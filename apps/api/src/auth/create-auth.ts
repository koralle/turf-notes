import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { passkey } from "@better-auth/passkey";
import type { AppDb } from "@turf-notes/db";
import { authSchema } from "@turf-notes/db/schema";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";

import { isPasswordSignInAllowed } from "../features/settings/queries";

export interface CreateAuthOptions {
  db: AppDb;
  secret: string;
  baseURL: string;
}

/**
 * passkey の rpID / origin を `BETTER_AUTH_URL` から導く。
 * ブラウザは web の origin で WebAuthn を行い、web が Request をそのまま転送するので、
 * `BETTER_AUTH_URL` は web の公開 URL と一致させる（要件 NFR-1）。
 */
const passkeyPluginOptions = (baseURL: string) => {
  const url = new URL(baseURL);
  return { origin: url.origin, rpID: url.hostname, rpName: "Turf Notes" };
};

/**
 * パスワードサインインが無効なユーザーを止める（ADR-0002）。
 *
 * Better Auth は `/sign-in/email` で JSON と form-urlencoded の両方を受け付ける。
 * media type ごとに手前で body を読み分けると取りこぼすため、Better Auth が
 * parse した後の body を見る `hooks.before` で判定する。
 * 応答は未知ユーザーと同じにして、ユーザーの存在を漏らさない。
 */
const passwordSignInGate = (db: AppDb) =>
  createAuthMiddleware(async (ctx) => {
    if (ctx.path !== "/sign-in/email") {
      return;
    }

    const body: unknown = ctx.body;
    if (
      typeof body !== "object" ||
      body === null ||
      !("email" in body) ||
      typeof body.email !== "string"
    ) {
      return;
    }

    if (await isPasswordSignInAllowed(db, body.email)) {
      return;
    }

    throw APIError.from("UNAUTHORIZED", {
      code: "INVALID_EMAIL_OR_PASSWORD",
      message: "Invalid email or password",
    });
  });

/**
 * Better Auth の正本構成。
 *
 * サインアップはここでは止めていない（CLI が内部 API でユーザーを作るため）。
 * HTTP 面では `app.ts` が `/api/auth/sign-up/*` を 404 で塞ぐ。
 */
export const createAuth = ({ db, secret, baseURL }: CreateAuthOptions) =>
  betterAuth({
    baseURL,
    database: drizzleAdapter(db, { provider: "sqlite", schema: authSchema }),
    emailAndPassword: { enabled: true },
    hooks: { before: passwordSignInGate(db) },
    plugins: [passkey(passkeyPluginOptions(baseURL))],
    secret,
    session: { freshAge: 0 },
  });

export type Auth = ReturnType<typeof createAuth>;
