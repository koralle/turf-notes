import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AppShell } from "../../components/shell";
import { meQuery, tagsQuery } from "../../rpc/queries";

export const Route = createFileRoute("/_app")({
  // ブラウザからの `/rpc` だけが API Worker に届く（SSR 中に同じ URL は叩けない）。
  // サインイン必須の画面はどれも SSR する中身を持たないので、ここから下は client で描く。
  ssr: false,
  beforeLoad: async ({ context }) => {
    // セッションを先に確かめる。未サインインなら後続の loader は走らない。
    try {
      await context.queryClient.query(meQuery);
    } catch {
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
