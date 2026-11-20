import { createOxlintConfig } from "@turf-notes/forge/oxlint";
import type {
  Capability,
  OxlintRuleSeverity,
} from "oxlint-plugin-react-doctor";
import {
  REACT_DOCTOR_RULES,
  RECOMMENDED_RULES,
  TANSTACK_QUERY_RULES,
  TANSTACK_START_RULES,
} from "oxlint-plugin-react-doctor";
import landmines from "ultracite/oxlint/landmines";
import react from "ultracite/oxlint/react";
import tanstack from "ultracite/oxlint/tanstack";

// リポジトリ全体に効く設定は @turf-notes/forge/oxlint が持つ。
// このファイルを置いた時点で apps/web 配下はルート oxlint.config.ts の対象外になる
// （Oxlint はファイルごとに最も近い設定だけを使い、親設定とはマージしない）。
// react / tanstack は React と TanStack Router を使うこのアプリだけに効かせる。
// landmines は「エージェントが green にするための近道」を止める opt-in プリセット。

// react-doctor CLI が package.json から組み立てるのと同じ能力の集合。
// react:18 / react:19 / react:19.2 は React 19.3 で満たされる階段。
// 依存を足したらここも足す（package.json からの自動導出はしていない）。
const capabilities: ReadonlySet<Capability> = new Set([
  "react",
  "react-aria",
  "react:18",
  "react:19",
  "react:19.2",
  "ssr",
  "tanstack-query",
  "tanstack-start",
  "typescript",
]);

const reactDoctorEntryByKey = new Map(
  REACT_DOCTOR_RULES.map((entry) => [entry.key, entry])
);

// oxlint の深刻度は文字列か [深刻度, オプション] の配列で書ける。
const severityOf = (value: unknown): string => {
  const head = Array.isArray(value) ? (value as readonly unknown[])[0] : value;
  return typeof head === "string" ? head : "error";
};

// Ultracite の react プリセットで実際に有効な組み込みルール名（接頭辞を落としたもの）。
// プリセットには off の項目も入っているので、値を見ないと「組み込みも react-doctor も
// 黙る」ルールができる。
const builtInReactRuleNames = new Set(
  Object.entries(react.rules ?? {}).flatMap(([key, value]) => {
    const severity = severityOf(value);
    if (severity === "off" || severity === "allow") {
      return [];
    }
    return [key.slice(key.indexOf("/") + 1)];
  })
);

// Oxlint は rules をそのまま登録するだけで、CLI がやっている requires
// （そのライブラリが入っている時だけ有効）の判定をしない。宣言した能力で
// 満たせないルールを落とし、入っていないライブラリ向けのルールを走らせない。
// 移植版（oxc の react / jsx-a11y / react_perf 由来）は、組み込み側が有効な
// ものだけ落とす。同じ指摘を 2 回出さないため。
export const isReactDoctorRuleEnabled = (key: string): boolean => {
  const entry = reactDoctorEntryByKey.get(key);
  if (entry === undefined) {
    return false;
  }
  const { rule } = entry;
  if (
    rule.requires?.some((capability) => !capabilities.has(capability)) === true
  ) {
    return false;
  }
  if (
    rule.tags?.includes("react-jsx-only") === true &&
    !capabilities.has("react")
  ) {
    return false;
  }
  if (
    rule.disabledWhen?.some((capability) => capabilities.has(capability)) ===
    true
  ) {
    return false;
  }
  return !(entry.originallyExternal && builtInReactRuleNames.has(entry.id));
};

// react-doctor の推奨セットは既定で warning が多い。厳し目なので全件 error にする。
// tanstack 系は framework が global ではないため推奨セットに入らない。
const asErrors = (
  rules: Readonly<Record<string, OxlintRuleSeverity>>
): Record<string, "error"> => {
  const enabled: Record<string, "error"> = {};
  for (const key of Object.keys(rules)) {
    if (isReactDoctorRuleEnabled(key)) {
      enabled[key] = "error";
    }
  }
  return enabled;
};

