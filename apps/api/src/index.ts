import { createDb } from "@turf-notes/db";
import type { AppDb } from "@turf-notes/db";

import { createApp } from "./app";
import { createAuth } from "./auth/create-auth";
import type { Auth } from "./auth/create-auth";
import { cookieSessionAuthenticator } from "./auth/session";

const dbCache = new Map<string, AppDb>();
const authCache = new Map<string, Auth>();

const dbFor = (env: Env): AppDb => {
  const cached = dbCache.get(env.TURSO_CONNECTION_URL);
  if (cached !== undefined) {
    return cached;
  }

  const db = createDb({
    url: env.TURSO_CONNECTION_URL,
    ...(env.TURSO_AUTH_TOKEN ? { authToken: env.TURSO_AUTH_TOKEN } : {}),
  });
  dbCache.set(env.TURSO_CONNECTION_URL, db);
  return db;
};

const authFor = (env: Env, db: AppDb): Auth => {
  const key = `${env.BETTER_AUTH_URL}|${env.BETTER_AUTH_SECRET}`;
  const cached = authCache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const auth = createAuth({
    db,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
  });
  authCache.set(key, auth);
  return auth;
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const db = dbFor(env);
    const auth = authFor(env, db);
    const app = createApp({
      authenticate: cookieSessionAuthenticator(auth),
      auth,
      db: () => db,
    });

    return await app.fetch(request, env);
  },
};
