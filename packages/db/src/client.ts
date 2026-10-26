import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

/** libSQL への接続情報。ローカルは `file:` URL でも動く。 */
export interface TursoConnection {
  url: string;
  authToken?: string;
}

/**
 * Drizzle のインスタンスを作る。Worker では isolate ごとに1つだけ作って使い回す。
 */
export const createDb = ({ url, authToken }: TursoConnection) => {
  const client = createClient({
    url,
    ...(authToken === undefined ? {} : { authToken }),
  });
  // drizzle 1.x は「設定オブジェクト」を受け取る。テーブル定義は `db.query` を使うときだけ
  // `schema` に渡す（その場合は relations が要る）ので、ここでは client だけ渡す。
  return drizzle({ client });
};

export type AppDb = ReturnType<typeof createDb>;
