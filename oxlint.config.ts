import { createOxlintConfig } from "@turf-notes/forge/oxlint";

// リポジトリ全体に効く設定は @turf-notes/forge/oxlint が持つ。
// ここにはルート固有の差分だけを置く。
// 注意: ネスト設定は親とマージされないため、全パッケージに効かせたい設定は forge 側に置くこと。
// apps/web 配下は apps/web/oxlint.config.ts がこの設定を置き換える（react / tanstack はそちら）。
export default createOxlintConfig();
