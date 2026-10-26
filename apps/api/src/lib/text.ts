/** 一覧・参照で使う見出し。タイトルが無ければ本文の最初の非空行。 */
export const headingOf = (title: string | null, body: string): string => {
  const trimmedTitle = title?.trim() ?? "";
  if (trimmedTitle.length > 0) {
    return trimmedTitle;
  }

  const firstLine =
    body.split("\n").find((line) => line.trim().length > 0) ?? "";
  return firstLine.trim().slice(0, 80);
};

/** 一覧に出す本文の抜粋。改行は畳む。 */
export const excerptOf = (body: string): string =>
  body.replaceAll(/\s+/g, " ").trim().slice(0, 120);

/**
 * タグ名の正規化形。表示形はそのまま残し、一意性の判定にだけ使う。
 * NFC で正規化し、前後と連続する空白を畳んで小文字化する。
 */
export const normalizeTagName = (name: string): string =>
  name.normalize("NFC").trim().replaceAll(/\s+/g, " ").toLowerCase();
