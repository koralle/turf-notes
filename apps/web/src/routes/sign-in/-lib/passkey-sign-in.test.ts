import { beforeEach, describe, expect, test, vi } from "vitest";

import { signInWithPasskey } from "./passkey-sign-in";

const { signInPasskey } = vi.hoisted(() => ({ signInPasskey: vi.fn() }));

vi.mock("../../../features/auth/auth-client", () => ({
  authClient: { signIn: { passkey: signInPasskey } },
}));

beforeEach(() => {
  signInPasskey.mockReset();
});

describe("signInWithPasskey", () => {
  test("署名できたら signed-in を返す", async () => {
    signInPasskey.mockResolvedValueOnce({ data: { token: "t" }, error: null });

    await expect(signInWithPasskey()).resolves.toBe("signed-in");
  });

  test("ダイアログを閉じた・時間切れは無言の cancelled にする", async () => {
    // simplewebauthn が NotAllowedError に付けるコード（閉じた・時間切れ・該当なし）
    signInPasskey.mockResolvedValueOnce({
      data: null,
      error: { code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY", status: 400 },
    });

    await expect(signInWithPasskey()).resolves.toBe("cancelled");
  });

  test("名前の付いた失敗は文言つきで投げる", async () => {
    signInPasskey.mockResolvedValueOnce({
      data: null,
      error: { code: "PASSKEY_NOT_FOUND", status: 404 },
    });

    await expect(signInWithPasskey()).rejects.toThrow(
      "このパスキーは登録されていません。パスワードでサインインしてください。"
    );
  });

  test("better-auth の catch-all は飲まずに投げる", async () => {
    // 検証の通信失敗も AUTH_CANCELLED に畳まれるので、黙ると原因が見えなくなる
    signInPasskey.mockResolvedValueOnce({
      data: null,
      error: { code: "AUTH_CANCELLED", status: 400 },
    });

    await expect(signInWithPasskey()).rejects.toThrow(
      "パスキーでサインインできませんでした。もう一度お試しください。"
    );
  });

  test("通信そのものが失敗したら接続の文言で投げる", async () => {
    signInPasskey.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await expect(signInWithPasskey()).rejects.toThrow(
      "接続できませんでした。ネットワークを確認してもう一度お試しください。"
    );
  });
});
