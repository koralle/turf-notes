import type { KnipConfig } from "knip";

const config: KnipConfig = {
  tags: ["-lintignore"],
  // .pi 配下のスキル用クローンはこのリポジトリのソースではない。
  ignore: ["**/.pi/git/**"],
  // lefthook.yaml / git hooks を entry として解析させない。
  lefthook: false,
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
      ignoreDependencies: ["lefthook"],
    },
    "apps/api": {
      vitest: { config: ["vitest.config.ts"] },
    },
    "apps/web": {
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
