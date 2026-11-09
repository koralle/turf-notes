import { Link } from "@tanstack/react-router";
import type { MemoSummary } from "@turf-notes/api-contract/schemas";
import { css } from "styled-system/css";

import { dateStamp } from "../lib/date";
import { RaceBadge } from "./race-badge";
import { TagChip } from "./tag-chip";

const list = css({ display: "flex", flexDirection: "column" });

const row = css({
  borderBottomColor: "line",
  borderBottomStyle: "solid",
  borderBottomWidth: "1px",
  display: "flex",
  flexDirection: { base: "column", md: "row" },
  gap: { base: "3px", md: "18px" },
  py: { base: "14px", md: "15px" },
  textDecoration: "none",
});

const dateCol = css({
  alignItems: "baseline",
  display: { base: "flex", md: "block" },
  flex: { base: "none", md: "0 0 52px" },
  gap: "5px",
  textAlign: { base: "left", md: "right" },
});

const yearStyle = css({
  color: "faint",
  display: "block",
  fontSize: { base: "10px", md: "9.5px" },
});
const dayStyle = css({
  color: { base: "muted", md: "ink" },
  display: "block",
  fontSize: { base: "11.5px", md: "12.5px" },
  fontVariantNumeric: "tabular-nums",
  fontWeight: 600,
  mt: { base: "0", md: "1px" },
});
const weekdayStyle = css({
  color: "faint",
  display: "block",
  fontSize: { base: "10px", md: "10.5px" },
  mt: { base: "0", md: "1px" },
});

const titleStyle = css({
  color: "ink",
  fontSize: "14px",
  fontWeight: 500,
  lineHeight: 1.65,
});

const metaStyle = css({
  display: "flex",
  flexDirection: "column",
  gap: { base: "4px", md: "6px" },
  mt: { base: "3px", md: "7px" },
});

const tagRow = css({
  alignItems: "center",
  display: "flex",
  flexWrap: "wrap",
  gap: { base: "5px", md: "6px" },
});

const refStyle = css({
  color: "faint",
  fontSize: { base: "10.5px", md: "11px" },
});

/** メモを縦に並べる。一覧・タグ・レースの各画面で同じ余白にするため共通化する。 */
export const MemoList = ({ children }: { children: React.ReactNode }) => (
  <div className={list}>{children}</div>
);

export const MemoRow = ({
  memo,
  isPending = false,
}: {
  memo: MemoSummary;
  /** 保存中で、まだリンク先のメモが無い。 */
  isPending?: boolean;
}) => {
  const stamp = dateStamp(memo.createdAt);
  const hasTagRow = memo.tags.length > 0 || memo.linkCount > 0;

  const content = (
    <>
      <div className={dateCol}>
        <span className={yearStyle}>{stamp.year}</span>
        <span className={dayStyle}>
          {stamp.month}/{stamp.day}
        </span>
        <span className={weekdayStyle}>{stamp.weekday}</span>
      </div>
      <div className={css({ flex: 1, minWidth: 0 })}>
        <div className={`${titleStyle} memo-heading`}>{memo.heading}</div>
        {memo.race === null && !hasTagRow ? null : (
          <div className={metaStyle}>
            {memo.race === null ? null : <RaceBadge race={memo.race} />}
            {hasTagRow ? (
              <div className={tagRow}>
                {memo.tags.map((tag) => (
                  <TagChip key={tag.id} tag={tag} />
                ))}
                {memo.linkCount > 0 ? (
                  <span className={refStyle}>参照 {memo.linkCount}</span>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </>
  );

  return isPending ? (
    <div className={row}>{content}</div>
  ) : (
    <Link className={row} params={{ memoId: memo.id }} to="/memos/$memoId">
      {content}
    </Link>
  );
};
