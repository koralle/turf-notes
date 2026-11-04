import type { TagKind } from "@turf-notes/api-contract/schemas";

/** タグの種類の表示名。UI は日本語のみ（NFR-4）。 */
export const kindLabels: Record<TagKind, string> = {
  horse: "馬",
  person: "人",
  theme: "主題",
};
