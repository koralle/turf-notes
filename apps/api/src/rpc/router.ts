import { createAuthRouter } from "./auth";
import { createRouterKit } from "./base";
import type { RouterDeps } from "./base";
import { createExportRouter } from "./export";
import { createMemosRouter } from "./memos";
import { createSettingsRouter } from "./settings";
import { createTagsRouter } from "./tags";

export const createRouter = (deps: RouterDeps) => {
  const kit = createRouterKit(deps);
  const { impl, requireAuth } = kit;

  return impl.router({
    ...createExportRouter(kit),
    auth: createAuthRouter(kit),
    health: impl.health.handler(() => ({ ok: true })),
    me: impl.me.use(requireAuth).handler(({ context }) => context.user),
    memos: createMemosRouter(kit),
    settings: createSettingsRouter(kit),
    tags: createTagsRouter(kit),
  });
};
