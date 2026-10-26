import { createRouterKit } from "./base";
import type { RouterDeps } from "./base";
import { createMemosRouter } from "./memos";
import { createTagsRouter } from "./tags";

export const createRouter = (deps: RouterDeps) => {
  const kit = createRouterKit(deps);
  const { impl, requireAuth } = kit;

  return impl.router({
    health: impl.health.handler(() => ({ ok: true })),
    me: impl.me.use(requireAuth).handler(({ context }) => context.user),
    memos: createMemosRouter(kit),
    tags: createTagsRouter(kit),
  });
};
