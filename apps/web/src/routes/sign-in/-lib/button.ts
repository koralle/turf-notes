import { css } from "styled-system/css";

/** サインイン画面の主要ボタン。パスキーとパスワードの2経路で同じ見た目にする。 */
export const primaryButton = css({
  alignItems: "center",
  bg: "accent",
  border: "none",
  borderRadius: "9px",
  color: "#fff",
  cursor: "pointer",
  display: "flex",
  fontSize: { base: "15px", md: "13px" },
  fontWeight: 600,
  justifyContent: "center",
  minH: { base: "48px", md: "auto" },
  py: "10px",
  w: "100%",
});
