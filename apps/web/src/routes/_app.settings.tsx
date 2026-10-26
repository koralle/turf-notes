import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button as RacButton } from "react-aria-components";
import { css } from "styled-system/css";

import { authClient } from "../features/auth/auth-client";
import { client } from "../rpc/client";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

const wrap = css({
  maxWidth: "640px",
  px: { base: "18px", md: "40px" },
  py: { base: "20px", md: "30px" },
});
const section = css({
  borderTopColor: "line",
  borderTopStyle: "solid",
  borderTopWidth: "1px",
  mt: { base: "22px", md: "26px" },
  pt: { base: "16px", md: "20px" },
});
const label = css({
  color: "faint",
  fontSize: "10px",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
});
const field = css({
  borderColor: "line",
  borderRadius: "7px",
  borderStyle: "solid",
  borderWidth: "1px",
  fontFamily: "inherit",
  fontSize: { base: "16px", md: "13px" },
  minH: { base: "44px", md: "auto" },
  p: "7px 9px",
});
const smallButton = css({
  alignItems: "center",
  bg: "accentWeak",
  border: "none",
  borderRadius: "7px",
  color: "accent",
  cursor: "pointer",
  display: "inline-flex",
  fontSize: "12px",
  fontWeight: 600,
  justifyContent: "center",
  minH: { base: "40px", md: "auto" },
  px: "11px",
  py: "6px",
  whiteSpace: "nowrap",
});
const row = css({
  alignItems: { base: "stretch", md: "center" },
  borderBottomColor: "line",
  borderBottomStyle: "solid",
  borderBottomWidth: "1px",
  display: "flex",
  flexDirection: { base: "column", md: "row" },
  gap: { base: "4px", md: "10px" },
  py: "10px",
});
const muted = css({ color: "muted", fontSize: "12px" });
const errorText = css({ color: "danger", fontSize: "11.5px", mt: "8px" });
const accountRow = css({
  alignItems: { base: "stretch", md: "center" },
  display: "flex",
  flexDirection: { base: "column", md: "row" },
  gap: "12px",
  mt: "8px",
});
const passkeyActions = css({
  alignItems: "center",
  display: "flex",
  gap: { base: "12px", md: "10px" },
});
const renameInput = css({ flex: 1, minWidth: 0 });
const mutedButton = css({
  alignItems: "center",
  color: "muted",
  display: "flex",
  fontSize: "12px",
  minH: { base: "40px", md: "auto" },
});
const passkeyAdd = css({
  display: "flex",
  flexDirection: { base: "column", md: "row" },
  gap: "6px",
  mt: "14px",
});
const dangerButton = css({
  alignItems: "center",
  color: "danger",
  display: "flex",
  fontSize: "12px",
  minH: { base: "40px", md: "auto" },
});

const formatDate = (value: unknown): string => {
  const ms = typeof value === "number" ? value : Date.parse(String(value));
  if (Number.isNaN(ms)) {
    return "";
  }
  return new Date(ms).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" });
};

