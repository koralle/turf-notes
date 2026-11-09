import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // テスト用の libSQL コンテナを1回だけ起動し、全ファイルで使い回す。
    globalSetup: ["./src/test-global-setup.ts"],
    // 1つの DB を共有し、各テストの前にテーブルを空にする。並列だと消し合う。
    fileParallelism: false,
    include: ["src/**/*.test.ts"],
  },
});
