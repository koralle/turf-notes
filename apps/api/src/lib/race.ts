import type { memos } from "@turf-notes/db/schema";
import { raceSchema } from "@turf-notes/domain";
import type { Race } from "@turf-notes/domain";
import * as v from "valibot";

type RaceColumns = Pick<
  typeof memos.$inferSelect,
  "raceDate" | "raceName" | "raceNumber" | "venue"
>;

/** 3つ組がそろっているときだけレースとして扱う（ADR-0001）。 */
export const toRace = (row: RaceColumns): Race | null => {
  if (row.raceDate === null || row.venue === null || row.raceNumber === null) {
    return null;
  }

  return v.parse(raceSchema, {
    date: row.raceDate,
    venue: row.venue,
    number: row.raceNumber,
    ...(row.raceName === null ? {} : { name: row.raceName }),
  });
};
