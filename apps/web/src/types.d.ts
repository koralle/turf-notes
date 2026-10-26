/** `cloudflare:workers` の最小限の型。Workers の型定義は読み込んでいない。 */
declare module "cloudflare:workers" {
  export const env: {
    readonly API: { fetch: (request: Request) => Promise<Response> };
  };
}
