import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import type { AppDb } from "@turf-notes/db";
import { authSchema } from "@turf-notes/db/schema";
import { betterAuth } from "better-auth";

export interface CreateAuthOptions {
  db: AppDb;
  secret: string;
  baseURL: string;
}

/**
 * Better Auth の正本構成。
 *
 * サインアップはここでは止めていない（CLI が内部 API でユーザーを作るため）。
 * HTTP 面では `app.ts` が `/api/auth/sign-up/*` を 404 で塞ぐ。
 */
export const createAuth = ({ db, secret, baseURL }: CreateAuthOptions) =>
  betterAuth({
    baseURL,
    secret,
    database: drizzleAdapter(db, { provider: "sqlite", schema: authSchema }),
    emailAndPassword: { enabled: true },
    session: { freshAge: 0 },
  });

export type Auth = ReturnType<typeof createAuth>;
