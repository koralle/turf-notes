import type { ExportData } from "@turf-notes/api-contract/schemas";
import type { AppDb } from "@turf-notes/db";
import { memoLinks, memos, memoTags, tags } from "@turf-notes/db/schema";
import type { MemoId, TagId, User } from "@turf-notes/domain";
import { and, asc, eq, isNull } from "drizzle-orm";

import { toRace } from "../../lib/race";

/** 全メモ・タグ・参照を1つの JSON にまとめる（要件 FR-S3）。 */
export const exportAll = async (db: AppDb, user: User): Promise<ExportData> => {
  const [tagRows, memoRows, memoTagRows, linkRows] = await Promise.all([
    db
      .select({ id: tags.id, kind: tags.kind, name: tags.name })
      .from(tags)
      .where(eq(tags.userId, user.id))
      .orderBy(asc(tags.kind), asc(tags.name)),
    db
      .select({
        id: memos.id,
        body: memos.body,
        createdAt: memos.createdAt,
        raceDate: memos.raceDate,
        raceName: memos.raceName,
        raceNumber: memos.raceNumber,
        title: memos.title,
        updatedAt: memos.updatedAt,
        venue: memos.venue,
      })
      .from(memos)
      .where(and(eq(memos.userId, user.id), isNull(memos.deletedAt)))
      .orderBy(asc(memos.createdAt)),
    db
      .select({ memoId: memoTags.memoId, tagId: memoTags.tagId })
      .from(memoTags)
      .innerJoin(memos, eq(memos.id, memoTags.memoId))
      .where(and(eq(memos.userId, user.id), isNull(memos.deletedAt))),
    db
      .select({
        fromMemoId: memoLinks.fromMemoId,
        toMemoId: memoLinks.toMemoId,
      })
      .from(memoLinks)
      .innerJoin(memos, eq(memos.id, memoLinks.fromMemoId))
      .where(and(eq(memos.userId, user.id), isNull(memos.deletedAt))),
  ]);

  // 参照先が削除済みだと、書き出したメモに無い id が linkIds に残る。
  const exportedIds = new Set(memoRows.map((row) => row.id));

  const tagIdsOf = new Map<MemoId, TagId[]>();
  for (const row of memoTagRows) {
    const list = tagIdsOf.get(row.memoId) ?? [];
    list.push(row.tagId);
    tagIdsOf.set(row.memoId, list);
  }

  const linkIdsOf = new Map<MemoId, MemoId[]>();
  for (const row of linkRows) {
    const list = linkIdsOf.get(row.fromMemoId) ?? [];
    list.push(row.toMemoId);
    linkIdsOf.set(row.fromMemoId, list);
  }

  return {
    exportedAt: Date.now(),
    memos: memoRows.map((row) => ({
      body: row.body,
      createdAt: row.createdAt.getTime(),
      id: row.id,
      linkIds: (linkIdsOf.get(row.id) ?? []).filter((id) =>
        exportedIds.has(id)
      ),
      race: toRace(row),
      tagIds: tagIdsOf.get(row.id) ?? [],
      title: row.title,
      updatedAt: row.updatedAt.getTime(),
    })),
    tags: tagRows,
    user: { email: user.email, id: user.id, name: user.name },
  };
};
