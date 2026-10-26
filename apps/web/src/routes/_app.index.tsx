import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type {
  MemoListInput,
  MemoListOutput,
} from "@turf-notes/api-contract/schemas";
import { useState } from "react";
import { css } from "styled-system/css";

import { EmptyState } from "../components/empty-state";
import { MemoRow, memoListStyle } from "../components/memo-row";
import { client } from "../rpc/client";

export const Route = createFileRoute("/_app/")({
  component: HomePage,
});

const topbar = css({
  alignItems: "center",
  display: "flex",
  gap: "14px",
  px: "32px",
  pt: "20px",
});

const newButton = css({
  bg: "accent",
  borderRadius: "9px",
  color: "#fff",
  fontSize: "12.5px",
  fontWeight: 600,
  ml: "auto",
  px: "14px",
  py: "8px",
  textDecoration: "none",
});

const composer = css({
  alignItems: "center",
  bg: "panel",
  borderColor: "line",
  borderRadius: "9px",
  borderStyle: "solid",
  borderWidth: "1px",
  display: "flex",
  gap: "10px",
  mx: "32px",
  mt: "16px",
  p: "10px 12px 10px 14px",
});

const composerInput = css({
  border: "none",
  flex: 1,
  fontFamily: "inherit",
  fontSize: "13.5px",
  outline: "none",
  _placeholder: { color: "faint" },
});

const saveButton = css({
  bg: "accentWeak",
  border: "none",
  borderRadius: "6px",
  color: "accent",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 600,
  px: "12px",
  py: "6px",
});

const toolbar = css({
  alignItems: "center",
  display: "flex",
  gap: "8px",
  px: "32px",
  pt: "14px",
});

const searchInput = css({
  bg: "panel",
  borderColor: "line",
  borderRadius: "999px",
  borderStyle: "solid",
  borderWidth: "1px",
  flex: 1,
  fontFamily: "inherit",
  fontSize: "13px",
  p: "7px 14px",
});

const timeline = css({
  flex: 1,
  overflow: "auto",
  pb: "32px",
  px: "32px",
  pt: "6px",
});

function HomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");

  const list = useInfiniteQuery({
    getNextPageParam: (last: MemoListOutput) => last.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const input: MemoListInput = {};
      if (query.trim() !== "") {
        input.q = query.trim();
      }
      if (pageParam !== undefined) {
        input.cursor = pageParam;
      }
      return await client.memos.list(input);
    },
    queryKey: ["memos", query],
  });

  const create = useMutation({
    mutationFn: async () => await client.memos.create({ body: draft.trim() }),
    onSuccess: async () => {
      setDraft("");
      await queryClient.invalidateQueries({ queryKey: ["memos"] });
    },
  });

  const items = (list.data?.pages ?? []).flatMap((page) => page.items);

  const submitDraft = () => {
    if (draft.trim() !== "" && !create.isPending) {
      create.mutate();
    }
  };

  const renderList = () => {
    if (list.isPending) {
      return null;
    }
    if (items.length === 0) {
      return (
        <EmptyState>
          まだメモがありません。上の欄に書くか「新規メモ」から始めてください。
        </EmptyState>
      );
    }
    return (
      <div className={memoListStyle}>
        {items.map((memo) => (
          <MemoRow key={memo.id} memo={memo} />
        ))}
      </div>
    );
  };

  return (
    <>
      <div className={topbar}>
        <h1 className={css({ fontSize: "19px", fontWeight: 600, m: 0 })}>
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

      <div className={composer}>
        <input
          className={composerInput}
          onChange={(event) => {
            setDraft(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              submitDraft();
            }
          }}
          placeholder="思いついたことを書く…"
          value={draft}
        />
        <button className={saveButton} onClick={submitDraft} type="button">
          保存
        </button>
      </div>

      <div className={toolbar}>
        <input
          className={searchInput}
          onChange={(event) => {
            setQuery(event.target.value);
          }}
          placeholder="検索"
          value={query}
        />
      </div>

      <div className={timeline}>
        {renderList()}

        {list.hasNextPage ? (
          <button
            className={css({
              bg: "panel",
              borderColor: "line",
              borderRadius: "8px",
              borderStyle: "solid",
              borderWidth: "1px",
              cursor: "pointer",
              fontSize: "12px",
              mt: "16px",
              p: "8px 14px",
              w: "100%",
            })}
            onClick={() => void list.fetchNextPage()}
            type="button"
          >
            もっと見る
          </button>
        ) : null}
      </div>
    </>
  );
}
