import { describe, expect, test } from "vitest";

import { toRace } from "./race";

describe("toRace", () => {
  test("3つ組がそろえばレースとして返す", () => {
    expect(
      toRace({
        raceDate: "2026-11-02",
        raceName: null,
        raceNumber: 11,
        venue: "東京",
      })
    ).toStrictEqual({
      date: "2026-11-02",
      name: null,
      number: 11,
      venue: "東京",
    });
  });

  test("どれか1つでも欠けたらレースにしない", () => {
    expect(
      toRace({
        raceDate: "2026-11-02",
        raceName: null,
        raceNumber: null,
        venue: "東京",
      })
    ).toBeNull();
  });
});
