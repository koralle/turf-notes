import { oxfmtConfig } from "@turf-notes/forge/oxfmt";
import { defineConfig } from "oxfmt";

// 共通設定は @turf-notes/forge/oxfmt が持つ。ここにはルート固有の差分だけを置く。
export default defineConfig({
  ...oxfmtConfig,
  ignorePatterns: [
    ...(oxfmtConfig.ignorePatterns ?? []),
    // apm が生成するロックファイル（手で整形しない）
    "apm.lock.yaml",
  ],
});
