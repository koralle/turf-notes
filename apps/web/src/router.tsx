import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Link,
  createRouter as createTanStackRouter,
} from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { css } from "styled-system/css";

import { routeTree } from "./routeTree.gen";

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
    defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } },
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

  return router;
};

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
