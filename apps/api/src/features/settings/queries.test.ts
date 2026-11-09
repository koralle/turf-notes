import { passkeys, users } from "@turf-notes/db/schema";
import { userId } from "@turf-notes/domain";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, test } from "vitest";

import { resetTestDb, testDb } from "../../test-db";
import { setPasswordSignIn } from "./queries";

const id = userId("user-settings");

const enabledInDb = async (): Promise<boolean | undefined> => {
  const rows = await testDb
    .select({ enabled: users.passwordSignInEnabled })
    .from(users)
    .where(eq(users.id, id));

  return rows[0]?.enabled;
};

const addPasskey = async (passkeyId: string) => {
  await testDb.insert(passkeys).values({
    backedUp: false,
    counter: 0,
    credentialID: `credential-${passkeyId}`,
    deviceType: "singleDevice",
    id: passkeyId,
    publicKey: "public-key",
    userId: id,
  });
};

beforeEach(async () => {
  await resetTestDb();
  await testDb
    .insert(users)
    .values({ email: "settings@example.com", id, name: "Owner" });
});

describe("setPasswordSignIn", () => {
  test("パスキーが無ければ無効化できず、DB も変わらない（FR-A4）", async () => {
    expect(await setPasswordSignIn(testDb, id, false)).toStrictEqual({
      kind: "no-passkey",
    });
    expect(await enabledInDb()).toBe(true);
  });

  test("パスキーが無くても有効化はできる", async () => {
    expect(await setPasswordSignIn(testDb, id, true)).toStrictEqual({
      kind: "ok",
    });
    expect(await enabledInDb()).toBe(true);
  });

  test("パスキーがあれば無効化できる", async () => {
    await addPasskey("passkey-1");

    expect(await setPasswordSignIn(testDb, id, false)).toStrictEqual({
      kind: "ok",
    });
    expect(await enabledInDb()).toBe(false);
  });

  test("無効化したあと有効化できる", async () => {
    await addPasskey("passkey-1");
    await testDb
      .update(users)
      .set({ passwordSignInEnabled: false })
      .where(eq(users.id, id));

    expect(await setPasswordSignIn(testDb, id, true)).toStrictEqual({
      kind: "ok",
    });
    expect(await enabledInDb()).toBe(true);
  });
});