function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newPasskeyName, setNewPasskeyName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const me = useQuery({
    queryFn: async () => await client.me(),
    queryKey: ["me"],
  });
  const methods = useQuery({
    queryFn: async () => await client.auth.methods(),
    queryKey: ["auth", "methods"],
  });
  const passkeys = useQuery({
    queryFn: async () => await authClient.passkey.listUserPasskeys(),
    queryKey: ["passkeys"],
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["passkeys"] });
    await queryClient.invalidateQueries({ queryKey: ["auth", "methods"] });
  };

  const addPasskey = useMutation({
    mutationFn: async () =>
      await authClient.passkey.addPasskey(
        newPasskeyName.trim() === "" ? {} : { name: newPasskeyName.trim() }
      ),
    onSuccess: async (result) => {
      if (result.error !== null && result.error !== undefined) {
        setError("パスキーを登録できませんでした");
        return;
      }
      setNewPasskeyName("");
      setError(null);
      await refresh();
    },
  });

  const deletePasskey = useMutation({
    mutationFn: async (id: string) =>
      await authClient.passkey.deletePasskey({ id }),
    onSuccess: async () => {
      await refresh();
    },
  });

  const renamePasskey = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) =>
      await authClient.passkey.updatePasskey({ id, name }),
    onSuccess: async () => {
      setRenamingId(null);
      await refresh();
    },
  });

  const togglePassword = useMutation({
    mutationFn: async (enabled: boolean) =>
      await client.settings.setPasswordSignIn({ enabled }),
    onError: (mutationError: unknown) => {
      const code =
        typeof mutationError === "object" &&
        mutationError !== null &&
        "code" in mutationError
          ? String(mutationError.code)
          : "";
      setError(
        code === "no-passkey"
          ? "パスキーを1つ登録するまで、パスワードサインインは無効化できません"
          : "設定を保存できませんでした"
      );
    },
    onSuccess: async () => {
      setError(null);
      await refresh();
    },
  });

  const signOut = useMutation({
    mutationFn: async () => await authClient.signOut(),
    onSuccess: async () => {
      // サインアウト後に前のユーザーのキャッシュが残らないようにする
      queryClient.clear();
      await navigate({ to: "/sign-in" });
    },
  });

  const exportAll = useMutation({
    mutationFn: async () => await client.exportAll(),
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.download = `turf-notes-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.href = url;
      anchor.click();
      URL.revokeObjectURL(url);
    },
  });

  const passkeyList = passkeys.data?.data ?? [];
  const hasPasskey = passkeyList.length > 0;
  const passwordEnabled = methods.data?.passwordSignInEnabled ?? true;

  return (
    <div className={wrap}>
      <h1
        className={css({
          fontSize: { base: "17px", md: "19px" },
          fontWeight: 600,
          m: 0,
        })}
      >
        設定
      </h1>

      <div className={section}>
        <div className={label}>アカウント</div>
        <div className={accountRow}>
          <div className={css({ flex: 1, minWidth: 0 })}>
            <div className={css({ fontSize: "13px" })}>
              {me.data?.name ?? "…"}
            </div>
            <div className={muted}>{me.data?.email ?? ""}</div>
          </div>
          <RacButton
            className={css({
              alignItems: "center",
              borderColor: "line",
              borderRadius: "7px",
              borderStyle: "solid",
              borderWidth: "1px",
              color: "danger",
              cursor: "pointer",
              display: "inline-flex",
              flexShrink: 0,
              fontSize: "12px",
              fontWeight: 600,
              justifyContent: "center",
              minH: { base: "44px", md: "auto" },
              px: "11px",
              py: "6px",
              w: { base: "100%", md: "auto" },
            })}
            isDisabled={signOut.isPending}
            onPress={() => {
              signOut.mutate();
            }}
          >
            サインアウト
          </RacButton>
        </div>
      </div>

      <div className={section}>
        <div className={label}>パスキー</div>
        <div className={css({ color: "muted", fontSize: "12px", mt: "6px" })}>
          パスキーは端末の生体認証やセキュリティキーでサインインする手段です。
        </div>

        {passkeyList.length === 0 ? (
          <div
            className={css({ color: "faint", fontSize: "12px", mt: "12px" })}
          >
            まだ登録されていません。
          </div>
        ) : (
          passkeyList.map((passkey) => (
            <div className={row} key={passkey.id}>
              {renamingId === passkey.id ? (
                <>
                  <input
                    className={`${field} ${renameInput}`}
                    onChange={(event) => {
                      setRenameValue(event.target.value);
                    }}
                    value={renameValue}
                  />
                  <div className={passkeyActions}>
                    <button
                      className={smallButton}
                      onClick={() => {
                        renamePasskey.mutate({
                          id: passkey.id,
                          name: renameValue,
                        });
                      }}
                      type="button"
                    >
                      保存
                    </button>
                    <button
                      className={mutedButton}
                      onClick={() => {
                        setRenamingId(null);
                      }}
                      type="button"
                    >
                      やめる
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className={css({ flex: 1, minWidth: 0 })}>
                    <div className={css({ fontSize: "13px" })}>
                      {passkey.name ?? "パスキー"}
                    </div>
                    <div className={css({ color: "faint", fontSize: "11px" })}>
                      {formatDate(passkey.createdAt)} 登録
                      {passkey.backedUp ? " ・ バックアップ済み" : ""}
                    </div>
                  </div>
                  <div className={passkeyActions}>
                    <button
                      className={smallButton}
                      onClick={() => {
                        setRenamingId(passkey.id);
                        setRenameValue(passkey.name ?? "");
                      }}
                      type="button"
                    >
                      名前を変更
                    </button>
                    <button
                      className={dangerButton}
                      onClick={() => {
                        deletePasskey.mutate(passkey.id);
                      }}
                      type="button"
                    >
                      削除
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}

        <div className={passkeyAdd}>
          <input
            className={field}
            onChange={(event) => {
              setNewPasskeyName(event.target.value);
            }}
            placeholder="パスキーに付ける名前（任意）"
            style={{ flex: 1 }}
            value={newPasskeyName}
          />
          <RacButton
            className={smallButton}
            isDisabled={addPasskey.isPending}
            onPress={() => {
              addPasskey.mutate();
            }}
          >
            パスキーを追加
          </RacButton>
        </div>
      </div>

      <div className={section}>
        <div className={label}>パスワードサインイン</div>
        <div
          className={css({
            alignItems: "center",
            display: "flex",
            gap: "12px",
            mt: "10px",
          })}
        >
          <div className={css({ flex: 1 })}>
            <div className={css({ fontSize: "13px" })}>
              {passwordEnabled ? "有効" : "無効"}
            </div>
            <div className={muted}>
              無効にすると、パスキーだけがサインイン手段になります。
              {hasPasskey ? "" : "先にパスキーを登録してください。"}
            </div>
          </div>
          <RacButton
            className={smallButton}
            isDisabled={!hasPasskey || togglePassword.isPending}
            onPress={() => {
              togglePassword.mutate(!passwordEnabled);
            }}
          >
            {passwordEnabled ? "無効にする" : "有効にする"}
          </RacButton>
        </div>
        <div className={css({ color: "faint", fontSize: "11px", mt: "10px" })}>
          パスキーを全部失った場合は、サーバー上で
          <code> pnpm --filter @turf-notes/api enable-password </code>
          を実行すると戻せます。
        </div>
      </div>

      <div className={section}>
        <div className={label}>データ</div>
        <div
          className={css({
            alignItems: "center",
            display: "flex",
            gap: "12px",
            mt: "10px",
          })}
        >
          <div className={css({ flex: 1 })}>
            <div className={css({ fontSize: "13px" })}>JSON エクスポート</div>
            <div className={muted}>
              メモ・タグ・参照をすべて1つのファイルに書き出します。
            </div>
          </div>
          <RacButton
            className={smallButton}
            isDisabled={exportAll.isPending}
            onPress={() => {
              exportAll.mutate();
            }}
          >
            エクスポート
          </RacButton>
        </div>
      </div>

      {error === null ? null : <div className={errorText}>{error}</div>}
    </div>
  );
}
