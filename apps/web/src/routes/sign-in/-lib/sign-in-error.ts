/**
 * 通信そのものが失敗したときの文言。`fetchOptions.timeout` の打ち切りは
 * AbortError、オフラインや接続断は TypeError で飛んでくる。
 */
export const resolveTransportErrorMessage = (error: unknown) => {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "サインインに応答がありませんでした。時間をおいてもう一度お試しください。";
  }

  if (error instanceof TypeError) {
    return "接続できませんでした。ネットワークを確認してもう一度お試しください。";
  }

  return "サインインに失敗しました。もう一度お試しください。";
};

export const resolvePasswordErrorMessage = (error: { status: number }) =>
  error.status === 401
    ? "メールアドレスかパスワードが違います"
    : "サインインに失敗しました。もう一度お試しください。";

/**
 * 無言で戻す WebAuthn のエラー。`NotAllowedError` は「ダイアログを閉じた」「時間切れ」
 * 「この端末に該当するパスキーが無い」をまとめて返す（RP から区別できないのは仕様）ので、
 * 何も出さずに戻す。`AbortError` はこちらの中断。
 *
 * `AUTH_CANCELLED` は名前と裏腹に better-auth の catch-all（WebAuthnError 以外の throw と
 * 検証 fetch の失敗）なので入れない。入れると検証中の通信失敗まで無言で飲まれる。
 */
export const cancelledPasskeyErrorCodes = new Set([
  "ERROR_CEREMONY_ABORTED",
  "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
]);

export const resolvePasskeyErrorMessage = (error: {
  code?: string;
  status: number;
}) => {
  if (
    error.code === "ERROR_INVALID_DOMAIN" ||
    error.code === "ERROR_INVALID_RP_ID" ||
    error.code === "ORIGIN_NOT_CONFIGURED"
  ) {
    return "この環境ではパスキーを使えません。パスワードでサインインしてください。";
  }

  if (error.code === "PASSKEY_NOT_FOUND") {
    return "このパスキーは登録されていません。パスワードでサインインしてください。";
  }

  if (error.code === "CHALLENGE_NOT_FOUND") {
    return "パスキーの確認に時間がかかりすぎました。もう一度お試しください。";
  }

  if (
    error.code === "AUTHENTICATION_FAILED" ||
    error.code === "ERROR_AUTHENTICATOR_GENERAL_ERROR"
  ) {
    return "パスキーを確認できませんでした。もう一度お試しください。";
  }

  return "パスキーでサインインできませんでした。もう一度お試しください。";
};
