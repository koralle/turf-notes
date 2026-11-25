import type { TagWithCount } from "@turf-notes/api-contract/schemas";

/** PC サイドバーに列挙する最近使ったタグの上限件数。 */
const SIDEBAR_TAG_LIMIT = 10;

type UsedTag = TagWithCount & { lastUsedAt: number };

const isUsedTag = (tag: TagWithCount): tag is UsedTag =>
  tag.memoCount > 0 && tag.lastUsedAt !== null;

const compareByName = (left: string, right: string): number => {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
};

const compareSidebarTags = (left: UsedTag, right: UsedTag): number =>
  right.lastUsedAt - left.lastUsedAt ||
  right.memoCount - left.memoCount ||
  compareByName(left.name, right.name) ||
  left.id - right.id;

/**
 * サイドバーに表示するタグを選ぶ。
 * 種類で分けず、非削除メモが1件以上あるタグを「最近使った順」で上位10件まで返す。
 * SSR とクライアントで順序が食い違わないよう、`localeCompare` に頼らず決定的に並べる。
 */
export const selectSidebarTags = (
  tags: readonly TagWithCount[]
): TagWithCount[] =>
  tags
    .filter(isUsedTag)
    .toSorted(compareSidebarTags)
    .slice(0, SIDEBAR_TAG_LIMIT);
