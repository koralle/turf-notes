import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AppShell } from "../../components/shell";
import { errorCode } from "../../rpc/client";
import { meQuery, tagsQuery } from "../../rpc/queries";

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ context }) => {
    // セッションを先に確かめる。未サインインなら後続の loader は走らない。
    try {
      await context.queryClient.query(meQuery);
    } catch (error) {
      // サインアウト以外（API 障害など）はサインインへ飛ばさず、エラー画面に任せる。
      if (errorCode(error) !== "UNAUTHORIZED") {
        throw error;
      }
      throw redirect({ to: "/sign-in" });
    }
  },
  loader: async ({ context }) => {
    // サイドバーのタグ。アプリ全体で一度だけ要るので、ここで温めて画面は待たせる。
    // 失敗してもアプリは開く（タグ無しのサイドバーになるだけ）。エラーはキャッシュに残る。
    try {
      await context.queryClient.query(tagsQuery);
    } catch {
      // 何もしない。
    }
  },
  component: AppLayout,
});

function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
