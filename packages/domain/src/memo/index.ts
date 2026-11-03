import * as v from "valibot";

import { raceSchema } from "../race";
import { readonlyValue } from "../readonly";

/** Memo の同一性（GLOSSARY: 同一性は MemoId であり、タイトルや本文ではない）。 */
export const memoIdSchema = v.pipe(v.string(), v.uuid());

/** 任意の表題。未入力のときは本文の1行目を表示上の見出しに使う（GLOSSARY: Title）。 */
const titleSchema = v.nullable(v.pipe(v.string(), v.maxLength(200)));

/** 本文は1文字以上必須（要件 FR-M1）。 */
const bodySchema = v.pipe(v.string(), v.minLength(1), v.maxLength(65_536));

/** 1つのメモが持てるタグ・参照の上限。 */
const tagIdsSchema = v.pipe(v.array(v.number()), v.maxLength(20));
const linkIdsSchema = v.pipe(v.array(memoIdSchema), v.maxLength(50));

/**
 * Memo の内容。id を持たない。
 * タイトル・レース情報・タグ・参照はすべて任意で、本文だけが必須（要件 FR-M1）。
 */
const memoWriteEntries = {
  body: bodySchema,
  title: v.optional(titleSchema),
  race: v.optional(v.nullable(raceSchema)),
  tagIds: v.optional(tagIdsSchema),
  linkIds: v.optional(linkIdsSchema),
};

/** パース結果は入れ子まで readonly（型だけの制約で、実行時には凍結しない）。 */
export const memoWriteSchema = readonlyValue(v.object(memoWriteEntries));

export type MemoWrite = v.InferOutput<typeof memoWriteSchema>;

/** メモ。同一性は MemoId で、内容は丸ごと差し替えられる。 */
export const memoSchema = v.pipe(
  readonlyValue(v.object({ id: memoIdSchema, ...memoWriteEntries })),
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

/** 同じタグを二度持つことはない。 */
export const tagTargets = (tagIds: readonly number[]): number[] => [
  ...new Set(tagIds),
];

/** 参照先は重複せず、自分自身を指さない（MemoLink は別の Memo への参照）。 */
export const linkTargets = (
  selfId: string,
  linkIds: readonly string[]
): string[] => [...new Set(linkIds)].filter((id) => id !== selfId);
