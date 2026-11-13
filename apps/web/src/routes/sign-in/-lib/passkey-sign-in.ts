import { authClient } from "../../../features/auth/auth-client";
import {
  cancelledPasskeyErrorCodes,
  resolvePasskeyErrorMessage,
  resolveTransportErrorMessage,
} from "./sign-in-error";

/**
 * `cancelled` は WebAuthn のダイアログを閉じた・時間切れ・中断。
 * 失敗は例外で返すので、正常系は2つだけ。
 */
export type PasskeySignInOutcome = "signed-in" | "cancelled";

export async function signInWithPasskey(): Promise<PasskeySignInOutcome> {
  const result = await authClient.signIn.passkey().catch((error: unknown) => {
    throw new Error(resolveTransportErrorMessage(error), { cause: error });
  });

  const error = result.error;

  if (error === null || error === undefined) {
    return "signed-in";
  }

  if ("code" in error && cancelledPasskeyErrorCodes.has(error.code)) {
    return "cancelled";
  }

  throw new Error(resolvePasskeyErrorMessage(error), { cause: error });
}
