import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { css } from "styled-system/css";

import { authMethodsQuery } from "../../rpc/queries";
import { PasskeyUI } from "./-components/passkey-ui";
import { SignInCard } from "./-components/sign-in-card";
import { SignInForm } from "./-components/sign-in-form";
import type { PasskeySignInOutcome } from "./-lib/passkey-sign-in";
import { signInWithPasskey } from "./-lib/passkey-sign-in";
import { signInWithPassword } from "./-lib/password-sign-in";

export const Route = createFileRoute("/sign-in")({
  // 温めないと、SSR した HTML がパスワード入力欄だけの仮の姿になり、
  // ハイドレートでパスキーボタンに差し替わる。
  loader: async ({ context }) => {
    try {
      await context.queryClient.query(authMethodsQuery);
    } catch {
      // 取れなくても画面は出す（パスワードの既定表示になるだけ）。
    }
  },
  component: SignInPage,
});

const divider = css({
  borderTopColor: "line",
  borderTopStyle: "solid",
  borderTopWidth: "1px",
  color: "faint",
  fontSize: "10.5px",
  letterSpacing: "0.08em",
  mt: "18px",
  pt: "14px",
  textAlign: "center",
});

function SignInPage() {
  const [showPassword, setShowPassword] = useState(false);

  const methods = useQuery(authMethodsQuery);

  const hasPasskey = methods.data?.hasPasskey ?? false;
  const passwordEnabled = methods.data?.passwordSignInEnabled ?? true;

  const navigate = useNavigate();
  const onSuccessPasswordSignIn = useCallback(async () => {
    await navigate({ to: "/" });
  }, [navigate]);

  const onSuccessPasskeySignIn = useCallback(
    async (outcome: PasskeySignInOutcome) => {
      if (outcome === "signed-in") {
        await navigate({ to: "/" });
      }
    },
    [navigate]
  );

  return (
    <SignInCard>
      <PasskeyUI
        hasPasskey={hasPasskey}
        onSignIn={signInWithPasskey}
        onSuccessSignIn={onSuccessPasskeySignIn}
        onTogglePassword={() => {
          setShowPassword((prev) => !prev);
        }}
        passwordEnabled={passwordEnabled}
      />

      {passwordEnabled && (showPassword || !hasPasskey) ? (
        <>
          {hasPasskey && showPassword ? (
            <div className={divider}>パスワードでサインイン</div>
          ) : null}
          <SignInForm
            onSignIn={signInWithPassword}
            onSuccessSignIn={onSuccessPasswordSignIn}
          />
        </>
      ) : null}
    </SignInCard>
  );
}
