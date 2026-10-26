import type {
  MemoDetail,
  MemoListInput,
  MemoRef,
  MemoSummary,
  RaceKey,
  TagSummary,
} from "@turf-notes/api-contract/schemas";
import type { AppDb } from "@turf-notes/db";
import { memoLinks, memos, memoTags, tags } from "@turf-notes/db/schema";
import { and, desc, eq, inArray, isNull, like, lt, or } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

import { toRace } from "../../lib/race";
import { excerptOf, headingOf } from "../../lib/text";

const MEMO_PAGE_SIZE = 20;

interface MemoRow {
  id: string;
  title: string | null;
  body: string;
  raceDate: string | null;
  venue: string | null;
  raceNumber: number | null;
  raceName: string | null;
  createdAt: Date;
  deletedAt: Date | null;
}

const memoColumns = {
  id: memos.id,
  title: memos.title,
  body: memos.body,
  raceDate: memos.raceDate,
  venue: memos.venue,
  raceNumber: memos.raceNumber,
  raceName: memos.raceName,
  createdAt: memos.createdAt,
  deletedAt: memos.deletedAt,
};

const encodeCursor = (createdAt: Date, id: string): string =>
  `${createdAt.getTime()}_${id}`;

const decodeCursor = (cursor: string): { ms: number; id: string } | null => {
  const separator = cursor.indexOf("_");
  if (separator <= 0) {
    return null;
  }

  const ms = Number(cursor.slice(0, separator));
  const id = cursor.slice(separator + 1);
  if (!Number.isFinite(ms) || id.length === 0) {
    return null;
  }

  return { ms, id };
};

/** メモ id の集合に対して、タグと参照件数をまとめて取る。 */
const decorate = async (db: AppDb, rows: MemoRow[]): Promise<MemoSummary[]> => {
  if (rows.length === 0) {
    return [];
  }

  const ids = rows.map((row) => row.id);

  const tagRows = await db
    .select({
      memoId: memoTags.memoId,
      id: tags.id,
      name: tags.name,
      kind: tags.kind,
    })
    .from(memoTags)
    .innerJoin(tags, eq(memoTags.tagId, tags.id))
    .where(inArray(memoTags.memoId, ids));

  const tagsByMemo = new Map<string, TagSummary[]>();
  for (const row of tagRows) {
    const list = tagsByMemo.get(row.memoId) ?? [];
    list.push({ id: row.id, name: row.name, kind: row.kind });
    tagsByMemo.set(row.memoId, list);
  }

  const linkRows = await db
    .select({ fromMemoId: memoLinks.fromMemoId, toMemoId: memoLinks.toMemoId })
    .from(memoLinks)
    .where(
      or(inArray(memoLinks.fromMemoId, ids), inArray(memoLinks.toMemoId, ids))
    );

  const linkCounts = new Map<string, number>();
  for (const row of linkRows) {
    if (ids.includes(row.fromMemoId)) {
      linkCounts.set(row.fromMemoId, (linkCounts.get(row.fromMemoId) ?? 0) + 1);
    }
    if (ids.includes(row.toMemoId)) {
      linkCounts.set(row.toMemoId, (linkCounts.get(row.toMemoId) ?? 0) + 1);
    }
  }

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    heading: headingOf(row.title, row.body),
    excerpt: excerptOf(row.body),
    createdAt: row.createdAt.getTime(),
    race: toRace(row),
    tags: tagsByMemo.get(row.id) ?? [],
    linkCount: linkCounts.get(row.id) ?? 0,
  }));
};

const baseConditions = (userId: string): SQL[] => [
  eq(memos.userId, userId),
  isNull(memos.deletedAt),
];

