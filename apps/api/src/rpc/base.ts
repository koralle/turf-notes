import { ORPCError, implement } from "@orpc/server";
import { contract } from "@turf-notes/api-contract";
import type { AppDb } from "@turf-notes/db";

import type { AuthenticatedUser, Authenticator } from "../auth/session";

export interface RpcContext {
  headers: Headers;
}

export interface RouterDeps {
  readonly authenticate: Authenticator;
  /** isolate ごとに1つだけ作った DB を返す。 */
  readonly db: () => AppDb;
}

const createImplementer = () => implement(contract).$context<RpcContext>();

export const createRouterKit = (deps: RouterDeps) => {
  const impl = createImplementer();

  /** DB だけを載せる。認証が要らない手続き（`auth.methods`）向け。 */
  const withDb = impl.middleware(
    async ({ next }) => await next({ context: { db: deps.db() } })
  );

  const requireAuth = impl.middleware(async ({ context, next }) => {
    const user: AuthenticatedUser | null = await deps.authenticate(
      context.headers
    );
    if (user === null) {
      throw new ORPCError("UNAUTHORIZED");
    }

    return await next({ context: { user, db: deps.db() } });
  });

  return { impl, requireAuth, withDb };
};

export type RouterKit = ReturnType<typeof createRouterKit>;
