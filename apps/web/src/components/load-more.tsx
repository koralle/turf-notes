import { css } from "styled-system/css";

const button = css({
  bg: "panel",
  borderColor: "line",
  borderRadius: "8px",
  borderStyle: "solid",
  borderWidth: "1px",
  cursor: "pointer",
  fontSize: "12px",
  minH: { base: "44px", md: "auto" },
  mt: "16px",
  p: "8px 14px",
  w: "100%",
});

/** 一覧の続きを読むボタン。ホームとタグページで同じ見た目にする。 */
export const LoadMore = ({ onClick }: { onClick: () => void }) => (
  <button className={button} onClick={onClick} type="button">
    もっと見る
  </button>
);
