import {
  memoBodySchema,
  memoIdSchema,
  memoTitleSchema,
} from "@turf-notes/domain";
import * as v from "valibot";

import { raceKeySchema, raceSchema } from "./race";
import { tagSummarySchema } from "./tag";

export type {
  Memo as MemoUpdateInput,
  MemoWrite as MemoCreateInput,
} from "@turf-notes/domain";
export { memoId } from "@turf-notes/domain";
export {
  memoSchema as memoUpdateInputSchema,
  memoWriteSchema as memoCreateInputSchema,
} from "@turf-notes/domain";

export const memoSummarySchema = v.object({
  id: memoIdSchema,
  title: memoTitleSchema,
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
  id: memoIdSchema,
  heading: v.string(),
});
export type MemoRef = v.InferOutput<typeof memoRefSchema>;

export const memoDetailSchema = v.object({
  ...memoSummarySchema.entries,
  body: memoBodySchema,
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
