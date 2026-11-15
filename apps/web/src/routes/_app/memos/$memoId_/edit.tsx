import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { MemoEditor } from "../../../../components/memo-editor";
import { QueryBoundary } from "../../../../components/query-boundary";
import { MissingMemo } from "../../../../components/query-fallbacks";
import { memoQuery } from "../../../../rpc/queries";

// ディレクトリ名末尾の _ は「$memoId の子にしない」エスケープ。外すと詳細ページ配下に入り、
// 詳細ページは Outlet を持たないので編集画面が描画されない。
export const Route = createFileRoute("/_app/memos/$memoId_/edit")({
  // 詳細画面から来る場合は既に温まっている。直接開いたときだけ取りに行く。
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.query(memoQuery(params.memoId));
    } catch {
      // 見つからない・取れないはここで投げず、画面の境界に任せる。
    }
  },
  component: EditMemoPage,
});

function EditMemoPage() {
  const { memoId } = Route.useParams();

  return (
    <QueryBoundary notFound={<MissingMemo />}>
      <EditForm memoId={memoId} />
    </QueryBoundary>
  );
}

const EditForm = ({ memoId }: { memoId: string }) => {
  const memo = useSuspenseQuery(memoQuery(memoId));

  return <MemoEditor memo={memo.data} />;
};
