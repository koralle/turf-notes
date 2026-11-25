import { memoLinks, memos, memoTags, tags, users } from "@turf-notes/db/schema";
import { memoId, userId } from "@turf-notes/domain";
import type { MemoId } from "@turf-notes/domain";
import { beforeEach, describe, expect, test } from "vitest";

import { resetTestDb, testDb } from "../../test-db";
import { exportAll } from "./queries";

const owner = userId("user-owner");
const user = { email: "owner@example.com", id: owner, name: "Owner" };

/** 決定的な時刻。書き出しの並び順を確かめるために createdAt を直接入れる。 */
const BASE = 1_700_000_000_000;

const idAt = (i: number): MemoId =>
  memoId(`0192f0aa-0000-7000-8000-${String(i).padStart(12, "0")}`);

beforeEach(async () => {
  await resetTestDb();
  await testDb
    .insert(users)
    .values({ email: user.email, id: owner, name: user.name });
});

describe("exportAll", () => {
  test("メモ・タグ・参照・ユーザーを 1 つの JSON にまとめる（FR-S3）", async () => {
    await testDb.insert(memos).values([
      {
        body: "参照先",
        createdAt: new Date(BASE),
        id: idAt(0),
        updatedAt: new Date(BASE),
        userId: owner,
      },
      {
        body: "参照元",
        createdAt: new Date(BASE + 1),
        id: idAt(1),
        raceDate: "2026-11-02",
        raceName: "天皇賞（秋）",
        raceNumber: 11,
        title: "見出し",
        updatedAt: new Date(BASE + 2),
        userId: owner,
        venue: "東京",
      },
    ]);

    const [tag] = await testDb
      .insert(tags)
      .values({
        kind: "horse",
        name: "ソダシ",
        normalizedName: "ソダシ",
        userId: owner,
      })
      .returning();

    if (tag === undefined) {
      throw new Error("tag insert failed");
    }

    await testDb.insert(memoTags).values({ memoId: idAt(1), tagId: tag.id });
    await testDb
      .insert(memoLinks)
      .values({ fromMemoId: idAt(1), toMemoId: idAt(0) });

    const dump = await exportAll(testDb, user);

    expect(dump.memos).toStrictEqual([
      {
        body: "参照先",
        createdAt: BASE,
        id: idAt(0),
        linkIds: [],
        race: null,
        tagIds: [],
        title: null,
        updatedAt: BASE,
      },
      {
        body: "参照元",
        createdAt: BASE + 1,
        id: idAt(1),
        linkIds: [idAt(0)],
        race: {
          date: "2026-11-02",
          name: "天皇賞（秋）",
          number: 11,
          venue: "東京",
        },
        tagIds: [tag.id],
        title: "見出し",
        updatedAt: BASE + 2,
      },
    ]);
    expect(dump.tags).toStrictEqual([
      { id: tag.id, kind: "horse", name: "ソダシ" },
    ]);
    expect(dump.user).toStrictEqual({
      email: user.email,
      id: owner,
      name: user.name,
    });
  });
});
