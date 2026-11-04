import * as v from "valibot";

import { readonlyValue } from "../readonly";

/** User の同一性。MemoId などの他の id と取り違えないよう brand する。 */
export const userIdSchema = v.pipe(
  v.string(),
  v.minLength(1),
  v.brand("UserId")
);

export type UserId = v.InferOutput<typeof userIdSchema>;

/** 文字列から UserId を作る。セッションなど外から来た id はこれを通す。 */
export const userId = (value: string): UserId => v.parse(userIdSchema, value);

/** サインインしているユーザー。 */
export const userSchema = readonlyValue(
  v.object({
    id: userIdSchema,
    name: v.string(),
    email: v.string(),
  })
);

export type User = v.InferOutput<typeof userSchema>;

/** サインイン手段の状態。サインイン画面が「パスワードを使えるか」を事前に知るための公開情報。 */
export const authMethodsSchema = v.object({
  hasPasskey: v.boolean(),
  passwordSignInEnabled: v.boolean(),
});

export type AuthMethods = v.InferOutput<typeof authMethodsSchema>;

/**
 * 次にパスワードサインインを nextEnabled にしても、サインイン手段が残るか（FR-A4）。
 * パスキーが1つも無い状態では無効化できない。サーバーは拒否し、UI は切り替えを不可能にする。
 */
export const canSetPasswordSignIn = (state: {
  hasPasskey: boolean;
  nextEnabled: boolean;
}): boolean => state.nextEnabled || state.hasPasskey;
