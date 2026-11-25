import { createServerOnlyFn } from "@tanstack/react-start";

/**
 * SSR 中の `/rpc`。Worker の中から自オリジンは叩けないので、`src/server.ts` が
 * ブラウザから流しているのと同じ Service Binding で API Worker を直接呼ぶ。
 * 入ってきたリクエストの cookie を渡さないと、サインイン済みでも 401 になる。
 */
export const ssrFetch = createServerOnlyFn(async (request: Request) => {
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
