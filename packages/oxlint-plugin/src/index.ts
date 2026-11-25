import { noForInTest } from "./rules/no-for-in-test.ts";

/** turf-notes 固有の Oxlint JS プラグイン。 */
export default {
  meta: { name: "turf-notes" },
  rules: {
    "no-for-in-test": noForInTest,
  },
};
