import type { Meta, StoryObj } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { userEvent, within } from "storybook/test";

import {
  resolvePasskeyErrorMessage,
  resolveTransportErrorMessage,
} from "../-lib/sign-in-error";
import { PasskeyUI } from "./passkey-ui";
import { SignInCard } from "./sign-in-card";

const meta = {
  component: PasskeyUI,
  title: "Routes/PasskeyUI",
  args: {
    hasPasskey: true,
    onSignIn: async () => "signed-in",
    onSuccessSignIn: async () => {},
    onTogglePassword: () => {},
    passwordExpanded: false,
    passwordEnabled: true,
  },
  decorators: [
    (Story) => {
      const queryClient = new QueryClient();
      return (
        <QueryClientProvider client={queryClient}>
          <SignInCard>
            <Story />
          </SignInCard>
        </QueryClientProvider>
      );
    },
  ],
} satisfies Meta<typeof PasskeyUI>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoPasskey: Story = {
  args: { hasPasskey: false },
};

export const PasswordDisabled: Story = {
  args: { passwordEnabled: false },
};

/** パスワードサインインも無効で、パスキーも無い。サーバー上の CLI でしか戻せない。 */
export const LockedOut: Story = {
  args: { hasPasskey: false, passwordEnabled: false },
};

/** RP ID・origin の設定違い。パスキーを使うしかない。 */
export const EnvironmentUnsupported: Story = {
  args: {
    onSignIn: async () => {
      throw new Error(
        resolvePasskeyErrorMessage({ code: "ERROR_INVALID_RP_ID", status: 400 })
      );
    },
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", {
        name: "パスキーでサインイン",
      })
    );
  },
};

/** サーバー側にこのパスキーが無い。端末を変えた・削除済み。 */
export const PasskeyNotFound: Story = {
  args: {
    onSignIn: async () => {
      throw new Error(
        resolvePasskeyErrorMessage({ code: "PASSKEY_NOT_FOUND", status: 404 })
      );
    },
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", {
        name: "パスキーでサインイン",
      })
    );
  },
};

/** チャレンジの有効期限切れ。やり直せば通ることがある。 */
export const ChallengeExpired: Story = {
  args: {
    onSignIn: async () => {
      throw new Error(
        resolvePasskeyErrorMessage({ code: "CHALLENGE_NOT_FOUND", status: 400 })
      );
    },
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", {
        name: "パスキーでサインイン",
      })
    );
  },
};

/** 署名の検証に失敗した。 */
export const VerificationFailed: Story = {
  args: {
    onSignIn: async () => {
      throw new Error(
        resolvePasskeyErrorMessage({
          code: "AUTHENTICATION_FAILED",
          status: 500,
        })
      );
    },
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", {
        name: "パスキーでサインイン",
      })
    );
  },
};

/** 心当たりのないコード。既定の文言になる。 */
export const UnexpectedError: Story = {
  args: {
    onSignIn: async () => {
      throw new Error(
        resolvePasskeyErrorMessage({ code: "SOMETHING_NEW", status: 400 })
      );
    },
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", {
        name: "パスキーでサインイン",
      })
    );
  },
};

/** オフラインや接続断（fetch の TypeError）。 */
export const NetworkError: Story = {
  args: {
    onSignIn: async () => {
      throw new Error(
        resolveTransportErrorMessage(new TypeError("Failed to fetch"))
      );
    },
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", {
        name: "パスキーでサインイン",
      })
    );
  },
};

/** `fetchOptions.timeout` による打ち切り（AbortError）。 */
export const NoResponse: Story = {
  args: {
    onSignIn: async () => {
      throw new Error(
        resolveTransportErrorMessage(new DOMException("", "AbortError"))
      );
    },
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", {
        name: "パスキーでサインイン",
      })
    );
  },
};
