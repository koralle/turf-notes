import { css } from "styled-system/css";

export const BrandRow = () => (
  <div
    className={css({
      alignItems: "center",
      display: "flex",
      gap: "9px",
      mb: { base: "22px", md: "10px" },
    })}
  >
    {/* ロゴの頭文字。読み上げると「T Turf Notes」になるので飾り扱いにする。 */}
    <span
      aria-hidden="true"
      className={css({
        alignItems: "center",
        bg: "accent",
        borderRadius: "6px",
        color: "#fff",
        display: "flex",
        fontSize: "12px",
        fontWeight: 700,
        h: "24px",
        justifyContent: "center",
        w: "24px",
      })}
    >
      T
    </span>
    <span className={css({ fontSize: "15px", fontWeight: 600 })}>
      Turf Notes
    </span>
  </div>
);
