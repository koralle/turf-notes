# 全画面 SSR を既定にする

すべての route をサーバーで描く（TanStack Router の既定 = `ssr: true`）。`/_app` に付けていた `ssr: false` は外した。SSR を止める指定はどこにも置かない。

SSR 中の `/rpc` は、ブラウザと同じ URL を叩かず、`src/server.ts` がブラウザからのリクエストを流しているのと同じ Service Binding（`env.API`）で API Worker を直接呼ぶ。

- `src/rpc/client.ts` の `RPCLink` が環境で `fetch` を切り替える。ブラウザは `fetch`、SSR 中は `env.API.fetch`。
- 受け取ったリクエストの `cookie` を転送する。これが無いと、サインイン済みでも `requireAuth` が 401 を返し、`/_app` の `beforeLoad` が全ページを `/sign-in` へ飛ばす。
- Service Binding に渡す URL の host は使われないので `https://turf-notes-api` を置いている。
- `cloudflare:workers` と `@tanstack/react-start/server` は `createServerOnlyFn` の中でだけ読む。フレームワークがクライアントのバンドルからその本体を削るので、ブラウザ側に Workerd のモジュールが入らない。

これで loader が温めたものが初回の HTML に入る。サイドバーのタグ、タイムラインの1ページ目、メモ詳細、レースページがハイドレートを待たずに出る。サインイン画面は `auth.methods` を loader で温めるようにしたので、パスキー / パスワードの初期表示が正しく出る（温めないと、仮のパスワード欄が出てからハイドレートで差し替わる）。

## なぜ

ADR-0004 で読み取りを route の loader に寄せた時点で、画面のデータは loader が持つ形になっていた。`ssr: false` は「SSR する中身が無い」ための指定で、中身ができた以上、残す理由が無い。初回表示が空になり、loader の取得がハイドレート後にもう一度走る形は、二度手間でもあった。

## Considered Options

- **`/_app` だけ `ssr: false` のまま、公開ページだけ SSR**: 公開ページが無い（全ページがサインイン必須）ので、分ける対象が無い。
- **SSR 中も `http://localhost:3000/rpc` を fetch する**: 本番は自ゾーンへの fetch が禁止で、開発も Worker の外。届かない。
- **`apps/api` の Hono アプリを web の Worker に同梱して in-process で呼ぶ**: Service Binding の分離（DB の資格情報を web に置かない）が崩れ、contract 経由の型付きエラーも HTTP 前提のまま二重になる。
- **サーバー側だけでパスキー認証を読み直す**: セッションの解決は `apps/api` の Better Auth が持つ。web 側に秘密鍵と DB を置くことになるので採らない。

## Consequences

- route を足すときの手順は ADR-0004 のまま（`queries.ts` に足す → `loader` で温める → 画面で読む）。ただし loader が走るのはブラウザだけではなくなる。
- `/rpc` の読み取りはリクエストごとにサーバーで1回走る。`queryClient` はリクエストごとに作られるので、キャッシュがリクエストをまたぐことはない。
- API が落ちていると、`me` の失敗はサインインへのリダイレクトではなくエラー画面になる（`beforeLoad` は UNAUTHORIZED だけをサインアウトとして扱う）。変更前はブラウザ側でなんでもサインインへ飛んでいたので、障害が「ログアウトされた」に見えていた。
- セッション更新の `Set-Cookie` は、oRPC の読み取りでは返らない。変更前から同じ（`apps/api` が `getSession` のヘッダーを捨てている）。
- クライアント側の `401` 退出（`queryCache.onError` → `leaveForSignIn`）はブラウザでだけ動く。SSR 中の 401 は `/_app` の `beforeLoad` が `redirect` で処理する。
