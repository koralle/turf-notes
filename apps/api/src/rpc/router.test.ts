import { createRouterClient } from "@orpc/server";
import { expect } from "vitest";

import type { RouterDeps } from "./base";
import { createRouter } from "./router";
import { owner, test } from "./rpc.fixture";

const rpcOf = (deps: RouterDeps, headers: Headers) =>
  createRouterClient(createRouter(deps), { context: { headers } });

test("未認証は UNAUTHORIZED / 401", async ({ deps }) => {
  const rpc = rpcOf(deps, new Headers());

  await expect(rpc.me()).rejects.toMatchObject({
    code: "UNAUTHORIZED",
    status: 401,
  });
});

test("サインイン済みなら自分の情報が返る", async ({ deps, ownerHeaders }) => {
  const rpc = rpcOf(deps, ownerHeaders);

  await expect(rpc.me()).resolves.toStrictEqual({
    email: owner.email,
    id: owner.id,
    name: owner.name,
  });
});
