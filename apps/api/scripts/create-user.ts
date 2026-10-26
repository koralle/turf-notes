import { createDb } from "@turf-notes/db";

import { createAuth } from "../src/auth/create-auth";

const url = process.env["TURSO_CONNECTION_URL"] ?? "http://127.0.0.1:8080";
const secret =
  process.env["BETTER_AUTH_SECRET"] ??
  "dev-secret-please-change-this-value-32chars";
const baseURL = process.env["BETTER_AUTH_URL"] ?? "http://localhost:3000";

const [
  email = "me@example.com",
  name = "koralle",
  password = "dev-password-1234",
] = process.argv.slice(2);

const db = createDb({ url });
const auth = createAuth({ db, secret, baseURL });

const result = await auth.api.signUpEmail({ body: { email, name, password } });

console.log(`created: ${result.user.email} (${result.user.id})`);
