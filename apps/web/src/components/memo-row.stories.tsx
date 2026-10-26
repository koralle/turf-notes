import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import type { MemoSummary } from "@turf-notes/api-contract/schemas";
import { css } from "styled-system/css";

import { MemoRow, memoListStyle } from "./memo-row";

const withRouter = (memo: MemoSummary) => {
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ["/"] }),
    routeTree: createRootRoute({
      component: () => (
        <div className={css({ maxWidth: "900px", px: "24px", py: "16px" })}>
          <div className={memoListStyle}>
            <MemoRow memo={memo} />
          </div>
        </div>
      ),
    }),
  });

  return <RouterProvider router={router} />;
};

const withRace: MemoSummary = {
  createdAt: Date.parse("2026-11-02T18:24:00+09:00"),
  excerpt: "道中で力みが出て、折り合いを欠いた。",
  heading: "ソダシは道中で力みが出た",
  id: "01a175cd-b61e-7992-8d03-54303f56c654",
  linkCount: 2,
  race: { date: "2026-11-02", name: "天皇賞(秋)", number: 11, venue: "東京" },
  tags: [
    { id: 1, kind: "horse", name: "ソダシ" },
    { id: 5, kind: "theme", name: "展開" },
  ],
  title: "ソダシは道中で力みが出た",
};

const withoutRace: MemoSummary = {
  createdAt: Date.parse("2026-10-26T09:00:00+09:00"),
  excerpt: "三連複の1点あたりの金額が多すぎる。",
  heading:
    "三連複の1点あたりの金額が多すぎる。的中率ではなく回収率で見るべき。点数を絞る勇気を持つ。",
  id: "01a175cd-b66d-7d8c-ab56-99e9e46cfefc",
  linkCount: 1,
  race: null,
  tags: [{ id: 7, kind: "theme", name: "買い方" }],
  title: null,
};

const meta = {
  component: MemoRow,
  render: (args) => withRouter(args.memo),
  title: "Components/MemoRow",
} satisfies Meta<typeof MemoRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithRace: Story = { args: { memo: withRace } };

export const WithoutRace: Story = { args: { memo: withoutRace } };
