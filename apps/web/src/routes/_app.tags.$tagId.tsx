import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { TagKind } from "@turf-notes/api-contract/schemas";
import { css } from "styled-system/css";

import { EmptyState } from "../components/empty-state";
import { MemoRow, memoListStyle } from "../components/memo-row";
import { MobileHeader } from "../components/mobile-header";
import { client } from "../rpc/client";

export const Route = createFileRoute("/_app/tags/$tagId")({
  component: TagPage,
});

const KIND_LABEL: Record<TagKind, string> = {
  horse: "馬",
  person: "人",
  theme: "主題",
};

const dotOf = {
  horse: css({ bg: "horse" }),
  person: css({ bg: "person" }),
  theme: css({ bg: "theme" }),
} as const;

const head = css({
  px: { base: "18px", md: "32px" },
  pt: { base: "12px", md: "20px" },
});
const timeline = css({
  pb: { base: "calc(24px + env(safe-area-inset-bottom))", md: "10px" },
  pt: { base: "4px", md: "10px" },
  px: { base: "18px", md: "32px" },
});

const kindLine = css({
  alignItems: "center",
  color: "muted",
  display: { base: "flex", md: "none" },
  fontSize: "11.5px",
  gap: "6px",
  mt: "6px",
});

const kindDot = css({ borderRadius: "999px", h: "6px", w: "6px" });

function TagPage() {
  const { tagId } = Route.useParams();
  const id = Number(tagId);
  const navigate = useNavigate();

  const tags = useQuery({
    queryFn: async () => await client.tags.list(),
    queryKey: ["tags"],
  });
  const memoList = useQuery({
    queryFn: async () => await client.memos.list({ tagIds: [id] }),
    queryKey: ["memos", "tag", id],
  });

  const tag = (tags.data ?? []).find((item) => item.id === id);

  return (
    <>
      <MobileHeader
        note={tag === undefined ? undefined : `${tag.memoCount}件`}
        onBack={() => void navigate({ to: "/tags" })}
        title="タグ"
      />
      <div className={head}>
        <div
          className={css({
            color: "faint",
            display: { base: "none", md: "block" },
            fontSize: "11px",
            letterSpacing: "0.08em",
          })}
        >
          タグ
        </div>
        <h1
          className={css({
            fontSize: "19px",
            fontWeight: 600,
            m: 0,
            mt: "4px",
          })}
        >
          {tag?.name ?? "…"}
        </h1>
        {tag === undefined ? null : (
          <div className={kindLine}>
            <span className={`${kindDot} ${dotOf[tag.kind]}`} />
            {KIND_LABEL[tag.kind]}
          </div>
        )}
      </div>
      <div className={timeline}>
        {(memoList.data?.items ?? []).length === 0 ? (
          <EmptyState>このタグのメモはまだありません。</EmptyState>
        ) : (
          <div className={memoListStyle}>
            {(memoList.data?.items ?? []).map((memo) => (
              <MemoRow key={memo.id} memo={memo} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
