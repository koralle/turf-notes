import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { MemoDetail, MemoRef } from "@turf-notes/api-contract/schemas";
import { defaultTagKind, tagKinds, venues } from "@turf-notes/domain";
import type { TagId, TagKind } from "@turf-notes/domain";
import { useState } from "react";
import { Button as RacButton } from "react-aria-components";
import { css } from "styled-system/css";

import { kindLabels } from "../lib/tag-kind";
import { client, errorCode } from "../rpc/client";
import { InlineError } from "./inline-error";
import { MobileHeader } from "./mobile-header";
import { TagChip } from "./tag-chip";

const root = css({
  display: "flex",
  flex: 1,
  flexDirection: "column",
  minHeight: 0,
});

const topbar = css({
  alignItems: "center",
  bg: "panel",
  borderBottomColor: "line",
  borderBottomStyle: "solid",
  borderBottomWidth: "1px",
  display: { base: "none", md: "flex" },
  gap: "12px",
  px: "32px",
  py: "11px",
});

const scrollArea = css({
  display: "flex",
  flex: 1,
  flexDirection: "column",
  minHeight: 0,
  overflow: { base: "auto", lg: "hidden" },
});

const body = css({
  display: "flex",
  flex: { base: "none", lg: 1 },
  flexDirection: { base: "column", lg: "row" },
  minHeight: 0,
});

