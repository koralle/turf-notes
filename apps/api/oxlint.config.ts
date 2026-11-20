import { createOxlintConfig } from "@turf-notes/forge/oxlint";
import landmines from "ultracite/oxlint/landmines";

// リポジトリ全体に効く設定は @turf-notes/forge/oxlint が持つ。
// このファイルを置いた時点で apps/api 配下はルート oxlint.config.ts の対象外になる
// （Oxlint はファイルごとに最も近い設定だけを使い、親設定とはマージしない）。
// landmines は「エージェントが green にするための近道」を止める opt-in プリセット。
// `jsPlugins` は knip が依存を読むためにルート設定へ再宣言する。
export default createOxlintConfig({
  extends: [landmines],
  jsPlugins: landmines.jsPlugins,
  rules: {
    // コメントは「なぜ」を残す規約。差分を語るコメントの検出は要らない。
    "landmines-style/no-comments": "off",
    // 戻り値型は procedure / クエリ関数の契約として明示する。
    "landmines-types/no-explicit-return-types": "off",
  },
});
