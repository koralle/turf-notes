import { describe, expect } from "vitest";

import { baseURL, owner, test } from "./api.fixture";

describe("HTTP 面", () => {
  test("サインアップは 404 で塞がっている（FR-A1）", async ({ app }) => {
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

  test("/rpc/* への POST 以外は 405 を返し、Allow に POST を載せる", async ({
    app,
  }) => {
    const response = await app.request(`${baseURL}/rpc/health`);

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST");
  });

  test("存在しない /rpc/* への POST は 404 を返す", async ({ app }) => {
    const response = await app.request(`${baseURL}/rpc/does-not-exist`, {
      method: "POST",
    });

    expect(response.status).toBe(404);
  });

  // Hono と oRPC の繋ぎ目（prefix と context の受け渡し）はここでしか確かめられない。
  test("cookie 付きの POST /rpc/me は自分の情報を返す", async ({
    app,
    ownerHeaders,
  }) => {
    const response = await app.request(`${baseURL}/rpc/me`, {
      headers: ownerHeaders,
      method: "POST",
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toStrictEqual({
      json: { email: owner.email, id: owner.id, name: owner.name },
    });
  });

  test("未認証の POST /rpc/me は 401 を返す", async ({ app }) => {
    const response = await app.request(`${baseURL}/rpc/me`, {
      method: "POST",
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      json: { code: "UNAUTHORIZED", status: 401 },
    });
  });
});
