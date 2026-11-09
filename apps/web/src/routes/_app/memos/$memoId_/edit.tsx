import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { MemoEditor } from "../../../../components/memo-editor";
import { memoQuery } from "../../../../rpc/queries";

// ディレクトリ名末尾の _ は「$memoId の子にしない」エスケープ。外すと詳細ページ配下に入り、
// 詳細ページは Outlet を持たないので編集画面が描画されない。
export const Route = createFileRoute("/_app/memos/$memoId_/edit")({
  // 詳細画面から来る場合は既に温まっている。直接開いたときだけ取りに行く。
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.query(memoQuery(params.memoId));
    } catch {
      // 見つからない・取れないはここで投げず、画面の「メモが見つかりません」に任せる。
    }
  },
  component: EditMemoPage,
});

function EditMemoPage() {
  const { memoId } = Route.useParams();
  const memo = useQuery(memoQuery(memoId));

  if (memo.isPending) {
    return null;
  }

  if (memo.isError) {
    return (
      <div style={{ padding: 32 }}>
        メモが見つかりません。<Link to="/">ホームへ戻る</Link>
      </div>
    );
  }

  return <MemoEditor memo={memo.data} />;
}
