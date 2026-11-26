import path from "node:path";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import viteReact from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { msw } from "msw/vite";
import { defineConfig } from "vitest/config";
import type { BrowserConfigOptions } from "vitest/node";

/**
 * ブラウザプロジェクトが2つあるので instance 名を分ける。既定名だとどちらも
 * `browser (chromium)` になり、Vitest が重複プロジェクトとして起動を拒否する。
 */
const chromiumBrowser = (name: string) =>
  ({
    enabled: true,
    headless: true,
    provider: playwright({
      launchOptions: {
        args: [
          "--enable-features=DeferRendererTasksAfterInput:policy/minimal-types",
        ],
      },
    }),
    instances: [{ browser: "chromium", name }],
  }) as const satisfies BrowserConfigOptions;

const storybookConfigDir = path.join(import.meta.dirname, ".storybook");

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "json"],
      reportOnFailure: true,
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/mocks/**",
        "src/routeTree.gen.ts",
        "src/test-browser-setup.ts",
        "src/types.d.ts",
        "**/*.test.{ts,tsx}",
        "**/*.stories.tsx",
      ],
    },
    projects: [
      {
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts", "*.test.ts"],
          exclude: ["src/**/*.browser.test.ts"],
        },
      },
      {
        extends: ".storybook/vite.config.ts",
        plugins: [viteReact(), msw()],
        optimizeDeps: {
          // src/rpc/client.ts の SSR 分岐が動的 import する ssr-fetch.ts はブラウザでは実行されない。
          // 事前バンドル対象から外して `#tanstack-start-entry` の解決失敗を防ぐ。
          exclude: [
            "@tanstack/react-start",
            "@tanstack/react-start/server",
            "@tanstack/start-server-core",
          ],
          // テスト実行中のオンザフライ最適化によるリロードを防ぐ。
          include: [
            "@turf-notes/domain > @internationalized/date",
            "@orpc/client",
            "@orpc/client/fetch",
            "@orpc/contract",
            "@orpc/react-query",
            "@orpc/server",
            "@orpc/server/fetch",
            "valibot",
          ],
        },
        test: {
          name: "browser",
          include: ["src/**/*.browser.test.{ts,tsx}"],
          setupFiles: ["src/test-browser-setup.ts"],
          passWithNoTests: true,
          browser: chromiumBrowser("browser-chromium"),
        },
      },
      {
        extends: ".storybook/vite.config.ts",
        plugins: [
          storybookTest({
            configDir: storybookConfigDir,
          }),
        ],
        test: {
          // addon は `storybook:<Storybook の configDir>` の名前でプロジェクトを引くので、
          // ここで別名を付けると Storybook のテストパネルがプロジェクトを見つけられない。
          name: `storybook:${storybookConfigDir}`,
          browser: chromiumBrowser("storybook-chromium"),
        },
      },
    ],
  },
});
