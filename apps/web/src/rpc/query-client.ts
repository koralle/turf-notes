import { QueryCache, QueryClient } from "@tanstack/react-query";

import { errorCode } from "./client";

interface AppQueryClientOptions {
  onUnauthorized?: () => void;
}

/**
 * 本番のルーターと Storybook で共有する QueryClient を作る。
 * loader が失敗を飲んでも mount 時に再試行が走らないよう retry / retryOnMount を切る。
 */
export const createAppQueryClient = (
  options?: AppQueryClientOptions
): QueryClient =>
  new QueryClient({
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
          options?.onUnauthorized?.();
        }
      },
    }),
  });
