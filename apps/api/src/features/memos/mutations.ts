import type {
  MemoCreateInput,
  MemoUpdateInput,
  RaceInput,
} from "@turf-notes/api-contract/schemas";
import type { AppDb } from "@turf-notes/db";
import { memoLinks, memos, memoTags, tags } from "@turf-notes/db/schema";
import { memoId } from "@turf-notes/domain";
import type { MemoId, TagId, UserId } from "@turf-notes/domain";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { uuidv7 } from "uuidv7";

const raceColumns = (race: RaceInput | null | undefined) => ({
  raceDate: race?.date ?? null,
  venue: race?.venue ?? null,
  raceNumber: race?.number ?? null,
  raceName: race?.name ?? null,
});

export const createMemo = async (
  db: AppDb,
  userId: UserId,
  input: MemoCreateInput
): Promise<CreateMemoResult> => {
  const id = memoId(uuidv7());
  // id はサーバーで採番するので、自分自身を参照する入力は作れない。
  const tagIds = input.tagIds ?? [];
  const linkIds = input.linkIds ?? [];

  const missing = await missingReference(db, userId, tagIds, linkIds);
  if (missing !== null) {
    return { kind: missing };
  }

  await db.transaction(async (tx) => {
    await tx.insert(memos).values({
      id,
      userId,
      title: input.title ?? null,
      body: input.body,
      ...raceColumns(input.race),
    });

    if (tagIds.length > 0) {
      await tx
        .insert(memoTags)
        .values(tagIds.map((tagId) => ({ memoId: id, tagId })));
    }

    if (linkIds.length > 0) {
      await tx
        .insert(memoLinks)
        .values(linkIds.map((toMemoId) => ({ fromMemoId: id, toMemoId })));
    }
  });

  return { kind: "ok", id };
};

export type UpdateMemoResult =
  | { kind: "ok" }
  | { kind: "not-found" }
  | { kind: "conflict" }
  | { kind: "tag-not-found" }
  | { kind: "link-not-found" };

export type CreateMemoResult =
  | { kind: "ok"; id: MemoId }
  | { kind: "tag-not-found" }
  | { kind: "link-not-found" };

/**
 * タグと参照先が自分のもので、書き込み先として存在することを確かめる。
 * 確かめないと、FK 違反が素の SQL エラー（500）になったり、他人の行を混ぜられたりする。
 */
const missingReference = async (
  db: AppDb,
  userId: UserId,
  tagIds: readonly TagId[],
  linkIds: readonly MemoId[]
): Promise<"tag-not-found" | "link-not-found" | null> => {
  if (tagIds.length > 0) {
    const rows = await db
      .select({ id: tags.id })
      .from(tags)
      .where(and(eq(tags.userId, userId), inArray(tags.id, tagIds)));
    if (new Set(rows.map((row) => row.id)).size !== new Set(tagIds).size) {
      return "tag-not-found";
    }
  }

  if (linkIds.length > 0) {
    const rows = await db
      .select({ id: memos.id })
      .from(memos)
      .where(
        and(
          eq(memos.userId, userId),
          isNull(memos.deletedAt),
          inArray(memos.id, linkIds)
        )
      );
    if (new Set(rows.map((row) => row.id)).size !== new Set(linkIds).size) {
      return "link-not-found";
    }
  }

  return null;
};

/**
 * 内容を丸ごと差し替える。読み込んだ版番号と一致しない時は書き換えずに conflict を返す
 * （楽観ロック）。タグと参照も同じトランザクションで入れ替える。
 */
export const updateMemo = async (
  db: AppDb,
  userId: UserId,
  input: MemoUpdateInput
): Promise<UpdateMemoResult> => {
  const missing = await missingReference(
    db,
    userId,
    input.tagIds ?? [],
    input.linkIds ?? []
  );
  if (missing !== null) {
    return { kind: missing };
  }

  return await db.transaction(async (tx) => {
    const updated = await tx
      .update(memos)
      .set({
        title: input.title ?? null,
        body: input.body,
        ...raceColumns(input.race),
        version: input.version + 1,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(memos.id, input.id),
          eq(memos.userId, userId),
          eq(memos.version, input.version),
          // 削除済みのメモは書き換えない（別タブで削除された場合）。
          isNull(memos.deletedAt)
        )
      )
      .returning({ id: memos.id });

    if (updated.length === 0) {
      // 版番号が合わなかったのか、そもそも無いのかを分けて返す。
      const rows = await tx
        .select({ id: memos.id })
        .from(memos)
        .where(
          and(
            eq(memos.id, input.id),
            eq(memos.userId, userId),
            isNull(memos.deletedAt)
          )
        )
        .limit(1);

      return rows.length > 0 ? { kind: "conflict" } : { kind: "not-found" };
    }

    await tx.delete(memoTags).where(eq(memoTags.memoId, input.id));
    const tagIds = input.tagIds ?? [];
    if (tagIds.length > 0) {
      await tx
        .insert(memoTags)
        .values(tagIds.map((tagId) => ({ memoId: input.id, tagId })));
    }

    await tx.delete(memoLinks).where(eq(memoLinks.fromMemoId, input.id));
    const linkIds = input.linkIds ?? [];
    if (linkIds.length > 0) {
      await tx
        .insert(memoLinks)
        .values(
          linkIds.map((toMemoId) => ({ fromMemoId: input.id, toMemoId }))
        );
    }

    return { kind: "ok" };
  });
};

/** 論理削除。関連するタグ紐付けと参照は残すが、読み出しでは除外する。 */
export const softDeleteMemo = async (
  db: AppDb,
  userId: UserId,
  id: MemoId
): Promise<boolean> => {
  const deleted = await db
    .update(memos)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(memos.id, id), eq(memos.userId, userId)))
    .returning({ id: memos.id });

  return deleted.length > 0;
};
