import { createDb } from "@turf-notes/db";
import { users } from "@turf-notes/db/schema";
import { eq } from "drizzle-orm";

/**
 * パスキーを全失したときの復旧手段（ADR-0002）。
 * サーバーにアクセスできる人だけがパスワードサインインを戻せる。
 */
const url = process.env["TURSO_CONNECTION_URL"] ?? "http://127.0.0.1:8080";
const email = process.argv[2] ?? "me@example.com";

const db = createDb({ url });

const updated = await db
  .update(users)
  .set({ passwordSignInEnabled: true, updatedAt: new Date() })
  .where(eq(users.email, email.toLowerCase()))
  .returning({ email: users.email });

if (updated.length === 0) {
  console.error(`user not found: ${email}`);
  process.exitCode = 1;
} else {
  console.log(`password sign-in enabled: ${updated[0]?.email ?? email}`);
}
