import { passkeyClient } from "@better-auth/passkey/client";
import { createAuthClient } from "better-auth/react";

/** 同一オリジンの `/api/auth` を叩く（Worker が API へ Service Binding で流す）。 */
export const authClient = createAuthClient({
  plugins: [passkeyClient()],
});
