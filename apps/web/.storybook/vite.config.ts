import path from "node:path";

import { defineConfig } from "vite";

/**
 * Storybook 専用の Vite 設定。アプリ本体の `vite.config.ts`（Cloudflare / TanStack Start）は
 * Storybook には要らないので読み込ませない。
 */
export default defineConfig({
  resolve: {
    alias: {
      "styled-system": path.resolve(import.meta.dirname, "../styled-system"),
    },
  },
});
