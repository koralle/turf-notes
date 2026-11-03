import * as v from "valibot";

import { idSchema } from "./common";
import { raceInputSchema, raceKeySchema, raceSchema } from "./race";
import { tagSummarySchema } from "./tag";

export const memoSummarySchema = v.object({
  id: idSchema,
  title: v.nullable(v.string()),
  /** 一覧・参照で見出しとして使う文字列。タイトル、無ければ本文の1行目。 */
  heading: v.string(),
  /** 一覧に出す本文の抜粋。 */
  excerpt: v.string(),
  createdAt: v.number(),
  race: v.nullable(raceSchema),
  tags: v.array(tagSummarySchema),
  /** このメモが参照しているメモ + このメモを参照しているメモの件数。 */
  linkCount: v.number(),
});
export type MemoSummary = v.InferOutput<typeof memoSummarySchema>;

export const memoRefSchema = v.object({
  id: idSchema,
  heading: v.string(),
});
export type MemoRef = v.InferOutput<typeof memoRefSchema>;

export const memoDetailSchema = v.object({
  ...memoSummarySchema.entries,
  body: v.string(),
  /** このメモが参照しているメモ。 */
  links: v.array(memoRefSchema),
  /** このメモを参照しているメモ。 */
  backlinks: v.array(memoRefSchema),
});
export type MemoDetail = v.InferOutput<typeof memoDetailSchema>;

export const memoListInputSchema = v.object({
  q: v.optional(v.string()),
  tagIds: v.optional(v.array(v.number())),
  race: v.optional(raceKeySchema),
  cursor: v.optional(v.string()),
});
export type MemoListInput = v.InferOutput<typeof memoListInputSchema>;

export const memoListOutputSchema = v.object({
  items: v.array(memoSummarySchema),
  nextCursor: v.nullable(v.string()),
});
export type MemoListOutput = v.InferOutput<typeof memoListOutputSchema>;

/** メモの書き込み内容。本文は1文字以上必須（要件 FR-M1）。 */
const memoWriteSchema = v.object({
  body: v.pipe(v.string(), v.minLength(1), v.maxLength(65_536)),
  title: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(200)))),
  race: v.optional(v.nullable(raceInputSchema)),
  tagIds: v.optional(v.pipe(v.array(v.number()), v.maxLength(20))),
  linkIds: v.optional(v.pipe(v.array(idSchema), v.maxLength(50))),
});
export const memoCreateInputSchema = memoWriteSchema;
export type MemoCreateInput = v.InferOutput<typeof memoCreateInputSchema>;

export const memoUpdateInputSchema = v.object({
  id: idSchema,
  ...memoWriteSchema.entries,
});
export type MemoUpdateInput = v.InferOutput<typeof memoUpdateInputSchema>;
