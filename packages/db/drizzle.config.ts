import { defineConfig } from "drizzle-kit";

// ローカルは libSQL のファイル DB を使う（Docker 不要）。
// 本番は TURSO_CONNECTION_URL / TURSO_AUTH_TOKEN を差し替える。
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/schema/index.ts",
  out: "./drizzle",
});
