import * as v from "valibot";

/** サインイン画面が「パスワードを使えるか」を事前に知るための公開情報。 */
export const authMethodsSchema = v.object({
  hasPasskey: v.boolean(),
  passwordSignInEnabled: v.boolean(),
});
export type AuthMethods = v.InferOutput<typeof authMethodsSchema>;
