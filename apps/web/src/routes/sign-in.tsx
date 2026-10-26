import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button as RacButton } from "react-aria-components";
import { css } from "styled-system/css";

import { authClient } from "../features/auth/auth-client";

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

const submit = css({
  bg: "accent",
  border: "none",
  borderRadius: "9px",
  color: "#fff",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 600,
  mt: "18px",
  py: "10px",
  w: "100%",
});

function SignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("me@example.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
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
      <form className={card} onSubmit={(event) => void handleSubmit(event)}>
        <div
          className={css({
            alignItems: "center",
            display: "flex",
            gap: "9px",
            mb: "6px",
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
        <div className={css({ color: "muted", fontSize: "12px", mb: "16px" })}>
          パスキーは未対応です。メールアドレスとパスワードでサインインしてください。
        </div>

        <label className={css({ fontSize: "12px" })}>
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
          className={css({ display: "block", fontSize: "12px", mt: "12px" })}
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

        {error === null ? null : (
          <div
            className={css({ color: "danger", fontSize: "11.5px", mt: "10px" })}
          >
            {error}
          </div>
        )}

        <RacButton
          className={submit}
          isDisabled={pending || password === ""}
          type="submit"
        >
          サインイン
        </RacButton>
      </form>
    </div>
  );
}
