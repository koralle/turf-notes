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
  /** パスワードサインインを許可してよいか（ADR-0002）。 */
  readonly isPasswordSignInAllowed: (email: string) => Promise<boolean>;
}

export const createApp = (deps: AppDeps) => {
  const app = new Hono();
  const rpcHandler = new RPCHandler(
    createRouter({ authenticate: deps.authenticate, db: deps.db })
  );

  // サインアップは提供しない（CLI でユーザーを作る）。UI だけでなく HTTP 面でも塞ぐ。
  app.post("/api/auth/sign-up/*", (c) => c.text("Not Found", 404));

  /**
   * パスワードサインインが無効なユーザーはここで止める。
   * Better Auth の `emailAndPassword.enabled` はデプロイ時の設定なので、
   * ユーザー単位の可否はアプリ層で判定する（ADR-0002）。
   */
  app.post("/api/auth/sign-in/email", async (c) => {
    const email = await readEmail(c.req.raw.clone());
    if (email !== null && !(await deps.isPasswordSignInAllowed(email))) {
      return c.json(
        {
          code: "PASSWORD_SIGN_IN_DISABLED",
          message: "パスワードサインインは無効です",
        },
        403
      );
    }

    return await deps.auth.handler(c.req.raw);
  });

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

const readEmail = async (request: Request): Promise<string | null> => {
  try {
    const body: unknown = await request.json();
    if (typeof body === "object" && body !== null && "email" in body) {
      const { email } = body;
      return typeof email === "string" ? email.toLowerCase() : null;
    }
  } catch {
    return null;
  }

  return null;
};
