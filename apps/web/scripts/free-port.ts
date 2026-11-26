import { once } from "node:events";
import net from "node:net";

/** Vite が実際に待ち受けるアドレス。ここが埋まっていれば EADDRINUSE になる。 */
const HOST = "127.0.0.1";

const isFree = async (port: number) => {
  await using server = net.createServer();

  server.listen({ host: HOST, port });

  try {
    await once(server, "listening");

    return true;
  } catch {
    return false;
  }
};

/**
 * Storybook は detect-port で空きを調べるが、macOS では `127.0.0.1:6006` だけを
 * 掴んでいるプロセスを 0.0.0.0 / localhost 側の検査で見逃すため、占有されたポートを
 * そのまま Vite に渡して EADDRINUSE で落ちる。バインド先で探し直してから渡す。
 */
export const findFreePort = async (port = 6006): Promise<number> => {
  if (await isFree(port)) {
    return port;
  }

  return await findFreePort(port + 1);
};

if (import.meta.main) {
  console.log(await findFreePort(Number(process.argv[2] ?? 6006)));
}
