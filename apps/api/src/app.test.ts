import { beforeEach, describe, expect, test } from "vitest";

import { createApp } from "./app";
import { createAuth } from "./auth/create-auth";
import { cookieSessionAuthenticator } from "./auth/session";
import { testDb } from "./test-db";

const baseURL = "http://localhost:3000";
const secret = "test-secret-please-change-this-value-32chars";

let app: ReturnType<typeof createApp>;

beforeEach(() => {
  const auth = createAuth({ baseURL, db: testDb, secret });
  app = createApp({
    authenticate: cookieSessionAuthenticator(auth),
    auth,
    db: () => testDb,
  });
});

describe("HTTP 面", () => {
  test("サインアップは 404 で塞がっている（FR-A1）", async () => {
    const response = await app.request(`${baseURL}/api/auth/sign-up/email`, {
      body: JSON.stringify({
        email: "signup@example.com",
        name: "Signup",
        password: "password-1234",
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    expect(response.status).toBe(404);
  });

  test("/rpc/* への POST 以外は 405 を返し、Allow に POST を載せる", async () => {
    const response = await app.request(`${baseURL}/rpc/health`);

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST");
  });
});
