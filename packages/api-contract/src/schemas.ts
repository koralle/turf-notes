import * as v from "valibot";

/** タグの種類。馬・人（騎手／調教師）・主題の3種。 */
export const tagKinds = ["horse", "person", "theme"] as const;
export type TagKind = (typeof tagKinds)[number];
export const tagKindSchema = v.picklist(tagKinds);

/** 開催日は `YYYY-MM-DD` の日付文字列で持つ（時刻は持たない）。 */
export const raceDateSchema = v.pipe(
  v.string(),
  v.regex(/^\d{4}-\d{2}-\d{2}$/, "開催日は YYYY-MM-DD 形式で指定してください")
);

export const venueSchema = v.pipe(v.string(), v.minLength(1), v.maxLength(32));

export const raceNumberSchema = v.pipe(
  v.number(),
  v.integer(),
  v.minValue(1),
  v.maxValue(12)
);

/** 書き込み時に受け取るレース情報。3項目そろって初めて意味を持つ。 */
export const raceInputSchema = v.object({
  date: raceDateSchema,
  venue: venueSchema,
  number: raceNumberSchema,
  name: v.optional(v.pipe(v.string(), v.maxLength(64))),
});
export type RaceInput = v.InferOutput<typeof raceInputSchema>;

/** 読み出し時のレース情報。レース名は未設定なら null。 */
export const raceSchema = v.object({
  date: raceDateSchema,
  venue: venueSchema,
  number: raceNumberSchema,
  name: v.nullable(v.string()),
});
export type Race = v.InferOutput<typeof raceSchema>;

export const raceKeySchema = v.object({
  date: raceDateSchema,
  venue: venueSchema,
  number: raceNumberSchema,
});
export type RaceKey = v.InferOutput<typeof raceKeySchema>;

export const idSchema = v.pipe(v.string(), v.uuid());

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

export const tagCreateInputSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(32)),
  kind: tagKindSchema,
});
export type TagCreateInput = v.InferOutput<typeof tagCreateInputSchema>;

/** サインイン画面が「パスワードを使えるか」を事前に知るための公開情報。 */
export const authMethodsSchema = v.object({
  hasPasskey: v.boolean(),
  passwordSignInEnabled: v.boolean(),
});
export type AuthMethods = v.InferOutput<typeof authMethodsSchema>;

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
      id: idSchema,
      title: v.nullable(v.string()),
      body: v.string(),
      race: v.nullable(raceSchema),
      createdAt: v.number(),
      updatedAt: v.number(),
      tagIds: v.array(v.number()),
      linkIds: v.array(idSchema),
    })
  ),
});
export type ExportData = v.InferOutput<typeof exportDataSchema>;
