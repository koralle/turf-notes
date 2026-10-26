import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { css } from "styled-system/css";

import { EmptyState } from "../components/empty-state";
import { MemoRow, memoListStyle } from "../components/memo-row";
import { client } from "../rpc/client";

export const Route = createFileRoute("/_app/tags/$tagId")({
  component: TagPage,
});

const head = css({ px: "32px", pt: "20px" });
const timeline = css({ px: "32px", py: "10px" });

function TagPage() {
  const { tagId } = Route.useParams();
  const id = Number(tagId);

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
      <div className={head}>
        <div
          className={css({
            color: "faint",
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
