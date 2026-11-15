import {
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { TagId } from "@turf-notes/domain";
import { tagIdOf } from "@turf-notes/domain";
import { css } from "styled-system/css";

import { EmptyState } from "../../../components/empty-state";
import { LoadMore } from "../../../components/load-more";
import { MemoList, MemoRow } from "../../../components/memo-row";
import { MobileHeader } from "../../../components/mobile-header";
import { QueryBoundary } from "../../../components/query-boundary";
import { kindLabels, tagDotOf } from "../../../lib/tag-kind";
import { tagMemosQuery, tagsQuery } from "../../../rpc/queries";

export const Route = createFileRoute("/_app/tags/$tagId")({
  loader: async ({ context, params }) => {
    const id = tagIdOf(params.tagId);
    if (id !== null) {
      try {
        await context.queryClient.infiniteQuery(tagMemosQuery(id));
      } catch {
        // 失敗は画面の境界に任せる（見出しと戻るは出したままにする）。
      }
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

const missing = css({
  fontSize: "13px",
  p: { base: "18px", md: "32px" },
});
const missingLink = css({ color: "accent", textDecoration: "underline" });

/** 数字でない id や、存在しないタグは空の一覧ではなく「見つからない」を出す。 */
const MissingTag = () => {
  const navigate = useNavigate();

  return (
    <>
      <MobileHeader
        onBack={() => void navigate({ to: "/tags" })}
        title="タグ"
      />
      <div className={missing}>
        タグが見つかりません。{" "}
        <Link className={missingLink} to="/tags">
          タグ一覧へ戻る
        </Link>
      </div>
    </>
  );
};

function TagPage() {
  const id = tagIdOf(Route.useParams().tagId);

  if (id === null) {
    return <MissingTag />;
  }

  return (
    <QueryBoundary notFound={<MissingTag />}>
      <TagBody id={id} />
    </QueryBoundary>
  );
}

const TagBody = ({ id }: { id: TagId }) => {
  const navigate = useNavigate();

  // `/_app` の loader が温めている。ここは読むだけ。
  const tags = useSuspenseQuery(tagsQuery);
  const memoList = useSuspenseInfiniteQuery(tagMemosQuery(id));

  const items = memoList.data.pages.flatMap((page) => page.items);
  const tag = tags.data.find((item) => item.id === id);

  if (tag === undefined) {
    return <MissingTag />;
  }

  return (
    <>
      <MobileHeader
        note={`${tag.memoCount}件`}
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
          {tag.name}
        </h1>
        <div className={kindLine}>
          <span className={`${kindDot} ${tagDotOf[tag.kind]}`} />
          {kindLabels[tag.kind]}
        </div>
      </div>
      <div className={timeline}>
        {items.length === 0 ? (
          <EmptyState>このタグのメモはまだありません。</EmptyState>
        ) : (
          <MemoList>
            {items.map((memo) => (
              <MemoRow key={memo.id} memo={memo} />
            ))}
          </MemoList>
        )}
        {memoList.hasNextPage ? (
          <LoadMore onClick={() => void memoList.fetchNextPage()} />
        ) : null}
      </div>
    </>
  );
};
