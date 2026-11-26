import { ORPCError } from "@orpc/client";
import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { expect, within } from "storybook/test";

import { mswHandlers } from "../../../mocks/browser";
import { mockImpl, rpcMockHandler } from "../../../mocks/rpc";
import { Route } from "./$tagId";

const meta = {
  parameters: {
    tanstack: {
      router: { path: "/tags/$tagId", params: { tagId: "3" }, route: Route },
    },
  },
  title: "Routes/TagPage",
} satisfies Meta<typeof Route>;

export default meta;

type Story = StoryObj<typeof Route>;

/** タグ「展開」が付いたメモが並ぶ。 */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      await canvas.findByRole("heading", { name: "展開" })
    ).toBeInTheDocument();
    await expect(
      await canvas.findByText("ソダシは道中で力みが出た")
    ).toBeInTheDocument();
    await expect(
      canvas.getByText("三連複の1点あたりの金額が多すぎる")
    ).toBeInTheDocument();
  },
};

/** タグはあるが、メモが1件も付いていない状態。 */
export const Empty: Story = {
  loaders: [
    mswHandlers(
      rpcMockHandler({
        memos: {
          list: mockImpl.memos.list.handler(() => ({
            items: [],
            nextCursor: null,
          })),
        },
      })
    ),
  ],
  parameters: {
    tanstack: { router: { path: "/tags/$tagId", params: { tagId: "2" } } },
  },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText("このタグのメモはまだありません。")
    ).toBeInTheDocument();
  },
};

/** 存在しないタグ。空の一覧ではなく「見つかりません」を出す。 */
export const NotFound: Story = {
  parameters: {
    tanstack: { router: { path: "/tags/$tagId", params: { tagId: "999" } } },
  },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText(/タグが見つかりません。/u)
    ).toBeInTheDocument();
  },
};

/** メモ取得がサーバーエラーになった状態（`ReadError`）。 */
export const LoadError: Story = {
  loaders: [
    mswHandlers(
      rpcMockHandler({
        memos: {
          list: mockImpl.memos.list.handler(() => {
            throw new ORPCError("INTERNAL_SERVER_ERROR");
          }),
        },
      })
    ),
  ],
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText(/読み込みに失敗しました。/u)
    ).toBeInTheDocument();
  },
};
