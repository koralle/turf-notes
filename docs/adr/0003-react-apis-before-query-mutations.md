# サーバー状態の変更だけを TanStack Query に任せ、それ以外は React の公式 API を使う

React 19 の公式 API（`useTransition` / `useOptimistic` / `useActionState`）には、mutation の結果を保持する場所が無い。`useMutation` を外すと、保留状態・エラー・キャッシュの再取得を画面ごとに手で持つことになり、読み取り側に残る `useQuery` の `queryClient` 依存も消えない。そこで、責務を次のように分ける。

- サーバーの状態を変える操作（作成・更新・削除・設定変更）は `useMutation` とし、成功時は `queryClient` を無効化する。
- サーバーの状態を変えない非同期処理（JSON エクスポートなど）は mutation にしない。保留状態は `useTransition` で持つ。
- 画面の見え方（確定前の行など）は `useOptimistic` に任せ、キャッシュには仮のデータを入れない。

## Considered Options

- **全部 React の公式 API にする**: mutation ごとに `useState` と `useTransition` を組み、`invalidateQueries` を自分で呼ぶ。行数は減らず、8 箇所で同じ状態機械が重複する。
- **読み取りも Router の loader に移す**: `@tanstack/react-query` を依存から消せて一貫するが、読み取り側の移行（SSR・preload・params 連動）が別途必要で、mutation 側の利益は小さい。取得の置き場所は `docs/adr/0004-router-warms-query-cache.md` で決め直した（loader で温め、画面は `useQuery` で読む）。
- **現状のまま**: サーバー状態を変えないエクスポートまで mutation 扱いになり、mutation という言葉の意味が濁る。

## Consequences

- mutation のエラーは `.error` から導出し、`useState` に写さない（表示の二重管理をしない）。Better Auth のように失敗を返り値で返す API は、`mutationFn` の中で例外に揃える。
- `useOptimistic` の仮データは操作が終わるまでだけ有効で、終わったらサーバーのデータで置き換わる。仮の id は確定するまでリンク先を持たない。
- 読み取りを loader に移して `@tanstack/react-query` を外す判断をしたとき、この分担は見直す。
