import { tagIdSchema, tagKindSchema, tagNameSchema } from "@turf-notes/domain";
import * as v from "valibot";

/**
 * 一覧・詳細で返すタグ。読み出しの境界なので、書き込み時の正規化（trim・長さ）はかけない。
 * id と kind だけは語彙として検証する。
 */
export const tagSummarySchema = v.object({
  id: tagIdSchema,
  name: v.string(),
  kind: tagKindSchema,
});

export type TagSummary = v.InferOutput<typeof tagSummarySchema>;

/** タグ一覧用。メモ件数と最後に使われた日時（Unix ms。未使用は null）を伴う。 */
export const tagWithCountSchema = v.object({
  ...tagSummarySchema.entries,
  memoCount: v.number(),
  lastUsedAt: v.nullable(v.number()),
});

export type TagWithCount = v.InferOutput<typeof tagWithCountSchema>;

export const tagCreateInputSchema = v.object({
  name: tagNameSchema,
  kind: tagKindSchema,
});

export type TagCreateInput = v.InferOutput<typeof tagCreateInputSchema>;
