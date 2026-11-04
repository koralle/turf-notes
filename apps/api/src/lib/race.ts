import type { memos } from "@turf-notes/db/schema";
import { raceOf } from "@turf-notes/domain";
import type { Race } from "@turf-notes/domain";

type RaceColumns = Pick<
  typeof memos.$inferSelect,
  "raceDate" | "raceName" | "raceNumber" | "venue"
>;

/** DB の列からレースを取り出す。3つ組の判定はドメイン（raceOf）が持つ（ADR-0001）。 */
export const toRace = (row: RaceColumns): Race | null =>
  raceOf({
    date: row.raceDate,
    name: row.raceName,
    number: row.raceNumber,
    venue: row.venue,
  });
