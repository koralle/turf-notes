import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { raceKey, raceKeySchema } from "@turf-notes/api-contract/schemas";
import { css } from "styled-system/css";
import * as v from "valibot";

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
  const parsed = v.safeParse(raceKeySchema, {
    date,
    number: Number(raceNumber),
    venue,
  });
  const race = parsed.success ? parsed.output : null;
  const navigate = useNavigate();

  const memoList = useQuery({
    queryFn: async () =>
      race === null ? { items: [] } : await client.memos.forRace(race),
    queryKey: ["memos", "race", race === null ? null : raceKey(race)],
  });

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
