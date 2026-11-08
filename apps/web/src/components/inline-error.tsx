import type { ReactNode } from "react";
import { css } from "styled-system/css";

const base = css({ color: "danger", display: "block", fontSize: "11.5px" });

/** 操作の失敗を出す一行。`output` なので支援技術にも読まれる。余白は呼び出し側で足す。 */
export const InlineError = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <output className={className === undefined ? base : `${base} ${className}`}>
    {children}
  </output>
);
