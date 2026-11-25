import { users } from "@turf-notes/db/schema";
import { eq } from "drizzle-orm";
import { describe, expect } from "vitest";

import { baseURL, owner, password, test } from "../api.fixture";
import type { createApp } from "../app";
import { testDb } from "../test-db";

const json = "application/json";
const form = "application/x-www-form-urlencoded";
const contentTypes = [json, form] as const;

type ContentType = (typeof contentTypes)[number];

type App = ReturnType<typeof createApp>;

const signIn = async (app: App, email: string, contentType: ContentType) => {
  const body =
    contentType === json
      ? JSON.stringify({ email, password })
      : new URLSearchParams({ email, password }).toString();

  return await app.request(`${baseURL}/api/auth/sign-in/email`, {
    body,
    headers: { "content-type": contentType },
    method: "POST",
  });
};

const disableOwner = async () => {
  await testDb
    .update(users)
    .set({ passwordSignInEnabled: false })
    .where(eq(users.id, owner.id));
};

const expectRejected = async (response: Response) => {
  expect(response.status).toBe(401);
  expect(response.headers.getSetCookie()).toStrictEqual([]);
  await expect(response.json()).resolves.toMatchObject({
    code: "INVALID_EMAIL_OR_PASSWORD",
  });
};

describe("パスワードサインインのゲート", () => {
  test.for(contentTypes)(
    "%s でも無効ユーザーのセッションを発行しない",
    async (contentType, { app }) => {
      await disableOwner();
      await expectRejected(await signIn(app, owner.email, contentType));
    }
  );

  test("無効ユーザーと未知ユーザーは form-urlencoded で同じ応答になる", async ({
    app,
  }) => {
    await disableOwner();

    const disabled = await signIn(app, owner.email, form);
    const unknown = await signIn(app, "unknown@example.com", form);

    expect(disabled.status).toBe(unknown.status);
    await expect(disabled.json()).resolves.toStrictEqual(await unknown.json());
  });

  test.for(contentTypes)(
    "%s の有効ユーザーはサインインできる",
    async (contentType, { app }) => {
      const response = await signIn(app, owner.email, contentType);

      expect(response.status).toBe(200);
      expect(
        response.headers
          .getSetCookie()
          .some((cookie) => cookie.includes("session_token="))
      ).toBe(true);
      await response.json();
    }
  );
});
