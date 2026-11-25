import { memoLinks, memos, memoTags, tags, users } from "@turf-notes/db/schema";
import { memoId, raceKeySchema, userId } from "@turf-notes/domain";
import type { MemoId } from "@turf-notes/domain";
import * as v from "valibot";
import { beforeEach, describe, expect, test } from "vitest";

import { resetTestDb, testDb } from "../../test-db";
import { softDeleteMemo } from "./mutations";
import { getMemoDetail, listMemos } from "./queries";

const owner = userId("user-owner");

/** 決定的な時刻。ページ送りの境目を作るために createdAt を直接入れる。 */
const BASE = 1_700_000_000_000;

/** i 番目のメモの id。uuid の形を満たす決まった値。 */
const idAt = (i: number): MemoId =>
  memoId(`0192f0aa-0000-7000-8000-${String(i).padStart(12, "0")}`);

/** createdAt を指定してメモを入れる。`createMemo` では同じミリ秒を作れないため直接入れる。 */
const insertMemos = async (
  rows: (Omit<typeof memos.$inferInsert, "body" | "userId"> & {
    body?: string;
  })[]
): Promise<void> => {
  await testDb
    .insert(memos)
    .values(rows.map((row) => ({ body: "本文", ...row, userId: owner })));
};

const pageOf = (items: { id: MemoId }[]): MemoId[] => items.map((m) => m.id);

beforeEach(async () => {
  await resetTestDb();
  await testDb
    .insert(users)
    .values({ email: "owner@example.com", id: owner, name: "Owner" });
});

describe("listMemos のページ送り", () => {
  test("21 件を 20 + 1 に分け、重複も抜けもない", async () => {
    await insertMemos(
      Array.from({ length: 21 }, (_, i) => ({
        createdAt: new Date(BASE + i),
        id: idAt(i),
      }))
    );

    const first = await listMemos(testDb, owner, {});
    expect(pageOf(first.items)).toHaveLength(20);
    expect(first.items[0]?.id).toBe(idAt(20));

    if (first.nextCursor === null) {
      throw new Error("21 件あるのに nextCursor が null");
    }

    const second = await listMemos(testDb, owner, { cursor: first.nextCursor });
    expect(pageOf(second.items)).toStrictEqual([idAt(0)]);
    expect(second.nextCursor).toBeNull();

    expect(
      [...pageOf(first.items), ...pageOf(second.items)].toSorted()
    ).toStrictEqual(Array.from({ length: 21 }, (_, i) => idAt(i)).toSorted());
  });

  test("同じ createdAt のメモがあっても、境目で重複も抜けもない", async () => {
    // 最後の 2 件を同じミリ秒にする。id の順でしか区別できない境目を作る。
    await insertMemos(
      Array.from({ length: 21 }, (_, i) => ({
        createdAt: new Date(i >= 19 ? BASE + 19 : BASE + i),
        id: idAt(i),
      }))
    );

    const first = await listMemos(testDb, owner, {});

    if (first.nextCursor === null) {
      throw new Error("21 件あるのに nextCursor が null");
    }

    const second = await listMemos(testDb, owner, { cursor: first.nextCursor });
    const seen = [...pageOf(first.items), ...pageOf(second.items)];

    expect(seen).toHaveLength(21);
    expect(new Set(seen).size).toBe(21);
  });

  test("壊れた cursor は 1 ページ目として扱う", async () => {
    await insertMemos([{ createdAt: new Date(BASE), id: idAt(0) }]);

    const plain = await listMemos(testDb, owner, {});
    const broken = await listMemos(testDb, owner, { cursor: "not-a-cursor" });

    expect(broken).toStrictEqual(plain);
  });
});

