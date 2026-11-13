import path from "node:path";

import type { StorybookConfig } from "@storybook/tanstack-react";
import viteReact from "@vitejs/plugin-react";
import { mergeConfig } from "vite";

const dirname = import.meta.dirname;

const config: StorybookConfig = {
  addons: ["@storybook/addon-docs"],
  core: {
    builder: {
      name: "@storybook/builder-vite",
      options: {
        // アプリ本体の vite.config.ts（Cloudflare / TanStack Start）を読み込ませない。
        viteConfigPath: path.resolve(dirname, "vite.config.ts"),
      },
    },
  },
  framework: { name: "@storybook/tanstack-react", options: {} },
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  viteFinal: (viteConfig) =>
    mergeConfig(viteConfig, {
      plugins: [viteReact()],
      resolve: {
        alias: {
          "styled-system": path.resolve(dirname, "../styled-system"),
        },
      },
    }),
};

export default config;
