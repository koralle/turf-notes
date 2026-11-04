import * as v from "valibot";
import { describe, expect, expectTypeOf, test } from "vitest";

import { excerptOf, headingOf, memoId, memoIdSchema, memoSchema } from ".";
import type { MemoId } from ".";
import { tagId } from "../tag";
import type { TagId } from "../tag";

const id = "0192f0aa-0000-7000-8000-000000000000";
const otherMemoId = "0192f0aa-0000-7000-8000-000000000001";

const memo = { body: "道中で力みが出た。", id };

const accepted = (input: unknown) => v.safeParse(memoSchema, input).success;

const linkIds = (n: number) =>
  Array.from(
    { length: n },
    (_, i) => `0192f0aa-0000-7000-8000-${String(i + 1).padStart(12, "0")}`
  );

describe("memoIdSchema / memoId", () => {
  test("UUID だけを MemoId として通す", () => {
    expect(v.safeParse(memoIdSchema, id).success).toBe(true);
    expect(v.safeParse(memoIdSchema, "memo-1").success).toBe(false);
  });

  test("UUID でない文字列からは MemoId を作れない", () => {
    expect(() => memoId("memo-1")).toThrow();
    expect(memoId(id)).toBe(id);
  });

  test("MemoId は素の string と区別される", () => {
    const plain: string = id;
    // @ts-expect-error brand されていない string は MemoId として扱えない
    const branded: MemoId = plain;
    expect(memoId(branded)).toBe(id);
  });
});

describe("memoSchema", () => {
  test("本文だけでメモになる", () => {
    expect(v.parse(memoSchema, memo)).toStrictEqual(memo);
  });

  test("本文が無い・空ならメモにしない（FR-M1）", () => {
    expect(accepted({ id })).toBe(false);
    expect(accepted({ ...memo, body: "" })).toBe(false);
  });

  test("タイトルは任意で、null も許す", () => {
    expect(v.parse(memoSchema, { ...memo, title: null })).toStrictEqual({
      ...memo,
      title: null,
    });
    expect(
      v.parse(memoSchema, { ...memo, title: "天皇賞（秋）" })
    ).toStrictEqual({ ...memo, title: "天皇賞（秋）" });
  });

  test("タイトルは200文字まで", () => {
    expect(accepted({ ...memo, title: "あ".repeat(200) })).toBe(true);
    expect(accepted({ ...memo, title: "あ".repeat(201) })).toBe(false);
  });

  test("参照は50件まで、タグは20件まで", () => {
    expect(accepted({ ...memo, linkIds: linkIds(50) })).toBe(true);
    expect(accepted({ ...memo, linkIds: linkIds(51) })).toBe(false);
    expect(
      accepted({
        ...memo,
        tagIds: Array.from({ length: 20 }, (_, i) => tagId(i + 1)),
      })
    ).toBe(true);
    expect(
      accepted({
        ...memo,
        tagIds: Array.from({ length: 21 }, (_, i) => tagId(i + 1)),
      })
    ).toBe(false);
  });
  test("パース結果は readonly（型だけの制約）", () => {
    const parsed = v.parse(memoSchema, {
      ...memo,
      tagIds: [tagId(1), tagId(2)],
    });
    expectTypeOf(parsed.body).toEqualTypeOf<string>();
    expectTypeOf(parsed.tagIds).toEqualTypeOf<readonly TagId[] | undefined>();
    // @ts-expect-error readonly なので書き換えられない
    parsed.body = "書き換え";
  });
});

describe("headingOf", () => {
  test("タイトルがあればそれを使う", () => {
    expect(headingOf("  天皇賞(秋)  ", "本文")).toBe("天皇賞(秋)");
  });

  test("タイトルが無ければ本文の最初の非空行を使う", () => {
    expect(headingOf(null, "\n\n  ソダシは道中で力みが出た。\n二行目")).toBe(
      "ソダシは道中で力みが出た。"
    );
  });

  test("タイトルが空白だけなら本文にフォールバックする", () => {
    expect(headingOf("   ", "本文の一行目")).toBe("本文の一行目");
  });
});

describe("excerptOf", () => {
  test("改行を畳んで先頭120文字を返す", () => {
    expect(excerptOf("1行目\n2行目")).toBe("1行目 2行目");
    expect(excerptOf("あ".repeat(200))).toHaveLength(120);
  });
});

describe("Memo の不変条件", () => {
  test("同じタグを重複して持たない", () => {
    expect(accepted({ ...memo, tagIds: [tagId(1), tagId(2)] })).toBe(true);
    expect(accepted({ ...memo, tagIds: [tagId(1), tagId(1)] })).toBe(false);
  });

  test("同じメモを重複して参照しない", () => {
    expect(accepted({ ...memo, linkIds: [otherMemoId] })).toBe(true);
    expect(accepted({ ...memo, linkIds: [otherMemoId, otherMemoId] })).toBe(
      false
    );
  });

  test("自分自身は参照しない", () => {
    expect(accepted({ ...memo, linkIds: [id] })).toBe(false);
  });
});
