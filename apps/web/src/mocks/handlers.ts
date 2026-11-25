import { HttpResponse, http } from "msw/http";

import { defaultUser, rpcMockHandler } from "./rpc";

const authHandlers = [
  http.post("/api/auth/sign-in/email", () =>
    HttpResponse.json({
      redirect: false,
      token: "mock-token",
      user: defaultUser,
    })
  ),
];

export const defaultHandlers = [rpcMockHandler(), ...authHandlers];
