import { queryOptions } from "@tanstack/react-query";

import { FRESH_FOR } from "../../rpc/queries";
import { authClient } from "./auth-client";

/**
 * パスキーは Better Auth のクライアントから読む（oRPC の外）。
 * `src/rpc/queries.ts` に混ぜると、サイドバーが読む共通チャンクに Better Auth が入る。
 */
export const passkeysQuery = queryOptions({
  queryFn: async () => await authClient.passkey.listUserPasskeys(),
  queryKey: ["passkeys"],
  staleTime: FRESH_FOR,
});
