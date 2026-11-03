import * as v from "valibot";

/** タグの種類。馬・人（騎手／調教師）・主題の3種。 */
export const tagKinds = ["horse", "person", "theme"] as const;
export type TagKind = (typeof tagKinds)[number];
export const tagKindSchema = v.picklist(tagKinds);

export const tagSummarySchema = v.object({
  id: v.number(),
  name: v.string(),
  kind: tagKindSchema,
});
export type TagSummary = v.InferOutput<typeof tagSummarySchema>;

export const tagWithCountSchema = v.object({
  ...tagSummarySchema.entries,
  memoCount: v.number(),
});
export type TagWithCount = v.InferOutput<typeof tagWithCountSchema>;

export const tagCreateInputSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(32)),
  kind: tagKindSchema,
});
export type TagCreateInput = v.InferOutput<typeof tagCreateInputSchema>;
