import { HttpResponse, http } from "msw/http";

import { defaultUser, rpcMockHandler } from "./rpc";

const defaultPasskey = {
  aaguid: "00000000-0000-0000-0000-000000000000",
  backedUp: true,
  counter: 0,
  createdAt: "2026-10-01T09:00:00+09:00",
  credentialID: "mock-credential-id",
  deviceType: "multiDevice",
  id: "passkey-1",
  name: "MacBook",
  publicKey: "mock-public-key",
  transports: "internal",
  userId: defaultUser.id,
};

/** Better Auth のパスキー一覧（`passkeysQuery`）をモックする。 */
export const passkeyListHandler = (passkeys: unknown[] = [defaultPasskey]) =>
  http.get("/api/auth/passkey/list-user-passkeys", () =>
    HttpResponse.json(passkeys)
  );

const authHandlers = [
  http.post("/api/auth/sign-in/email", () =>
    HttpResponse.json({
      redirect: false,
      token: "mock-token",
      user: defaultUser,
    })
  ),
  passkeyListHandler(),
];

export const defaultHandlers = [rpcMockHandler(), ...authHandlers];
