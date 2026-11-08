import { describe, expect, test } from "vitest";

import { dateStamp, fullDate } from "./date";

describe("fullDate", () => {
  test("年月日と曜日を全角括弧で返す", () => {
    expect(fullDate("2026-11-15")).toBe("2026年11月15日（日）");
  });

  test("月日は先頭の0を落とす", () => {
    expect(fullDate("2026-01-05")).toBe("2026年1月5日（月）");
  });

  test("日付として読めなければ入力をそのまま返す", () => {
    expect(fullDate("not-a-date")).toBe("not-a-date");
  });
});

describe("dateStamp", () => {
  test("年・2桁の月日・曜日に分ける", () => {
    expect(dateStamp(Date.parse("2026-11-08T23:30:00+09:00"))).toStrictEqual({
      day: "08",
      month: "11",
      weekday: "日",
      year: "2026",
    });
  });
});
