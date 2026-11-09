import path from "node:path";

import { createDb } from "@turf-notes/db";
import {
  accounts,
  memoLinks,
  memos,
  memoTags,
  passkeys,
  sessions,
  tags,
  users,
  verifications,
} from "@turf-notes/db/schema";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterAll, beforeAll } from "vitest";

/**
 * テストは実物の libSQL を使う（モック DB は使わない）。
 * コンテナは `test-global-setup.ts` が起動し、URL を環境変数で渡してくる。
 */
const url = process.env["TURSO_TEST_CONNECTION_URL"];
if (url === undefined) {
  throw new Error(
    "TURSO_TEST_CONNECTION_URL が無い。globalSetup の libSQL コンテナが起動していない。"
  );
}

export const testDb = createDb({ url });

beforeAll(async () => {
  await migrate(testDb, {
    migrationsFolder: path.join(
      import.meta.dirname,
      "../../../packages/db/drizzle"
    ),
  });
});

afterAll(() => {
  testDb.$client.close();
});

/** テーブルを空にする。子から先に消して外部キーの順序に依存しないようにする。 */
export const resetTestDb = async (): Promise<void> => {
  await testDb.batch([
    testDb.delete(memoLinks),
    testDb.delete(memoTags),
    testDb.delete(memos),
    testDb.delete(tags),
    testDb.delete(passkeys),
    testDb.delete(sessions),
    testDb.delete(verifications),
    testDb.delete(accounts),
    testDb.delete(users),
  ]);
};
