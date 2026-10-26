const API_PREFIXES = ["/rpc/", "/api/auth/"] as const;

/** `/rpc/*` と `/api/auth/*` は Service Binding で API Worker へ流す。 */
export const isApiPath = (pathname: string): boolean =>
  API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
