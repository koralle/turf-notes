import path from "node:path";

import type { StorybookConfig } from "@storybook/tanstack-react";
import viteReact from "@vitejs/plugin-react";
import { msw } from "msw/vite";
import { mergeConfig } from "vite";

const dirname = import.meta.dirname;

const config: StorybookConfig = {
  addons: ["@storybook/addon-docs", "@storybook/addon-vitest"],
  core: {
    builder: {
      name: "@storybook/builder-vite",
      options: {
        // アプリ本体の vite.config.ts（Cloudflare / TanStack Start）を読み込ませない。
        viteConfigPath: path.resolve(dirname, "vite.config.ts"),
      },
    },
  },
  // 開発時のみ出るオンボーディング（サイドバーのチェックリストと設定メニューの Guide）を消す。
  features: {
    menuOnboardingChecklist: false,
    sidebarOnboardingChecklist: false,
  },
  framework: { name: "@storybook/tanstack-react", options: {} },
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  viteFinal: (viteConfig) =>
    mergeConfig(viteConfig, {
      plugins: [viteReact(), msw()],
    }),
};

export default config;
