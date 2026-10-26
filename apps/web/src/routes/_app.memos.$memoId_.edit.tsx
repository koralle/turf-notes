import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { MemoEditor } from "../components/memo-editor";
import { client } from "../rpc/client";

export const Route = createFileRoute("/_app/memos/$memoId_/edit")({
  component: EditMemoPage,
});

function EditMemoPage() {
  const { memoId } = Route.useParams();
  const memo = useQuery({
    queryFn: async () => await client.memos.detail({ id: memoId }),
    queryKey: ["memo", memoId],
  });

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
