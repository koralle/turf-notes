import { parseDate } from "@internationalized/date";
import * as v from "valibot";

import { readonlyValue } from "../readonly";

export const venues = [
  "札幌",
  "函館",
  "福島",
  "新潟",
  "東京",
  "中山",
  "中京",
  "京都",
  "阪神",
  "小倉",
  "門別",
  "盛岡",
  "水沢",
  "浦和",
  "船橋",
  "大井",
  "川崎",
  "金沢",
  "笠松",
  "名古屋",
  "園田",
  "姫路",
  "高知",
  "佐賀",
] as const;

/**
 * 形式・実在・年を見る。CalendarDate のコンストラクタは 2026-02-30 を黙って 02-28 に丸めるので parseDate を使う。
 * 年の範囲は 9026 のようなタイポを弾くためだけのもので、境界自体に意味は無い。
 */
const isRaceDate = (s: string) => {
  try {
    parseDate(s);
  } catch {
    return false;
  }
  const year = Number(s.slice(0, 4));
  return year >= 1900 && year <= 2100;
};

const raceDateSchema = v.pipe(
  v.string(),
  v.check(
    isRaceDate,
    "開催日は 1900〜2100 年の実在する日付（YYYY-MM-DD）で指定してください"
  ),
  v.brand("RaceDate")
);

const venueSchema = v.pipe(v.picklist(venues), v.brand("Venue"));

const raceNumberSchema = v.pipe(
  v.number(),
  v.integer(),
  v.minValue(1),
  v.maxValue(12),
  v.brand("RaceNumber")
);

const raceNameSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1),
  v.maxLength(64)
);

export const raceKeySchema = v.object({
  date: raceDateSchema,
  venue: venueSchema,
  number: raceNumberSchema,
});

export type RaceKey = v.InferOutput<typeof raceKeySchema>;

/** パース結果は入れ子まで readonly（型だけの制約で、実行時には凍結しない）。 */
export const raceSchema = v.pipe(
  readonlyValue(
    v.object({
      ...raceKeySchema.entries,
      name: v.optional(raceNameSchema),
    })
  ),
  v.brand("Race")
);

export type Race = v.InferOutput<typeof raceSchema>;

/**
 * 3つ組がそろっているときだけレースにする（ADR-0001）。
 * DB の4列のように、どれかが欠けうる値から Race を取り出すための入口。
 */
export const raceOf = (fields: {
  date: string | null;
  name?: string | null;
  number: number | null;
  venue: string | null;
}): Race | null => {
  if (fields.date === null || fields.venue === null || fields.number === null) {
    return null;
  }

  return v.parse(raceSchema, {
    date: fields.date,
    venue: fields.venue,
    number: fields.number,
    ...(fields.name === null || fields.name === undefined
      ? {}
      : { name: fields.name }),
  });
};

export const raceKey = ({ date, venue, number }: RaceKey) =>
  `${date}/${venue}/${number}`;

export const sameRace = (left: RaceKey, right: RaceKey) =>
  raceKey(left) === raceKey(right);
