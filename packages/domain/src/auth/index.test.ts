import * as v from "valibot";
import { describe, expect, expectTypeOf, test } from "vitest";

import {
  authMethodsSchema,
  canSetPasswordSignIn,
  userId,
  userIdSchema,
  userSchema,
} from ".";
import type { UserId } from ".";

describe("userIdSchema / userId", () => {
  test("空でない文字列だけを UserId として通す", () => {
    expect(v.safeParse(userIdSchema, "user-1").success).toBe(true);
    expect(v.safeParse(userIdSchema, "").success).toBe(false);
    expect(v.safeParse(userIdSchema, 1).success).toBe(false);
  });

  test("空文字からは UserId を作れない", () => {
    expect(() => userId("")).toThrow();
    expect(userId("user-1")).toBe("user-1");
  });

  test("UserId は素の string と区別される", () => {
    const raw = "user-1";
    const plain: string = raw;
    // @ts-expect-error brand されていない string は UserId として扱えない
    const branded: UserId = plain;
    expect(userId(branded)).toBe("user-1");
  });
});

describe("userSchema", () => {
  const user = {
    email: "me@example.com",
    id: userId("user-1"),
    name: "koralle",
  };

  test("id・名前・メールアドレスを受け取る", () => {
    expect(v.parse(userSchema, user)).toStrictEqual(user);
  });

  test("id が UserId でなければ弾く", () => {
    expect(v.safeParse(userSchema, { ...user, id: "" }).success).toBe(false);
    expect(v.safeParse(userSchema, { ...user, id: undefined }).success).toBe(
      false
    );
  });

  test("パース結果は readonly（型だけの制約）", () => {
    const parsed = v.parse(userSchema, user);
    expectTypeOf(parsed.id).toEqualTypeOf<UserId>();
    // @ts-expect-error readonly なので書き換えられない
    parsed.email = "other@example.com";
  });
});

describe("authMethodsSchema", () => {
  test("パスキーの有無とパスワードサインインの可否を持つ", () => {
    expect(
      v.parse(authMethodsSchema, {
        hasPasskey: true,
        passwordSignInEnabled: false,
      })
    ).toStrictEqual({ hasPasskey: true, passwordSignInEnabled: false });
    expect(v.safeParse(authMethodsSchema, { hasPasskey: true }).success).toBe(
      false
    );
  });
});

describe("canSetPasswordSignIn", () => {
  test("パスキーが1つも無ければ無効化できない（FR-A4）", () => {
    expect(
      canSetPasswordSignIn({ nextEnabled: false, hasPasskey: false })
    ).toBe(false);
  });

  test("パスキーがあれば無効化できる", () => {
    expect(canSetPasswordSignIn({ nextEnabled: false, hasPasskey: true })).toBe(
      true
    );
  });

  test("有効化はパスキーの有無に関わらずできる", () => {
    expect(canSetPasswordSignIn({ nextEnabled: true, hasPasskey: false })).toBe(
      true
    );
    expect(canSetPasswordSignIn({ nextEnabled: true, hasPasskey: true })).toBe(
      true
    );
  });
});
