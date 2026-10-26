import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { passkey } from "@better-auth/passkey";
import type { AppDb } from "@turf-notes/db";
import { authSchema } from "@turf-notes/db/schema";
import { betterAuth } from "better-auth";

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
    plugins: [passkey(passkeyPluginOptions(baseURL))],
    secret,
    session: { freshAge: 0 },
  });

export type Auth = ReturnType<typeof createAuth>;
