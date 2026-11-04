import { describe, expect, test } from "vitest";

import { toRace } from "./race";

const row = {
  raceDate: "2026-11-02",
  raceName: null,
  raceNumber: 11,
  venue: "東京",
};

describe("toRace", () => {
  test("DB の列をレースに写す", () => {
    expect(toRace(row)).toStrictEqual({
      date: "2026-11-02",
      number: 11,
      venue: "東京",
    });
  });

  test("raceName を name に写し、前後の空白を落とす", () => {
    expect(toRace({ ...row, raceName: "  天皇賞（秋） " })).toStrictEqual({
      date: "2026-11-02",
      name: "天皇賞（秋）",
      number: 11,
      venue: "東京",
    });
  });

  test.each([
    { raceNumber: null, venue: "東京" },
    { raceDate: null, raceNumber: 11 },
    { raceDate: null, venue: "東京" },
  ])("どれか1つでも欠けたらレースにしない %o", (partial) => {
    expect(toRace({ ...row, ...partial })).toBeNull();
  });
});
