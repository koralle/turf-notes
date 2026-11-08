import { Link } from "@tanstack/react-router";
import type { Race } from "@turf-notes/api-contract/schemas";
import { css } from "styled-system/css";

import { fullDate } from "../lib/date";

/** 2026年11月15日（日）京都11R エリザベス女王杯。レース名が無ければ「京都11R」まで。 */
const raceLabel = (race: Race) =>
  `${fullDate(race.date)}${race.venue}${race.number}R${
    race.name === undefined ? "" : ` ${race.name}`
  }`;

const badge = css({
  alignSelf: "flex-start",
  bg: "accentWeak",
  borderRadius: "4px",
  color: "accent",
  fontSize: "11px",
  fontVariantNumeric: "tabular-nums",
  fontWeight: 600,
  maxWidth: "100%",
  px: "7px",
  py: "2px",
});

const linkBadge = css({ textDecoration: "none" });

/** 一覧の行は行全体がメモへのリンクなので、バッジ自体はリンクにしない。 */
export const RaceBadge = ({ race }: { race: Race }) => (
  <div className={badge}>{raceLabel(race)}</div>
);

/** メモ詳細ではレースページへのリンクにする。 */
export const RaceBadgeLink = ({ race }: { race: Race }) => (
  <Link
    className={`${badge} ${linkBadge}`}
    params={{
      date: race.date,
      raceNumber: String(race.number),
      venue: race.venue,
    }}
    to="/races/$date/$venue/$raceNumber"
  >
    {raceLabel(race)}
  </Link>
);
