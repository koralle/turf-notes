import { defineConfig } from "@pandacss/dev";

/**
 * デザインの正本は `design/mockups/` のモックアップ。
 * 色は「無彩色＋深緑1色」に絞り、タグの種類だけ色で区別する。
 */
export default defineConfig({
  preflight: false,
  include: ["./src/**/*.{ts,tsx}"],
  exclude: [],
  outdir: "styled-system",
  jsxFramework: "react",
  theme: {
    extend: {
      tokens: {
        colors: {
          bg: { value: "#fbfbfb" },
          panel: { value: "#ffffff" },
          ink: { value: "#18181b" },
          muted: { value: "#71717a" },
          faint: { value: "#a1a1aa" },
          line: { value: "#e7e7ea" },
          accent: { value: "#15803d" },
          accentWeak: { value: "#ecfdf3" },
          chip: { value: "#f4f4f5" },
          chipInk: { value: "#3f3f46" },
          horse: { value: "#15803d" },
          person: { value: "#2563eb" },
          theme: { value: "#a16207" },
          danger: { value: "#b45309" },
        },
      },
    },
  },
});
