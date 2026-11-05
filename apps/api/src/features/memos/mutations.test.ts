import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { createDb } from "@turf-notes/db";
import type { AppDb } from "@turf-notes/db";
import { memos, users } from "@turf-notes/db/schema";
import { memoId, userId } from "@turf-notes/domain";
import type { MemoId } from "@turf-notes/domain";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { createMemo, updateMemo } from "./mutations";

const owner = userId("user-owner");
const stranger = userId("user-stranger");
let db: AppDb;
let dir = "";

const rowOf = async (id: MemoId) => {
  const rows = await db
    .select({ body: memos.body, version: memos.version })
    .from(memos)
    .where(eq(memos.id, id));

  return rows[0];
};

beforeAll(async () => {
  // libSQL の sqlite3 クライアントは transaction() で接続を作り直すので、
  // `:memory:` だとテーブルの無い別 DB になる。ファイル DB を使う。
  dir = await mkdtemp(path.join(tmpdir(), "turf-notes-"));
  db = createDb({ url: `file:${path.join(dir, "test.db")}` });
  await migrate(db, {
    migrationsFolder: path.join(
      import.meta.dirname,
      "../../../../../packages/db/drizzle"
    ),
  });
  await db.insert(users).values([
    { email: "owner@example.com", id: owner, name: "Owner" },
    { email: "stranger@example.com", id: stranger, name: "Stranger" },
  ]);
});

afterAll(async () => {
  db.$client.close();
  await rm(dir, { force: true, recursive: true });
});

describe("updateMemo", () => {
  test("読み込んだ版番号と一致すれば保存でき、版番号が1増える", async () => {
    const { id } = await createMemo(db, owner, { body: "道中で力みが出た。" });
    expect(await rowOf(id)).toStrictEqual({
      body: "道中で力みが出た。",
      version: 0,
    });

    expect(
      await updateMemo(db, owner, { body: "直線で伸びた。", id, version: 0 })
    ).toStrictEqual({ kind: "ok" });
    expect(await rowOf(id)).toStrictEqual({
      body: "直線で伸びた。",
      version: 1,
    });
  });

  test("古い版番号では保存せず conflict を返す", async () => {
    const { id } = await createMemo(db, owner, { body: "一回目" });
    await updateMemo(db, owner, { body: "二回目", id, version: 0 });

    expect(
      await updateMemo(db, owner, { body: "古い内容", id, version: 0 })
    ).toStrictEqual({ kind: "conflict" });
    expect(await rowOf(id)).toStrictEqual({ body: "二回目", version: 1 });
  });

  test("存在しないメモは not-found", async () => {
    expect(
      await updateMemo(db, owner, {
        body: "本文",
        id: memoId("0192f0aa-0000-7000-8000-0000000000ff"),
        version: 0,
      })
    ).toStrictEqual({ kind: "not-found" });
  });

  test("他のユーザーのメモは not-found（版番号が合っていても書けない）", async () => {
    const { id } = await createMemo(db, owner, { body: "持ち主のメモ" });

    expect(
      await updateMemo(db, stranger, { body: "横取り", id, version: 0 })
    ).toStrictEqual({ kind: "not-found" });
    expect(await rowOf(id)).toStrictEqual({ body: "持ち主のメモ", version: 0 });
  });
});
