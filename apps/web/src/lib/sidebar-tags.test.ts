import type { TagWithCount } from "@turf-notes/api-contract/schemas";
import type { TagKind } from "@turf-notes/domain";
import { tagId } from "@turf-notes/domain";
import { describe, expect, test } from "vitest";

import { selectSidebarTags } from "./sidebar-tags";

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

describe("selectSidebarTags", () => {
  test("0件または lastUsedAt が null のタグを除外する", () => {
    const input = [
      makeTag(1, "未使用の馬", "horse", 0, null),
      makeTag(2, "壊れた状態", "theme", 1, null),
      makeTag(3, "件数ゼロだが日時あり", "person", 0, 1000),
      makeTag(4, "ソダシ", "horse", 2, 2000),
    ];

    expect(selectSidebarTags(input)).toStrictEqual([
      makeTag(4, "ソダシ", "horse", 2, 2000),
    ]);
  });

  test("馬・人・主題を区別せず lastUsedAt の降順で並べる", () => {
    const input = [
      makeTag(1, "東京芝2000", "theme", 3, 1000),
      makeTag(2, "川田将雅", "person", 1, 3000),
      makeTag(3, "キタサンブラック", "horse", 2, 2000),
    ];

    expect(
      selectSidebarTags(input).map((tag) => [tag.id, tag.kind])
    ).toStrictEqual([
      [tagId(2), "person"],
      [tagId(3), "horse"],
      [tagId(1), "theme"],
    ]);
  });

  test("lastUsedAt が同じときは memoCount 降順・名前昇順・id 昇順で決まる", () => {
    const input = [
      makeTag(4, "展開", "theme", 2, 5000),
      makeTag(3, "展開", "theme", 2, 5000),
      makeTag(2, "馬場", "theme", 2, 5000),
      makeTag(1, "血統", "theme", 5, 5000),
    ];

    expect(selectSidebarTags(input).map((tag) => tag.id)).toStrictEqual([
      tagId(1),
      tagId(3),
      tagId(4),
      tagId(2),
    ]);
  });

  test("15件渡すと上位10件に絞られる", () => {
    const input = Array.from({ length: 15 }, (_, index) =>
      makeTag(index + 1, `タグ${index + 1}`, "theme", 1, (index + 1) * 1000)
    );

    const selected = selectSidebarTags(input);
    expect(selected).toHaveLength(10);
    expect(selected.map((tag) => tag.id)).toStrictEqual([
      tagId(15),
      tagId(14),
      tagId(13),
      tagId(12),
      tagId(11),
      tagId(10),
      tagId(9),
      tagId(8),
      tagId(7),
      tagId(6),
    ]);
  });

  test("入力配列を破壊しない", () => {
    const input = [
      makeTag(1, "古い", "horse", 1, 1000),
      makeTag(2, "新しい", "person", 1, 2000),
    ];

    const snapshot = [...input];

    selectSidebarTags(input);

    expect(input).toStrictEqual(snapshot);
  });
});
