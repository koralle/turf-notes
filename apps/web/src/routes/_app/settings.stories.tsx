import { ORPCError } from "@orpc/client";
import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { expect, userEvent, within } from "storybook/test";

import { mswHandlers } from "../../mocks/browser";
import { passkeyListHandler } from "../../mocks/handlers";
import { mockImpl, rpcMockHandler } from "../../mocks/rpc";
import { Route } from "./settings";

const meta = {
  parameters: {
    tanstack: {
      router: {
        route: Route,
      },
    },
  },
  title: "Routes/SettingsPage",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/** パスキー1つ・パスワードサインイン無効。最後のパスキーは消せない。 */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByText("Turf User")).toBeInTheDocument();
    await expect(await canvas.findByText("MacBook")).toBeInTheDocument();
    await expect(
      canvas.getByText(/最後のパスキーは削除できません/u)
    ).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "削除" })).toBeDisabled();
  },
};

/** パスキーが未登録。パスワードサインインは無効化できない。 */
export const NoPasskey: Story = {
  loaders: [
    mswHandlers(
      passkeyListHandler([]),
      rpcMockHandler({
        auth: {
          methods: mockImpl.auth.methods.handler(() => ({
            hasPasskey: false,
            passwordSignInEnabled: true,
          })),
        },
      })
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      await canvas.findByText("まだ登録されていません。")
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: "無効にする" })
    ).toBeDisabled();
  },
};

/** エクスポートがサーバーエラーになった状態。 */
export const ExportError: Story = {
  loaders: [
    mswHandlers(
      rpcMockHandler({
        exportAll: mockImpl.exportAll.handler(() => {
          throw new ORPCError("INTERNAL_SERVER_ERROR");
        }),
      })
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      await canvas.findByRole("button", { name: "エクスポート" })
    );

    await expect(
      await canvas.findByText("エクスポートに失敗しました")
    ).toBeInTheDocument();
  },
};
