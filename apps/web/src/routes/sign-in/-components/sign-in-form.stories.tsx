import type { Meta, StoryObj } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { userEvent, within } from "storybook/test";

import {
  resolvePasswordErrorMessage,
  resolveTransportErrorMessage,
} from "../-lib/sign-in-error";
import { SignInCard } from "./sign-in-card";
import { SignInForm } from "./sign-in-form";

const meta = {
  component: SignInForm,
  title: "Routes/SignInForm",
  args: {
    onSignIn: async () => {},
    onSuccessSignIn: async () => {},
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
} satisfies Meta<typeof SignInForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/**
 * 入力の不備。サーバーへは行かず、項目ごとにエラーが出る。
 * 送信ボタンだけ押すと両方の項目が埋まっていない状態になる。
 */
export const InvalidInput: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", {
        name: "パスワードでサインイン",
      })
    );
  },
};

/** 401。資格情報の誤りかどうかは区別せずに返す。 */
export const WrongCredentials: Story = {
  args: {
    onSignIn: async () => {
      throw new Error(resolvePasswordErrorMessage({ status: 401 }));
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByLabelText("メールアドレス"),
      "turf@example.com"
    );
    await userEvent.type(
      canvas.getByLabelText("パスワード"),
      "correct-horse-battery"
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "パスワードでサインイン" })
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
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByLabelText("メールアドレス"),
      "turf@example.com"
    );
    await userEvent.type(
      canvas.getByLabelText("パスワード"),
      "correct-horse-battery"
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "パスワードでサインイン" })
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
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByLabelText("メールアドレス"),
      "turf@example.com"
    );
    await userEvent.type(
      canvas.getByLabelText("パスワード"),
      "correct-horse-battery"
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "パスワードでサインイン" })
    );
  },
};

/** 5xx と、原因の分からない失敗。文言は同じ既定のものになる。 */
export const ServerError: Story = {
  args: {
    onSignIn: async () => {
      throw new Error(resolvePasswordErrorMessage({ status: 500 }));
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByLabelText("メールアドレス"),
      "turf@example.com"
    );
    await userEvent.type(
      canvas.getByLabelText("パスワード"),
      "correct-horse-battery"
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "パスワードでサインイン" })
    );
  },
};
