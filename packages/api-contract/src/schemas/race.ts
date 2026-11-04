import type { Race } from "@turf-notes/domain";

export { raceKeySchema, raceSchema } from "@turf-notes/domain";
export type { Race, RaceKey } from "@turf-notes/domain";

/** 書き込み時に受け取るレース情報。永続化されたレースと同じ形（レース名は任意）。 */
export type RaceInput = Race;
