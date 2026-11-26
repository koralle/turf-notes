import { ORPCError } from "@orpc/client";
import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { expect, userEvent, within } from "storybook/test";

import { mswHandlers } from "../../../mocks/browser";
import { mockImpl, rpcMockHandler } from "../../../mocks/rpc";
import { Route } from "./new";

const meta = {
  parameters: {
    tanstack: {
      router: {
        route: Route,
      },
    },
  },
  title: "Routes/NewMemoPage",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/** 本文が空のあいだは保存できない。 */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByLabelText("本文")).toHaveValue("");
    await expect(canvas.getByRole("button", { name: "保存" })).toBeDisabled();
  },
};

/** 保存がサーバーエラーになった状態。 */
export const SaveError: Story = {
  loaders: [
    mswHandlers(
      rpcMockHandler({
        memos: {
          create: mockImpl.memos.create.handler(() => {
            throw new ORPCError("INTERNAL_SERVER_ERROR");
          }),
        },
      })
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(await canvas.findByLabelText("本文"), "メモ");
    await userEvent.click(canvas.getByRole("button", { name: "保存" }));

    const errors = await canvas.findAllByText("保存に失敗しました");

    await expect(errors.length).toBeGreaterThan(0);
  },
};
