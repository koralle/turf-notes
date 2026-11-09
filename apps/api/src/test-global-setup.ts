import path from "node:path";

import { createDb } from "@turf-notes/db";
import { migrate } from "drizzle-orm/libsql/migrator";
import { GenericContainer, Wait } from "testcontainers";
import type { StartedTestContainer } from "testcontainers";

/**
 * テスト用の libSQL を Testcontainers で立て、本番と同じマイグレーションを当てる
 * （要件 §9 品質基準の「DB 統合テスト」）。
 * イメージは `apps/api/compose.yaml` の開発用と同じもの。ダイジェストを上げるときは両方直す。
 */
const image =
  "ghcr.io/tursodatabase/libsql-server@sha256:817fb6c6865d048a509f5c120905629fb9b5af20ad0c526cdc68a6d8793898ad";

let container: StartedTestContainer | undefined;

export const setup = async (): Promise<void> => {
  container = await new GenericContainer(image)
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
