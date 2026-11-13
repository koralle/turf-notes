import { Button as RacButton } from "react-aria-components";
import { css } from "styled-system/css";

import { useSignIn } from "../-hooks/use-sign-in";
import type { PasskeySignInOutcome } from "../-lib/passkey-sign-in";
import { ErrorBanner } from "./error-banner";

const hint = css({
  color: "muted",
  fontSize: { base: "13px", md: "12px" },
  lineHeight: 1.8,
  mb: "16px",
});

const primary = css({
  alignItems: "center",
  bg: "accent",
  border: "none",
  borderRadius: "9px",
  color: "#fff",
  cursor: "pointer",
  display: "flex",
  fontSize: { base: "15px", md: "13px" },
  fontWeight: 600,
  justifyContent: "center",
  minH: { base: "48px", md: "auto" },
  mt: "18px",
  py: "10px",
  w: "100%",
});

const secondary = css({
  alignItems: "center",
  bg: "accentWeak",
  border: "none",
  borderRadius: "9px",
  color: "accent",
  cursor: "pointer",
  display: "flex",
  fontSize: "13px",
  fontWeight: 600,
  justifyContent: "center",
  minH: { base: "44px", md: "auto" },
  mt: "10px",
  py: "10px",
  w: "100%",
});

const recoveryNote = css({
  color: "faint",
  fontSize: "11px",
  lineHeight: 1.7,
  mt: "12px",
});

const bannerSpacing = css({ mb: "14px" });

interface PasskeyUIProps {
  hasPasskey: boolean;
  onSignIn: () => Promise<PasskeySignInOutcome>;
  onSuccessSignIn: (outcome: PasskeySignInOutcome) => Promise<void>;
  onTogglePassword: () => void;
  passwordEnabled: boolean;
}

export const PasskeyUI = ({
  hasPasskey,
  onSignIn,
  onSuccessSignIn,
  onTogglePassword,
  passwordEnabled,
}: PasskeyUIProps) => {
  const passkey = useSignIn({
    onSignIn,
    onSuccess: onSuccessSignIn,
  });
  const label = "パスキーでサインイン";

  return hasPasskey ? (
    <>
      <div className={hint}>登録済みのパスキーでサインインします。</div>
      {passkey.error === null ? null : (
        <ErrorBanner className={bannerSpacing}>{passkey.error}</ErrorBanner>
      )}
      <RacButton
        // 保留に入ると RAC がボタン名を assertive で読み上げるので、名前を進行中の文言に差し替える。
        aria-label={passkey.isPending ? `${label}しています` : label}
        className={primary}
        isPending={passkey.isPending}
        onPress={() => {
          passkey.signIn();
        }}
        style={{ marginTop: 0 }}
      >
        {label}
      </RacButton>
      {passwordEnabled ? (
        <RacButton className={secondary} onPress={onTogglePassword}>
          その他の方法でログインする
        </RacButton>
      ) : (
        <div className={recoveryNote}>
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
  );
};
