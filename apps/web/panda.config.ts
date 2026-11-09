import { defineConfig } from "@pandacss/dev";

/**
 * デザインの正本は `design/mockups/` のモックアップ。
 * 色は「無彩色＋深緑1色」に絞り、タグの種類だけ色で区別する。
 */
export default defineConfig({
  // v2 は preset を自動で追加しない。v1 の既定（base + panda）を明示する。
  presets: ["@pandacss/preset-base", "@pandacss/preset-panda"],
  // リセットは `src/index.css` で読み込む kiso.css。ここを true に戻すと
  // reset レイヤーで二重になり、kiso.css とどちらが勝つか分からなくなる。
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
          // 補助テキストは小さく（10〜12px）出すので、WCAG AA の 4.5:1 を満たす濃さにする。
          muted: { value: "#52525b" },
          faint: { value: "#71717a" },
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
