import type { ReactNode } from "react";
import { css } from "styled-system/css";

import { BrandRow } from "./brand-row";

const page = css({
  alignItems: "center",
  display: "flex",
  justifyContent: "center",
  minHeight: "100dvh",
  p: { base: "24px", md: "20px" },
});

const card = css({
  bg: { base: "bg", md: "panel" },
  borderColor: "line",
  borderRadius: { base: "0", md: "14px" },
  borderStyle: "solid",
  borderWidth: { base: "0", md: "1px" },
  maxWidth: "380px",
  p: { base: "0", md: "28px" },
  w: "100%",
});

const title = css({
  fontSize: "21px",
  fontWeight: 600,
  m: 0,
  mb: "6px",
});

/**
 * `_app` のシェルと違い、サインインはレイアウトの外に出すので `main` が要る
 * （無いと支援技術が本文へ飛べず、Lighthouse の landmark-one-main も落ちる）。
 */
export const SignInCard = ({ children }: { children: ReactNode }) => (
  <main className={page}>
    <div className={card}>
      <BrandRow />

      <h1 className={title}>サインイン</h1>

      {children}
    </div>
  </main>
);
