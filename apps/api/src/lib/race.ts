import type { Race } from "@turf-notes/api-contract/schemas";

interface RaceColumns {
  raceDate: string | null;
  venue: string | null;
  raceNumber: number | null;
  raceName: string | null;
}

/** 3つ組がそろっているときだけレースとして扱う（ADR-0001）。 */
export const toRace = (row: RaceColumns): Race | null => {
  if (row.raceDate === null || row.venue === null || row.raceNumber === null) {
    return null;
  }

  return {
    date: row.raceDate,
    venue: row.venue,
    number: row.raceNumber,
    name: row.raceName,
  };
};
