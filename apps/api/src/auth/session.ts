import type { Auth } from "./create-auth";

/** 認証済みユーザー。contract の `me` の出力と同じ形。 */
export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
}

/** リクエストヘッダーからサインイン済みユーザーを解決する port。 */
export type Authenticator = (
  headers: Headers
) => Promise<AuthenticatedUser | null>;

/** Better Auth の Cookie セッションを読む authenticator を作る。 */
export const cookieSessionAuthenticator =
  (auth: Auth): Authenticator =>
  async (headers) => {
    const session = await auth.api.getSession({ headers });
    if (session === null) {
      return null;
    }

    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    };
  };
