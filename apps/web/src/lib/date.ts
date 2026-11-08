const formatter = new Intl.DateTimeFormat("ja-JP", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Asia/Tokyo",
  weekday: "short",
  year: "numeric",
});

const parts = (ms: number): Record<string, string> => {
  const entries = formatter
    .formatToParts(new Date(ms))
    .filter((part) => part.type !== "literal")
    .map((part) => [part.type, part.value] as const);

  return Object.fromEntries(entries);
};

/** 一覧の日付スタンプ（年 / 月日 / 曜日）。 */
export const dateStamp = (ms: number) => {
  const p = parts(ms);
  return {
    day: p["day"] ?? "",
    month: p["month"] ?? "",
    weekday: p["weekday"] ?? "",
    year: p["year"] ?? "",
  };
};

/** 2026年11月2日（日）形式。 */
export const fullDate = (isoDate: string): string => {
  const ms = Date.parse(`${isoDate}T00:00:00+09:00`);
  if (Number.isNaN(ms)) {
    return isoDate;
  }
  const p = parts(ms);
  return `${p["year"]}年${Number(p["month"])}月${Number(p["day"])}日（${p["weekday"]}）`;
};
