import { describe, expect, test } from "vitest";

import { createAppQueryClient } from "./query-client";

const errorWith = (code: string) =>
  Object.assign(new Error(code), { code, defined: true, status: 401 });

describe("createAppQueryClient", () => {
  test("UNAUTHORIZED で失敗したときだけ onUnauthorized を呼ぶ", async () => {
    let calls = 0;

    const queryClient = createAppQueryClient({
      onUnauthorized: () => {
        calls += 1;
      },
    });

    await expect(
      queryClient.query({
        queryFn: async () => await Promise.reject(errorWith("UNAUTHORIZED")),
        queryKey: ["unauthorized"],
      })
    ).rejects.toThrow("UNAUTHORIZED");
    expect(calls).toBe(1);

    await expect(
      queryClient.query({
        queryFn: async () => await Promise.reject(errorWith("memo-not-found")),
        queryKey: ["not-found"],
      })
    ).rejects.toThrow("memo-not-found");
    expect(calls).toBe(1);
  });
});
