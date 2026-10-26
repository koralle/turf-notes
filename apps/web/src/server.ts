import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { env } from "cloudflare:workers";

import { isApiPath } from "./api/is-api-path";

/**
 * Worker の entry。`/rpc/*` と `/api/auth/*` は元の Request をそのまま
 * Service Binding（`turf-notes-api`）へ渡し、それ以外は TanStack Start が処理する。
 */
export default createServerEntry({
  fetch: async (request, options) => {
    if (isApiPath(new URL(request.url).pathname)) {
      return await env.API.fetch(request);
    }

    return await handler.fetch(request, options);
  },
});
