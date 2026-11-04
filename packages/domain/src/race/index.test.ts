import * as v from "valibot";
import { describe, expect, test } from "vitest";

import { raceKey, raceKeySchema, raceOf, raceSchema, sameRace } from ".";

const accepted = (input: unknown) => v.safeParse(raceSchema, input).success;

const tokyo11 = v.parse(raceKeySchema, {
  date: "2026-11-02",
  number: 11,
  venue: "東京",
});

const other = (overrides: Partial<v.InferInput<typeof raceKeySchema>>) =>
  v.parse(raceKeySchema, { ...tokyo11, ...overrides });

describe("raceSchema", () => {
  test("3つ組と任意のレース名を受け取る", () => {
    expect(
      v.parse(raceSchema, { ...tokyo11, name: "  天皇賞（秋） " })
    ).toStrictEqual({ ...tokyo11, name: "天皇賞（秋）" });
    expect(v.parse(raceSchema, tokyo11)).toStrictEqual(tokyo11);
  });

  test("レース名が空白だけならレース名なしとして弾く", () => {
    expect(accepted({ ...tokyo11, name: "   " })).toBe(false);
  });

  test.each([
    { number: 11, venue: "東京" },
    { date: "2026-11-02", number: 11 },
    { date: "2026-11-02", venue: "東京" },
    { ...tokyo11, date: null },
    { ...tokyo11, number: undefined },
  ])("3つ組が欠けたらレースにしない %o", (input) => {
    expect(accepted(input)).toBe(false);
  });

  test.each([
    "2026-02-30",
    "2026-02-29",
    "2026-13-01",
    "2026-1-2",
    "2026-11-02T00:00:00Z",
    "1899-12-31",
    "2101-01-01",
    "",
  ])("開催日 %s は弾く", (date) => {
    expect(accepted({ ...tokyo11, date })).toBe(false);
  });

  test.each(["1900-01-01", "2024-02-29", "2026-11-02", "2100-12-31"])(
    "開催日 %s は通す",
    (date) => {
      expect(accepted({ ...tokyo11, date })).toBe(true);
    }
  );

  test("競馬場は一覧の外なら弾く", () => {
    expect(accepted({ ...tokyo11, venue: "ドバイ" })).toBe(false);
  });

  test.each([0, 13, 11.5])("レース番号 %s は弾く", (number) => {
    expect(accepted({ ...tokyo11, number })).toBe(false);
  });
});

describe("readonlyValue", () => {
  test("入れ子の値も型レベルで readonly にする", () => {
    const race = v.parse(raceSchema, { ...tokyo11, name: "天皇賞（秋）" });

    // @ts-expect-error readonly なので属性を書き換えられない
    race.venue = "京都";

    // readonly は型だけの制約なので、実行時には書き換わる
    expect(race.venue).toBe("京都");
  });
});

describe("raceKey / sameRace", () => {
  test("キーは開催日・競馬場・レース番号の3つ組", () => {
    expect(raceKey(tokyo11)).toBe("2026-11-02/東京/11");
  });

  test("レース名は同一性に関与しない", () => {
    const named = v.parse(raceSchema, { ...tokyo11, name: "天皇賞（秋）" });
    expect(sameRace(tokyo11, named)).toBe(true);
  });

  test("3つ組のどれかが違えば別のレース", () => {
    expect(sameRace(tokyo11, other({ number: 12 }))).toBe(false);
    expect(sameRace(tokyo11, other({ venue: "京都" }))).toBe(false);
    expect(sameRace(tokyo11, other({ date: "2026-11-08" }))).toBe(false);
  });
});

describe("raceOf", () => {
  test("3つ組がそろえばレースとして返す", () => {
    expect(
      raceOf({
        date: "2026-11-02",
        name: null,
        number: 11,
        venue: "東京",
      })
    ).toStrictEqual({ date: "2026-11-02", number: 11, venue: "東京" });
  });

  test("レース名は前後の空白を落として持つ", () => {
    expect(
      raceOf({
        date: "2026-11-02",
        name: "  天皇賞（秋） ",
        number: 11,
        venue: "東京",
      })
    ).toStrictEqual({
      date: "2026-11-02",
      name: "天皇賞（秋）",
      number: 11,
      venue: "東京",
    });
  });

  test.each([
    { number: null, venue: "東京" },
    { date: null, number: 11 },
    { date: null, venue: "東京" },
  ])("どれか1つでも欠けたらレースにしない %o", (partial) => {
    expect(
      raceOf({ date: "2026-11-02", number: 11, venue: "東京", ...partial })
    ).toBeNull();
  });
});
