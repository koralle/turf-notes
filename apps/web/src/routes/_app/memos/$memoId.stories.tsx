import { ORPCError } from "@orpc/client";
import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { expect, within } from "storybook/test";

import { mswHandlers } from "../../../mocks/browser";
import {
  defaultMemoDetail,
  mockImpl,
  rpcMockHandler,
} from "../../../mocks/rpc";
import { Route } from "./$memoId";

const UNKNOWN_MEMO_ID = "01a175cd-b700-7000-8000-0000000000ff";

const meta = {
  parameters: {
    tanstack: {
      router: {
        path: "/memos/$memoId",
        params: { memoId: defaultMemoDetail.id },
        route: Route,
      },
    },
  },
  title: "Routes/MemoDetailPage",
} satisfies Meta<typeof Route>;

export default meta;

type Story = StoryObj<typeof Route>;

/** 見出し・本文・参照しているメモが出る通常表示。 */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      await canvas.findByRole("heading", { name: defaultMemoDetail.heading })
    ).toBeInTheDocument();
    await expect(canvas.getByText("参照しているメモ")).toBeInTheDocument();
    await expect(
      canvas.getByText("→ 三連複の1点あたりの金額が多すぎる")
    ).toBeInTheDocument();
  },
};

/** 存在しないメモ。取得の失敗ではなく「見つかりません」を出す。 */
export const NotFound: Story = {
  parameters: {
    tanstack: {
      router: { path: "/memos/$memoId", params: { memoId: UNKNOWN_MEMO_ID } },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText(/メモが見つかりません。/u)
    ).toBeInTheDocument();
  },
};

/** uuid でない id は問い合わせず、「見つかりません」を出す。 */
export const InvalidId: Story = {
  parameters: {
    tanstack: {
      router: { path: "/memos/$memoId", params: { memoId: "not-a-uuid" } },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText(/メモが見つかりません。/u)
    ).toBeInTheDocument();
  },
};

/** 取得がサーバーエラーになった状態（`ReadError`）。 */
export const LoadError: Story = {
  loaders: [
    mswHandlers(
      rpcMockHandler({
        memos: {
          detail: mockImpl.memos.detail.handler(() => {
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
