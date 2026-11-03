/**
 * タグ名の正規化形。表示形はそのまま残し、一意性の判定にだけ使う。
 * NFC で正規化し、前後と連続する空白を畳んで小文字化する。
 */
export const normalizeTagName = (name: string): string =>
  name.normalize("NFC").trim().replaceAll(/\s+/g, " ").toLowerCase();
