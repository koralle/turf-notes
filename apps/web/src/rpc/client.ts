import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import { createORPCReactQueryUtils } from "@orpc/react-query";
import type { ApiContract } from "@turf-notes/api-contract";

/** ブラウザは同じオリジン、SSR 中は Service Binding の行き先（host は使われない）。 */
const origin = (): string =>
  import.meta.env.SSR ? "https://turf-notes-api" : window.location.origin;

const link = new RPCLink({
  fetch: async (request) => {
    if (import.meta.env.SSR) {
      const { ssrFetch } = await import("./ssr-fetch");

      return await ssrFetch(request);
    }

    return await fetch(request);
  },
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

const missingCodes = new Set(["memo-not-found", "tag-not-found"]);

/** 対象が無いことを表す定義済みエラーのコードか。画面はこれを見て「見つかりません」を出す。 */
export const isMissing = (error: unknown): boolean =>
  missingCodes.has(errorCode(error));
