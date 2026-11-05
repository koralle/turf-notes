import { userId } from "@turf-notes/domain";
import type { User } from "@turf-notes/domain";

import type { Auth } from "./create-auth";

/** リクエストヘッダーからサインイン済みユーザーを解決する port。 */
export type Authenticator = (headers: Headers) => Promise<User | null>;

/** Better Auth の Cookie セッションを読む authenticator を作る。 */
export const cookieSessionAuthenticator =
  (auth: Auth): Authenticator =>
  async (headers) => {
    const session = await auth.api.getSession({ headers });
    if (session === null) {
      return null;
    }

    return {
      id: userId(session.user.id),
      name: session.user.name,
      email: session.user.email,
    };
  };
