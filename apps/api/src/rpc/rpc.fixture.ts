import { accounts, users } from "@turf-notes/db/schema";
import { hashPassword } from "better-auth/crypto";
import { test as baseTest } from "vitest";

import { createAuth } from "../auth/create-auth";
import type { Auth } from "../auth/create-auth";
import { cookieSessionAuthenticator } from "../auth/session";
import { resetTestDb, testDb } from "../test-db";
import { createRouterKit } from "./base";
import type { RouterDeps, RouterKit } from "./base";

const baseURL = "http://localhost:3000";
const password = "correct-password";
const secret = "test-secret-please-change-this-value-32chars";

export const owner = {
  email: "owner@example.com",
  id: "user-owner",
  name: "Owner",
};

const stranger = {
  email: "stranger@example.com",
  id: "user-stranger",
  name: "Stranger",
};

/** ハッシュは重いので 1 回だけ計算し、各テストは解決済みの Promise を待つ。 */
const passwordHash = hashPassword(password);

/** 実際のパスワードサインインを通して、セッション Cookie だけを持つヘッダーを得る。 */
const signInHeaders = async (auth: Auth, email: string): Promise<Headers> => {
  const { headers } = await auth.api.signInEmail({
    body: { email, password },
    returnHeaders: true,
  });

  const cookie = headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");

  return new Headers({ cookie });
};

/**
 * RPC のテストが使う `test`。各テストの前に DB を空にして owner と stranger を入れ、
 * その DB を見る `deps` / `kit` と、それぞれとしてサインイン済みのヘッダーを渡す。
 */
export const test = baseTest.extend<{
  auth: Auth;
  deps: RouterDeps;
  kit: RouterKit;
  ownerHeaders: Headers;
  strangerHeaders: Headers;
}>({
  // Vitest はフィクスチャの第 1 引数を分割代入で受けることを要求するため、依存の無いこれは空になる。
  // oxlint-disable-next-line no-empty-pattern
  auth: async ({}, use) => {
    await resetTestDb();

    const hash = await passwordHash;

    await testDb.insert(users).values([
      { ...owner, passwordSignInEnabled: true },
      { ...stranger, passwordSignInEnabled: true },
    ]);
    await testDb.insert(accounts).values(
      [owner, stranger].map((user) => ({
        accountId: user.id,
        id: `account-${user.id}`,
        password: hash,
        providerId: "credential",
        userId: user.id,
      }))
    );

    await use(createAuth({ baseURL, db: testDb, secret }));
  },
  deps: async ({ auth }, use) => {
    await use({
      authenticate: cookieSessionAuthenticator(auth),
      db: () => testDb,
    });
  },
  kit: async ({ deps }, use) => {
    await use(createRouterKit(deps));
  },
  ownerHeaders: async ({ auth }, use) => {
    await use(await signInHeaders(auth, owner.email));
  },
  strangerHeaders: async ({ auth }, use) => {
    await use(await signInHeaders(auth, stranger.email));
  },
});
