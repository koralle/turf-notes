import * as v from "valibot";

import { readonlyValue } from "../readonly";

/** タグの種類。馬・人（騎手／調教師）・主題の3種（要件 §4.2）。 */
export const tagKinds = ["horse", "person", "theme"] as const;

export type TagKind = (typeof tagKinds)[number];

export const tagKindSchema = v.picklist(tagKinds);

/** 新規タグの既定の種類。主題（FR-M5）。 */
export const defaultTagKind: TagKind = "theme";

/** Tag の同一性。レース番号などの素の整数と取り違えないよう brand する。 */
export const tagIdSchema = v.pipe(
  v.number(),
  v.integer(),
  v.minValue(1),
  v.brand("TagId")
);

export type TagId = v.InferOutput<typeof tagIdSchema>;

/** 数値から TagId を作る。DB 行や URL など外から来た id はこれを通す。 */
export const tagId = (value: number): TagId => v.parse(tagIdSchema, value);

/** 文字列から TagId を作る（URL パラメータなど）。整数でなければ null。 */
export const tagIdOf = (raw: string): TagId | null => {
  const parsed = v.safeParse(tagIdSchema, Number(raw));
  return parsed.success ? parsed.output : null;
};

/** 表示形。NFC にし、前後と連続する空白を畳む。DB の name 列に入る形。 */
export const tagDisplayName = (name: string): string =>
  name.normalize("NFC").trim().replaceAll(/\s+/g, " ");

/** 一意性の判定にだけ使う正規化形。表示形を小文字化したもの（要件 §4.2）。 */
export const normalizeTagName = (name: string): string =>
  tagDisplayName(name).toLowerCase();

/** タグ名は1〜32文字。表示形に正規化してから測る。 */
export const tagNameSchema = v.pipe(
  v.string(),
  v.transform(tagDisplayName),
  v.minLength(1),
  v.maxLength(32)
);

/**
 * タグ。同一性は TagId。name は表示形で保持し、正規化形は normalizeTagName で導出する
 * （DB の normalized_name は一意性の判定用。要件 §4.2）。
 * 名前の一意性はユーザーごとに判定するので、ここでは検証しない。
 */
export const tagSchema = readonlyValue(
  v.object({
    id: tagIdSchema,
    name: tagNameSchema,
    kind: tagKindSchema,
  })
);

export type Tag = v.InferOutput<typeof tagSchema>;
