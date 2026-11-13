import { authClient } from "../../../features/auth/auth-client";
import type { SignInFormSchema } from "./schema";
import {
  resolvePasswordErrorMessage,
  resolveTransportErrorMessage,
} from "./sign-in-error";

export async function signInWithPassword(value: SignInFormSchema) {
  const result = await authClient.signIn
    .email(value)
    .catch((error: unknown) => {
      throw new Error(resolveTransportErrorMessage(error), { cause: error });
    });

  if (result.error !== null && result.error !== undefined) {
    throw new Error(resolvePasswordErrorMessage(result.error), {
      cause: result.error,
    });
  }
}
