import type {
  MemoCreateInput,
  MemoUpdateInput,
  RaceInput,
} from "@turf-notes/api-contract/schemas";
import type { AppDb } from "@turf-notes/db";
import { memoLinks, memos, memoTags } from "@turf-notes/db/schema";
import { and, eq } from "drizzle-orm";
import { uuidv7 } from "uuidv7";

const uniqueIds = (ids: readonly string[]): string[] =>
  ids.filter((id, index) => ids.indexOf(id) === index);

const raceColumns = (race: RaceInput | null | undefined) => ({
  raceDate: race?.date ?? null,
  venue: race?.venue ?? null,
  raceNumber: race?.number ?? null,
  raceName: race?.name ?? null,
});

export const createMemo = async (
  db: AppDb,
  userId: string,
  input: MemoCreateInput
): Promise<{ id: string }> => {
  const id = uuidv7();

  await db.transaction(async (tx) => {
    await tx.insert(memos).values({
      id,
      userId,
      title: input.title ?? null,
      body: input.body,
      ...raceColumns(input.race),
    });

    if (input.tagIds !== undefined && input.tagIds.length > 0) {
      await tx
        .insert(memoTags)
        .values(input.tagIds.map((tagId) => ({ memoId: id, tagId })));
    }

    if (input.linkIds !== undefined && input.linkIds.length > 0) {
      await tx.insert(memoLinks).values(
        uniqueIds(input.linkIds)
          .filter((toMemoId) => toMemoId !== id)
          .map((toMemoId) => ({ fromMemoId: id, toMemoId }))
      );
    }
  });

  return { id };
};

export const updateMemo = async (
  db: AppDb,
  userId: string,
  input: MemoUpdateInput
): Promise<boolean> =>
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(memos)
      .set({
        title: input.title ?? null,
        body: input.body,
        ...raceColumns(input.race),
        updatedAt: new Date(),
      })
      .where(and(eq(memos.id, input.id), eq(memos.userId, userId)))
      .returning({ id: memos.id });

    if (updated.length === 0) {
      return false;
    }

    await tx.delete(memoTags).where(eq(memoTags.memoId, input.id));
    if (input.tagIds !== undefined && input.tagIds.length > 0) {
      await tx
        .insert(memoTags)
        .values(input.tagIds.map((tagId) => ({ memoId: input.id, tagId })));
    }

    await tx.delete(memoLinks).where(eq(memoLinks.fromMemoId, input.id));
    const linkIds = uniqueIds(input.linkIds ?? []).filter(
      (toMemoId) => toMemoId !== input.id
    );
    if (linkIds.length > 0) {
      await tx
        .insert(memoLinks)
        .values(
          linkIds.map((toMemoId) => ({ fromMemoId: input.id, toMemoId }))
        );
    }

    return true;
  });

/** 論理削除。関連するタグ紐付けと参照は残すが、読み出しでは除外する。 */
export const softDeleteMemo = async (
  db: AppDb,
  userId: string,
  id: string
): Promise<boolean> => {
  const deleted = await db
    .update(memos)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(memos.id, id), eq(memos.userId, userId)))
    .returning({ id: memos.id });

  return deleted.length > 0;
};
