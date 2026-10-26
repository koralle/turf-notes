import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { MemoDetail, TagKind } from "@turf-notes/api-contract/schemas";
import { useState } from "react";
import { Button as RacButton } from "react-aria-components";
import { css } from "styled-system/css";

import { client } from "../rpc/client";
import { TagChip } from "./tag-chip";

const VENUES = [
  "東京",
  "中山",
  "京都",
  "阪神",
  "中京",
  "小倉",
  "新潟",
  "福島",
  "函館",
  "札幌",
  "大井",
  "川崎",
  "船橋",
  "浦和",
  "名古屋",
  "園田",
  "門別",
  "盛岡",
] as const;

const KIND_LABEL: Record<TagKind, string> = {
  horse: "馬",
  person: "人",
  theme: "主題",
};

const topbar = css({
  alignItems: "center",
  bg: "panel",
  borderBottomColor: "line",
  borderBottomStyle: "solid",
  borderBottomWidth: "1px",
  display: "flex",
  gap: "12px",
  px: "32px",
  py: "11px",
});

const body = css({
  display: "flex",
  flex: 1,
  flexDirection: { base: "column", lg: "row" },
  minHeight: 0,
});

const editorCol = css({
  flex: 1,
  minWidth: 0,
  overflow: "auto",
  p: { base: "20px", lg: "30px 48px" },
});

const rail = css({
  bg: "panel",
  borderLeftColor: "line",
  borderLeftStyle: "solid",
  borderLeftWidth: { base: "0", lg: "1px" },
  borderTopColor: "line",
  borderTopStyle: "solid",
  borderTopWidth: { base: "1px", lg: "0" },
  display: "flex",
  flex: { base: "none", lg: "0 0 296px" },
  flexDirection: "column",
  gap: "18px",
  p: "24px",
  width: { base: "auto", lg: "296px" },
});

const label = css({
  color: "faint",
  fontSize: "10px",
  letterSpacing: "0.1em",
  mb: "7px",
  textTransform: "uppercase",
});

const field = css({
  borderColor: "line",
  borderRadius: "6px",
  borderStyle: "solid",
  borderWidth: "1px",
  fontFamily: "inherit",
  fontSize: "13px",
  minW: 0,
  p: "7px 9px",
  w: "100%",
});

const titleInput = css({
  border: "none",
  color: "ink",
  fontFamily: "inherit",
  fontSize: "21px",
  fontWeight: 600,
  outline: "none",
  p: "0",
  w: "100%",
  _placeholder: { color: "faint" },
});

const bodyArea = css({
  borderColor: "line",
  borderRadius: "8px",
  borderStyle: "solid",
  borderWidth: "1px",
  color: "ink",
  fontFamily: "inherit",
  fontSize: "14px",
  lineHeight: 1.95,
  mt: "18px",
  minHeight: "360px",
  outline: "none",
  p: "14px",
  resize: "vertical",
  w: "100%",
  _focus: { borderColor: "accent" },
});

const actionLink = css({
  color: "muted",
  cursor: "pointer",
  fontSize: "11.5px",
  mt: "8px",
  textDecoration: "underline",
});

const chipWrap = css({ display: "flex", flexWrap: "wrap", gap: "6px" });

const primaryBtn = css({
  alignItems: "center",
  bg: "accent",
  border: "none",
  borderRadius: "9px",
  color: "#fff",
  cursor: "pointer",
  display: "inline-flex",
  fontSize: "12.5px",
  fontWeight: 600,
  px: "14px",
  py: "8px",
});

