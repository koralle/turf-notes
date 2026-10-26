import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { css } from "styled-system/css";

import { client } from "../rpc/client";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

const wrap = css({ maxWidth: "640px", px: "40px", py: "30px" });
const section = css({
  borderTopColor: "line",
  borderTopStyle: "solid",
  borderTopWidth: "1px",
  mt: "24px",
  pt: "20px",
});

function SettingsPage() {
  const me = useQuery({
    queryFn: async () => await client.me(),
    queryKey: ["me"],
  });

  return (
    <div className={wrap}>
      <h1 className={css({ fontSize: "19px", fontWeight: 600, m: 0 })}>設定</h1>

      <div className={section}>
        <div
          className={css({
            color: "faint",
            fontSize: "10px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          })}
        >
          アカウント
        </div>
        <div className={css({ fontSize: "13px", mt: "8px" })}>
          {me.data?.name ?? "…"}
        </div>
        <div className={css({ color: "muted", fontSize: "12.5px" })}>
          {me.data?.email ?? ""}
        </div>
      </div>

      <div className={section}>
        <div
          className={css({
            color: "faint",
            fontSize: "10px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          })}
        >
          このプロトタイプで未実装のもの
        </div>
        <ul
          className={css({
            color: "muted",
            fontSize: "12.5px",
            lineHeight: 2,
            mt: "8px",
            pl: "18px",
          })}
        >
          <li>パスキーの登録（サインインはメールアドレスとパスワードのみ）</li>
          <li>パスワードサインインの有効／無効の切り替え</li>
          <li>JSON エクスポート</li>
        </ul>
        <div className={css({ color: "faint", fontSize: "11.5px", mt: "8px" })}>
          ユーザーは <code>pnpm --filter @turf-notes/api create-user</code>{" "}
          で作ります。
        </div>
      </div>
    </div>
  );
}
