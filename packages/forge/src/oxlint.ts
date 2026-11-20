import { defineConfig } from "oxlint";
import type { OxlintConfig } from "oxlint";
import core from "ultracite/oxlint/core";
import vitest from "ultracite/oxlint/vitest";

/**
 * `ultracite/oxlint/vitest` はルールを `overrides` で一括有効化するため、
 * `extends` する側からは個別ルールを上書きできない（プリセットの `overrides` が必ず勝つ）。
 * このリポジトリの規約と衝突するものだけを差し替えたプリセットを渡す。
 *
 * - `consistent-test-it`: 既定は `describe` 内で `it` を推奨するが、このリポジトリは `test` 固定。
 * - `prefer-to-be-truthy` / `prefer-to-be-falsy`: `toBe(true)` / `toBe(false)` を truthy へ
 *   丸めさせると、boolean を返す契約（API の応答、判定関数）が別の truthy 値に
 *   変わっても緑のままになる。
 * - `prefer-import-in-mock`: 自動修正が `vi.mock(import("..."))` へ書き換えるが、これは
 *   型付き overload になるため部分的な module mock が型検査を通らなくなる。
 * - `prefer-describe-function-title`: `describe` の見出しは文字列で書く。対象は valibot の
 *   スキーマのように関数でないものも多く、関数を渡す形に統一できない。
 * - `require-top-level-describe`: 1 ファイル 1 対象のテストは、ファイル全体を `describe` で
 *   包まずに共有の `beforeEach` と `test` を並べる（ファイル名が対象を示している）。
 * - `require-to-throw-message`: 投げる値は valibot の ValiError。文言は valibot の版で
 *   変わるので、テストを文言に結び付けない。
 * - `expect-expect`: 表明を `expect*` で始まるヘルパーにまとめたテストを、表明なしと数えない。
 */
const vitestPreset: OxlintConfig = {
  overrides: (vitest.overrides ?? []).map((override) => ({
    ...override,
    rules: {
      ...override.rules,
      "vitest/consistent-test-it": [
        "error",
        { fn: "test", withinDescribe: "test" },
      ],
      "vitest/expect-expect": ["error", { assertFunctionNames: ["expect*"] }],
      "vitest/prefer-import-in-mock": "off",
      "vitest/prefer-describe-function-title": "off",
      "vitest/prefer-to-be-falsy": "off",
      "vitest/prefer-to-be-truthy": "off",
      "vitest/require-to-throw-message": "off",
      "vitest/require-top-level-describe": "off",
    },
  })),
};

/**
 * Oxlint は `extends` した設定の `ignorePatterns` を継承しない。
 * そのため `createOxlintConfig` がこの配列を必ず設定に含める。
 *
 * パターンは設定ファイルの位置に依存しない glob で定義する。
 */
const ignorePatterns = [
  ...(core.ignorePatterns ?? []),
  "**/.agents/skills/**",
  "**/postcss.config.cjs",
  "**/styled-system/**",
  "**/worker-configuration.d.ts",
];

/**
 * テストとメンテナンススクリプト向けの緩和。`extends` する側のディレクトリに
 * 依存しない glob にする。
 */
const testFiles = [
  "**/*.test.ts",
  "**/*.test.tsx",
  "**/src/test/**/*.ts",
  "**/src/test/**/*.tsx",
  "**/scripts/**/*.ts",
];

const oxlintConfig = defineConfig({
  // react / tanstack は apps/web/oxlint.config.ts が受け持つ（React を使うのは web だけ）。
  extends: [core, vitestPreset],
  overrides: [
    {
      files: testFiles,
      rules: {
        "func-style": "off",
        "no-await-in-loop": "off",
        "no-promise-executor-return": "off",
        "no-use-before-define": "off",
        "no-useless-return": "off",
        "promise/avoid-new": "off",
        // テストダブルは本物の port が async である以上 async になるが、本文に await は無い。
        "require-await": "off",
        "typescript/await-thenable": "off",
        "typescript/consistent-type-imports": "off",
        "typescript/no-base-to-string": "off",
        "typescript/no-explicit-any": "off",
        "typescript/no-unsafe-argument": "off",
        "typescript/no-unsafe-assignment": "off",
        "typescript/no-unsafe-call": "off",
        "typescript/no-unsafe-member-access": "off",
        "typescript/no-unsafe-return": "off",
        // 契約のエラー型へ絞る `as` は、テストで応答を読み解くための最短経路。
        "typescript/no-unsafe-type-assertion": "off",
        "typescript/strict-void-return": "off",
        "unicorn/import-style": "off",
        "unicorn/no-immediate-mutation": "off",
        "unicorn/no-await-expression-member": "off",
      },
    },
    {
      // stories はテスト fixture と同じ扱い。prod のコードでは unsafe 系を有効に保つ。
      files: ["**/*.stories.{ts,tsx}"],
      rules: {
        // ハンドラの差し替えは「何もしない」が正当な応答になる。
        "no-empty-function": "off",
        // 差し替える port が Promise を返す以上 async になるが、本文に await は無い。
        "require-await": "off",
        "typescript/no-unsafe-argument": "off",
        "typescript/no-unsafe-assignment": "off",
        "typescript/no-unsafe-call": "off",
        "typescript/no-unsafe-member-access": "off",
        "typescript/no-unsafe-return": "off",
        "typescript/no-unsafe-type-assertion": "off",
      },
    },
    {
      // パース結果を型レベルで readonly にする変換。readonly は型にしか現れないため、
      // 実行時の値は入力と同一で、valibot の検証では示せない。
      files: ["**/packages/domain/src/readonly.ts"],
      rules: { "typescript/no-unsafe-type-assertion": "off" },
    },
  ],
  rules: {
    // 契約スキーマのバレルは意図して持つ（domain の再エクスポートを含むため既定の100では足りない）。
    // サブパス export で回避すると公開面が概念ごとに非対称になるので、閾値側で受ける。
    "oxc/no-barrel-file": ["error", { threshold: 150 }],
    // キーの並びは意味を持たない。Drizzle のスキーマは列の順が DDL と対応しており、
    // 並べ替えると定義が読めなくなるため、この規約は採らない。
    "sort-keys": "off",
    // コールバックを Promise へ書き換える前提のルール。TanStack Query の
    // コールバック API と Better Auth のフックは callback 前提で、書き換えると
    // 呼び出し側の設計が変わるため無効。
    "promise/prefer-await-to-callbacks": "off",
  },
});

type CreateOxlintConfigOptions = Omit<
  OxlintConfig,
  "extends" | "ignorePatterns"
> & {
  /** 追加で有効にしたいプリセット。共通設定の後ろに連結される。 */
  extends?: OxlintConfig["extends"];
  /** リポジトリ固有で追加したい ignore。共通の ignore の後ろに連結される。 */
  ignorePatterns?: string[];
};

/**
 * パッケージごとの設定を作る。`extends` と共通 `ignorePatterns` を必ず含むため、
 * 呼び出し側は差分だけを渡せばよい（`ignorePatterns` の再宣言漏れを防ぐ）。
 *
 * 注意: 返した設定はネスト設定として親設定を置き換える。
 * 全パッケージに効かせたい設定はここ（forge）に置くこと。
 */
export const createOxlintConfig = ({
  extends: presets = [],
  ignorePatterns: additionalIgnorePatterns = [],
  ...rest
}: CreateOxlintConfigOptions = {}) =>
  defineConfig({
    extends: [oxlintConfig, ...presets],
    ignorePatterns: [...ignorePatterns, ...additionalIgnorePatterns],
    ...rest,
  });