export const MemoEditor = ({ memo }: { memo?: MemoDetail }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(memo?.title ?? "");
  const [text, setText] = useState(memo?.body ?? "");
  const [raceDate, setRaceDate] = useState(memo?.race?.date ?? "");
  const [venue, setVenue] = useState(memo?.race?.venue ?? "");
  const [raceNumber, setRaceNumber] = useState(
    memo?.race?.number.toString() ?? ""
  );
  const [raceName, setRaceName] = useState(memo?.race?.name ?? "");
  const [tagIds, setTagIds] = useState<number[]>(
    memo?.tags.map((tag) => tag.id) ?? []
  );
  const [linkIds, setLinkIds] = useState<string[]>(
    memo?.links.map((link) => link.id) ?? []
  );

  const [newTagName, setNewTagName] = useState("");
  const [newTagKind, setNewTagKind] = useState<TagKind>("horse");
  const [refQuery, setRefQuery] = useState("");

  const tags = useQuery({
    queryFn: async () => await client.tags.list(),
    queryKey: ["tags"],
  });
  const refCandidates = useQuery({
    enabled: refQuery.trim().length > 0,
    queryFn: async () => await client.memos.list({ q: refQuery.trim() }),
    queryKey: ["memos", "ref", refQuery],
  });

  const createTag = useMutation({
    mutationFn: async () =>
      await client.tags.create({ kind: newTagKind, name: newTagName.trim() }),
    onSuccess: async (tag) => {
      setNewTagName("");
      setTagIds((prev) => [...new Set([...prev, tag.id])]);
      await queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const hasRace = raceDate !== "" && venue !== "" && raceNumber !== "";
      const payload = {
        body: text,
        linkIds,
        race: hasRace
          ? {
              date: raceDate,
              number: Number(raceNumber),
              venue,
              ...(raceName.trim() === "" ? {} : { name: raceName.trim() }),
            }
          : null,
        tagIds,
        title: title.trim() === "" ? null : title.trim(),
      };

      return memo === undefined
        ? await client.memos.create(payload)
        : await client.memos.update({ id: memo.id, ...payload });
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["memos"] });
      await queryClient.invalidateQueries({ queryKey: ["tags"] });
      await navigate({ params: { memoId: result.id }, to: "/memos/$memoId" });
    },
  });

  const tagList = tags.data ?? [];
  const selectedTags = tagList.filter((tag) => tagIds.includes(tag.id));

  return (
    <>
      <div className={topbar}>
        <button
          className={css({
            color: "muted",
            cursor: "pointer",
            fontSize: "12.5px",
          })}
          onClick={() => void navigate({ to: "/" })}
          type="button"
        >
          ← 戻る
        </button>
        {save.isError ? (
          <span className={css({ color: "danger", fontSize: "11.5px" })}>
            保存に失敗しました
          </span>
        ) : null}
        <RacButton
          className={primaryBtn}
          isDisabled={save.isPending || text.trim().length === 0}
          onPress={() => {
            save.mutate();
          }}
          style={{ marginLeft: "auto" }}
        >
          保存
        </RacButton>
      </div>

      <div className={body}>
        <div className={editorCol}>
          <input
            className={titleInput}
            onChange={(event) => {
              setTitle(event.target.value);
            }}
            placeholder="タイトル（任意）"
            value={title}
          />
          <div
            className={css({ color: "faint", fontSize: "11.5px", mt: "6px" })}
          >
            本文は Markdown。タイトルが空なら本文の1行目が見出しになる
          </div>
          <textarea
            className={bodyArea}
            onChange={(event) => {
              setText(event.target.value);
            }}
            placeholder="レースの感想、馬の観察、買い方の反省など"
            value={text}
          />
        </div>

        <aside className={rail}>
          <section>
            <div className={label}>レース</div>
            <div className={css({ display: "grid", gap: "6px" })}>
              <input
                className={field}
                onChange={(event) => {
                  setRaceDate(event.target.value);
                }}
                type="date"
                value={raceDate}
              />
              <div
                className={css({
                  display: "grid",
                  gap: "6px",
                  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 64px)",
                })}
              >
                <select
                  className={field}
                  onChange={(event) => {
                    setVenue(event.target.value);
                  }}
                  value={venue}
                >
                  <option value="">競馬場</option>
                  {VENUES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <select
                  className={field}
                  onChange={(event) => {
                    setRaceNumber(event.target.value);
                  }}
                  value={raceNumber}
                >
                  <option value="">R</option>
                  {Array.from({ length: 12 }, (_, index) => index + 1).map(
                    (number) => (
                      <option key={number} value={String(number)}>
                        {number}R
                      </option>
                    )
                  )}
                </select>
              </div>
              <input
                className={field}
                onChange={(event) => {
                  setRaceName(event.target.value);
                }}
                placeholder="レース名（任意）"
                value={raceName}
              />
            </div>
            <div
              className={css({ color: "faint", fontSize: "10.5px", mt: "6px" })}
            >
              3つそろえるとレースページができます
            </div>
          </section>

          <section>
            <div className={label}>タグ</div>
            <div className={chipWrap}>
              {selectedTags.map((tag) => (
                <TagChip
                  key={tag.id}
                  onRemove={() => {
                    setTagIds((prev) => prev.filter((id) => id !== tag.id));
                  }}
                  tag={tag}
                />
              ))}
            </div>
            <div
              className={css({
                display: "flex",
                flexWrap: "wrap",
                gap: "4px",
                mt: "10px",
              })}
            >
              {tagList
                .filter((tag) => !tagIds.includes(tag.id))
                .slice(0, 12)
                .map((tag) => (
                  <button
                    className={css({ cursor: "pointer", opacity: 0.85 })}
                    key={tag.id}
                    onClick={() => {
                      setTagIds((prev) => [...prev, tag.id]);
                    }}
                    type="button"
                  >
                    <TagChip tag={tag} />
                  </button>
                ))}
            </div>
            <div className={css({ display: "flex", gap: "4px", mt: "10px" })}>
              <input
                className={field}
                onChange={(event) => {
                  setNewTagName(event.target.value);
                }}
                placeholder="新しいタグ"
                value={newTagName}
              />
              <select
                className={field}
                onChange={(event) => {
                  setNewTagKind(event.target.value as TagKind);
                }}
                value={newTagKind}
              >
                {(["horse", "person", "theme"] as const).map((kind) => (
                  <option key={kind} value={kind}>
                    {KIND_LABEL[kind]}
                  </option>
                ))}
              </select>
              <button
                className={css({
                  color: "accent",
                  cursor: "pointer",
                  fontSize: "12px",
                })}
                disabled={newTagName.trim() === "" || createTag.isPending}
                onClick={() => {
                  createTag.mutate();
                }}
                type="button"
              >
                追加
              </button>
            </div>
          </section>

          <section>
            <div className={label}>参照</div>
            <div
              className={css({
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              })}
            >
              {linkIds.map((id) => (
                <div
                  className={css({
                    alignItems: "center",
                    display: "flex",
                    fontSize: "12px",
                    gap: "6px",
                  })}
                  key={id}
                >
                  <span className={css({ color: "faint", fontSize: "10.5px" })}>
                    →
                  </span>
                  <span
                    className={css({
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    })}
                  >
                    {id}
                  </span>
                  <button
                    className={css({ color: "faint", cursor: "pointer" })}
                    onClick={() => {
                      setLinkIds((prev) => prev.filter((item) => item !== id));
                    }}
                    type="button"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <input
              className={field}
              onChange={(event) => {
                setRefQuery(event.target.value);
              }}
              placeholder="メモを検索して参照を追加"
              value={refQuery}
            />
            {(refCandidates.data?.items ?? [])
              .filter(
                (item) => item.id !== memo?.id && !linkIds.includes(item.id)
              )
              .slice(0, 5)
              .map((item) => (
                <button
                  className={actionLink}
                  key={item.id}
                  onClick={() => {
                    setLinkIds((prev) => [...prev, item.id]);
                    setRefQuery("");
                  }}
                  style={{ display: "block", textAlign: "left" }}
                  type="button"
                >
                  ＋ {item.heading}
                </button>
              ))}
          </section>

          {memo === undefined ? null : (
            <div className={css({ mt: "auto" })}>
              <div className={label}>投稿</div>
              <div className={css({ fontSize: "11.5px" })}>
                {new Date(memo.createdAt).toLocaleString("ja-JP", {
                  timeZone: "Asia/Tokyo",
                })}
              </div>
            </div>
          )}
        </aside>
      </div>
    </>
  );
};
