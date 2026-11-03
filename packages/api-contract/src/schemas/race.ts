import * as v from "valibot";

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
