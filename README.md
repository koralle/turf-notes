# Turf Notes

競馬についての個人的なメモを書き溜めるアプリ。競馬の事実データ（出馬表・結果・オッズ）は持たず、ユーザーが書いたメモと、それを整理するためのタグ・レース情報・メモ間の参照だけを扱う。

要件は [docs/requirements.md](docs/requirements.md)、用語は [GLOSSARY.md](GLOSSARY.md)、決定の根拠は [docs/adr/](docs/adr/) を正とする。デザインの正本は [design/mockups/](design/mockups/)。

## 構成

| パス | 役割 |
| --- | --- |
| `apps/web` | アプリ本体。TanStack Start + Panda CSS。Cloudflare Worker `turf-notes` |
| `apps/api` | API Worker `turf-notes-api`。Hono + oRPC + Better Auth |
| `packages/api-contract` | oRPC の contract と Valibot スキーマ（input / output / 型付きエラー） |
| `packages/db` | Drizzle のスキーマ、マイグレーション、接続ファクトリ |
| `packages/forge` | 共有ツールチェイン設定（tsconfig / oxlint / oxfmt） |
| `design/` | UI モックアップ（HTML）とスクリーンショット |
| `docs/` | 要件定義書と ADR |

`apps/web` は DB に触らない。`/rpc/*` と `/api/auth/*` を Service Binding で `turf-notes-api` へ流す。

## 必要なもの

- Node 24 以上（`devEngines` で担保）
- pnpm 12.14.0
- Docker（ローカルの libSQL サーバー用）

## セットアップ

```sh
pnpm install

# ローカルの libSQL サーバー（http://127.0.0.1:8080）
docker compose -f apps/api/compose.yaml up -d

# 環境変数（.dev.vars は git 管理外）
cp apps/api/.dev.vars.example apps/api/.dev.vars

# マイグレーションと最初のユーザー
pnpm --filter @turf-notes/db migrate
pnpm --filter @turf-notes/api create-user me@example.com koralle dev-password-1234

# 開発サーバー（web:3000 / api は auxiliary worker として同時起動）
pnpm dev
```

`http://localhost:3000` を開き、作成したユーザーでサインインする。

## コマンド

| コマンド | 内容 |
| --- | --- |
| `pnpm dev` | 開発サーバー（web + api） |
| `pnpm build` | 全パッケージのビルド |
| `pnpm test` | 単体テスト（Vitest） |
| `pnpm typecheck` | 型検査（ルート + 全パッケージ） |
| `pnpm check` | Ultracite（Oxlint + Oxfmt）の検査 |
| `pnpm fix` | 自動修正 |
| `pnpm knip` | 未使用の依存・export・catalog の検出 |
| `pnpm --filter @turf-notes/db generate` | スキーマからマイグレーション生成 |
| `pnpm --filter @turf-notes/db migrate` | マイグレーション適用 |
| `pnpm --filter @turf-notes/api create-user <email> <name> <password>` | ユーザー作成 |
| `pnpm --filter @turf-notes/api enable-password` | パスワードサインインを再有効化（復旧用） |
| `pnpm --filter @turf-notes/api set-password <email> <password>` | パスワードを差し替える（セッション不要） |
| `pnpm --filter @turf-notes/web storybook` | Storybook（http://localhost:6006） |
| `pnpm --filter @turf-notes/web build-storybook` | Storybook の静的ビルド |

## 実装済み

- 認証: パスキー（登録・改名・削除）とパスワードサインイン。サインイン画面はパスキーが既定で、「その他の方法でログインする」を開くとパスワードが出る。サインアップは HTTP 面でも 404
- パスワードサインインの有効／無効（アプリ層で拒否。パスキー0件では無効化できず、CLI で復旧）
- メモ: 作成・一覧・編集・論理削除、タイトル任意（無ければ本文1行目を見出しに）、Markdown 表示
- タグ（馬 / 人 / 主題）、レース情報（開催日・競馬場・レース番号・レース名）、部分一致検索
- タグページ、レースページ、メモ間の参照（双方向表示）
- JSON エクスポート、Storybook、CI

## 未実装（今後の候補）

- Markdown の編集時プレビュー、記法の拡張（表・取り消し線など）
- 一覧の無限スクロール（現状は「もっと見る」）
- レート制限、監査ログ

## CI / CD

| ワークフロー | トリガー | 内容 |
| --- | --- | --- |
| `ci.yaml` | PR / デプロイからの呼び出し | lint+format / typecheck / test / knip / build / build-storybook / マイグレーションが追記のみか |
| `deploy.yaml` | `main` への push・手動 | CI を全部通してから、マイグレーション → API → Web の順でデプロイ |

`main` にマージすると CI が通り次第そのまま本番へ出ます。デプロイは concurrency（`production`）で直列化し、途中で失敗したらそこで止まります（マイグレーションが失敗したらデプロイしない）。

### リポジトリに設定するもの

Secrets（`production` 環境に置くのがおすすめ）:

| 名前                    | 用途                                          |
| ----------------------- | --------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Workers のデプロイ（Edit Cloudflare Workers） |
| `CLOUDFLARE_ACCOUNT_ID` | アカウント ID                                 |
| `TURSO_CONNECTION_URL`  | 本番 DB                                       |
| `TURSO_AUTH_TOKEN`      | 本番 DB のトークン                            |
| `BETTER_AUTH_SECRET`    | セッション署名（32文字以上）                  |

Variables:

| 名前              | 値                                    |
| ----------------- | ------------------------------------- |
| `BETTER_AUTH_URL` | `https://turf-notes.koralle-mgmg.com` |

### マイグレーションは追記のみ

適用済みのマイグレーションを書き換えると既存 DB と食い違うため、`ci.yaml` の `migrations` ジョブが「base にすでに存在したフォルダへの変更」を失敗させます。スキーマ変更は必ず新しいマイグレーションを足す。

## 本番デプロイ

ホスト名は `turf-notes.koralle-mgmg.com` 固定（パスキーの rpID がドメインに紐づくため、後から変えない）。

```sh
# 1) 本番 DB（Turso）にスキーマを適用
TURSO_CONNECTION_URL='libsql://...' TURSO_AUTH_TOKEN='...' \
  pnpm --filter @turf-notes/db migrate

# 2) 本番ユーザーを作る（サインアップは無い）
TURSO_CONNECTION_URL='libsql://...' TURSO_AUTH_TOKEN='...' \
  pnpm --filter @turf-notes/api create-user <email> <name> <password>

# 3) シークレットを登録
pnpm --filter @turf-notes/api exec wrangler secret put TURSO_CONNECTION_URL
pnpm --filter @turf-notes/api exec wrangler secret put TURSO_AUTH_TOKEN
pnpm --filter @turf-notes/api exec wrangler secret put BETTER_AUTH_SECRET
pnpm --filter @turf-notes/api exec wrangler secret put BETTER_AUTH_URL   # https://turf-notes.koralle-mgmg.com

# 4) API → Web の順にデプロイ（Web の Service Binding が API を参照する）
pnpm run deploy
```

初回サインイン後に**パスキーを登録し、パスワードサインインを無効化**するのが想定運用。パスキーを全失したときは `enable-password` を本番 DB に対して実行して復旧する。

## 補足

- ローカル DB は libSQL の HTTP サーバー（`apps/api/compose.yaml`）。本番は Turso を想定している。
- `XDG_CONFIG_HOME` をワークスペース内に向けると、wrangler が `~/.config` に書けない環境でも動く。
  ```sh
  XDG_CONFIG_HOME=$PWD/.tmp/xdg pnpm dev
  ```
