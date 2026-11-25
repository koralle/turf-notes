import { accounts, users } from "@turf-notes/db/schema";
import { hashPassword } from "better-auth/crypto";
import { beforeAll, beforeEach, describe, expect, test } from "vitest";

import { baseURL, password, secret, testApp } from "../api.fixture";
import { resetTestDb, testDb } from "../test-db";
import { createAuth } from "./create-auth";
import type { Auth } from "./create-auth";

const json = "application/json";
const form = "application/x-www-form-urlencoded";
const contentTypes = [json, form] as const;

type ContentType = (typeof contentTypes)[number];

let app: ReturnType<typeof testApp>;
let passwordHash = "";

const signIn = async (email: string, contentType: ContentType) => {
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

const seedUser = async (email: string, enabled: boolean) => {
  const id = `user-${email}`;
  await testDb.insert(users).values({
    email,
    id,
    name: "Owner",
    passwordSignInEnabled: enabled,
  });
  await testDb.insert(accounts).values({
    accountId: id,
    id: `account-${email}`,
    password: passwordHash,
    providerId: "credential",
    userId: id,
  });
};

const expectRejected = async (response: Response) => {
  expect(response.status).toBe(401);
  expect(response.headers.getSetCookie()).toStrictEqual([]);
  await expect(response.json()).resolves.toMatchObject({
    code: "INVALID_EMAIL_OR_PASSWORD",
  });
};

beforeAll(async () => {
  passwordHash = await hashPassword(password);
});

beforeEach(async () => {
  await resetTestDb();
  await seedUser("disabled@example.com", false);
  await seedUser("enabled@example.com", true);

  // rate limit のメモリ状態をテスト間で共有しないよう、毎回作り直す。
  const auth: Auth = createAuth({ baseURL, db: testDb, secret });
  app = testApp(auth);
});

describe("パスワードサインインのゲート", () => {
  test.each(contentTypes)(
    "%s でも無効ユーザーのセッションを発行しない",
    async (contentType) => {
      await expectRejected(await signIn("disabled@example.com", contentType));
    }
  );

  test("無効ユーザーと未知ユーザーは form-urlencoded で同じ応答になる", async () => {
    const disabled = await signIn("disabled@example.com", form);
    const unknown = await signIn("unknown@example.com", form);

    expect(disabled.status).toBe(unknown.status);
    await expect(disabled.json()).resolves.toStrictEqual(await unknown.json());
  });

  test.each(contentTypes)(
    "%s の有効ユーザーはサインインできる",
    async (contentType) => {
      const response = await signIn("enabled@example.com", contentType);

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
