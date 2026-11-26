import { ORPCError } from "@orpc/client";
import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { expect, within } from "storybook/test";

import { mswHandlers } from "../../../../../mocks/browser";
import {
  sodashiMemo,
  mockImpl,
  rpcMockHandler,
} from "../../../../../mocks/rpc";
import { Route } from "./$raceNumber";

const meta = {
  parameters: {
    tanstack: {
      router: {
        params: { date: "2026-11-02", raceNumber: "11", venue: "東京" },
        route: Route,
      },
    },
  },
  title: "Routes/RacePage",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/** そのレースに紐づくメモが並ぶ。 */
export const Default: Story = {
  loaders: [
    mswHandlers(
      rpcMockHandler({
        memos: {
          forRace: mockImpl.memos.forRace.handler(() => ({
            items: [sodashiMemo],
          })),
        },
      })
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      await canvas.findByRole("heading", { name: /東京 11R/u })
    ).toBeInTheDocument();
    await expect(canvas.getByText("天皇賞(秋)")).toBeInTheDocument();
    await expect(
      canvas.getByText("ソダシは道中で力みが出た")
    ).toBeInTheDocument();
  },
};

/** そのレースのメモがまだ無い状態。 */
export const Empty: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText(
        "このレースのメモはまだありません。"
      )
    ).toBeInTheDocument();
  },
};

/** 取得がサーバーエラーになった状態（`ReadError`）。 */
export const LoadError: Story = {
  loaders: [
    mswHandlers(
      rpcMockHandler({
        memos: {
          forRace: mockImpl.memos.forRace.handler(() => {
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
