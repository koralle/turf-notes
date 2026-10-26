import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button as RacButton } from "react-aria-components";
import { css } from "styled-system/css";

import { authClient } from "../features/auth/auth-client";
import { client } from "../rpc/client";

export const Route = createFileRoute("/sign-in")({
  component: SignInPage,
});

const page = css({
  alignItems: "center",
  display: "flex",
  justifyContent: "center",
  minHeight: "100vh",
  p: "20px",
});

const card = css({
  bg: "panel",
  borderColor: "line",
  borderRadius: "14px",
  borderStyle: "solid",
  borderWidth: "1px",
  maxWidth: "380px",
  p: "28px",
  w: "100%",
});

const field = css({
  borderColor: "line",
  borderRadius: "7px",
  borderStyle: "solid",
  borderWidth: "1px",
  fontFamily: "inherit",
  fontSize: "13.5px",
  mt: "6px",
  p: "9px 11px",
  w: "100%",
});

const primary = css({
  alignItems: "center",
  bg: "accent",
  border: "none",
  borderRadius: "9px",
  color: "#fff",
  cursor: "pointer",
  display: "flex",
  fontSize: "13px",
  fontWeight: 600,
  justifyContent: "center",
  mt: "18px",
  py: "10px",
  w: "100%",
});

const secondary = css({
  bg: "accentWeak",
  border: "none",
  borderRadius: "9px",
  color: "accent",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 600,
  mt: "10px",
  py: "10px",
  w: "100%",
});

const errorText = css({ color: "danger", fontSize: "11.5px", mt: "10px" });
const hint = css({ color: "muted", fontSize: "12px", mb: "16px" });

function SignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("me@example.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const methods = useQuery({
    queryFn: async () => await client.auth.methods(),
    queryKey: ["auth", "methods"],
    staleTime: 0,
  });

  const hasPasskey = methods.data?.hasPasskey ?? false;
  const passwordEnabled = methods.data?.passwordSignInEnabled ?? true;

  const handlePasskey = async () => {
    setPending(true);
    setError(null);
    const result = await authClient.signIn.passkey();
    setPending(false);

    if (result.error !== null && result.error !== undefined) {
      setError("パスキーでサインインできませんでした");
      return;
    }

    await navigate({ to: "/" });
  };

  const handlePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = await authClient.signIn.email({ email, password });

    setPending(false);
    if (result.error !== null && result.error !== undefined) {
      setError("メールアドレスかパスワードが違います");
      return;
    }

    await navigate({ to: "/" });
  };

  return (
    <div className={page}>
      <div className={card}>
        <div
          className={css({
            alignItems: "center",
            display: "flex",
            gap: "9px",
            mb: "10px",
          })}
        >
          <span
            className={css({
              alignItems: "center",
              bg: "accent",
              borderRadius: "6px",
              color: "#fff",
              display: "flex",
              fontSize: "12px",
              fontWeight: 700,
              h: "24px",
              justifyContent: "center",
              w: "24px",
            })}
          >
            T
          </span>
          <span className={css({ fontSize: "15px", fontWeight: 600 })}>
            Turf Notes
          </span>
        </div>

        {hasPasskey ? (
          <>
            <div className={hint}>登録済みのパスキーでサインインします。</div>
            <RacButton
              className={primary}
              isDisabled={pending}
              onPress={() => void handlePasskey()}
              style={{ marginTop: 0 }}
            >
              パスキーでログイン
            </RacButton>
            {passwordEnabled ? (
              <RacButton
                className={secondary}
                onPress={() => {
                  setShowPassword((prev) => !prev);
                }}
              >
                その他の方法でログインする
              </RacButton>
            ) : (
              <div
                className={css({
                  color: "faint",
                  fontSize: "11px",
                  mt: "12px",
                })}
              >
                パスキーを全部失った場合は、サーバー上で
                <code> pnpm --filter @turf-notes/api enable-password </code>
                を実行してください。
              </div>
            )}
          </>
        ) : (
          <div className={hint}>
            パスキーが未登録です。メールアドレスとパスワードでサインインしてください。
          </div>
        )}

        {passwordEnabled && (showPassword || !hasPasskey) ? (
          <form onSubmit={(event) => void handlePassword(event)}>
            <label
              className={css({
                display: "block",
                fontSize: "12px",
                mt: "14px",
              })}
            >
              メールアドレス
              <input
                autoComplete="email"
                className={field}
                onChange={(event) => {
                  setEmail(event.target.value);
                }}
                type="email"
                value={email}
              />
            </label>

            <label
              className={css({
                display: "block",
                fontSize: "12px",
                mt: "12px",
              })}
            >
              パスワード
              <input
                autoComplete="current-password"
                className={field}
                onChange={(event) => {
                  setPassword(event.target.value);
                }}
                type="password"
                value={password}
              />
            </label>

            <RacButton
              className={primary}
              isDisabled={pending || password === ""}
              type="submit"
            >
              サインイン
            </RacButton>
          </form>
        ) : null}

        {error === null ? null : <div className={errorText}>{error}</div>}
      </div>
    </div>
  );
}
