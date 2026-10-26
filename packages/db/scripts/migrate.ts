import { mkdir } from "node:fs/promises";
import path from "node:path";

import { migrate } from "drizzle-orm/libsql/migrator";

import { createDb } from "../src/client";

// 既定は apps/api/compose.yaml のローカル libSQL サーバー。
// ファイル DB を使いたいときは TURSO_CONNECTION_URL=file:./.data/local.db を渡す。
const url = process.env["TURSO_CONNECTION_URL"] ?? "http://127.0.0.1:8080";

if (url.startsWith("file:")) {
  await mkdir(path.join(process.cwd(), ".data"), { recursive: true });
}

const db = createDb({
  url,
  ...(process.env["TURSO_AUTH_TOKEN"] === undefined
    ? {}
    : { authToken: process.env["TURSO_AUTH_TOKEN"] }),
});

await migrate(db, {
  migrationsFolder: path.join(import.meta.dirname, "../drizzle"),
});

console.log(`migrated: ${url}`);
