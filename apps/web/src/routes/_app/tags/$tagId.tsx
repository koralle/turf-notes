import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { tagIdOf } from "@turf-notes/domain";
import { css } from "styled-system/css";

import { EmptyState } from "../../../components/empty-state";
import { LoadMore } from "../../../components/load-more";
import { MemoList, MemoRow } from "../../../components/memo-row";
import { MobileHeader } from "../../../components/mobile-header";
import { kindLabels, tagDotOf } from "../../../lib/tag-kind";
import { tagMemosQuery, tagsQuery } from "../../../rpc/queries";

export const Route = createFileRoute("/_app/tags/$tagId")({
  loader: async ({ context, params }) => {
    const id = tagIdOf(params.tagId);
    if (id !== null) {
      await context.queryClient.infiniteQuery(tagMemosQuery(id));
    }
  },
  component: TagPage,
});

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
  const id = tagIdOf(tagId);
  const navigate = useNavigate();

  // `/_app` の loader が温めている。ここは読むだけ。
  const tags = useQuery(tagsQuery);
  const memoList = useInfiniteQuery(tagMemosQuery(id));

  const items = (memoList.data?.pages ?? []).flatMap((page) => page.items);

  const tag = (tags.data ?? []).find((item) => item.id === id);

  // 数字でない id や、存在しないタグは空の一覧ではなく「見つからない」を出す。
  if (id === null || (tags.isSuccess && tag === undefined)) {
    return (
      <>
        <MobileHeader
          onBack={() => void navigate({ to: "/tags" })}
          title="タグ"
        />
        <div
          className={css({ fontSize: "13px", p: { base: "18px", md: "32px" } })}
        >
          タグが見つかりません。{" "}
          <Link
            className={css({ color: "accent", textDecoration: "underline" })}
            to="/tags"
          >
            タグ一覧へ戻る
          </Link>
        </div>
      </>
    );
  }

  const renderList = () => {
    if (memoList.isPending) {
      return null;
    }
    if (items.length === 0) {
      return <EmptyState>このタグのメモはまだありません。</EmptyState>;
    }
    return (
      <>
        <MemoList>
          {items.map((memo) => (
            <MemoRow key={memo.id} memo={memo} />
          ))}
        </MemoList>
        {memoList.hasNextPage ? (
          <LoadMore onClick={() => void memoList.fetchNextPage()} />
        ) : null}
      </>
    );
  };

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
            <span className={`${kindDot} ${tagDotOf[tag.kind]}`} />
            {kindLabels[tag.kind]}
          </div>
        )}
      </div>
      <div className={timeline}>{renderList()}</div>
    </>
  );
}
