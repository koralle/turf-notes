import { GenericContainer, Wait } from "testcontainers";
import type { StartedTestContainer } from "testcontainers";

/**
 * テスト用の libSQL を Testcontainers で立てる（要件 §4 の「DB 統合テスト」）。
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

  process.env["TURSO_TEST_CONNECTION_URL"] =
    `http://${container.getHost()}:${container.getMappedPort(8080)}`;
};

export const teardown = async (): Promise<void> => {
  await container?.stop();
};
