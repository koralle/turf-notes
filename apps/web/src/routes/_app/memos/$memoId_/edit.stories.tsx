import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { expect, userEvent, within } from "storybook/test";

import { mswHandlers } from "../../../../mocks/browser";
import {
  defaultMemoDetail,
  mockImpl,
  rpcMockHandler,
} from "../../../../mocks/rpc";
import { Route } from "./edit";

const meta = {
  parameters: {
    tanstack: {
      router: {
        path: "/memos/$memoId/edit",
        params: { memoId: defaultMemoDetail.id },
        route: Route,
      },
    },
  },
  title: "Routes/EditMemoPage",
} satisfies Meta<typeof Route>;

export default meta;

type Story = StoryObj<typeof Route>;

/** 既存メモの内容が入力欄に入った状態。 */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByLabelText("本文")).toHaveValue(
      defaultMemoDetail.body
    );
  },
};

/** 他の画面で先に保存されていたとき（409）、上書きせずに知らせる。 */
export const Conflict: Story = {
  loaders: [
    mswHandlers(
      rpcMockHandler({
        memos: {
          update: mockImpl.memos.update.handler(({ errors }) => {
            throw errors["memo-conflict"]();
          }),
        },
      })
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(await canvas.findByLabelText("本文"), " 追記");
    await userEvent.click(canvas.getByRole("button", { name: "保存" }));

    const errors = await canvas.findAllByText(
      "他の画面で更新されています。読み込み直してください"
    );

    await expect(errors.length).toBeGreaterThan(0);
  },
};

/** 存在しないメモ。 */
export const NotFound: Story = {
  parameters: {
    tanstack: {
      router: {
        path: "/memos/$memoId/edit",
        params: { memoId: "01a175cd-b700-7000-8000-0000000000ff" },
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText(/メモが見つかりません。/u)
    ).toBeInTheDocument();
  },
};
