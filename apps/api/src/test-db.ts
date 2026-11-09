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
 * テーブルを空にする。子から先に消して外部キーの順序に依存しないようにする。
 * shortcut: 消すテーブルを手で並べている。スキーマにテーブルを足したらここにも足す
 * （忘れると前のテストの行が残り、別のテストが原因不明に落ちる）。
 */
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
