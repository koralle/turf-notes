import { memoIdSchema } from "@turf-notes/domain";
import * as v from "valibot";

import { raceSchema } from "./race";
import { tagKindSchema } from "./tag";

/** JSON エクスポート。メモ・タグ・参照をすべて含む（要件 FR-S3）。 */
export const exportDataSchema = v.object({
  exportedAt: v.number(),
  user: v.object({ id: v.string(), name: v.string(), email: v.string() }),
  tags: v.array(
    v.object({
      id: v.number(),
      kind: tagKindSchema,
      name: v.string(),
    })
  ),
  memos: v.array(
    v.object({
      id: memoIdSchema,
      title: v.nullable(v.string()),
      body: v.string(),
      race: v.nullable(raceSchema),
      createdAt: v.number(),
      updatedAt: v.number(),
      tagIds: v.array(v.number()),
      linkIds: v.array(memoIdSchema),
    })
  ),
});
export type ExportData = v.InferOutput<typeof exportDataSchema>;
