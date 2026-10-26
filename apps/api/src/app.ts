import { RPCHandler } from "@orpc/server/fetch";
import type { AppDb } from "@turf-notes/db";
import { Hono } from "hono";

import type { Auth } from "./auth/create-auth";
import type { Authenticator } from "./auth/session";
import { createRouter } from "./rpc/router";

export interface AppDeps {
  readonly authenticate: Authenticator;
  /** isolate ごとに遅延生成するため関数で受ける。 */
  readonly db: () => AppDb;
  readonly auth: Auth;
}

export const createApp = (deps: AppDeps) => {
  const app = new Hono();
  const rpcHandler = new RPCHandler(
    createRouter({ authenticate: deps.authenticate, db: deps.db })
  );

  // サインアップは提供しない（CLI でユーザーを作る）。UI だけでなく HTTP 面でも塞ぐ。
  app.post("/api/auth/sign-up/*", (c) => c.text("Not Found", 404));

  // パスワードサインインの可否は Better Auth の `hooks.before` で判定する（ADR-0002）。
  // media type ごとの取りこぼしを避けるため、ここでは body を読まない。
  app.on(
    ["GET", "POST"],
    "/api/auth/*",
    async (c) => await deps.auth.handler(c.req.raw)
  );

  app.post("/rpc/*", async (c) => {
    const { matched, response } = await rpcHandler.handle(c.req.raw, {
      context: { headers: c.req.raw.headers },
      prefix: "/rpc",
    });

    if (!matched) {
      return await c.notFound();
    }

    return c.newResponse(response.body, response);
  });

  app.all("/rpc/*", (c) =>
    c.text("Method Not Allowed", 405, { Allow: "POST" })
  );

  return app;
};
