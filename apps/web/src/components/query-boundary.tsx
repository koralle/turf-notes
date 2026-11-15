import {
  ErrorBoundary,
  Suspense,
  useErrorBoundaryFallbackProps,
} from "@suspensive/react";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { isMissing } from "../rpc/client";
import { LoadFailed, Loading } from "./query-fallbacks";

const QueryFallback = ({ notFound }: { notFound?: ReactNode }) => {
  const { error, reset } = useErrorBoundaryFallbackProps();

  return notFound !== undefined && isMissing(error) ? (
    <>{notFound}</>
  ) : (
    <LoadFailed onRetry={reset} />
  );
};

/**
 * 読み取りの待ちと失敗を受け持つ境界。loader が温めた直後は待たない（ADR-0006）。
 * 再試行は失敗した取得を未取得に戻す。戻さないと、同じエラーを投げ直すだけになる
 * （`retryOnMount: false` を既定にしているので、mount では勝手に取り直さない）。
 */
export const QueryBoundary = ({
  children,
  notFound,
}: {
  children: ReactNode;
  /** 「無い」を表すエラーのときの表示。渡さなければ読み込み失敗として扱う。 */
  notFound?: ReactNode;
}) => {
  const queryClient = useQueryClient();

  return (
    <ErrorBoundary
      fallback={<QueryFallback notFound={notFound} />}
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
