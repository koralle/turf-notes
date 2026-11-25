import { getTableName, sql } from "drizzle-orm";
import { expect, test } from "vitest";

import { testDb, testTables } from "./test-db";

/**
 * スキーマにテーブルを足して `resetTestDb` に足し忘れると、前のテストの行が残って
 * 別のテストが原因不明に落ちる。ここで先に落として、原因を名指しする。
 */
test("resetTestDb の対象はスキーマの全テーブルと一致する", async () => {
  const rows = await testDb.all<{ name: string }>(
    sql`select name from sqlite_master
        where type = 'table'
          and name not like 'sqlite_%'
          and name <> '__drizzle_migrations'`
  );

  expect(rows.map((row) => row.name).toSorted()).toStrictEqual(
    testTables.map((table) => getTableName(table)).toSorted()
  );
});
