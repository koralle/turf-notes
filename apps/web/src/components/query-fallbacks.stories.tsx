import type { Meta, StoryObj } from "@storybook/tanstack-react";

import { LoadFailed, Loading, MissingMemo } from "./query-fallbacks";

const meta = {
  component: Loading,
  title: "Components/QueryFallbacks",
} satisfies Meta<typeof Loading>;

export default meta;

type Story = StoryObj<typeof meta>;

/** loader が温めるまでの待ち。温めた直後は出ない（ADR-0006）。 */
export const LoadingState: Story = {};

/** 取得が失敗したとき。再試行の入口を持つ。 */
export const LoadFailedState: Story = {
  render: () => <LoadFailed onRetry={() => {}} />,
};

/** メモが無いとき。再試行ではなくホームへの道を出す。 */
export const MissingMemoState: Story = {
  render: () => <MissingMemo />,
};
