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
import { getTableName } from "drizzle-orm";
import { afterAll } from "vitest";

/**
 * テストは実物の libSQL を使う（モック DB は使わない）。
 * コンテナの起動・マイグレーション・URL の受け渡しは `test-global-setup.ts` が行う。
 */
const url = process.env["TURSO_TEST_CONNECTION_URL"];

if (url === undefined) {
  throw new Error(
    "TURSO_TEST_CONNECTION_URL が無い。globalSetup の libSQL コンテナが起動していない。"
  );
}

export const testDb = createDb({ url });

afterAll(() => {
  testDb.$client.close();
});

/**
 * `resetTestDb` が空にするテーブル。子から先に並べる（外部キーが有効なので順序が要る）。
 * スキーマにテーブルを足したらここにも足す。忘れると `test-db.test.ts` が落ちる。
 */
export const testTables = [
  memoLinks,
  memoTags,
  memos,
  tags,
  passkeys,
  sessions,
  verifications,
  accounts,
  users,
] as const;

/**
 * テーブルを空にする。1 回の batch で順番どおりに消す（外部キーの都合で直列が要る）。
 */
export const resetTestDb = async (): Promise<void> => {
  await testDb.$client.batch(
    testTables.map((table) => `delete from ${getTableName(table)}`)
  );
};