export default createOxlintConfig({
  extends: [react, tanstack, landmines],
  jsPlugins: [
    ...landmines.jsPlugins,
    { name: "storybook", specifier: "eslint-plugin-storybook" },
    { name: "react-doctor", specifier: "oxlint-plugin-react-doctor" },
  ],
  // react-doctor 本体（CLI）と同じ前提を渡す。`portedRuleMode` を curated に
  // しないと、oxc から移植した react 系ルールが upstream 挙動（誤検知寄り）で動く。
  settings: {
    "react-doctor": {
      capabilities: [...capabilities].toSorted(),
      framework: "tanstack-start",
      portedRuleMode: "curated",
    },
  },
  rules: {
    ...asErrors(RECOMMENDED_RULES),
    ...asErrors(TANSTACK_START_RULES),
    ...asErrors(TANSTACK_QUERY_RULES),
    // コメントは「なぜ」を残す規約。差分を語るコメントの検出は要らない。
    "landmines-style/no-comments": "off",
    // 戻り値型は hook / port の契約として明示する。
    "landmines-types/no-explicit-return-types": "off",
  },
  overrides: [
    {
      // ルートのコンポーネントはフレームワークが関数宣言で置く（`function XxxPage()`）。
      // ルート定義がコンポーネントを下で宣言するのは file-based routing の定型なので、
      // 巻き上げに頼る参照を許す。
      // TanStack Router は `throw redirect()` / `throw notFound()` を制御フローに使う。
      // 投げる値は Error ではなく Response 相当なので、ルート層だけ例外にする。
      files: ["src/routes/**/*.ts", "src/routes/**/*.tsx"],
      rules: {
        "func-style": "off",
        "no-use-before-define": "off",
        "react/function-component-definition": "off",
        "typescript/only-throw-error": "off",
      },
    },
    {
      // クライアントの生成途中に、自分自身（router）と queryClient の両方を要る
      // 退出処理を置く必要があり、関数宣言の巻き上げに依存している。
      files: ["src/router.tsx"],
      rules: {
        "func-style": "off",
        "no-use-before-define": "off",
      },
    },
    {
      // 編集画面の状態（本文・タグ・リンク・レース・保存の状態）を 1 か所に保つ。
      // 分割すると入力ごとの派生値の計算が関数をまたぎ、かえって追いにくくなる。
      // 変更の有無は「最初のレンダーの値」を基準に判定する。値だけを使う useState を
      // 使うため、value と setter の対を強制するルールはここだけ外す。
      files: ["src/components/memo-editor.tsx"],
      rules: {
        complexity: "off",
        "react/hook-use-state": "off",
      },
    },
    {
      // better-auth のパスキーは WebAuthn（ブラウザ API）を要り、実物をテストで動かせないので
      // authClient を差し替えている。MSW で HTTP を置き換える形へ寄せるのは別作業。
      files: ["src/routes/sign-in/-lib/passkey-sign-in.test.ts"],
      rules: { "landmines-testing/no-test-doubles": "off" },
    },
    {
      // Storybook の設定は knip が読み込んで評価する。`import.meta` の分割代入は
      // その評価で解決できず、設定が読めなくなって未使用ファイルの検出が止まる。
      files: ["**/.storybook/main.ts"],
      rules: { "prefer-destructuring": "off" },
    },
    {
      // eslint-plugin-storybook の flat/recommended 相当。
      // Oxlint の files は ESLint の extglob（`@(ts|tsx)`）を解釈せず黙って無視するため brace で書く。
      files: [
        "**/*.stories.{ts,tsx,js,jsx,mjs,cjs}",
        "**/*.story.{ts,tsx,js,jsx,mjs,cjs}",
      ],
      rules: {
        "storybook/await-interactions": "error",
        "storybook/context-in-play-function": "error",
        "storybook/default-exports": "error",
        "storybook/hierarchy-separator": "error",
        "storybook/no-redundant-story-name": "error",
        "storybook/no-renderer-packages": "error",
        "storybook/prefer-pascal-case": "error",
        "storybook/story-exports": "error",
        "storybook/use-storybook-expect": "error",
        "storybook/use-storybook-testing-library": "error",
      },
    },
  ],
});
