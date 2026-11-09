import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type {
  MemoListInput,
  MemoListOutput,
} from "@turf-notes/api-contract/schemas";
import { Plus, Search, X } from "lucide-react";
import { useState } from "react";
import { css } from "styled-system/css";

import { EmptyState } from "../../components/empty-state";
import { LoadMore } from "../../components/load-more";
import { MemoList, MemoRow } from "../../components/memo-row";
import { useDebouncedValue } from "../../hooks/use-debounced-value";
import { client } from "../../rpc/client";

export const Route = createFileRoute("/_app/")({
  component: HomePage,
});

const topbar = css({
  alignItems: "center",
  display: "flex",
  gap: "14px",
  px: { base: "18px", md: "32px" },
  pt: { base: "16px", md: "20px" },
});

const newButton = css({
  bg: "accent",
  borderRadius: "9px",
  color: "#fff",
  display: { base: "none", md: "block" },
  fontSize: "12.5px",
  fontWeight: 600,
  ml: "auto",
  px: "14px",
  py: "8px",
  textDecoration: "none",
});

const toolbar = css({
  alignItems: "center",
  display: "flex",
  gap: "8px",
  px: { base: "18px", md: "32px" },
  pt: { base: "10px", md: "14px" },
});

const searchWrap = css({
  alignItems: "center",
  bg: "panel",
  borderColor: "line",
  borderRadius: "999px",
  borderStyle: "solid",
  borderWidth: "1px",
  display: "flex",
  flex: 1,
  gap: "8px",
  h: { base: "44px", md: "auto" },
  px: "14px",
  py: { base: "0", md: "7px" },
  _focusWithin: { borderColor: "accent" },
});

const searchIcon = css({
  color: "faint",
  display: { base: "flex", md: "none" },
  flexShrink: 0,
});

const searchInput = css({
  bg: "panel",
  border: "none",
  color: "ink",
  flex: 1,
  fontFamily: "inherit",
  fontSize: { base: "16px", md: "13px" },
  minWidth: 0,
  outline: "none",
  p: 0,
  _placeholder: { color: "muted" },
});

const clearButton = css({
  alignItems: "center",
  color: "faint",
  display: { base: "flex", md: "none" },
  flexShrink: 0,
  h: "100%",
  justifyContent: "center",
  w: "32px",
});

const resultNote = css({
  color: "faint",
  display: { base: "block", md: "none" },
  fontSize: "11px",
  mt: "10px",
  px: { base: "18px", md: "32px" },
});

const timeline = css({
  flex: 1,
  overflow: "auto",
  pb: { base: "88px", md: "32px" },
  px: { base: "18px", md: "32px" },
  pt: "6px",
});

const fab = css({
  alignItems: "center",
  bg: "accent",
  borderRadius: "999px",
  boxShadow: "0 6px 16px rgba(21, 128, 61, 0.28)",
  color: "#fff",
  display: { base: "flex", md: "none" },
  h: "50px",
  justifyContent: "center",
  position: "fixed",
  right: "18px",
  w: "50px",
  zIndex: 20,
});

function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  // 1文字ごとに API を叩かないよう、入力が止まってから検索する。
  const search = useDebouncedValue(query);

  const list = useInfiniteQuery({
    getNextPageParam: (last: MemoListOutput) => last.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const input: MemoListInput = {};
      if (search.trim() !== "") {
        input.q = search.trim();
      }
      if (pageParam !== undefined) {
        input.cursor = pageParam;
      }
      return await client.memos.list(input);
    },
    queryKey: ["memos", search],
  });

  const items = (list.data?.pages ?? []).flatMap((page) => page.items);

  const renderList = () => {
    if (list.isPending) {
      return null;
    }
    if (items.length === 0) {
      return (
        <EmptyState>
          {search.trim() === ""
            ? "まだメモがありません。新規メモから始めてください。"
            : "見つかりませんでした。"}
        </EmptyState>
      );
    }
    return (
      <MemoList>
        {items.map((memo) => (
          <MemoRow key={memo.id} memo={memo} />
        ))}
      </MemoList>
    );
  };

  const showResultCount =
    search.trim() !== "" && list.isSuccess && !list.hasNextPage;

  return (
    <>
      <div className={topbar}>
        <h1
          className={css({
            fontSize: { base: "17px", md: "19px" },
            fontWeight: 600,
            m: 0,
          })}
        >
          メモ
        </h1>
        <button
          className={newButton}
          onClick={() => void navigate({ to: "/memos/new" })}
          type="button"
        >
          新規メモ
        </button>
      </div>

      <div className={toolbar}>
        <div className={searchWrap}>
          <span className={searchIcon}>
            <Search size={17} />
          </span>
          <input
            aria-label="メモを検索"
            name="q"
            className={searchInput}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            placeholder="検索"
            value={query}
          />
          {query === "" ? null : (
            <button
              aria-label="検索をクリア"
              className={clearButton}
              onClick={() => {
                setQuery("");
              }}
              type="button"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {showResultCount ? (
        <div className={resultNote}>
          「{search.trim()}」の検索結果 {items.length}件
        </div>
      ) : null}

      <div className={timeline}>
        {renderList()}

        {list.hasNextPage ? (
          <LoadMore onClick={() => void list.fetchNextPage()} />
        ) : null}
      </div>

      <Link
        aria-label="新規メモ"
        className={fab}
        style={{ bottom: "calc(76px + env(safe-area-inset-bottom))" }}
        to="/memos/new"
      >
        <Plus size={22} />
      </Link>
    </>
  );
}