export const listMemos = async (
  db: AppDb,
  userId: string,
  input: MemoListInput
): Promise<{ items: MemoSummary[]; nextCursor: string | null }> => {
  const conditions = baseConditions(userId);

  const q = input.q?.trim() ?? "";
  if (q.length > 0) {
    // SQLite の LIKE は ASCII に対しては大文字小文字を区別しない。
    // 日本語の表記揺れまでは吸収しないが、部分一致としては十分（要件 FR-L3）。
    const pattern = `%${q}%`;
    const search = or(like(memos.body, pattern), like(memos.title, pattern));
    if (search !== undefined) {
      conditions.push(search);
    }
  }

  for (const tagId of input.tagIds ?? []) {
    const taggedMemoIds = db
      .select({ id: memoTags.memoId })
      .from(memoTags)
      .where(eq(memoTags.tagId, tagId));
    conditions.push(inArray(memos.id, taggedMemoIds));
  }

  if (input.race !== undefined) {
    conditions.push(
      eq(memos.raceDate, input.race.date),
      eq(memos.venue, input.race.venue),
      eq(memos.raceNumber, input.race.number)
    );
  }

  const decoded =
    input.cursor === undefined ? null : decodeCursor(input.cursor);
  if (decoded !== null) {
    const cursorDate = new Date(decoded.ms);
    const keyset = or(
      lt(memos.createdAt, cursorDate),
      and(eq(memos.createdAt, cursorDate), lt(memos.id, decoded.id))
    );
    if (keyset !== undefined) {
      conditions.push(keyset);
    }
  }

  const rows = await db
    .select(memoColumns)
    .from(memos)
    .where(and(...conditions))
    .orderBy(desc(memos.createdAt), desc(memos.id))
    .limit(MEMO_PAGE_SIZE + 1);

  const hasMore = rows.length > MEMO_PAGE_SIZE;
  const page = hasMore ? rows.slice(0, MEMO_PAGE_SIZE) : rows;
  const last = page.at(-1);

  return {
    items: await decorate(db, page),
    nextCursor:
      hasMore && last !== undefined
        ? encodeCursor(last.createdAt, last.id)
        : null,
  };
};

const findMemo = async (
  db: AppDb,
  userId: string,
  id: string
): Promise<MemoRow | null> => {
  const rows = await db
    .select(memoColumns)
    .from(memos)
    .where(and(...baseConditions(userId), eq(memos.id, id)))
    .limit(1);

  return rows[0] ?? null;
};

const toRefs = (
  rows: { id: string; title: string | null; body: string }[]
): MemoRef[] =>
  rows.map((row) => ({ id: row.id, heading: headingOf(row.title, row.body) }));

export const getMemoDetail = async (
  db: AppDb,
  userId: string,
  id: string
): Promise<MemoDetail | null> => {
  const row = await findMemo(db, userId, id);
  if (row === null) {
    return null;
  }

  const [summary] = await decorate(db, [row]);

  const linkRows = await db
    .select({ id: memos.id, title: memos.title, body: memos.body })
    .from(memoLinks)
    .innerJoin(memos, eq(memoLinks.toMemoId, memos.id))
    .where(and(eq(memoLinks.fromMemoId, id), isNull(memos.deletedAt)))
    .orderBy(desc(memos.createdAt));

  const backlinkRows = await db
    .select({ id: memos.id, title: memos.title, body: memos.body })
    .from(memoLinks)
    .innerJoin(memos, eq(memoLinks.fromMemoId, memos.id))
    .where(and(eq(memoLinks.toMemoId, id), isNull(memos.deletedAt)))
    .orderBy(desc(memos.createdAt));

  return {
    ...(summary ?? {
      id: row.id,
      title: row.title,
      heading: headingOf(row.title, row.body),
      excerpt: excerptOf(row.body),
      createdAt: row.createdAt.getTime(),
      race: toRace(row),
      tags: [],
      linkCount: 0,
    }),
    body: row.body,
    links: toRefs(linkRows),
    backlinks: toRefs(backlinkRows),
  };
};

export const listMemosForRace = async (
  db: AppDb,
  userId: string,
  key: RaceKey
): Promise<MemoSummary[]> => {
  const rows = await db
    .select(memoColumns)
    .from(memos)
    .where(
      and(
        ...baseConditions(userId),
        eq(memos.raceDate, key.date),
        eq(memos.venue, key.venue),
        eq(memos.raceNumber, key.number)
      )
    )
    .orderBy(desc(memos.createdAt))
    .limit(100);

  return await decorate(db, rows);
};
