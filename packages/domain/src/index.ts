/** ドメインロジックのエントリ。用語集（GLOSSARY.md）の概念だけをここに置く。 */
export {
  excerptOf,
  headingOf,
  linkTargets,
  memoIdSchema,
  memoSchema,
  memoWriteSchema,
  tagTargets,
} from "./memo";
export type { Memo, MemoWrite } from "./memo";
export { raceKey, raceKeySchema, raceSchema, sameRace, venues } from "./race";
export type { Race, RaceKey } from "./race";
