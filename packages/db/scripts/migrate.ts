import { mkdir } from "node:fs/promises";
import path from "node:path";

import { migrate } from "drizzle-orm/libsql/migrator";

import { createDb } from "../src/client";

const url = process.env["TURSO_CONNECTION_URL"] ?? "file:./.data/local.db";

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
