# 読み取りは route の loader で温め、画面は `useQuery` / `useInfiniteQuery` で読む

`apps/web` のデータ取得を「どう取るか」と「どこに置くか」で分ける。

- **温める**: route の `loader` / `beforeLoad` が `queryClient.query()` / `queryClient.infiniteQuery()` を呼び、Query のキャッシュを埋める。`defaultPreload: "intent"` なので、リンクを hover した時点で次の画面の分が取りに行かれる。
- **読む**: 画面は同じ定義を `useQuery` / `useInfiniteQuery` に渡すだけ。取得の開始もキーの組み立ても画面には書かない。

取得の定義（`queryKey`・`queryFn`・`staleTime`）は `src/rpc/queries.ts` に置き、`@orpc/react-query` の `createORPCReactQueryUtils(client)` で作る。キーと取得関数は contract のパスから生成されるので（`[['memos','detail'], { input, type }]`）、

- `invalidateQueries({ queryKey: orpc.memos.key() })` で `memos` 配下（list / tag / race / detail）がまとめて無効化される。手で階層を保守しなくてよい。
- `skipToken` で「問い合わせない」を表せる。URL の `tagId` が数値でない、レースの3つ組が不正、検索語が空、といった条件で `enabled` と番号のダミー値を組み合わせる必要がない。
- キーに `type: 'infinite' | 'query'` が入るので、タイムライン（無限）と参照検索（単発）が同じ `memos.list` と同じ input を使っても衝突しない。

loader と画面が同じ `staleTime` を見るので、温めた直後に画面が取り直すことはない（ADR-0003 の mutation の分担はそのまま）。

サインインの判定は画面コンポーネントではなく `/_app` の `beforeLoad` に置く。`me` を warm して失敗したら `/sign-in` へ `redirect` するので、未サインインのまま子の loader が走ることはない。

## なぜ SSR しないか

> 更新: この節の判断は ADR-0005 で覆した（全画面 SSR が既定）。下記は `ssr: false` にした時点の理由。

`/_app` は `ssr: false` にした。ブラウザからの `/rpc` は `src/server.ts` が Service Binding で `apps/api` へ流すが、**Worker の中から同じ URL を fetch することはできない**（本番は自ゾーンへの fetch が禁止、開発も `localhost:3000` は Worker の外）。つまり SSR 中に loader を走らせると API に届かない。

`ssr: true` にするなら、サーバー側専用の oRPC クライアント（`env.API.fetch` を transport にし、`getRequestHeaders()` で cookie を渡す）を足すことになる。サインイン必須の画面は現状どれも SSR する中身を持たないため、そこまではしない。SSR したくなったときの追加はこの1点で済む。

## Considered Options

- **画面ごとに `useQuery` を書き、loader は使わない（変更前）**: 取得は画面に散らばり、遷移のたびに取りに行く。preload は空回りし、SSR する中身も無い。
- **loader だけにして `useQuery` をやめる**: `@tanstack/react-query` を依存から消せるが、無限スクロールの `fetchNextPage`、mutation 後の `invalidateQueries`、パスキー（Better Auth のクライアント関数）の取得を作り直すことになる。ADR-0003 の分担も崩れる。
- **`@orpc/tanstack-query` / `@orpc/react-query` を入れず、`queryOptions` を手で書く**: 依存は1つ減るが、キーの階層・`input` の直列化・無限クエリと単発クエリの区別を自前で保守することになる。実際に手で書いた版では、参照検索を `["memos","ref",q]` という別の名前空間に逃がして衝突を避け、不正な `tagId` を `0` で埋めて `enabled: false` を重ねていた。`@orpc/react-query` は `@orpc/tanstack-query` の React 層で、この3つ（パス由来のキー・`skipToken`・`type` による区別）がそのまま解決される。React 用の context ヘルパーはクライアントがモジュール定数なので使わない。
- **loader で `staleTime: "static"` を付ける**: 古いキャッシュでも待たずに返るので遷移は速いが、`isStaleByTime("static")` は `isInvalidated` より先に false を返す。保存直後に詳細が古いまま描画されるため採らない。鮮度は各定義の `staleTime`（30秒。`me` は無期限）に任せる。
- **`useSuspenseQuery` で読む**: loader が待つので pending 分岐は消せるが、Suspense 境界とエラー境界を全画面に置く必要がある。今回は `useQuery` のまま、pending/error の分岐を残す。

## Consequences

- route を足すときは「`src/rpc/queries.ts` に `orpc.x.y.queryOptions()` を足す → `loader` で温める → 画面で読む」の3手になる。画面に `queryKey` や `queryFn` を書かない。
- キーは contract の手続き名で決まる。手続きを改名・移動するとキャッシュも別物になる（画面のコードは oRPC の型で壊れるので気づける）。
- `queryClient.query()` は `ensureQueryData` の後継（`fetchQuery` / `prefetchQuery` / `ensureQueryData` は非推奨）。`staleTime: "static"` を渡さない限り、期限切れなら取り直してから返る。
- `retryOnMount: false` を既定にした。loader がエラーを飲んだとき（メモ不在など）、データ無しのエラークエリは既定では mount で再試行され、同じ 404 が2本飛ぶ。`refetchOnMount` では止まらない（データがあるときしか見られない）。
- セッションが画面を開いている間に切れた場合、`beforeLoad` は再実行されない。Query の `queryCache.onError` が `UNAUTHORIZED` を見て router でサインインへ移し、離れたあとにキャッシュを捨てる（ページ全体の読み直しはしないので、編集中の未保存ガードが効く）。
- 削除は無効化ではなく `removeQueries` でメモのキャッシュを捨てる。無効化だと削除済みメモの詳細を取り直して 404 になるため。
- loader が失敗すると router のエラー画面になる。自前の「見つかりません」表示を持つ画面（メモ詳細・編集）の loader は、その表示を出すために例外を飲んでいる。新しい画面で同じことをするときは同じ形にする。
- サインイン画面は `ssr` の対象のままだが、`auth.methods` は `useQuery`（サーバーでは実行されない）で読む。loader を足すと SSR 中に `/rpc` を叩いて落ちるので足さない。
