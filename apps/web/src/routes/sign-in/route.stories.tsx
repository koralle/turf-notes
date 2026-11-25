import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { HttpResponse, http } from "msw/http";
import { expect, userEvent, within } from "storybook/test";

import { mswHandlers } from "../../mocks/browser";
import { mockImpl, rpcMockHandler } from "../../mocks/rpc";
import { Route } from "./route";

const noPasskeyRpcHandler = () =>
  rpcMockHandler({
    auth: {
      methods: mockImpl.auth.methods.handler(() => ({
        hasPasskey: false,
        passwordSignInEnabled: true,
      })),
    },
  });

const submitPasswordSignIn = async (canvasElement: HTMLElement) => {
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

  return canvas;
};

const meta = {
  parameters: {
    tanstack: {
      router: {
        route: Route,
      },
    },
  },
  title: "Routes/SignInPage",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/** パスキーが既定。パスワード欄は「その他の方法」を開いたときだけ出る。 */
export const Default: Story = {};

/** パスキーが未登録。パスワード欄が最初から出る（区切り線は出ない）。 */
export const NoPasskey: Story = {
  loaders: [mswHandlers(noPasskeyRpcHandler())],
};

/** パスキーも無く、パスワードサインインも無効。サーバー上の CLI でしか戻せない。 */
export const LockedOut: Story = {
  loaders: [
    mswHandlers(
      rpcMockHandler({
        auth: {
          methods: mockImpl.auth.methods.handler(() => ({
            hasPasskey: false,
            passwordSignInEnabled: false,
          })),
        },
      })
    ),
  ],
};

/**
 * 「その他の方法」でパスワード欄を開いた状態。
 * route の `showPassword` が `aria-expanded` と欄の表示に届いていることまで確かめる。
 */
export const PasswordExpanded: Story = {
  loaders: [
    mswHandlers(
      rpcMockHandler({
        auth: {
          methods: mockImpl.auth.methods.handler(() => ({
            hasPasskey: true,
            passwordSignInEnabled: true,
          })),
        },
      })
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const toggle = canvas.getByRole("button", {
      name: "その他の方法でログインする",
    });

    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(canvas.queryByLabelText("メールアドレス")).toBeNull();

    await userEvent.click(toggle);

    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByLabelText("メールアドレス")).toBeInTheDocument();
  },
};

/** パスワード認証が 401 を返したとき、共通の認証失敗文言を出す。 */
export const WrongPassword: Story = {
  loaders: [
    mswHandlers(
      noPasskeyRpcHandler(),
      http.post("/api/auth/sign-in/email", () =>
        HttpResponse.json(
          { code: "INVALID_EMAIL_OR_PASSWORD", message: "Invalid credentials" },
          { status: 401 }
        )
      )
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = await submitPasswordSignIn(canvasElement);

    await expect(
      await canvas.findByText("メールアドレスかパスワードが違います")
    ).toBeInTheDocument();
  },
};

/** 認証 API が 500 を返したとき、再試行を促す文言を出す。 */
export const ServerError: Story = {
  loaders: [
    mswHandlers(
      noPasskeyRpcHandler(),
      http.post("/api/auth/sign-in/email", () =>
        HttpResponse.json({ message: "Internal Server Error" }, { status: 500 })
      )
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = await submitPasswordSignIn(canvasElement);

    await expect(
      await canvas.findByText(
        "サインインに失敗しました。もう一度お試しください。"
      )
    ).toBeInTheDocument();
  },
};
