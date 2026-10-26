import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { css } from "styled-system/css";

import { EmptyState } from "../components/empty-state";
import { MemoRow, memoListStyle } from "../components/memo-row";
import { MobileHeader } from "../components/mobile-header";
import { fullDate } from "../lib/date";
import { client } from "../rpc/client";

export const Route = createFileRoute("/_app/races/$date/$venue/$raceNumber")({
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
  const number = Number(raceNumber);
  const navigate = useNavigate();

  const memoList = useQuery({
    queryFn: async () => await client.memos.forRace({ date, number, venue }),
    queryKey: ["memos", "race", date, venue, number],
  });

  const items = memoList.data?.items ?? [];
  const raceName = items.find((item) => item.race?.name !== null)?.race?.name;

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
