import type {
  TagSummary,
  TagWithCount,
} from "@turf-notes/api-contract/schemas";
import type { AppDb } from "@turf-notes/db";
import { memos, memoTags, tags } from "@turf-notes/db/schema";
import {
  normalizeTagName,
  tagDisplayName,
  tagSchema,
} from "@turf-notes/domain";
import type { TagId, TagKind, UserId } from "@turf-notes/domain";
import { and, count, eq, isNull } from "drizzle-orm";
import * as v from "valibot";

export const listTags = async (
  db: AppDb,
  userId: UserId
): Promise<TagWithCount[]> => {
  const rows = await db
    .select({
      id: tags.id,
      name: tags.name,
      kind: tags.kind,
      memoCount: count(memoTags.memoId),
    })
    .from(tags)
    .leftJoin(memoTags, eq(memoTags.tagId, tags.id))
    .leftJoin(
      memos,
      and(eq(memos.id, memoTags.memoId), isNull(memos.deletedAt))
    )
    .where(eq(tags.userId, userId))
    .groupBy(tags.id)
    .orderBy(tags.kind, tags.name);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    kind: row.kind,
    memoCount: row.memoCount,
  }));
};

/**
 * タグを作る。同じ正規化名が既にあればそれを返す（種類の変更はしない）。
 */
export const createTag = async (
  db: AppDb,
  userId: UserId,
  name: string,
  kind: TagKind
): Promise<TagSummary> => {
  const display = tagDisplayName(name);
  const normalizedName = normalizeTagName(display);

  await db
    .insert(tags)
    .values({ userId, kind, name: display, normalizedName })
    .onConflictDoNothing();

  const rows = await db
    .select({ id: tags.id, name: tags.name, kind: tags.kind })
    .from(tags)
    .where(
      and(eq(tags.userId, userId), eq(tags.normalizedName, normalizedName))
    )
    .limit(1);

  const row = rows[0];
  if (row === undefined) {
    throw new Error("tag insert failed");
  }

  // 書き込み境界。保存した名前が Tag の不変条件（表示形）を満たすことを確かめる。
  return v.parse(tagSchema, { id: row.id, name: row.name, kind: row.kind });
};

export const removeTag = async (
  db: AppDb,
  userId: UserId,
  id: TagId
): Promise<boolean> => {
  const deleted = await db
    .delete(tags)
    .where(and(eq(tags.id, id), eq(tags.userId, userId)))
    .returning({ id: tags.id });

  return deleted.length > 0;
};
