import { describe, expect, test } from "vitest";

import { normalizeTagName } from "./text";

describe("normalizeTagName", () => {
  test("前後の空白を落とし、連続空白を畳み、小文字化する", () => {
    expect(normalizeTagName("  Soda   Shi ")).toBe("soda shi");
  });

  test("日本語のカタカナはそのまま保つ", () => {
    expect(normalizeTagName(" ソダシ ")).toBe("ソダシ");
  });
});
