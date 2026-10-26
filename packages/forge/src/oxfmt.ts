import { defineConfig } from "oxfmt";
import ultracite from "ultracite/oxfmt";

export const oxfmtConfig = defineConfig({
  ...ultracite,
  ignorePatterns: [
    ...(ultracite.ignorePatterns ?? []),
    // リポジトリ固有のパスはここに置かない（各リポジトリの oxfmt.config.ts 側で足す）。
    "**/.agents/**",
    // エージェントの実行時状態。リポジトリの整形対象ではない
    "**/.pi/**",
    // デザイン検討用のモックアップ／スクリーンショットは手で整えた成果物なので整形しない
    "**/design/mockups/**",
    "**/design/screens/**",
  ],
});
