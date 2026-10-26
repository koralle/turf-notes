import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { css } from "styled-system/css";

import { Markdown } from "../components/markdown";
import { TagChip } from "../components/tag-chip";
import { fullDate } from "../lib/date";
import { client } from "../rpc/client";

export const Route = createFileRoute("/_app/memos/$memoId")({
  component: MemoDetailPage,
});

const wrap = css({ maxWidth: "760px", px: "40px", py: "30px" });
const h1 = css({ fontSize: "22px", fontWeight: 600, lineHeight: 1.5, m: 0 });
const meta = css({
  alignItems: "center",
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  mt: "12px",
});
const bodyText = css({ mt: "24px" });
const section = css({ mt: "28px" });
const sectionLabel = css({
  color: "faint",
  fontSize: "10px",
  letterSpacing: "0.1em",
  mb: "6px",
  textTransform: "uppercase",
});

function MemoDetailPage() {
  const { memoId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const memo = useQuery({
    queryFn: async () => await client.memos.detail({ id: memoId }),
    queryKey: ["memo", memoId],
  });

  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const remove = useMutation({
    mutationFn: async () => await client.memos.delete({ id: memoId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["memos"] });
      await navigate({ to: "/" });
    },
  });

  if (memo.isPending) {
    return null;
  }

  if (memo.isError) {
    return (
      <div style={{ padding: 32 }}>
        メモが見つかりません。<Link to="/">ホームへ戻る</Link>
      </div>
    );
  }

  const item = memo.data;

  return (
    <div className={wrap}>
      <div
        className={css({ alignItems: "center", display: "flex", gap: "12px" })}
      >
        <button
          className={css({
            color: "muted",
            cursor: "pointer",
            fontSize: "12.5px",
          })}
          onClick={() => void navigate({ to: "/" })}
          type="button"
        >
          ← ホーム
        </button>
        <Link
          className={css({ color: "accent", fontSize: "12.5px", ml: "auto" })}
          params={{ memoId }}
          to="/memos/$memoId/edit"
        >
          編集
        </Link>
        <button
          className={css({
            color: "danger",
            cursor: "pointer",
            fontSize: "12.5px",
          })}
          onClick={() => {
            if (confirmingDelete) {
              remove.mutate();
              return;
            }
            setConfirmingDelete(true);
          }}
          type="button"
        >
          {confirmingDelete ? "本当に削除" : "削除"}
        </button>
      </div>

      <h1 className={h1} style={{ marginTop: 18 }}>
        {item.heading}
      </h1>

      <div className={meta}>
        {item.race === null ? null : (
          <Link
            className={css({
              bg: "accentWeak",
              borderRadius: "5px",
              color: "accent",
              fontSize: "11.5px",
              fontWeight: 600,
              px: "8px",
              py: "3px",
              textDecoration: "none",
            })}
            params={{
              date: item.race.date,
              raceNumber: String(item.race.number),
              venue: item.race.venue,
            }}
            to="/races/$date/$venue/$raceNumber"
          >
            {fullDate(item.race.date)} {item.race.venue} {item.race.number}R
            {item.race.name === null ? "" : ` ${item.race.name}`}
          </Link>
        )}
        {item.tags.map((tag) => (
          <TagChip key={tag.id} tag={tag} />
        ))}
      </div>

      <div className={bodyText}>
        <Markdown source={item.body} />
      </div>

      {item.links.length === 0 ? null : (
        <div className={section}>
          <div className={sectionLabel}>参照しているメモ</div>
          {item.links.map((link) => (
            <Link
              className={css({
                color: "accent",
                display: "block",
                fontSize: "13px",
                py: "4px",
              })}
              key={link.id}
              params={{ memoId: link.id }}
              to="/memos/$memoId"
            >
              → {link.heading}
            </Link>
          ))}
        </div>
      )}

      {item.backlinks.length === 0 ? null : (
        <div className={section}>
          <div className={sectionLabel}>このメモを参照しているメモ</div>
          {item.backlinks.map((link) => (
            <Link
              className={css({
                color: "accent",
                display: "block",
                fontSize: "13px",
                py: "4px",
              })}
              key={link.id}
              params={{ memoId: link.id }}
              to="/memos/$memoId"
            >
              ← {link.heading}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
