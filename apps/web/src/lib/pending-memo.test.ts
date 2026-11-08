import { memoSummarySchema } from "@turf-notes/api-contract/schemas";
import * as v from "valibot";
import { describe, expect, test } from "vitest";

import { pendingMemo } from "./pending-memo";

describe("pendingMemo", () => {
  test("一覧の契約（memoSummarySchema）を満たす", () => {
    const result = v.safeParse(memoSummarySchema, pendingMemo("1行目\n2行目"));

    expect(result.success).toBe(true);
  });

  test("見出しは本文の1行目、抜粋は改行を畳んだ本文", () => {
    const memo = pendingMemo("1行目\n2行目");

    expect(memo.heading).toBe("1行目");
    expect(memo.excerpt).toBe("1行目 2行目");
  });
});
