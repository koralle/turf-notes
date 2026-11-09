import { ORPCError, createRouterClient } from "@orpc/server";
import { accounts, users } from "@turf-notes/db/schema";
import { hashPassword } from "better-auth/crypto";
import { beforeAll, beforeEach, describe, expect, test } from "vitest";

import { createAuth } from "../auth/create-auth";
import type { Auth } from "../auth/create-auth";
import { cookieSessionAuthenticator } from "../auth/session";
import { resetTestDb, testDb } from "../test-db";
import { createRouter } from "./router";

const baseURL = "http://localhost:3000";
const password = "correct-password";
const secret = "test-secret-please-change-this-value-32chars";

const owner = { email: "owner@example.com", id: "user-owner", name: "Owner" };
const stranger = {
  email: "stranger@example.com",
  id: "user-stranger",
  name: "Stranger",
};

let auth: Auth;
let passwordHash = "";

/** 実際のパスワードサインインを通して、セッション Cookie だけを持つヘッダーを得る。 */
const headersFor = async (email: string): Promise<Headers> => {
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

/** email を省くと未認証のクライアントになる。 */
const rpc = async (email?: string) => {
  const router = createRouter({
    authenticate: cookieSessionAuthenticator(auth),
    db: () => testDb,
  });
  const headers = email === undefined ? new Headers() : await headersFor(email);

  return createRouterClient(router, { context: { headers } });
};

beforeAll(async () => {
  passwordHash = await hashPassword(password);
});

beforeEach(async () => {
  await resetTestDb();
  await testDb.insert(users).values([
    { ...owner, passwordSignInEnabled: true },
    { ...stranger, passwordSignInEnabled: true },
  ]);
  await testDb.insert(accounts).values(
    [owner, stranger].map((user) => ({
      accountId: user.id,
      id: `account-${user.id}`,
      password: passwordHash,
      providerId: "credential",
      userId: user.id,
    }))
  );
  auth = createAuth({ baseURL, db: testDb, secret });
});

describe("認証", () => {
  test("未認証は UNAUTHORIZED / 401", async () => {
    const client = await rpc();
    const error = await client.me().catch((error_: unknown) => error_);

    expect(error).toBeInstanceOf(ORPCError);
    expect((error as ORPCError<string, unknown>).code).toBe("UNAUTHORIZED");
    expect((error as ORPCError<string, unknown>).status).toBe(401);
  });

  test("サインイン済みなら自分の情報が返る", async () => {
    const client = await rpc(owner.email);

    expect(await client.me()).toStrictEqual({
      email: owner.email,
      id: owner.id,
      name: owner.name,
    });
  });
});

describe("メモ", () => {
  test("作成・一覧・詳細・更新・削除が一続きで通る", async () => {
    const client = await rpc(owner.email);

    const { id } = await client.memos.create({ body: "道中で力みが出た。" });

    const list = await client.memos.list({});
    expect(list.items.map((item) => item.id)).toStrictEqual([id]);

    const detail = await client.memos.detail({ id });
    expect(detail.body).toBe("道中で力みが出た。");
    expect(detail.version).toBe(0);

    expect(
      await client.memos.update({
        body: "道中で力みが出た。直線で伸びた。",
        id,
        version: 0,
      })
    ).toStrictEqual({ id });

    expect((await client.memos.detail({ id })).version).toBe(1);
    expect(await client.memos.delete({ id })).toStrictEqual({ ok: true });
  });

  test("古い版番号で保存すると memo-conflict", async () => {
    const client = await rpc(owner.email);
    const { id } = await client.memos.create({ body: "版番号のテスト。" });
    await client.memos.update({ body: "1回目。", id, version: 0 });

    const error = await client.memos
      .update({ body: "2回目。", id, version: 0 })
      .catch((error_: unknown) => error_);

    expect((error as ORPCError<string, unknown>).code).toBe("memo-conflict");
  });

  test("他人のメモは見えない（memo-not-found）", async () => {
    const mine = await rpc(owner.email);
    const { id } = await mine.memos.create({ body: "他人には見えない。" });

    const theirs = await rpc(stranger.email);
    const error = await theirs.memos
      .detail({ id })
      .catch((error_: unknown) => error_);

    expect((error as ORPCError<string, unknown>).code).toBe("memo-not-found");
    expect((await theirs.memos.list({})).items).toStrictEqual([]);
  });

  test("入力が contract に合わなければ拒否される", async () => {
    const client = await rpc(owner.email);
    const error = await client.memos
      .detail({ id: "" })
      .catch((error_: unknown) => error_);

    expect(error).toBeInstanceOf(ORPCError);
    expect((error as Error).message).toContain("Input validation failed");
  });
});
