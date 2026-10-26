import type { ReactNode } from "react";
import { css } from "styled-system/css";

import { ChevronLeftIcon } from "./icons";

const headerStyle = css({
  alignItems: "center",
  bg: "panel",
  borderBottomColor: "line",
  borderBottomStyle: "solid",
  borderBottomWidth: "1px",
  display: { base: "flex", md: "none" },
  flex: "0 0 auto",
  gap: "4px",
  minH: "54px",
  px: "6px",
  py: "5px",
  position: "sticky",
  top: 0,
  zIndex: 10,
});

const backStyle = css({
  alignItems: "center",
  color: "muted",
  display: "flex",
  h: "44px",
  justifyContent: "center",
  w: "44px",
});

const titleStyle = css({ fontSize: "14.5px", fontWeight: 600 });

const actionSlot = css({
  alignItems: "center",
  display: "flex",
  ml: "auto",
  pr: "6px",
});

const noteStyle = css({
  color: "faint",
  fontSize: "11.5px",
  ml: "auto",
  pr: "12px",
});

/**
 * スマートフォン用のサブ画面ヘッダー。タブバーを隠す画面で使う。
 * PC では表示しない（`md` で `display: none`）。
 */
export const MobileHeader = ({
  title,
  onBack,
  action,
  note,
}: {
  title: string;
  onBack: () => void;
  action?: ReactNode | undefined;
  note?: string | undefined;
}) => {
  let trailing: ReactNode = null;
  if (action !== undefined) {
    trailing = <div className={actionSlot}>{action}</div>;
  } else if (note !== undefined) {
    trailing = <span className={noteStyle}>{note}</span>;
  }

  return (
    <div className={headerStyle}>
      <button
        aria-label="戻る"
        className={backStyle}
        onClick={onBack}
        type="button"
      >
        <ChevronLeftIcon size={21} />
      </button>
      <span className={titleStyle}>{title}</span>
      {trailing}
    </div>
  );
};
