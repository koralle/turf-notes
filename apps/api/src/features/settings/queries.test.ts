import path from "node:path";

import { createDb } from "@turf-notes/db";
import type { AppDb } from "@turf-notes/db";
import { passkeys, users } from "@turf-notes/db/schema";
import { userId } from "@turf-notes/domain";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/libsql/migrator";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "vitest";

import { setPasswordSignIn } from "./queries";

const id = userId("user-settings");
let db: AppDb;

const enabledInDb = async (): Promise<boolean | undefined> => {
  const rows = await db
    .select({ enabled: users.passwordSignInEnabled })
    .from(users)
    .where(eq(users.id, id));

  return rows[0]?.enabled;
};

const addPasskey = async (passkeyId: string) => {
  await db.insert(passkeys).values({
    backedUp: false,
    counter: 0,
    credentialID: `credential-${passkeyId}`,
    deviceType: "singleDevice",
    id: passkeyId,
    publicKey: "public-key",
    userId: id,
  });
};

beforeAll(async () => {
  db = createDb({ url: ":memory:" });
  await migrate(db, {
    migrationsFolder: path.join(
      import.meta.dirname,
      "../../../../../packages/db/drizzle"
    ),
  });
  await db
    .insert(users)
    .values({ email: "settings@example.com", id, name: "Owner" });
});

beforeEach(async () => {
  await db.delete(passkeys);
  await db
    .update(users)
    .set({ passwordSignInEnabled: true })
    .where(eq(users.id, id));
});

afterAll(() => {
  db.$client.close();
});

describe("setPasswordSignIn", () => {
  test("パスキーが無ければ無効化できず、DB も変わらない（FR-A4）", async () => {
    expect(await setPasswordSignIn(db, id, false)).toStrictEqual({
      kind: "no-passkey",
    });
    expect(await enabledInDb()).toBe(true);
  });

  test("パスキーが無くても有効化はできる", async () => {
    expect(await setPasswordSignIn(db, id, true)).toStrictEqual({ kind: "ok" });
    expect(await enabledInDb()).toBe(true);
  });

  test("パスキーがあれば無効化できる", async () => {
    await addPasskey("passkey-1");

    expect(await setPasswordSignIn(db, id, false)).toStrictEqual({
      kind: "ok",
    });
    expect(await enabledInDb()).toBe(false);
  });

  test("無効化したあと有効化できる", async () => {
    await addPasskey("passkey-1");
    await db
      .update(users)
      .set({ passwordSignInEnabled: false })
      .where(eq(users.id, id));

    expect(await setPasswordSignIn(db, id, true)).toStrictEqual({ kind: "ok" });
    expect(await enabledInDb()).toBe(true);
  });
});
