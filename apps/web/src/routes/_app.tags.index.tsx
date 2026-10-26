import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { TagKind } from "@turf-notes/api-contract/schemas";
import { css } from "styled-system/css";

import { EmptyState } from "../components/empty-state";
import { client } from "../rpc/client";

export const Route = createFileRoute("/_app/tags/")({
  component: TagsPage,
});

const KINDS = ["horse", "person", "theme"] as const;

const KIND_LABEL: Record<TagKind, string> = {
  horse: "馬",
  person: "人",
  theme: "主題",
};

const wrap = css({
  maxW: "720px",
  pb: "32px",
  pt: { base: "16px", md: "20px" },
  px: { base: "18px", md: "32px" },
  w: "100%",
});

const title = css({
  fontSize: { base: "17px", md: "19px" },
  fontWeight: 600,
  m: 0,
});

const group = css({ mt: "16px" });

const groupLabel = css({
  color: "faint",
  fontSize: "10.5px",
  letterSpacing: "0.09em",
  mb: "2px",
  pl: "2px",
});

const row = css({
  alignItems: "center",
  borderBottomColor: "line",
  borderBottomStyle: "solid",
  borderBottomWidth: "1px",
  color: "ink",
  display: "flex",
  fontSize: "14px",
  gap: "9px",
  minH: "46px",
  textDecoration: "none",
});

const dot = css({
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

const name = css({
  flex: 1,
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

const count = css({
  color: "faint",
  fontSize: "12px",
  fontVariantNumeric: "tabular-nums",
});

function TagsPage() {
  const tags = useQuery({
    queryFn: async () => await client.tags.list(),
    queryKey: ["tags"],
    staleTime: 30_000,
  });

  if (tags.isPending || tags.isError) {
    return null;
  }

  const all = tags.data ?? [];

  return (
    <div className={wrap}>
      <h1 className={title}>タグ</h1>
      {all.length === 0 ? (
        <EmptyState>
          タグはまだありません。メモを作るときにタグを付けられます。
        </EmptyState>
      ) : (
        KINDS.map((kind) => {
          const groupTags = all.filter((tag) => tag.kind === kind);
          if (groupTags.length === 0) {
            return null;
          }
          return (
            <section className={group} key={kind}>
              <h2 className={groupLabel}>{KIND_LABEL[kind]}</h2>
              {groupTags.map((tag) => (
                <Link
                  className={row}
                  key={tag.id}
                  params={{ tagId: String(tag.id) }}
                  to="/tags/$tagId"
                >
                  <span className={`${dot} ${dotOf[kind]}`} />
                  <span className={name}>{tag.name}</span>
                  <span className={count}>{tag.memoCount}</span>
                </Link>
              ))}
            </section>
          );
        })
      )}
    </div>
  );
}
