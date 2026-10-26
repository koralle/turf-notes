import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import type { TagWithCount } from "@turf-notes/api-contract/schemas";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { css } from "styled-system/css";

import { client } from "../rpc/client";
import { HomeIcon, SettingsIcon, TagIcon } from "./icons";

const shell = css({
  display: "flex",
  flexDirection: { base: "column", md: "row" },
  height: "100dvh",
  overflow: "hidden",
});

const sidebar = css({
  bg: "panel",
  borderRightColor: "line",
  borderRightStyle: "solid",
  borderRightWidth: "1px",
  display: { base: "none", md: "flex" },
  flex: "0 0 244px",
  flexDirection: "column",
  gap: "2px",
  overflow: "auto",
  p: "22px 16px",
  width: "244px",
});

const brand = css({
  alignItems: "center",
  display: "flex",
  gap: "9px",
  pb: "18px",
  px: "8px",
});

const mark = css({
  alignItems: "center",
  bg: "accent",
  borderRadius: "6px",
  color: "#fff",
  display: "flex",
  fontSize: "11px",
  fontWeight: 700,
  h: "22px",
  justifyContent: "center",
  w: "22px",
});

const navItem = css({
  alignItems: "center",
  borderRadius: "6px",
  color: "muted",
  display: "flex",
  fontSize: "13px",
  gap: "8px",
  px: "9px",
  py: "7px",
  textDecoration: "none",
});

const sideLabel = css({
  color: "faint",
  fontSize: "10.5px",
  letterSpacing: "0.09em",
  mt: "18px",
  mb: "6px",
  px: "9px",
});

const tagRow = css({
  alignItems: "center",
  borderRadius: "5px",
  color: "ink",
  display: "flex",
  fontSize: "12.5px",
  gap: "8px",
  px: "9px",
  py: "5px",
  textDecoration: "none",
});

const dotBase = css({
  borderRadius: "999px",
  flex: "0 0 6px",
  h: "6px",
  w: "6px",
});
const dotOf = {
  horse: css({ bg: "horse" }),
  person: css({ bg: "person" }),
  theme: css({ bg: "theme" }),
} as const;

const countStyle = css({ color: "faint", fontSize: "11px", ml: "auto" });

const mainCol = css({
  bg: "bg",
  display: "flex",
  flex: 1,
  flexDirection: "column",
  minHeight: 0,
  minWidth: 0,
  overflow: "auto",
});

const kindLabel = { horse: "馬", person: "人", theme: "主題" } as const;

const Sidebar = () => {
  const tags = useQuery({
    queryFn: async () => await client.tags.list(),
    queryKey: ["tags"],
    staleTime: 30_000,
  });

  const grouped = (tags.data ?? []).reduce<Record<string, TagWithCount[]>>(
    (acc, tag) => {
      const list = acc[tag.kind] ?? [];
      list.push(tag);
      acc[tag.kind] = list;
      return acc;
    },
    {}
  );

  return (
    <aside className={sidebar}>
      <Link className={brand} to="/">
        <span className={mark}>T</span>
        <span className={css({ fontSize: "13.5px", fontWeight: 600 })}>
          Turf Notes
        </span>
      </Link>
      <Link className={navItem} to="/">
        ホーム
      </Link>
      <Link className={navItem} to="/settings">
        設定
      </Link>
      {(["horse", "person", "theme"] as const).map((kind) =>
        (grouped[kind] ?? []).length === 0 ? null : (
          <div key={kind}>
            <div className={sideLabel}>{kindLabel[kind]}</div>
            {(grouped[kind] ?? []).map((tag) => (
              <Link
                className={tagRow}
                key={tag.id}
                params={{ tagId: String(tag.id) }}
                to="/tags/$tagId"
              >
                <span className={`${dotBase} ${dotOf[kind]}`} />
                {tag.name}
                <span className={countStyle}>{tag.memoCount}</span>
              </Link>
            ))}
          </div>
        )
      )}
    </aside>
  );
};

const tabBar = css({
  alignItems: "stretch",
  bg: "panel",
  borderTopColor: "line",
  borderTopStyle: "solid",
  borderTopWidth: "1px",
  display: { base: "flex", md: "none" },
  flex: "0 0 auto",
  minH: "60px",
});

const tab = css({
  alignItems: "center",
  color: "muted",
  display: "flex",
  flex: 1,
  flexDirection: "column",
  fontSize: "10px",
  gap: "3px",
  justifyContent: "center",
  letterSpacing: "0.02em",
  textDecoration: "none",
});

const tabActive = css({ color: "accent", fontWeight: 600 });

const MobileTabs = ({ pathname }: { pathname: string }) => (
  <nav
    aria-label="メインナビゲーション"
    className={tabBar}
    style={{
      height: "calc(60px + env(safe-area-inset-bottom))",
      paddingBottom: "env(safe-area-inset-bottom)",
    }}
  >
    <Link
      aria-current={pathname === "/" ? "page" : undefined}
      className={`${tab} ${pathname === "/" ? tabActive : ""}`}
      to="/"
    >
      <HomeIcon size={20} />
      ホーム
    </Link>
    <Link
      aria-current={pathname === "/tags" ? "page" : undefined}
      className={`${tab} ${pathname === "/tags" ? tabActive : ""}`}
      to="/tags"
    >
      <TagIcon size={20} />
      タグ
    </Link>
    <Link
      aria-current={pathname === "/settings" ? "page" : undefined}
      className={`${tab} ${pathname === "/settings" ? tabActive : ""}`}
      to="/settings"
    >
      <SettingsIcon size={20} />
      設定
    </Link>
  </nav>
);

export const AppShell = ({ children }: { children: ReactNode }) => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const isTopLevel =
    pathname === "/" || pathname === "/tags" || pathname === "/settings";

  return (
    <div className={shell} style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <Sidebar />
      <main className={mainCol}>{children}</main>
      {isTopLevel ? <MobileTabs pathname={pathname} /> : null}
    </div>
  );
};

/**
 * サインイン必須の画面を包む。`/sign-in` は対象外。
 * SSR 中は何も描かない（データ取得はクライアントで始まる）。
 */
export const RequireSession = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const isSignIn = pathname.startsWith("/sign-in");

  const session = useQuery({
    enabled: !isSignIn,
    queryFn: async () => await client.me(),
    queryKey: ["me"],
    retry: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!isSignIn && session.error !== null) {
      void navigate({ to: "/sign-in" });
    }
  }, [isSignIn, navigate, session.error]);

  if (isSignIn) {
    return <>{children}</>;
  }

  if (session.isPending || session.error !== null) {
    return null;
  }

  return <>{children}</>;
};
