import * as v from "valibot";

import { raceSchema } from "../race";
import { readonlyValue } from "../readonly";

/** Memo の同一性。他の uuid（ユーザー・セッションなど）と取り違えないよう brand する。 */
export const memoIdSchema = v.pipe(v.string(), v.uuid(), v.brand("MemoId"));

export type MemoId = v.InferOutput<typeof memoIdSchema>;

/** 文字列から MemoId を作る。DB 行など外から来た id はこれを通す。 */
export const memoId = (value: string): MemoId => v.parse(memoIdSchema, value);

/** 任意の表題。未入力のときは本文の1行目を表示上の見出しに使う（GLOSSARY: Title）。 */
export const memoTitleSchema = v.nullable(v.pipe(v.string(), v.maxLength(200)));

/** 本文は1文字以上必須（要件 FR-M1）。 */
export const memoBodySchema = v.pipe(
  v.string(),
  v.minLength(1),
  v.maxLength(65_536)
);

/** 1つのメモが持てるタグ・参照の上限。同じタグ・同じ参照先を二度持つことはない。 */
const tagIdsSchema = v.pipe(
  v.array(v.number()),
  v.maxLength(20),
  v.check(
    (ids) => new Set(ids).size === ids.length,
    "同じタグを重複して指定できません"
  )
);
const linkIdsSchema = v.pipe(
  v.array(memoIdSchema),
  v.maxLength(50),
  v.check(
    (ids) => new Set(ids).size === ids.length,
    "同じメモを重複して参照できません"
  )
);

/**
 * Memo の内容。id を持たない。
 * タイトル・レース情報・タグ・参照はすべて任意で、本文だけが必須（要件 FR-M1）。
 */
const memoWriteEntries = {
  body: memoBodySchema,
  title: v.optional(memoTitleSchema),
  race: v.optional(v.nullable(raceSchema)),
  tagIds: v.optional(tagIdsSchema),
  linkIds: v.optional(linkIdsSchema),
};

/** パース結果は入れ子まで readonly（型だけの制約で、実行時には凍結しない）。 */
export const memoWriteSchema = readonlyValue(v.object(memoWriteEntries));

export type MemoWrite = v.InferOutput<typeof memoWriteSchema>;

/**
 * メモ。同一性は MemoId で、内容は丸ごと差し替えられる。
 * 自分自身への参照は持てない（MemoLink は別の Memo への参照）。
 */
export const memoSchema = v.pipe(
  readonlyValue(v.object({ id: memoIdSchema, ...memoWriteEntries })),
  v.check(
    (memo) => !(memo.linkIds ?? []).includes(memo.id),
    "自分自身は参照できません"
  ),
  v.brand("Memo")
);

export type Memo = v.InferOutput<typeof memoSchema>;

/** 一覧・参照で使う見出し。タイトルが無ければ本文の最初の非空行。 */
export const headingOf = (title: string | null, body: string): string => {
  const trimmedTitle = title?.trim() ?? "";
  if (trimmedTitle.length > 0) {
    return trimmedTitle;
  }

  const firstLine =
    body.split("\n").find((line) => line.trim().length > 0) ?? "";
  return firstLine.trim().slice(0, 80);
};

/** 一覧に出す本文の抜粋。改行は畳む。 */
export const excerptOf = (body: string): string =>
  body.replaceAll(/\s+/g, " ").trim().slice(0, 120);
