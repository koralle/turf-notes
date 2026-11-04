// ルートの @turf-notes/domain を引くと schemas のバレルが no-barrel-file の上限を超えるため、タグだけを読む。
import {
  tagIdSchema,
  tagKindSchema,
  tagNameSchema,
} from "@turf-notes/domain/tag";
import * as v from "valibot";

export {
  tagIdSchema,
  tagKindSchema,
  tagNameSchema,
  tagSchema as tagSummarySchema,
} from "@turf-notes/domain/tag";
export type { Tag as TagSummary } from "@turf-notes/domain/tag";

/** タグ一覧用。メモ件数を伴う。 */
export const tagWithCountSchema = v.object({
  id: tagIdSchema,
  name: tagNameSchema,
  kind: tagKindSchema,
  memoCount: v.number(),
});
export type TagWithCount = v.InferOutput<typeof tagWithCountSchema>;

export const tagCreateInputSchema = v.object({
  name: tagNameSchema,
  kind: tagKindSchema,
});
export type TagCreateInput = v.InferOutput<typeof tagCreateInputSchema>;
