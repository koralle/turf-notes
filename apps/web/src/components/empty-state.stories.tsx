import type { Meta, StoryObj } from "@storybook/react-vite";

import { EmptyState } from "./empty-state";

const meta = {
  component: EmptyState,
  title: "Components/EmptyState",
} satisfies Meta<typeof EmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const MemoList: Story = {
  args: {
    children:
      "まだメモがありません。上の欄に書くか「新規メモ」から始めてください。",
  },
};

export const RaceList: Story = {
  args: { children: "このレースのメモはまだありません。" },
};
