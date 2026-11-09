import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import {
  Link,
  createRouter as createTanStackRouter,
} from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { css } from "styled-system/css";

import { routeTree } from "./routeTree.gen";
import { errorCode } from "./rpc/client";

const notFound = css({
  color: "muted",
  fontSize: "13px",
  p: "40px",
  textAlign: "center",
});
const notFoundLink = css({ color: "accent", textDecoration: "underline" });

/** ルートに一致しなかったときの表示。既定の `<p>Not Found</p>` だけだと行き止まりになる。 */
const NotFound = () => (
  <div className={notFound}>
    ページが見つかりません。{" "}
    <Link className={notFoundLink} to="/">
      ホームへ戻る
    </Link>
  </div>
);

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        // loader が失敗を飲んでも、データ無しのエラークエリは mount で再試行される。
        // 同じリクエストを画面がすぐに繰り返さないよう切る（再取得は loader と invalidate が担う）。
        retry: false,
        retryOnMount: false,
      },
    },
    queryCache: new QueryCache({
      onError: (error) => {
        if (errorCode(error) === "UNAUTHORIZED") {
          void leaveForSignIn();
        }
      },
    }),
  });

  const router = createTanStackRouter({
    context: { queryClient },
    defaultNotFoundComponent: NotFound,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    Wrap: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
    routeTree,
  });

  setupRouterSsrQueryIntegration({ queryClient, router });

  /**
   * セッションが切れたときの退出。編集中の未保存ガード（`useBlocker`）を通すため、
   * ハード遷移ではなく router に遷移させる。離れたあとにキャッシュを捨てる。
   */
  async function leaveForSignIn() {
    try {
      await router.navigate({ to: "/sign-in" });
      queryClient.clear();
    } catch {
      // 遷移できなくても、編集画面の未保存ガードが「編集を続ける」を選ばせている。
    }
  }

  return router;
};

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
