# 画面の読み取りは Suspense で書き、待ちは画面ごとに、失敗は route の境界に任せる

`apps/web` の読み取りを `useSuspenseQuery` / `useSuspenseInfiniteQuery` にする。待ちと失敗の受け皿は、**読み取りが始まる前か後か**で分ける。

- **loader が読むもの**（画面を出すのに要る本体のデータ）: loader が温め、失敗したら例外を投げる。route の `errorComponent`（`ReadError`）が受ける。React の server renderer はレンダー中の例外でエラー境界を実行しないが、router は `match.status === "error"` のときに `errorComponent` を**サーバーで描く**（`Match.js`）。つまり失敗した画面も SSR の HTML に入る。再試行は `router.invalidate()` で loader をやり直す（ページは読み直さない）。
- **画面が組まれたあとの読むもの**（検索語ごとの取得、layout が温めたタグ）: `@suspensive/react` の `ErrorBoundary` + `Suspense` を組にした `QueryBoundary`（`src/components/query-boundary.tsx`）が受ける。再試行は失敗したクエリを未取得に戻して取り直す。
- **無い**: `memo-not-found` は失敗ではないので、loader が `{ missing: true }` を data として返し、画面が「見つかりません」を出す。エラーを error として投げ回すと、クライアントへ直列化される過程で `code` が落ち、ハイドレート後に「読み込みに失敗しました」へ化ける（実際に確認した）。タグは一覧を読んで `tag === undefined` で判定する。
- **URL の妥当性**は境界の外で先に見る。uuid でない memo id は問い合わせずに「見つかりません」を出す（API の入力不正を再試行しても永久に失敗するため）。

待ちと失敗を境界に移したので、画面から `isPending` / `isError` の分岐と `data` の undefined チェックが消える。

## Suspense にしない読み取り

- **レイアウト（サイドバーのタグ）**: 失敗しても空のサイドバーで開く。境界を置くと、タグが取れないだけで全画面が失敗表示になる。
- **設定画面の各セクション**: アカウント・パスキー・パスワードは独立していて、片方が取れなくても他は描ける。
- **編集画面の参照検索**: 入力に追従する検索なので、1文字ごとに画面を待たせない。

これらは `useQuery` のまま。

## `skipToken` と組み合わせない

`skipToken` で「問い合わせない」を表す読み取りは Suspense と組み合わせない。取得が始まらないので、境界は永久に待つ。URL の妥当性は先に見て、不正なら問い合わせない画面（「見つかりません」や空の一覧）を出す。この理由で、タグページとレースページの `skipToken` は消え、`tagMemosQuery` / `raceMemosQuery` は妥当な ID だけを受ける。

## 検索で前の結果を残さない

`keepPreviousData` は使わない。前の結果を出している間は検索語だけが新しくなり、件数と行が食い違う。その状態を見分ける `isPlaceholderData` は suspense フックの型に出てこないので、`isFetching` のような別の信号で代用することになり、実態と合わない条件が増える。検索語が変わったら一覧は「読み込み中…」に戻す（検索欄は境界の外なのでフォーカスは残る）。

## Considered Options

- **`useQuery` のまま、画面ごとに pending / error を分岐する（変更前）**: 取得は画面の都合で書き分けられ、「読み込みに失敗しました」が画面ごとに3通りに実装されていた。loader が失敗を飲んだ画面では、同じ失敗が空白として現れる。
- **loader で失敗を飲み、すべて `QueryBoundary` に任せる**: 画面の見た目は揃うが、React の server renderer はエラー境界を実行しないので、失敗した画面の SSR HTML が空になる（`renderToString` でも同じ）。ブックマークから開いた削除済みメモが、JS が動くまで真っ白になる。
- **TanStack Query の suspense フックと、自前の `<Suspense>` / ErrorBoundary**: 境界そのものは 30 行で書けるが、fallback に reset を渡す配線と、fallback の中で error を読む口を自前で持つことになる。`@suspensive/react` の `ErrorBoundary` は fallback を静的な要素として渡し、その中で `useErrorBoundaryFallbackProps()` から reset を読める（fallback を描画中に定義しなくてよい）。
- **`QueryErrorResetBoundary` と `useQueryErrorResetBoundary` の reset で再試行する**: TanStack Query の想定経路だが、`reset()` は「境界が reset された」というフラグを立てるだけでクエリの状態は戻さない。取り直しは `retryOnMount` に頼るので、`retryOnMount: false` を既定にしているこのアプリでは何も起きない（実際に試すと、エラーを持ったままの結果が描画された）。
- **`@suspensive/react-query` も入れる（`SuspenseQuery` / `Mutation`）**: `SuspenseQuery` は render props で query を JSX に埋める形になり、oRPC の queryOptions と `skipToken`、画面ごとの `staleTime` の置き場所が二重になる。Suspensive 自身もフックは TanStack Query から取るよう案内しているので、`@suspensive/react` だけを入れる。
- **失敗したクエリをクライアントへ渡す**: 直列化で `code` が落ちるので、「見つかりません」と「読み込みに失敗」を区別できなくなる。`dehydrateOptions.shouldDehydrateQuery` を success だけにして、クライアントが取り直す（一時的な障害ならそこで戻る）。
- **境界を `_app` の layout に 1 つだけ置く**: 画面の失敗がすべて同じ表示になり、検索欄やヘッダーまで巻き込む。「どの画面のどこが取れなかったか」を出せない。
- **route の `errorComponent` で `reset` を使う**: サーバー側では `reset` が `undefined` で渡る（`Match.js`）。クライアントでも「エラー状態を消す」以上のことをしないので、`router.invalidate()` で loader ごとやり直す。
- **`keepPreviousData` を使わず、検索語ごとに境界を待たせる**: こちらを採った（上の節）。

## Consequences

- 画面のデータは取得済みとして扱える。`data` の undefined 分岐と `?? []` が消える。
- 読み取りを足すときは、画面の本体なら loader で温めて `errorComponent: ReadError` を付け、mount 後に増える読み取りなら `QueryBoundary` の中に置く。
- `retryOnMount: false` は変えない。mount で同じ取得を繰り返さないため（ADR-0004）。
- loader が投げたエラーはクライアントへ直列化され、`code` が落ちる。`code` で分岐する表示（「無い」）は loader の data で返す。分岐しない表示（「読み込みに失敗しました」）は errorComponent でよい。
- 失敗した画面の見出し・戻るボタンは出ない（route の component が組まれないため）。「無い」は `MissingMemo` がホームへのリンクを持つ。それ以外はブラウザの戻る／シェルのナビゲーションを使う。
- 認証切れの退出は境界ではなく `queryCache.onError` が持つ（ADR-0005）。期限切れで 401 が返っても「読み込みに失敗しました」は出さない。
- `docs/adr/0004-router-warms-query-cache.md` の「`useSuspenseQuery` は採らない」はこの決定で覆した。
