import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import type { TagWithCount } from "@turf-notes/api-contract/schemas";
import type { TagKind } from "@turf-notes/domain";
import { tagId } from "@turf-notes/domain";
import { expect, within } from "storybook/test";
import { css } from "styled-system/css";

import { tagsQuery } from "../rpc/queries";
import { AppShell } from "./shell";

const makeTag = (
  id: number,
  name: string,
  kind: TagKind,
  memoCount: number,
  lastUsedAt: number | null
): TagWithCount => ({
  id: tagId(id),
  kind,
  lastUsedAt,
  memoCount,
  name,
});

const manyTagsFixture: TagWithCount[] = [
  makeTag(1, "キタサンブラック", "horse", 4, 16_000),
  makeTag(2, "川田将雅", "person", 3, 15_000),
  makeTag(3, "東京芝2000", "theme", 5, 14_000),
  makeTag(4, "ダノンダックス", "horse", 1, 13_000),
  makeTag(5, "菅原明良", "person", 2, 12_000),
  makeTag(6, "ニジンスキー（Nijinsky）長距離血統検証メモ", "horse", 1, 11_000),
  makeTag(7, "道悪巧者・パワー型血統", "theme", 2, 10_000),
  makeTag(8, "戸崎圭太", "person", 1, 9000),
  makeTag(9, "シルバーステート", "horse", 1, 8000),
  makeTag(10, "ダービー", "theme", 1, 7000),
  makeTag(11, "フレンチデピュティ", "horse", 1, 6000),
  makeTag(12, "松山弘平", "person", 1, 5000),
  makeTag(13, "トニービン", "horse", 1, 4000),
  makeTag(14, "田辺裕信", "person", 1, 3000),
  makeTag(15, "エリザベス女王杯", "theme", 0, null),
  makeTag(16, "短期免許外国人", "horse", 0, null),
];

const mainPreviewStyle = css({
  color: "muted",
  fontSize: "13px",
  p: { base: "18px", md: "32px" },
});

const ShellLayout = () => (
  <AppShell>
    <Outlet />
  </AppShell>
);

const HomePreview = () => (
  <div className={mainPreviewStyle}>
    <h1 className={css({ color: "ink", fontSize: "19px", fontWeight: 600 })}>
      メモ
    </h1>
    <p className={css({ mt: "8px" })}>タイムライン表示領域</p>
  </div>
);

const TagsPreview = () => (
  <div className={mainPreviewStyle}>
    <h1 className={css({ color: "ink", fontSize: "19px", fontWeight: 600 })}>
      タグ
    </h1>
    <p className={css({ mt: "8px" })}>全タグ一覧ページ</p>
  </div>
);

const TagDetailPreview = () => (
  <div className={mainPreviewStyle}>
    <h1 className={css({ color: "ink", fontSize: "19px", fontWeight: 600 })}>
      タグ詳細
    </h1>
    <p className={css({ mt: "8px" })}>選択したタグのメモ一覧</p>
  </div>
);

const SettingsPreview = () => (
  <div className={mainPreviewStyle}>
    <h1 className={css({ color: "ink", fontSize: "19px", fontWeight: 600 })}>
      設定
    </h1>
    <p className={css({ mt: "8px" })}>設定ページ</p>
  </div>
);

const rootRoute = createRootRoute({ component: ShellLayout });

const routeTree = rootRoute.addChildren([
  createRoute({
    component: HomePreview,
    getParentRoute: () => rootRoute,
    path: "/",
  }),
  createRoute({
    component: TagsPreview,
    getParentRoute: () => rootRoute,
    path: "/tags",
  }),
  createRoute({
    component: TagDetailPreview,
    getParentRoute: () => rootRoute,
    path: "/tags/$tagId",
  }),
  createRoute({
    component: SettingsPreview,
    getParentRoute: () => rootRoute,
    path: "/settings",
  }),
]);

interface ShellStoryArgs {
  initialPath: string;
  tags: TagWithCount[];
}

const renderShell = ({ initialPath, tags }: ShellStoryArgs) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  queryClient.setQueryData(tagsQuery.queryKey, tags);

  const router = createRouter({
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    routeTree,
  });

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
};

const meta = {
  args: {
    initialPath: "/",
    tags: manyTagsFixture,
  },
  render: renderShell,
  title: "Components/AppShell",
} satisfies Meta<ShellStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 登録タグが多くても最近の10件のみアイコン付きでフラット列挙し、0件タグは出さない。 */
export const ManyTags: Story = {
  play: async ({ canvasElement }) => {
    if (!window.matchMedia("(min-width: 768px)").matches) {
      return;
    }

    const canvas = within(canvasElement);

    await expect(canvas.queryByRole("complementary")).toBeNull();
    await expect(canvas.getByRole("main")).toHaveAttribute(
      "id",
      "main-content"
    );

    const skip = await canvas.findByRole("link", {
      name: "メインコンテンツへスキップ",
    });

    await expect(skip).toHaveAttribute("href", "#main-content");

    const recentNav = await canvas.findByRole("navigation", {
      name: "最近のタグ",
    });

    const tagLinks = within(recentNav).getAllByRole("link");
    await expect(tagLinks).toHaveLength(10);

    await expect(within(recentNav).queryByText("エリザベス女王杯")).toBeNull();
    await expect(within(recentNav).queryByText("短期免許外国人")).toBeNull();

    const mainNav = canvas.getByRole("navigation", { name: "メイン" });
    await expect(
      within(mainNav).getByRole("link", { name: "タグ 16件" })
    ).toHaveAttribute("href", "/tags");

    const currentLinks = canvas.getAllByRole("link", { current: "page" });

    await expect(currentLinks).toHaveLength(1);
    await expect(currentLinks[0]).toHaveTextContent("ホーム");

    await expect(
      within(recentNav).getByRole("link", { name: "馬 キタサンブラック 4件" })
    ).toBeInTheDocument();
    await expect(
      within(recentNav).getByRole("link", { name: "人 川田将雅 3件" })
    ).toBeInTheDocument();
    await expect(
      within(recentNav).getByRole("link", { name: "主題 東京芝2000 5件" })
    ).toBeInTheDocument();
  },
};

/** サイドバーの最近使ったタグを選択中の状態。 */
export const ActiveTag: Story = {
  args: {
    initialPath: "/tags/1",
    tags: manyTagsFixture,
  },
  play: async ({ canvasElement }) => {
    if (!window.matchMedia("(min-width: 768px)").matches) {
      return;
    }

    const canvas = within(canvasElement);
    await canvas.findByRole("navigation", { name: "最近のタグ" });

    const currentLinks = canvas.getAllByRole("link", { current: "page" });

    await expect(currentLinks).toHaveLength(1);
    await expect(currentLinks[0]).toHaveAccessibleName(
      "馬 キタサンブラック 4件"
    );
  },
};

/** タグ一覧ページを開いている状態。 */
export const TagsIndex: Story = {
  args: {
    initialPath: "/tags",
    tags: manyTagsFixture,
  },
};

/** タグが未登録の初期状態。「最近のタグ」セクションは出ない。 */
export const EmptyTags: Story = {
  args: {
    initialPath: "/",
    tags: [],
  },
};
