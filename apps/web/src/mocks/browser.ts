import { HttpNetworkFrame, NetworkReadyState } from "msw/experimental";
import { network } from "virtual:msw";

import { isApiPath } from "../api/is-api-path";
import { defaultHandlers } from "./handlers";

export const resetHandlers = (): void => {
  network.resetHandlers();
};

// HMR で handlers / rpc が再評価されたとき false に戻るため、再 configure を走らせられる。
let configured = false;
let starting: Promise<void> | undefined;

/** Service Worker を起動する（失敗時は再試行でき、HMR 後の再設定も行う）。 */
export const startWorker = async (): Promise<void> => {
  if (configured && network.readyState === NetworkReadyState.ENABLED) {
    return;
  }

  starting ??= (async () => {
    network.configure({
      context: { quiet: true },
      handlers: defaultHandlers,
      onUnhandledFrame: ({ defaults, frame }) => {
        if (
          frame instanceof HttpNetworkFrame &&
          isApiPath(new URL(frame.data.request.url).pathname)
        ) {
          defaults.error();
        }
      },
    });

    await network.enable();
    configured = true;
  })().finally(() => {
    starting = undefined;
  });

  await starting;
};

/**
 * Story の `loaders` でハンドラを差し替えるためのヘルパー。
 * `@storybook/tanstack-react` は `beforeEach` で `router.load()` を走らせるため、
 * `loaders` で先に `network.use` しておくと route の `beforeLoad` / `loader` に間に合う。
 */
export const mswHandlers =
  (...handlers: Parameters<typeof network.use>) =>
  async (): Promise<Record<string, never>> => {
    await startWorker();
    network.use(...handlers);

    return {};
  };
