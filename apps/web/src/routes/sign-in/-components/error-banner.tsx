import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { css } from "styled-system/css";

const banner = css({
  alignItems: "flex-start",
  borderColor: "danger",
  borderRadius: "7px",
  borderStyle: "solid",
  borderWidth: "1px",
  color: "danger",
  display: "flex",
  fontSize: "12px",
  gap: "7px",
  lineHeight: 1.7,
  p: "9px 11px",
});

/** 1 行ぶんの箱の高さを取って、字が大きくても小さくても 1 行目に揃う。 */
const icon = css({
  alignItems: "center",
  display: "flex",
  flexShrink: "0",
  h: "1lh",
});

/**
 * 操作の失敗を、画面全体に掛かるものとして枠付きで出す。
 * 項目ごとの検証エラー（`InlineError`）とは別物。余白は呼び出し側で足す。
 */
export const ErrorBanner = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={className === undefined ? banner : `${banner} ${className}`}
    role="alert"
  >
    <span aria-hidden="true" className={icon}>
      <CircleAlert size={14} />
    </span>
    {children}
  </div>
);
