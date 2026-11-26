import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { expect, within } from "storybook/test";

import { mswHandlers } from "../../../mocks/browser";
import { mockImpl, rpcMockHandler } from "../../../mocks/rpc";
import { Route } from "./index";

const meta = {
  parameters: {
    tanstack: {
      router: {
        route: Route,
      },
    },
  },
  title: "Routes/TagsPage",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/** 種類ごとにグループ化されたタグ一覧。 */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const main = within(await within(canvasElement).findByRole("main"));

    await expect(
      await main.findByRole("heading", { name: "タグ" })
    ).toBeInTheDocument();
    await expect(
      await main.findByRole("link", { name: /ソダシ/u })
    ).toBeInTheDocument();
    await expect(main.getByRole("link", { name: /武豊/u })).toBeInTheDocument();
    await expect(main.getByRole("link", { name: /展開/u })).toBeInTheDocument();
  },
};

/** タグが1つも無い初期状態。 */
export const Empty: Story = {
  loaders: [
    mswHandlers(
      rpcMockHandler({
        tags: { list: mockImpl.tags.list.handler(() => []) },
      })
    ),
  ],
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText(
        "タグはまだありません。メモを作るときにタグを付けられます。"
      )
    ).toBeInTheDocument();
  },
};
