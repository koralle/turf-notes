import { describe, expect, test } from "vitest";

import { excerptOf, headingOf, normalizeTagName } from "./text";

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

describe("normalizeTagName", () => {
  test("前後の空白を落とし、連続空白を畳み、小文字化する", () => {
    expect(normalizeTagName("  Soda   Shi ")).toBe("soda shi");
  });

  test("日本語のカタカナはそのまま保つ", () => {
    expect(normalizeTagName(" ソダシ ")).toBe("ソダシ");
  });
});
