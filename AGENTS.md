# AGENTS.md

## プロジェクト概要

競馬についての個人的なメモを書き溜めるアプリ。競馬の事実データ（出馬表・結果・オッズ）は扱わない。要件は `docs/requirements.md`、用語は `GLOSSARY.md`、決定は `docs/adr/` が正。

## 規範

- **用語を勝手に作らない**。`GLOSSARY.md` にある語を使い、新しい概念が要るときは glossary を先に更新する。
- **要件にないものを作らない**。`docs/requirements.md` の §7 スコープ外を確認する。
- **pantry の負債を持ち込まない**。未使用依存、`DynamicLink` のような過渡期コード、UI でしか止めていない制限、実体のない e2e 前提を作らない。

## ディレクトリ

- `apps/web` — TanStack Start + Panda CSS。DB に触らない。`/rpc/*` と `/api/auth/*` は `src/server.ts` が Service Binding で `apps/api` へ流す
- `apps/api` — Hono + oRPC + Better Auth。`src/rpc/base.ts` の `requireAuth` で認証と DB を注入する
- `packages/api-contract` — oRPC contract と Valibot スキーマ。input / output / 型付きエラーはここだけ
- `packages/db` — Drizzle スキーマとマイグレーション。**適用済みのマイグレーションは手で編集しない** （変更は CI の `migrations` ジョブが落とす。スキーマ変更は新しいマイグレーションを足す）
- `packages/forge` — tsconfig / oxlint / oxfmt の共通設定。全パッケージに効かせたい lint 設定はここ

## コマンド

| コマンド                  | 説明                                          |
| ------------------------- | --------------------------------------------- |
| `pnpm dev`                | web(3000) + api（auxiliary worker）を同時起動 |
| `pnpm check` / `pnpm fix` | Ultracite（Oxlint + Oxfmt）                   |
| `pnpm typecheck`          | ルート + 全パッケージの型検査                 |
| `pnpm test`               | Vitest                                        |
| `pnpm knip`               | 未使用依存・export の検出                     |
| `pnpm build`              | 全パッケージのビルド                          |

コードを変更したら、完了前に `pnpm check && pnpm typecheck && pnpm test && pnpm knip && pnpm build` を通す。CI はこれに Storybook のビルドとマイグレーションの追記チェックを足したものを回す。

## 認証の復旧

本番はパスキーのみで運用している（`users.password_sign_in_enabled = false`）。復旧はサーバー上でのみ可能: `enable-password` で戻し、必要なら `set-password` で差し替える。

## ローカル DB

`docker compose -f apps/api/compose.yaml up -d` で libSQL サーバーを起動し、 `pnpm --filter @turf-notes/db migrate` でスキーマを適用する。接続先は `apps/api/.dev.vars`。

## UI

デザインの正本は `design/mockups/` の HTML と `design/screens/` の PNG。色は Panda のトークン（`apps/web/panda.config.ts`）にだけ定義し、生の色値をコンポーネントに書かない。