const editorCol = css({
  flex: 1,
  minWidth: 0,
  overflow: { base: "visible", lg: "auto" },
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

const hint = css({ color: "faint", fontSize: "10.5px", mt: "6px" });

const field = css({
  borderColor: "line",
  borderRadius: "6px",
  borderStyle: "solid",
  borderWidth: "1px",
  fontFamily: "inherit",
  fontSize: { base: "16px", md: "13px" },
  minH: { base: "44px", md: "auto" },
  minW: 0,
  p: "7px 9px",
  w: "100%",
});

const raceKeyGrid = css({
  display: "grid",
  gap: "6px",
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 64px)",
});

const fieldStack = css({ display: "grid", gap: "6px" });

const titleInput = css({
  bg: "bg",
  border: "none",
  color: "ink",
  fontFamily: "inherit",
  fontSize: { base: "19px", md: "21px" },
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
  fontSize: { base: "16px", md: "14px" },
  lineHeight: 1.95,
  mt: "18px",
  minHeight: { base: "320px", md: "360px" },
  outline: "none",
  p: "14px",
  resize: { base: "none", md: "vertical" },
  w: "100%",
  _focus: { borderColor: "accent" },
});

const actionLink = css({
  alignItems: "center",
  color: "muted",
  cursor: "pointer",
  display: "flex",
  fontSize: { base: "13px", md: "11.5px" },
  minH: { base: "40px", md: "auto" },
  mt: "8px",
  textAlign: "left",
  textDecoration: "underline",
  w: "100%",
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

const mobileBar = css({
  bg: "panel",
  borderTopColor: "line",
  borderTopStyle: "solid",
  borderTopWidth: "1px",
  display: { base: "block", md: "none" },
  flex: "0 0 auto",
  p: "10px 18px",
});

const primaryBtnFull = css({
  alignItems: "center",
  bg: "accent",
  border: "none",
  borderRadius: "10px",
  color: "#fff",
  cursor: "pointer",
  display: "flex",
  fontSize: "15px",
  fontWeight: 600,
  h: "48px",
  justifyContent: "center",
  w: "100%",
});

const saveErrorSpacing = css({
  mb: "6px",
  textAlign: "center",
});

const refItem = css({
  alignItems: "center",
  borderBottomColor: "line",
  borderBottomStyle: "solid",
  borderBottomWidth: { base: "1px", md: "0" },
  display: "flex",
  fontSize: "12px",
  gap: "6px",
  minH: { base: "42px", md: "auto" },
});

const refArrow = css({ color: "faint", fontSize: "10.5px" });

const refName = css({
  flex: 1,
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

const refRemove = css({
  alignItems: "center",
  color: "faint",
  cursor: "pointer",
  display: "flex",
  h: { base: "44px", md: "auto" },
  justifyContent: "center",
  w: { base: "32px", md: "auto" },
});

const tagAddButton = css({
  color: "accent",
  cursor: "pointer",
  flexShrink: 0,
  fontSize: "12px",
  minH: { base: "44px", md: "auto" },
  px: { base: "4px", md: "0" },
});

/** レースの3つ組とレース名。3つそろったときだけレースページができる。 */
const RaceFields = ({
  date,
  name,
  number,
  onDateChange,
  onNameChange,
  onNumberChange,
  onVenueChange,
  venue,
}: {
  date: string;
  name: string;
  number: string;
  onDateChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onNumberChange: (value: string) => void;
  onVenueChange: (value: string) => void;
  venue: string;
}) => (
  <section>
    <div className={label}>レース</div>
    <div className={fieldStack}>
      <input
        aria-label="開催日"
        name="raceDate"
        className={field}
        onChange={(event) => {
          onDateChange(event.target.value);
        }}
        type="date"
        value={date}
      />
      <div className={raceKeyGrid}>
        <select
          aria-label="競馬場"
          name="venue"
          className={field}
          onChange={(event) => {
            onVenueChange(event.target.value);
          }}
          value={venue}
        >
          <option value="">競馬場</option>
          {venues.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          aria-label="レース番号"
          name="raceNumber"
          className={field}
          onChange={(event) => {
            onNumberChange(event.target.value);
          }}
          value={number}
        >
          <option value="">R</option>
          {Array.from({ length: 12 }, (_, index) => index + 1).map((item) => (
            <option key={item} value={String(item)}>
              {item}R
            </option>
          ))}
        </select>
      </div>
      <input
        aria-label="レース名"
        name="raceName"
        className={field}
        onChange={(event) => {
          onNameChange(event.target.value);
        }}
        placeholder="レース名（任意）"
        value={name}
      />
    </div>
    <div className={hint}>3つそろえるとレースページができます</div>
  </section>
);

/** タグの選択と新規作成。選択状態は保存に使うので親が持つ。 */
const TagSection = ({
  onAdd,
  onRemove,
  selectedIds,
}: {
  onAdd: (id: TagId) => void;
  onRemove: (id: TagId) => void;
  selectedIds: TagId[];
}) => {
  const queryClient = useQueryClient();
  const [newTagName, setNewTagName] = useState("");
  const [newTagKind, setNewTagKind] = useState<TagKind>(defaultTagKind);

  const tags = useQuery({
    queryFn: async () => await client.tags.list(),
    queryKey: ["tags"],
  });

  const createTag = useMutation({
    mutationFn: async () =>
      await client.tags.create({ kind: newTagKind, name: newTagName.trim() }),
    onSuccess: async (tag) => {
      setNewTagName("");
      onAdd(tag.id);
      await queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });

  const tagList = tags.data ?? [];
  const selectedIdSet = new Set(selectedIds);

  return (
    <section>
      <div className={label}>タグ</div>
      <div className={chipWrap}>
        {tagList
          .filter((tag) => selectedIdSet.has(tag.id))
          .map((tag) => (
            <TagChip
              key={tag.id}
              onRemove={() => {
                onRemove(tag.id);
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
          .filter((tag) => !selectedIdSet.has(tag.id))
          .slice(0, 12)
          .map((tag) => (
            <button
              className={css({ cursor: "pointer", opacity: 0.85 })}
              key={tag.id}
              onClick={() => {
                onAdd(tag.id);
              }}
              type="button"
            >
              <TagChip tag={tag} />
            </button>
          ))}
      </div>
      <div className={css({ display: "flex", gap: "4px", mt: "10px" })}>
        <input
          aria-label="新しいタグ名"
          name="newTagName"
          className={field}
          onChange={(event) => {
            setNewTagName(event.target.value);
          }}
          placeholder="新しいタグ"
          value={newTagName}
        />
        <select
          aria-label="タグの種類"
          name="tagKind"
          className={field}
          onChange={(event) => {
            setNewTagKind(event.target.value as TagKind);
          }}
          value={newTagKind}
        >
          {tagKinds.map((kind) => (
            <option key={kind} value={kind}>
              {kindLabels[kind]}
            </option>
          ))}
        </select>
        <button
          className={tagAddButton}
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
  );
};

/** 参照するメモの検索と選択。選択済みの参照は保存に使うので親が持つ。 */
const ReferenceSection = ({
  links,
  memoId,
  onAdd,
  onRemove,
}: {
  links: MemoRef[];
  memoId: string | undefined;
  onAdd: (link: MemoRef) => void;
  onRemove: (id: MemoRef["id"]) => void;
}) => {
  const [refQuery, setRefQuery] = useState("");

  const refCandidates = useQuery({
    enabled: refQuery.trim().length > 0,
    queryFn: async () => await client.memos.list({ q: refQuery.trim() }),
    queryKey: ["memos", "ref", refQuery],
  });

  return (
    <section>
      <div className={label}>参照</div>
      <div className={css({ display: "flex", flexDirection: "column" })}>
        {links.map((link) => (
          <div className={refItem} key={link.id}>
            <span className={refArrow}>→</span>
            <span className={refName}>{link.heading}</span>
            <button
              aria-label={`${link.heading} を外す`}
              className={refRemove}
              onClick={() => {
                onRemove(link.id);
              }}
              type="button"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <input
        aria-label="参照するメモを検索"
        name="refQuery"
        className={field}
        onChange={(event) => {
          setRefQuery(event.target.value);
        }}
        placeholder="メモを検索して参照を追加"
        value={refQuery}
      />
      {(refCandidates.data?.items ?? [])
        .filter(
          (item) =>
            item.id !== memoId && !links.some((link) => link.id === item.id)
        )
        .slice(0, 5)
        .map((item) => (
          <button
            className={actionLink}
            key={item.id}
            onClick={() => {
              onAdd({ heading: item.heading, id: item.id });
              setRefQuery("");
            }}
            type="button"
          >
            ＋ {item.heading}
          </button>
        ))}
    </section>
  );
};

export const MemoEditor = ({ memo }: { memo?: MemoDetail }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(memo?.title ?? "");
  const [text, setText] = useState(memo?.body ?? "");
  const [raceDate, setRaceDate] = useState(memo?.race?.date ?? "");
  const [venue, setVenue] = useState(memo?.race?.venue ?? "");
  const [raceNumber, setRaceNumber] = useState(
    () => memo?.race?.number.toString() ?? ""
  );
  const [raceName, setRaceName] = useState(memo?.race?.name ?? "");
  const [tagIds, setTagIds] = useState<TagId[]>(
    () => memo?.tags.map((tag) => tag.id) ?? []
  );
  const [links, setLinks] = useState<MemoRef[]>(memo?.links ?? []);

  const save = useMutation({
    mutationFn: async () => {
      // 3つ組がそろっているかだけを見る。値の検証は契約（サーバー）に任せる。
      const venueParam = venues.find((item) => item === venue);
      const payload = {
        body: text,
        linkIds: links.map((link) => link.id),
        race:
          raceDate === "" || venueParam === undefined || raceNumber === ""
            ? null
            : {
                date: raceDate,
                number: Number(raceNumber),
                venue: venueParam,
                ...(raceName.trim() === "" ? {} : { name: raceName.trim() }),
              },
        tagIds,
        title: title.trim() === "" ? null : title.trim(),
      };

      return memo === undefined
        ? await client.memos.create(payload)
        : await client.memos.update({
            id: memo.id,
            version: memo.version,
            ...payload,
          });
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["memos"] });
      await queryClient.invalidateQueries({ queryKey: ["tags"] });
      await navigate({ params: { memoId: result.id }, to: "/memos/$memoId" });
    },
  });

  const addTag = (id: TagId) => {
    setTagIds((prev) => [...new Set([...prev, id])]);
  };
  const removeTag = (id: TagId) => {
    setTagIds((prev) => prev.filter((item) => item !== id));
  };
  const addLink = (link: MemoRef) => {
    setLinks((prev) => [...prev, link]);
  };
  const removeLink = (id: MemoRef["id"]) => {
    setLinks((prev) => prev.filter((item) => item.id !== id));
  };

  // 他の画面で先に保存されていたら、こちらの内容は上書きせずに知らせる。
  const saveErrorMessage =
    errorCode(save.error) === "memo-conflict"
      ? "他の画面で更新されています。読み込み直してください"
      : "保存に失敗しました";

  return (
    <div className={root}>
      <MobileHeader
        onBack={() => void navigate({ to: "/" })}
        title={memo === undefined ? "新規メモ" : "メモを編集"}
      />
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
        {save.isError ? <InlineError>{saveErrorMessage}</InlineError> : null}
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

      <div className={scrollArea}>
        <div className={body}>
          <div className={editorCol}>
            <input
              aria-label="タイトル"
              name="title"
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
              aria-label="本文"
              name="body"
              className={bodyArea}
              onChange={(event) => {
                setText(event.target.value);
              }}
              placeholder="レースの感想、馬の観察、買い方の反省など"
              value={text}
            />
          </div>

          <aside className={rail}>
            <RaceFields
              date={raceDate}
              name={raceName}
              number={raceNumber}
              onDateChange={setRaceDate}
              onNameChange={setRaceName}
              onNumberChange={setRaceNumber}
              onVenueChange={setVenue}
              venue={venue}
            />
            <TagSection
              onAdd={addTag}
              onRemove={removeTag}
              selectedIds={tagIds}
            />
            <ReferenceSection
              links={links}
              memoId={memo?.id}
              onAdd={addLink}
              onRemove={removeLink}
            />

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
      </div>

      <div
        className={mobileBar}
        style={{ paddingBottom: "calc(10px + env(safe-area-inset-bottom))" }}
      >
        {save.isError ? (
          <InlineError className={saveErrorSpacing}>
            {saveErrorMessage}
          </InlineError>
        ) : null}
        <RacButton
          className={primaryBtnFull}
          isDisabled={save.isPending || text.trim().length === 0}
          onPress={() => {
            save.mutate();
          }}
        >
          保存
        </RacButton>
      </div>
    </div>
  );
};
