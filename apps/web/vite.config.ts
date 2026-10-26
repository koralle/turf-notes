import { readFileSync } from "node:fs";
import path from "node:path";

import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const apiRoot = path.resolve(import.meta.dirname, "../api");

/** `apps/api/.dev.vars` を読む。auxiliary worker には vars を明示的に渡す必要がある。 */
const readApiDevVars = (): Record<string, string> => {
  try {
    const text = readFileSync(path.join(apiRoot, ".dev.vars"), "utf-8");
    return Object.fromEntries(
      text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith("#"))
        .map((line) => {
          const separator = line.indexOf("=");
          return [
            line.slice(0, separator).trim(),
            line.slice(separator + 1).trim(),
          ] as const;
        })
    );
  } catch {
    return {};
  }
};

/**
 * `vite dev` で turf-notes-api を auxiliary worker として同時に起動し、
 * `env.API` の Service Binding を本物の API に繋ぐ。
 */
const apiAuxiliaryWorker = () => ({
  config: { vars: readApiDevVars() },
  configPath: path.join(apiRoot, "wrangler.jsonc"),
});

export default defineConfig(({ command }) => ({
  plugins: [
    cloudflare({
      viteEnvironment: { name: "ssr" },
      // build では API を同梱しない（apps/api から別にデプロイする）。
      ...(command === "serve"
        ? { auxiliaryWorkers: [apiAuxiliaryWorker()] }
        : {}),
    }),
    tanstackStart(),
    viteReact(),
  ],
  resolve: {
    alias: {
      "styled-system": path.resolve(import.meta.dirname, "styled-system"),
    },
  },
  server: {
    port: 3000,
    // 3000 が埋まっていたら別ポートへ黙って逃げない（BETTER_AUTH_URL とズレるため）。
    strictPort: true,
  },
}));
