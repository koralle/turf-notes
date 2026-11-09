import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { raceKeyOf } from "@turf-notes/domain";
import { css } from "styled-system/css";

import { EmptyState } from "../../../../../components/empty-state";
import { MemoList, MemoRow } from "../../../../../components/memo-row";
import { MobileHeader } from "../../../../../components/mobile-header";
import { fullDate } from "../../../../../lib/date";
import { raceMemosQuery } from "../../../../../rpc/queries";

export const Route = createFileRoute("/_app/races/$date/$venue/$raceNumber")({
  loader: async ({ context, params }) => {
    const race = raceKeyOf({
      date: params.date,
      number: params.raceNumber,
      venue: params.venue,
    });
    if (race !== null) {
      await context.queryClient.query(raceMemosQuery(race));
    }
  },
  component: RacePage,
});

const head = css({
  px: { base: "18px", md: "32px" },
  pt: { base: "12px", md: "20px" },
});
const timeline = css({
  pb: { base: "calc(24px + env(safe-area-inset-bottom))", md: "10px" },
  pt: { base: "4px", md: "10px" },
  px: { base: "18px", md: "32px" },
});

function RacePage() {
  const { date, venue, raceNumber } = Route.useParams();
  const race = raceKeyOf({ date, number: raceNumber, venue });
  const navigate = useNavigate();

  const memoList = useQuery(raceMemosQuery(race));

  const items = memoList.data?.items ?? [];
  const raceName = items.find((item) => item.race?.name !== undefined)?.race
    ?.name;

  return (
    <>
      <MobileHeader
        note={items.length === 0 ? undefined : `${items.length}件`}
        onBack={() => void navigate({ to: "/" })}
        title="レース"
      />
      <div className={head}>
        <div
          className={css({
            color: "faint",
            display: { base: "none", md: "block" },
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
          {fullDate(date)} {venue} {raceNumber}R
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
          <MemoList>
            {items.map((memo) => (
              <MemoRow key={memo.id} memo={memo} />
            ))}
          </MemoList>
        )}
      </div>
    </>
  );
}
