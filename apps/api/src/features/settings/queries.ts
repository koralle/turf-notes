import type { AuthMethods } from "@turf-notes/api-contract/schemas";
import type { AppDb } from "@turf-notes/db";
import { passkeys, users } from "@turf-notes/db/schema";
import { count, eq } from "drizzle-orm";

/**
 * サインイン画面向けの公開情報。1ユーザー専用なので、唯一のユーザーの設定を返す。
 * ユーザーがまだ居ないときは「パスワードは有効・パスキーなし」を返す。
 */
export const getAuthMethods = async (db: AppDb): Promise<AuthMethods> => {
  const userRows = await db
    .select({ passwordSignInEnabled: users.passwordSignInEnabled })
    .from(users)
    .limit(1);

  const passkeyRows = await db.select({ total: count() }).from(passkeys);

  return {
    hasPasskey: (passkeyRows[0]?.total ?? 0) > 0,
    passwordSignInEnabled: userRows[0]?.passwordSignInEnabled ?? true,
  };
};

export type SetPasswordSignInResult = { kind: "ok" } | { kind: "no-passkey" };

/**
 * パスワードサインインの可否を切り替える。
 * パスキーが1つも無い状態で無効化すると復旧できなくなるため、サーバー側でも拒否する。
 */
export const setPasswordSignIn = async (
  db: AppDb,
  userId: string,
  enabled: boolean
): Promise<SetPasswordSignInResult> => {
  if (!enabled) {
    const rows = await db
      .select({ total: count() })
      .from(passkeys)
      .where(eq(passkeys.userId, userId));

    if ((rows[0]?.total ?? 0) === 0) {
      return { kind: "no-passkey" };
    }
  }

  await db
    .update(users)
    .set({ passwordSignInEnabled: enabled, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return { kind: "ok" };
};

/** メールアドレスから見てパスワードサインインを許可してよいか。 */
export const isPasswordSignInAllowed = async (
  db: AppDb,
  email: string
): Promise<boolean> => {
  const rows = await db
    .select({ enabled: users.passwordSignInEnabled })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  // ユーザーが見つからない場合も true。存在有無を応答の違いで漏らさない。
  return rows[0]?.enabled ?? true;
};
