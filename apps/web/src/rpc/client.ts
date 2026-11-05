import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
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

/** oRPC の定義済みエラーのコード。エラーでなければ空文字を返す。 */
export const errorCode = (error: unknown): string =>
  typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : "";
