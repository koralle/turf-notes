import { describe, expect, test } from "vitest";

import {
  cancelledPasskeyErrorCodes,
  resolvePasskeyErrorMessage,
  resolvePasswordErrorMessage,
  resolveTransportErrorMessage,
} from "./sign-in-error";

describe("resolveTransportErrorMessage", () => {
  test("タイムアウトの打ち切りは応答なしとして案内する", () => {
    expect(
      resolveTransportErrorMessage(new DOMException("", "AbortError"))
    ).toBe(
      "サインインに応答がありませんでした。時間をおいてもう一度お試しください。"
    );
  });

  test("オフラインや接続断はネットワークを疑わせる", () => {
    expect(resolveTransportErrorMessage(new TypeError("Failed to fetch"))).toBe(
      "接続できませんでした。ネットワークを確認してもう一度お試しください。"
    );
  });

  test("心当たりのない例外は既定の文言にする", () => {
    expect(resolveTransportErrorMessage(new Error("boom"))).toBe(
      "サインインに失敗しました。もう一度お試しください。"
    );
  });
});

describe("resolvePasswordErrorMessage", () => {
  test("401 はメールアドレスかパスワードの誤りとして扱う", () => {
    expect(resolvePasswordErrorMessage({ status: 401 })).toBe(
      "メールアドレスかパスワードが違います"
    );
  });

  test("401 以外は既定の文言にする", () => {
    expect(resolvePasswordErrorMessage({ status: 500 })).toBe(
      "サインインに失敗しました。もう一度お試しください。"
    );
  });
});

describe("resolvePasskeyErrorMessage", () => {
  test.each([
    ["ERROR_INVALID_DOMAIN"],
    ["ERROR_INVALID_RP_ID"],
    ["ORIGIN_NOT_CONFIGURED"],
  ])("%s は環境の問題としてパスワードへ誘導する", (code) => {
    expect(resolvePasskeyErrorMessage({ code, status: 400 })).toBe(
      "この環境ではパスキーを使えません。パスワードでサインインしてください。"
    );
  });

  test("PASSKEY_NOT_FOUND は未登録としてパスワードへ誘導する", () => {
    expect(
      resolvePasskeyErrorMessage({ code: "PASSKEY_NOT_FOUND", status: 404 })
    ).toBe(
      "このパスキーは登録されていません。パスワードでサインインしてください。"
    );
  });

  test("CHALLENGE_NOT_FOUND は時間切れとして案内する", () => {
    expect(
      resolvePasskeyErrorMessage({ code: "CHALLENGE_NOT_FOUND", status: 400 })
    ).toBe("パスキーの確認に時間がかかりすぎました。もう一度お試しください。");
  });

  test.each([["AUTHENTICATION_FAILED"], ["ERROR_AUTHENTICATOR_GENERAL_ERROR"]])(
    "%s は確認できなかったものとして案内する",
    (code) => {
      expect(resolvePasskeyErrorMessage({ code, status: 500 })).toBe(
        "パスキーを確認できませんでした。もう一度お試しください。"
      );
    }
  );

  test("未知のコードとコード無しは既定の文言にする", () => {
    const fallback =
      "パスキーでサインインできませんでした。もう一度お試しください。";

    expect(
      resolvePasskeyErrorMessage({ code: "SOMETHING_NEW", status: 400 })
    ).toBe(fallback);
    expect(resolvePasskeyErrorMessage({ status: 400 })).toBe(fallback);
  });
});

describe("cancelledPasskeyErrorCodes", () => {
  test("ダイアログを閉じた・時間切れと中断だけを無言にする", () => {
    expect([...cancelledPasskeyErrorCodes]).toStrictEqual([
      "ERROR_CEREMONY_ABORTED",
      "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
    ]);
  });

  test("better-auth の catch-all は無言にしない", () => {
    // AUTH_CANCELLED は WebAuthnError 以外の throw と検証 fetch の失敗を畳んだもの
    // （@better-auth/passkey の client 実装）。黙ると通信失敗が見えなくなる。
    expect(cancelledPasskeyErrorCodes.has("AUTH_CANCELLED")).toBe(false);
  });
});
