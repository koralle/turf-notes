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

## 実装済み / 未実装

実装済み: パスワードサインイン（サインアップは HTTP 面でも 404）、メモの作成・一覧・編集・論理削除、タイトル任意（無ければ本文1行目を見出しに）、タグ（馬 / 人 / 主題）、レース情報（開催日・競馬場・レース番号・レース名）、部分一致検索、タグページ、レースページ、メモ間の参照（双方向表示）。

未実装（今回のスコープ外）: パスキー、パスワードサインインの有効/無効トグル、JSON エクスポート、Storybook、CI、Markdown のレンダリング（現状は改行を保ったテキスト表示）。

## 補足

- ローカル DB は libSQL の HTTP サーバー（`apps/api/compose.yaml`）。本番は Turso を想定している。
- `XDG_CONFIG_HOME` をワークスペース内に向けると、wrangler が `~/.config` に書けない環境でも動く。
  ```sh
  XDG_CONFIG_HOME=$PWD/.tmp/xdg pnpm dev
  ```
