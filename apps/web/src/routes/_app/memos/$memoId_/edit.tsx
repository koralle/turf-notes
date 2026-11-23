import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { memoIdOf } from "@turf-notes/domain";

import { MemoEditor } from "../../../../components/memo-editor";
import { MissingMemo, ReadError } from "../../../../components/query-fallbacks";
import { isMissing } from "../../../../rpc/client";
import { memoQuery } from "../../../../rpc/queries";

// ディレクトリ名末尾の _ は「$memoId の子にしない」エスケープ。外すと詳細ページ配下に入り、
// 詳細ページは Outlet を持たないので編集画面が描画されない。
export const Route = createFileRoute("/_app/memos/$memoId_/edit")({
  // 詳細画面から来る場合は既に温まっている。直接開いたときだけ取りに行く。
  loader: async ({ context, params }) => {
    const id = memoIdOf(params.memoId);

    if (id === null) {
      return { missing: true };
    }

    try {
      await context.queryClient.query(memoQuery(id));
    } catch (error) {
      if (isMissing(error)) {
        return { missing: true };
      }

      throw error;
    }

    return { missing: false };
  },
  errorComponent: ReadError,
  component: EditMemoPage,
});

function EditMemoPage() {
  const { missing } = Route.useLoaderData();
  const { memoId } = Route.useParams();

  if (missing) {
    return <MissingMemo />;
  }

  return <EditForm memoId={memoId} />;
}

const EditForm = ({ memoId }: { memoId: string }) => {
  const memo = useSuspenseQuery(memoQuery(memoId));

  return <MemoEditor memo={memo.data} />;
};
