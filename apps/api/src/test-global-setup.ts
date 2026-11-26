import { readFileSync } from "node:fs";
import path from "node:path";

import { createDb } from "@turf-notes/db";
import { parseYAML } from "confbox";
import { migrate } from "drizzle-orm/libsql/migrator";
import { GenericContainer, Wait } from "testcontainers";
import type { StartedTestContainer } from "testcontainers";
import * as v from "valibot";

const composeSchema = v.object({
  services: v.object({
    turso: v.object({
      image: v.pipe(v.string(), v.nonEmpty()),
    }),
  }),
});

/**
 * テスト用の libSQL を Testcontainers で立て、本番と同じマイグレーションを当てる
 * （要件 §9 品質基準の「DB 統合テスト」）。
 * イメージは `apps/api/compose.yaml` から読み、開発用と同じ版を 1 箇所で管理する。
 */
const readLibsqlImage = (): string => {
  const composePath = path.join(import.meta.dirname, "../compose.yaml");
  const parsed = parseYAML(readFileSync(composePath, "utf-8"));

  return v.parse(composeSchema, parsed).services.turso.image;
};

let container: StartedTestContainer | undefined;

export const setup = async (): Promise<void> => {
  container = await new GenericContainer(readLibsqlImage())
    .withExposedPorts(8080)
    .withWaitStrategy(Wait.forHttp("/health", 8080))
    .start();

  const url = `http://${container.getHost()}:${container.getMappedPort(8080)}`;
  process.env["TURSO_TEST_CONNECTION_URL"] = url;

  // マイグレーションはここで1回だけ。テストファイルごとに当てると、
  // 並列化したときに __drizzle_migrations を同時に書きに行くことになる。
  const db = createDb({ url });
  await migrate(db, {
    migrationsFolder: path.join(
      import.meta.dirname,
      "../../../packages/db/drizzle"
    ),
  });
  db.$client.close();
};

export const teardown = async (): Promise<void> => {
  await container?.stop();
};
