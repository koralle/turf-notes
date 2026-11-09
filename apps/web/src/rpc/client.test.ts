import { describe, expect, test } from "vitest";

import { errorCode } from "./client";

/** oRPC のエラーは実行時には `code` を持つ。型ではなく形だけを見ているので、形を作って確かめる。 */
const errorWith = (code: string) =>
  Object.assign(new Error(code), { code, defined: true, status: 409 });

describe("errorCode", () => {
  test("定義済みエラーのコードを返す", () => {
    expect(errorCode(errorWith("memo-conflict"))).toBe("memo-conflict");
    expect(errorCode(errorWith("UNAUTHORIZED"))).toBe("UNAUTHORIZED");
  });

  test("code を持たないものは空文字", () => {
    expect(errorCode(new Error("boom"))).toBe("");
    expect(errorCode(null)).toBe("");
    expect(errorCode("memo-conflict")).toBe("");
  });
});
