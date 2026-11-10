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
const retryButton = css({
  bg: "transparent",
  border: "none",
  color: "accent",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: "inherit",
  p: 0,
  textDecoration: "underline",
});

/** ルートに一致しなかったときの表示。既定の `<p>Not Found</p>` だけだと行き止まりになる。 */
const NotFound = () => (
  <div className={notFound}>
    ページが見つかりません。{" "}
    <Link className={notFoundLink} to="/">
      ホームへ戻る
    </Link>
  </div>
);

/**
 * loader が投げたときの表示。既定は英語の "Something went wrong!" で、
 * この画面は API の障害で出るので、日本語で何が起きたかと再試行を出す。
 * 再試行はページを開き直す（`reset` は beforeLoad の失敗をやり直さず、無反応になる）。
 */
const LoadFailed = () => (
  <div className={notFound}>
    読み込みに失敗しました。{" "}
    <button
      className={retryButton}
      onClick={() => {
        window.location.reload();
      }}
      type="button"
    >
      もう一度読み込む
    </button>
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
        // SSR 中の 401 は `/_app` の beforeLoad がリダイレクトで処理する。
        if (
          typeof window !== "undefined" &&
          errorCode(error) === "UNAUTHORIZED"
        ) {
          void leaveForSignIn();
        }
      },
    }),
  });

  const router = createTanStackRouter({
    context: { queryClient },
    defaultErrorComponent: LoadFailed,
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
