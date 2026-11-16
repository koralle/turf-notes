import {
  ErrorBoundary,
  Suspense,
  useErrorBoundaryFallbackProps,
} from "@suspensive/react";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { LoadFailed, Loading } from "./query-fallbacks";

const QueryFallback = () => {
  const { reset } = useErrorBoundaryFallbackProps();

  return <LoadFailed onRetry={reset} />;
};

/**
 * 画面が組まれたあとの読み取りの待ちと失敗を受け持つ境界（ADR-0006）。
 * loader が失敗する画面は route の `errorComponent`（`ReadError`）が受けるので、
 * ここに来るのは検索やサイドバー由来の、mount 後に失敗しうる読み取りだけ。
 * 再試行は失敗した取得を未取得に戻す。戻さないと、同じエラーを投げ直すだけになる
 * （`retryOnMount: false` を既定にしているので、mount では勝手に取り直さない）。
 */
export const QueryBoundary = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  return (
    <ErrorBoundary
      fallback={<QueryFallback />}
      onReset={() => {
        void queryClient.resetQueries({
          predicate: (query) => query.state.status === "error",
        });
      }}
    >
      <Suspense fallback={<Loading />}>{children}</Suspense>
    </ErrorBoundary>
  );
};
