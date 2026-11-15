# 画面の読み取りは Suspense で書き、待ちと失敗は画面ごとの境界に任せる

`apps/web` の読み取りを `useSuspenseQuery` / `useSuspenseInfiniteQuery` にし、`@suspensive/react` の `<ErrorBoundary>` と `<Suspense>` を組にした `QueryBoundary`（`src/components/query-boundary.tsx`）を画面に置く。

- 待ち: 境界の中の読み取りは、取得が終わるまで fallback（`Loading`）を出す。loader が温めていれば待たない。
- 失敗: 失敗した取得は境界が受け、`LoadFailed`（「読み込みに失敗しました」＋もう一度読み込む）を出す。再試行は `queryClient.resetQueries({ predicate: エラーのクエリ })` で失敗した取得を未取得に戻す。既定の `retryOnMount: false`（ADR-0004）があるので、戻さないと mount では取り直さない。
- 無い: `memo-not-found` / `tag-not-found` は失敗ではなく「見つかりません」を出す（`QueryBoundary` の `notFound`）。oRPC のコードを見て決めるので、画面は例外の形を気にしない。
- loader は取得を温めるだけで、失敗を投げない（`try { ... } catch {}`）。失敗は画面の境界が扱うので、再試行がページ全体の読み直しにならない。

待ちと失敗を境界に移したので、画面から `isPending` / `isError` の分岐と `data` の undefined チェックが消える。

## Suspense にしない読み取り

- **レイアウト（サイドバーのタグ）**: 失敗しても空のサイドバーで開く。境界を置くと、タグが取れないだけで全画面が失敗表示になる。
- **設定画面の各セクション**: アカウント・パスキー・パスワードは独立していて、片方が取れなくても他は描ける。
- **編集画面の参照検索**: 入力に追従する検索なので、1文字ごとに画面を待たせない。

これらは `useQuery` のまま。

## `skipToken` と組み合わせない

`skipToken` で「問い合わせない」を表す読み取りは Suspense と組み合わせない。取得が始まらないので、境界は永久に待つ。URL の妥当性は境界の外で先に見て、不正なら問い合わせない画面（「見つかりません」や空の一覧）を出す。この理由で、タグページとレースページの `skipToken` は消え、`tagMemosQuery` / `raceMemosQuery` は妥当な ID だけを受ける。

## SSR では境界が働かない

React の server renderer はレンダー中の例外でエラー境界を実行せず、その場でサーバー側の描画を打ち切る。つまり **失敗した画面の HTML は返らない**（ブラウザがクライアント描画に切り替える。`react-dom/server` の `renderToString` でも同じ）。ADR-0005 の「SSR を既定にする」は取得に成功した画面の話で、失敗した画面はクライアントが描く。

そのため、SSR 中に失敗したクエリはクライアントへ渡さない（`setupRouterSsrQueryIntegration` の `dehydrateOptions.shouldDehydrateQuery` を `success` だけにした）。渡すと、直列化で `code` が落ちて「見つかりません」と「読み込みに失敗」を区別できなくなる。代わりにクライアントが同じ取得をやり直すので、一時的な障害ならそこで戻る。

## Considered Options

- **`useQuery` のまま、画面ごとに pending / error を分岐する（変更前）**: 取得は画面の都合で書き分けられ、「読み込みに失敗しました」が画面ごとに3通りに実装されていた。loader が失敗を飲んだ画面では、同じ失敗が空白として現れる。
- **TanStack Query の suspense フックと、自前の `<Suspense>` / ErrorBoundary**: 境界そのものは 30 行で書けるが、fallback に reset を渡す配線と、fallback の中で error を読む口を自前で持つことになる。`@suspensive/react` の `ErrorBoundary` は fallback を静的な要素として渡し、その中で `useErrorBoundaryFallbackProps()` から error と reset を読める（fallback を描画中に定義しなくてよい）。
- **`QueryErrorResetBoundary` と `useQueryErrorResetBoundary` の reset で再試行する**: TanStack Query の想定経路だが、`reset()` は「境界が reset された」というフラグを立てるだけでクエリの状態は戻さない。取り直しは `retryOnMount` に頼るので、`retryOnMount: false` を既定にしているこのアプリでは何も起きない（実際に試すと、エラーを持ったままの結果が描画された）。
- **`@suspensive/react-query` も入れる（`SuspenseQuery` / `Mutation`）**: `SuspenseQuery` は render props で query を JSX に埋める形になり、oRPC の queryOptions と `skipToken`、画面ごとの `staleTime` の置き場所が二重になる。Suspensive 自身もフックは TanStack Query から取るよう案内しているので、`@suspensive/react` だけを入れる。
- **境界を `_app` の layout に 1 つだけ置く**: 画面の失敗がすべて同じ表示になり、検索欄やヘッダーまで巻き込む。「どの画面のどこが取れなかったか」を出せない。
- **loader の失敗を router の `defaultErrorComponent` に任せ続ける**: 再試行がページ全体の再読み込みになり、失敗した取得だけをやり直せない。`defaultErrorComponent` は beforeLoad（サインイン判定）の失敗に対する最後の受け皿として残す。
- **`keepPreviousData` を使わず、検索語ごとに境界を待たせる**: 検索欄は境界の外にあるのでフォーカスは残るが、1文字ごとに一覧が消えて fallback に変わる。

## Consequences

- 画面のデータは取得済みとして扱える。`data` の undefined 分岐と `?? []` が消える。
- 読み取りを足すときは `QueryBoundary` の中に置く。妥当性の検証が要る読み取りは、境界の外で検証してから内側のコンポーネントに渡す（そうしないと `skipToken` で永久に待つ）。
- 失敗した画面は SSR では描けず、クライアントが描く（上の節）。成功した画面の SSR は変わらない。
- `retryOnMount: false` は変えない。loader が失敗を飲んだあと、mount で同じ取得を繰り返さないため（ADR-0004）。再試行は境界の reset だけが行う。
- タイムラインの検索は `keepPreviousData` で前の結果を出したままにする。前の結果を出している間は、件数を出さず（`hasNextPage` で見分ける）、「もっと見る」も出さない（古いページを基準に続きを取らないため。`isFetching` で見分ける）。
- 「見つかりません」は境界の `notFound` に ReactNode として渡す。エンティティが増えたら `errorCode` の集合（`src/rpc/client.ts` の `isMissing`）も増やす。
- 認証切れの退出は境界ではなく `queryCache.onError` が持つ（ADR-0005）。期限切れで 401 が返っても「読み込みに失敗しました」は出さない。
- `docs/adr/0004-router-warms-query-cache.md` の「`useSuspenseQuery` は採らない」はこの決定で覆した。
