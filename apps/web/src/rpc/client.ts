import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import { createORPCReactQueryUtils } from "@orpc/react-query";
import { createServerOnlyFn } from "@tanstack/react-start";
import type { ApiContract } from "@turf-notes/api-contract";

const inBrowser = typeof window !== "undefined";

/**
 * SSR 中の `/rpc`。Worker の中から自オリジンは叩けないので、`src/server.ts` が
 * ブラウザから流しているのと同じ Service Binding で API Worker を直接呼ぶ。
 * 入ってきたリクエストの cookie を渡さないと、サインイン済みでも 401 になる。
 */
const ssrFetch = createServerOnlyFn(async (request: Request) => {
  const [{ env }, { getRequestHeaders }] = await Promise.all([
    import("cloudflare:workers"),
    import("@tanstack/react-start/server"),
  ]);

  const cookie = getRequestHeaders().get("cookie");
  if (cookie !== null) {
    request.headers.set("cookie", cookie);
  }

  // API も DB も返さないときに SSR が固まったままになるので、上限を置く。
  // 固まるより、エラー画面を出して「もう一度読み込む」に任せる。
  return await env.API.fetch(request, { signal: AbortSignal.timeout(5000) });
});

/** ブラウザは同じオリジン、SSR 中は Service Binding の行き先（host は使われない）。 */
const origin = (): string =>
  inBrowser ? window.location.origin : "https://turf-notes-api";

const link = new RPCLink({
  fetch: async (request) =>
    inBrowser ? await fetch(request) : await ssrFetch(request),
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
