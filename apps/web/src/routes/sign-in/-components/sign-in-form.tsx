import { useForm } from "@conform-to/react/future";
import { Button as RacButton } from "react-aria-components";
import { css } from "styled-system/css";

import { useSignIn } from "../-hooks/use-sign-in";
import { primaryButton } from "../-lib/button";
import type { SignInFormSchema } from "../-lib/schema";
import { signInFormSchema } from "../-lib/schema";
import { InlineError } from "../../../components/inline-error";
import { ErrorBanner } from "./error-banner";

const field = css({
  borderColor: "line",
  borderRadius: "7px",
  borderStyle: "solid",
  borderWidth: "1px",
  fontFamily: "inherit",
  fontSize: { base: "16px", md: "13.5px" },
  minH: { base: "44px", md: "auto" },
  mt: "6px",
  p: "9px 11px",
  w: "100%",
});

const errorSpacing = css({ mt: "10px" });

const bannerSpacing = css({ mt: "14px" });

const buttonSpacing = css({ mt: "18px" });

interface SignInFormProps {
  onSignIn: (value: SignInFormSchema) => Promise<void>;
  onSuccessSignIn: () => Promise<void>;
}

export const SignInForm = ({ onSignIn, onSuccessSignIn }: SignInFormProps) => {
  const label = "パスワードでサインイン";
  const { signIn, isPending, error } = useSignIn({
    onSignIn,
    onSuccess: onSuccessSignIn,
  });

  const { form, fields } = useForm(signInFormSchema, {
    shouldValidate: "onBlur",
    onSubmit: async (event, { value }) => {
      event.preventDefault();
      signIn(value);
    },
  });

  return (
    <form {...form.props}>
      {error === null ? null : (
        <ErrorBanner className={bannerSpacing}>{error}</ErrorBanner>
      )}

      <label
        className={css({
          display: "block",
          fontSize: "12px",
          mt: "14px",
        })}
      >
        メールアドレス
        <input
          aria-describedby={fields.email.ariaDescribedBy}
          aria-invalid={fields.email.ariaInvalid}
          autoComplete="username"
          className={field}
          id={fields.email.id}
          name={fields.email.name}
          required
          spellCheck={false}
          type="email"
        />
      </label>
      {fields.email.errors === undefined ? null : (
        <InlineError className={errorSpacing} id={fields.email.errorId}>
          {fields.email.errors}
        </InlineError>
      )}

      <label
        className={css({
          display: "block",
          fontSize: "12px",
          mt: "12px",
        })}
      >
        パスワード
        <input
          aria-describedby={fields.password.ariaDescribedBy}
          aria-invalid={fields.password.ariaInvalid}
          autoComplete="current-password"
          className={field}
          id={fields.password.id}
          name={fields.password.name}
          required
          type="password"
        />
      </label>
      {fields.password.errors === undefined ? null : (
        <InlineError className={errorSpacing} id={fields.password.errorId}>
          {fields.password.errors}
        </InlineError>
      )}

      <RacButton
        // 保留に入ると RAC がボタン名を assertive で読み上げるので、名前を進行中の文言に差し替える。
        aria-label={isPending ? `${label}しています` : label}
        className={`${primaryButton} ${buttonSpacing}`}
        isPending={isPending}
        type="submit"
      >
        {label}
      </RacButton>
    </form>
  );
};
