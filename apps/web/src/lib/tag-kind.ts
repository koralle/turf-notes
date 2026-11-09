import type { TagKind } from "@turf-notes/domain";
import { css } from "styled-system/css";

/** タグの種類の表示名。UI は日本語のみ（NFR-4）。 */
export const kindLabels: Record<TagKind, string> = {
  horse: "馬",
  person: "人",
  theme: "主題",
};

/** 種類を色で見分けるための点。サイドバー・タグ一覧・チップで共有する。 */
export const tagDotOf = {
  horse: css({ bg: "horse" }),
  person: css({ bg: "person" }),
  theme: css({ bg: "theme" }),
} as const;
