import type { KnipConfig } from "knip";

const config: KnipConfig = {
  tags: ["-lintignore"],
  // .pi 配下のスキル用クローンと .agents のスキル用ツールはこのリポジトリのソースではない。
  ignore: ["**/.pi/git/**", "**/.agents/**"],
  // lefthook.yaml / git hooks を entry として解析させない。
  lefthook: false,
  // knip 6.32 の TypeScript プラグインは typescript 系の依存を検出すると有効になるが、
  // このリポジトリは tsrs を使うため無効のままになる。tsconfig の extends / types を
  // 未使用依存として誤検出しないよう、ここで明示的に有効化する。
  typescript: true,
  rules: {
    exports: "warn",
    types: "warn",
    nsExports: "warn",
    nsTypes: "warn",
    enumMembers: "warn",
    namespaceMembers: "warn",
    duplicates: "warn",
    catalog: "warn",
  },
  workspaces: {
    ".": {
      // エージェントが `pnpm intent` で使う CLI。コードからは import しない。
      ignoreDependencies: ["lefthook", "@tanstack/intent"],
    },
    "apps/api": {
      vitest: { config: ["vitest.config.ts"] },
    },
    "apps/web": {
      // Storybook 専用の Vite 設定は main.ts からパス文字列で参照している
      entry: [".storybook/vite.config.ts", "src/**/*.stories.tsx"],
      ignoreDependencies: [
        // Workers の仮想モジュール（npm パッケージではない）
        "cloudflare",
        // src/index.css の @import で読み込むセルフホスト書体
        "@fontsource/noto-sans-jp",
      ],
    },
  },
};

export default config;
