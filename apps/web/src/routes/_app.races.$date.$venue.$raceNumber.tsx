import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { css } from "styled-system/css";

import { EmptyState } from "../components/empty-state";
import { MemoRow, memoListStyle } from "../components/memo-row";
import { fullDate } from "../lib/date";
import { client } from "../rpc/client";

export const Route = createFileRoute("/_app/races/$date/$venue/$raceNumber")({
  component: RacePage,
});

const head = css({ px: "32px", pt: "20px" });
const timeline = css({ px: "32px", py: "10px" });

function RacePage() {
  const { date, venue, raceNumber } = Route.useParams();
  const number = Number(raceNumber);

  const memoList = useQuery({
    queryFn: async () => await client.memos.forRace({ date, number, venue }),
    queryKey: ["memos", "race", date, venue, number],
  });

  const items = memoList.data?.items ?? [];
  const raceName = items.find((item) => item.race?.name !== null)?.race?.name;

  return (
    <>
      <div className={head}>
        <div
          className={css({
            color: "faint",
            fontSize: "11px",
            letterSpacing: "0.08em",
          })}
        >
          レース
        </div>
        <h1
          className={css({
            fontSize: "19px",
            fontWeight: 600,
            m: 0,
            mt: "4px",
          })}
        >
          {fullDate(date)} {venue} {number}R
        </h1>
        {raceName === undefined || raceName === null ? null : (
          <div
            className={css({ color: "muted", fontSize: "12.5px", mt: "4px" })}
          >
            {raceName}
          </div>
        )}
      </div>
      <div className={timeline}>
        {items.length === 0 ? (
          <EmptyState>このレースのメモはまだありません。</EmptyState>
        ) : (
          <div className={memoListStyle}>
            {items.map((memo) => (
              <MemoRow key={memo.id} memo={memo} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
