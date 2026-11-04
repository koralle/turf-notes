import { memoIdSchema, tagIdSchema, tagSchema } from "@turf-notes/domain";
import * as v from "valibot";

import { userSchema } from "./auth";
import { raceSchema } from "./race";

/** JSON エクスポート。メモ・タグ・参照をすべて含む（要件 FR-S3）。 */
export const exportDataSchema = v.object({
  exportedAt: v.number(),
  user: userSchema,
  tags: v.array(tagSchema),
  memos: v.array(
    v.object({
      id: memoIdSchema,
      title: v.nullable(v.string()),
      body: v.string(),
      race: v.nullable(raceSchema),
      createdAt: v.number(),
      updatedAt: v.number(),
      tagIds: v.array(tagIdSchema),
      linkIds: v.array(memoIdSchema),
    })
  ),
});
export type ExportData = v.InferOutput<typeof exportDataSchema>;
