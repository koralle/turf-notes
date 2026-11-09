import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import { createORPCReactQueryUtils } from "@orpc/react-query";
import type { ApiContract } from "@turf-notes/api-contract";

const origin = (): string =>
  typeof window === "undefined"
    ? "http://localhost:3000"
    : window.location.origin;

const link = new RPCLink({
  url: () => `${origin()}/rpc`,
});

/** ブラウザから `/rpc` を叩く oRPC クライアント。型は contract から来る。 */
export const client: ContractRouterClient<ApiContract> = createORPCClient(link);

/**
 * TanStack Query 用のユーティリティ。queryKey と queryFn を contract のパスから作るので、
 * `orpc.memos.key()` で配下（list / detail / forRace）をまとめて無効化できる。
 * 定義は `./queries.ts` に置く。
 */
export const orpc = createORPCReactQueryUtils(client);

/** oRPC の定義済みエラーのコード。エラーでなければ空文字を返す。 */
export const errorCode = (error: unknown): string =>
  typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : "";
