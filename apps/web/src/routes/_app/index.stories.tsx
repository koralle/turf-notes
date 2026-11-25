import { ORPCError } from "@orpc/client";
import type { Meta, StoryObj } from "@storybook/tanstack-react";
import type { MemoSummary } from "@turf-notes/api-contract/schemas";
import { memoId, tagId } from "@turf-notes/domain";
import { expect, userEvent, within } from "storybook/test";

import { mswHandlers } from "../../mocks/browser";
import { defaultMemos, mockImpl, rpcMockHandler } from "../../mocks/rpc";
import { Route } from "./index";

const page2Memo: MemoSummary = {
  createdAt: Date.parse("2026-10-18T15:40:00+09:00"),
  excerpt: "良馬場の高速決着で先行馬が残った。",
  heading: "秋華賞は前残りだった",
  id: memoId("01a175cd-b700-7000-8000-000000000003"),
  linkCount: 0,
  race: null,
  tags: [{ id: tagId(3), kind: "theme", name: "展開" }],
  title: "秋華賞は前残りだった",
};

const meta = {
  parameters: {
    tanstack: {
      router: {
        route: Route,
      },
    },
  },
  title: "Routes/HomePage",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/** 通常のタイムライン表示（メモ一覧とサイドバーのタグ）。 */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      await canvas.findByRole("heading", { name: "メモ" })
    ).toBeInTheDocument();
    await expect(
      await canvas.findByText("ソダシは道中で力みが出た")
    ).toBeInTheDocument();
  },
};

/** 次ページがある状態。「もっと見る」で2ページ目を HTTP 経由で読み込む。 */
export const WithLoadMore: Story = {
  loaders: [
    mswHandlers(
      rpcMockHandler({
        memos: {
          list: mockImpl.memos.list.handler(({ input }) =>
            input.cursor === "page-2"
              ? { items: [page2Memo], nextCursor: null }
              : { items: defaultMemos, nextCursor: "page-2" }
          ),
        },
      })
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const loadMore = await canvas.findByRole("button", { name: "もっと見る" });
    await userEvent.click(loadMore);

    await expect(
      await canvas.findByText(page2Memo.heading)
    ).toBeInTheDocument();
  },
};

/** メモが1件も無い初期状態。 */
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      await canvas.findByText(
        "まだメモがありません。新規メモから始めてください。"
      )
    ).toBeInTheDocument();
  },
};

/** 検索して一致するメモが無い状態（デバウンス後に再取得する）。 */
export const SearchNoResults: Story = {
  loaders: [
    mswHandlers(
      rpcMockHandler({
        memos: {
          list: mockImpl.memos.list.handler(({ input }) =>
            input.q === undefined || input.q === ""
              ? { items: defaultMemos, nextCursor: null }
              : { items: [], nextCursor: null }
          ),
        },
      })
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(
      await canvas.findByLabelText("メモを検索"),
      "ドウデュース"
    );

    await expect(
      await canvas.findByText("見つかりませんでした。")
    ).toBeInTheDocument();
  },
};

/** 一覧取得がサーバーエラーになった状態（`ReadError`）。 */
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
    const canvas = within(canvasElement);

    await expect(
      await canvas.findByText(/読み込みに失敗しました。/u)
    ).toBeInTheDocument();
  },
};

/** 未認証（401）のとき、親ルート `_app` の `beforeLoad` で `/sign-in` へ遷移する。 */
export const Unauthorized: Story = {
  loaders: [
    mswHandlers(
      rpcMockHandler({
        me: mockImpl.me.handler(({ errors }) => {
          throw errors.UNAUTHORIZED();
        }),
      })
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      await canvas.findByRole("heading", { name: "サインイン" })
    ).toBeInTheDocument();
  },
};
