import * as v from "valibot";
import { describe, expect, expectTypeOf, test } from "vitest";

import {
  normalizeTagName,
  tagDisplayName,
  tagId,
  tagIdSchema,
  tagNameSchema,
  tagSchema,
} from ".";
import type { TagId } from ".";

const accepted = (input: unknown) => v.safeParse(tagSchema, input).success;

const nameAccepted = (name: unknown) =>
  v.safeParse(tagNameSchema, name).success;

describe("tagIdSchema / tagId", () => {
  test("正の整数だけを TagId として通す", () => {
    expect(v.safeParse(tagIdSchema, 1).success).toBe(true);
    expect(v.safeParse(tagIdSchema, 0).success).toBe(false);
    expect(v.safeParse(tagIdSchema, 1.5).success).toBe(false);
    expect(v.safeParse(tagIdSchema, "1").success).toBe(false);
  });

  test("整数でない値からは TagId を作れない", () => {
    expect(() => tagId(0)).toThrow();
    expect(tagId(12)).toBe(12);
  });

  test("TagId は素の number と区別される", () => {
    const plain = Number("12");
    // @ts-expect-error brand されていない number は TagId として扱えない
    const branded: TagId = plain;
    expect(tagId(branded)).toBe(12);
  });
});

describe("タグ名の正規化", () => {
  test("表示形は NFC にし、前後の空白を落とし、連続空白を畳む", () => {
    expect(tagDisplayName("  Soda   Shi ")).toBe("Soda Shi");
    expect(tagDisplayName("ソタ\u3099シ")).toBe("ソダシ");
  });

  test("日本語のカタカナはそのまま保つ", () => {
    expect(tagDisplayName(" ソダシ ")).toBe("ソダシ");
  });

  test("正規化形は表示形を小文字化したもの", () => {
    expect(normalizeTagName("  Soda   Shi ")).toBe("soda shi");
    expect(normalizeTagName(" ソダシ ")).toBe("ソダシ");
    expect(normalizeTagName(tagDisplayName("  Soda  Shi "))).toBe("soda shi");
  });
});

describe("tagNameSchema", () => {
  test("パース結果は表示形", () => {
    expect(v.parse(tagNameSchema, "  天皇賞（秋）  ")).toBe("天皇賞（秋）");
  });

  test("空白だけなら弾く", () => {
    expect(nameAccepted("   ")).toBe(false);
    expect(nameAccepted("")).toBe(false);
  });

  test("32文字まで", () => {
    expect(nameAccepted("あ".repeat(32))).toBe(true);
    expect(nameAccepted("あ".repeat(33))).toBe(false);
    // 正規化して32文字に収まるなら通す
    expect(nameAccepted(` ${"あ".repeat(32)}  `)).toBe(true);
  });

  test("文字列以外は弾く", () => {
    expect(nameAccepted(1)).toBe(false);
  });
});

describe("tagSchema", () => {
  const tag = { id: tagId(12), kind: "horse", name: "ソダシ" } as const;

  test("id・名前・種類を受け取る", () => {
    expect(v.parse(tagSchema, tag)).toStrictEqual(tag);
  });

  test("名前は表示形に正規化される", () => {
    expect(v.parse(tagSchema, { ...tag, name: " ソダシ " }).name).toBe(
      "ソダシ"
    );
  });

  test("種類は3種の外なら弾く", () => {
    expect(accepted({ ...tag, kind: "venue" })).toBe(false);
  });

  test("id が TagId でなければ弾く", () => {
    expect(accepted({ ...tag, id: 0 })).toBe(false);
  });

  test("パース結果は readonly（型だけの制約）", () => {
    const parsed = v.parse(tagSchema, { ...tag, name: " ソダシ " });
    expectTypeOf(parsed.id).toEqualTypeOf<TagId>();
    expectTypeOf(parsed.kind).toEqualTypeOf<"horse" | "person" | "theme">();
    // @ts-expect-error readonly なので書き換えられない
    parsed.kind = "theme";
  });
});
