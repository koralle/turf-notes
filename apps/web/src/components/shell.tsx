import { useQuery } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";
import { Home, SlidersHorizontal, Tag } from "lucide-react";
import { useId, useRef } from "react";
import type { ReactNode } from "react";
import { css } from "styled-system/css";

import { selectSidebarTags } from "../lib/sidebar-tags";
import { tagsQuery } from "../rpc/queries";
import { TagKindIcon } from "./tag-kind-icon";

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
  _pointerCoarse: { py: "16px" },
});

const skipLink = css({
  alignItems: "center",
  bg: "panel",
  borderColor: "accent",
  borderRadius: "8px",
  borderStyle: "solid",
  borderWidth: "2px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
  color: "ink",
  display: { base: "none", md: "inline-flex" },
  fontSize: "13px",
  fontWeight: 600,
  left: "12px",
  position: "fixed",
  px: "14px",
  py: "8px",
  textDecoration: "none",
  top: "12px",
  zIndex: 50,
});

const brand = css({
  alignItems: "center",
  color: "ink",
  display: "flex",
  gap: "9px",
  pb: "18px",
  px: "8px",
  _pointerCoarse: { pb: "12px" },
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

const navList = css({
  display: "flex",
  flexDirection: "column",
  gap: "2px",
});

const navItem = css({
  alignItems: "center",
  borderRadius: "6px",
  color: "muted",
  display: "flex",
  fontSize: "13px",
  gap: "9px",
  minH: "34px",
  position: "relative",
  px: "9px",
  py: "7px",
  textDecoration: "none",
  _hover: { bg: "bg", color: "ink" },
  _currentPage: { bg: "accentWeak", color: "accent", fontWeight: 600 },
  _pointerCoarse: { minH: "44px" },
});

const sideLabel = css({
  color: "faint",
  fontSize: "10.5px",
  letterSpacing: "0.09em",
  mt: "18px",
  mb: "6px",
  px: "9px",
  _pointerCoarse: { mb: "4px", mt: "12px" },
});

const tagRow = css({
  alignItems: "center",
  borderRadius: "5px",
  color: "ink",
  display: "flex",
  fontSize: "12.5px",
  gap: "8px",
  minH: "28px",
  position: "relative",
  px: "9px",
  py: "4px",
  textDecoration: "none",
  _hover: { bg: "bg" },
  _currentPage: { bg: "accentWeak", color: "accent", fontWeight: 600 },
  _pointerCoarse: { minH: "44px" },
});

const tagName = css({
  flex: 1,
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

const countStyle = css({
  color: "faint",
  flexShrink: 0,
  fontSize: "11px",
  fontVariantNumeric: "tabular-nums",
  ml: "auto",
  "a[aria-current=page] &": { color: "muted" },
});

const mainCol = css({
  bg: "bg",
  display: "flex",
  flex: 1,
  flexDirection: "column",
  minHeight: 0,
  minWidth: 0,
  overflow: "auto",
});

const Sidebar = () => {
  // `/_app` の loader が温めている。ここは読むだけ。
  const tags = useQuery(tagsQuery);
  const recentTagsId = useId();

  const allTags = tags.data ?? [];
  const recentTags = selectSidebarTags(allTags);

  return (
    <div className={sidebar}>
      <div className={brand}>
        <span aria-hidden="true" className={mark}>
          T
        </span>
        <span className={css({ fontSize: "13.5px", fontWeight: 600 })}>
          Turf Notes
        </span>
      </div>
      <nav aria-label="メイン">
        <ul className={navList}>
          <li>
            <Link activeOptions={{ exact: true }} className={navItem} to="/">
              <Home aria-hidden="true" size={15} />
              ホーム
            </Link>
          </li>
          <li>
            <Link
              activeOptions={{ exact: true }}
              className={navItem}
              to="/tags"
            >
              <Tag aria-hidden="true" size={15} />
              タグ
              {allTags.length > 0 ? (
                <span className={countStyle}>
                  <span aria-hidden="true">{allTags.length}</span>
                  <span className="visually-hidden">{`${allTags.length}件`}</span>
                </span>
              ) : null}
            </Link>
          </li>
          <li>
            <Link className={navItem} to="/settings">
              <SlidersHorizontal aria-hidden="true" size={15} />
              設定
            </Link>
          </li>
        </ul>
      </nav>
      {recentTags.length === 0 ? null : (
        <nav aria-labelledby={recentTagsId}>
          <div className={sideLabel} id={recentTagsId}>
            最近のタグ
          </div>
          <ol className={navList}>
            {recentTags.map((tag) => (
              <li key={tag.id}>
                <Link
                  className={tagRow}
                  params={{ tagId: String(tag.id) }}
                  to="/tags/$tagId"
                >
                  <TagKindIcon kind={tag.kind} />
                  <span className={tagName}>{tag.name}</span>
                  <span className={countStyle}>
                    <span aria-hidden="true">{tag.memoCount}</span>
                    <span className="visually-hidden">{`${tag.memoCount}件`}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      )}
    </div>
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

const tabList = css({
  alignItems: "stretch",
  display: "flex",
  flex: 1,
});

const tabListItem = css({
  display: "flex",
  flex: 1,
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
  _currentPage: { color: "accent", fontWeight: 600 },
});

const MobileTabs = () => (
  <nav
    aria-label="メイン"
    className={tabBar}
    style={{
      height: "calc(60px + env(safe-area-inset-bottom))",
      paddingBottom: "env(safe-area-inset-bottom)",
    }}
  >
    <ul className={tabList}>
      <li className={tabListItem}>
        <Link activeOptions={{ exact: true }} className={tab} to="/">
          <Home aria-hidden="true" size={20} />
          ホーム
        </Link>
      </li>
      <li className={tabListItem}>
        <Link activeOptions={{ exact: true }} className={tab} to="/tags">
          <Tag aria-hidden="true" size={20} />
          タグ
        </Link>
      </li>
      <li className={tabListItem}>
        <Link className={tab} to="/settings">
          <SlidersHorizontal aria-hidden="true" size={20} />
          設定
        </Link>
      </li>
    </ul>
  </nav>
);

export const AppShell = ({ children }: { children: ReactNode }) => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const mainRef = useRef<HTMLElement>(null);

  const isTopLevel =
    pathname === "/" || pathname === "/tags" || pathname === "/settings";

  return (
    <div className={shell} style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <a
        className={`${skipLink} visually-hidden`}
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          mainRef.current?.focus();
        }}
      >
        メインコンテンツへスキップ
      </a>
      <Sidebar />
      <main className={mainCol} id="main-content" ref={mainRef} tabIndex={-1}>
        {children}
      </main>
      {isTopLevel ? <MobileTabs /> : null}
    </div>
  );
};