describe("listMemos の絞り込み", () => {
  test("タイトルでも検索できる", async () => {
    await insertMemos([
      {
        body: "本文には無い語",
        createdAt: new Date(BASE),
        id: idAt(0),
        title: "天皇賞（秋）",
      },
      { body: "ふつうの本文", createdAt: new Date(BASE + 1), id: idAt(1) },
    ]);

    expect(
      pageOf((await listMemos(testDb, owner, { q: "天皇賞" })).items)
    ).toStrictEqual([idAt(0)]);
  });

  test("tagIds は指定したタグを全部持つメモだけを返す", async () => {
    const [horse, theme] = await testDb
      .insert(tags)
      .values([
        {
          kind: "horse",
          name: "ソダシ",
          normalizedName: "ソダシ",
          userId: owner,
        },
        { kind: "theme", name: "展開", normalizedName: "展開", userId: owner },
      ])
      .returning();

    if (horse === undefined || theme === undefined) {
      throw new Error("tag insert failed");
    }

    await insertMemos([
      { createdAt: new Date(BASE), id: idAt(0) },
      { createdAt: new Date(BASE + 1), id: idAt(1) },
      { createdAt: new Date(BASE + 2), id: idAt(2) },
    ]);
    await testDb.insert(memoTags).values([
      { memoId: idAt(0), tagId: horse.id },
      { memoId: idAt(1), tagId: horse.id },
      { memoId: idAt(1), tagId: theme.id },
    ]);

    expect(
      pageOf((await listMemos(testDb, owner, { tagIds: [horse.id] })).items)
    ).toStrictEqual([idAt(1), idAt(0)]);
    expect(
      pageOf(
        (await listMemos(testDb, owner, { tagIds: [horse.id, theme.id] })).items
      )
    ).toStrictEqual([idAt(1)]);
  });

  test("race は開催日・競馬場・番号の 3 つが揃ったメモだけを返す", async () => {
    await insertMemos([
      {
        createdAt: new Date(BASE),
        id: idAt(0),
        raceDate: "2026-11-02",
        raceNumber: 11,
        venue: "東京",
      },
      {
        createdAt: new Date(BASE + 1),
        id: idAt(1),
        raceDate: "2026-11-02",
        raceNumber: 11,
        venue: "京都",
      },
      {
        createdAt: new Date(BASE + 2),
        id: idAt(2),
        raceDate: "2026-11-02",
        raceNumber: 12,
        venue: "東京",
      },
    ]);

    const found = await listMemos(testDb, owner, {
      race: v.parse(raceKeySchema, {
        date: "2026-11-02",
        number: 11,
        venue: "東京",
      }),
    });

    expect(pageOf(found.items)).toStrictEqual([idAt(0)]);
  });
});

describe("参照の件数と向き", () => {
  test("links は参照先、backlinks は参照元を返す", async () => {
    await insertMemos([
      { body: "参照先", createdAt: new Date(BASE), id: idAt(0) },
      { body: "参照元", createdAt: new Date(BASE + 1), id: idAt(1) },
    ]);
    await testDb
      .insert(memoLinks)
      .values({ fromMemoId: idAt(1), toMemoId: idAt(0) });

    const source = await getMemoDetail(testDb, owner, idAt(1));
    expect(source?.links.map((ref) => ref.id)).toStrictEqual([idAt(0)]);
    expect(source?.backlinks).toStrictEqual([]);

    const target = await getMemoDetail(testDb, owner, idAt(0));
    expect(target?.links).toStrictEqual([]);
    expect(target?.backlinks.map((ref) => ref.id)).toStrictEqual([idAt(1)]);
  });

  test("参照元を削除すると backlinks から消える", async () => {
    await insertMemos([
      { body: "参照先", createdAt: new Date(BASE), id: idAt(0) },
      { body: "参照元", createdAt: new Date(BASE + 1), id: idAt(1) },
    ]);
    await testDb
      .insert(memoLinks)
      .values({ fromMemoId: idAt(1), toMemoId: idAt(0) });

    await softDeleteMemo(testDb, owner, idAt(1));

    const target = await getMemoDetail(testDb, owner, idAt(0));
    expect(target?.backlinks).toStrictEqual([]);
    expect(target?.linkCount).toBe(0);
  });

  test("参照先を削除すると、一覧の件数も詳細の links も減る", async () => {
    await insertMemos([
      { createdAt: new Date(BASE), id: idAt(0) },
      { createdAt: new Date(BASE + 1), id: idAt(1) },
    ]);
    await testDb
      .insert(memoLinks)
      .values({ fromMemoId: idAt(1), toMemoId: idAt(0) });

    const before = await listMemos(testDb, owner, {});
    expect(before.items.find((m) => m.id === idAt(1))?.linkCount).toBe(1);

    await softDeleteMemo(testDb, owner, idAt(0));

    const after = await listMemos(testDb, owner, {});
    expect(after.items.find((m) => m.id === idAt(1))?.linkCount).toBe(0);

    const detail = await getMemoDetail(testDb, owner, idAt(1));
    expect(detail?.links).toStrictEqual([]);
    expect(detail?.linkCount).toBe(0);
  });
});
