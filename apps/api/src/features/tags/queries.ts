import type {
  TagKind,
  TagSummary,
  TagWithCount,
} from "@turf-notes/api-contract/schemas";
import type { AppDb } from "@turf-notes/db";
import { memos, memoTags, tags } from "@turf-notes/db/schema";
import { and, count, eq, isNull } from "drizzle-orm";

import { normalizeTagName } from "../../lib/text";

export const listTags = async (
  db: AppDb,
  userId: string
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
  userId: string,
  name: string,
  kind: TagKind
): Promise<TagSummary> => {
  const display = name.normalize("NFC").trim().replaceAll(/\s+/g, " ");
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

  return { id: row.id, name: row.name, kind: row.kind };
};

export const removeTag = async (
  db: AppDb,
  userId: string,
  id: number
): Promise<boolean> => {
  const deleted = await db
    .delete(tags)
    .where(and(eq(tags.id, id), eq(tags.userId, userId)))
    .returning({ id: tags.id });

  return deleted.length > 0;
};
