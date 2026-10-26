const parts = (ms: number): Record<string, string> => {
  const formatter = new Intl.DateTimeFormat("ja-JP", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Tokyo",
    weekday: "short",
    year: "numeric",
  });

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

/** 2026/11/02（日）形式。 */
export const fullDate = (isoDate: string): string => {
  const ms = Date.parse(`${isoDate}T00:00:00+09:00`);
  if (Number.isNaN(ms)) {
    return isoDate;
  }
  const p = parts(ms);
  return `${p["year"]}/${p["month"]}/${p["day"]}（${p["weekday"]}）`;
};
