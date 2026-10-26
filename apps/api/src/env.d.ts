interface Env {
  readonly TURSO_CONNECTION_URL: string;
  readonly TURSO_AUTH_TOKEN?: string;
  readonly BETTER_AUTH_SECRET: string;
  readonly BETTER_AUTH_URL: string;
  readonly APP_ENV?: string;
}
