import { createDb } from "@turf-notes/db";
import { accounts, users } from "@turf-notes/db/schema";
import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";

/**
 * パスワードを差し替える。セッションが無くても使える復旧用の口。
 * パスワードサインインを無効にしている間も、この値は「非常口」として残る。
 */
const url = process.env["TURSO_CONNECTION_URL"] ?? "http://127.0.0.1:8080";
const authToken = process.env["TURSO_AUTH_TOKEN"];
const [email, password] = process.argv.slice(2);

if (email === undefined || password === undefined) {
  console.error("usage: set-password <email> <new-password>");
  process.exit(1);
}

const db = createDb({ url, ...(authToken ? { authToken } : {}) });

const [user] = await db
  .select({ id: users.id })
  .from(users)
  .where(eq(users.email, email.toLowerCase()))
  .limit(1);

if (user === undefined) {
  console.error(`user not found: ${email}`);
  process.exit(1);
}

const updated = await db
  .update(accounts)
  .set({ password: await hashPassword(password), updatedAt: new Date() })
  .where(
    and(eq(accounts.userId, user.id), eq(accounts.providerId, "credential"))
  )
  .returning({ id: accounts.id });

if (updated.length === 0) {
  console.error("credential account not found");
  process.exit(1);
}

console.log(`password updated: ${email}`);
