import { createRouterClient } from "@orpc/server";
import { raceKeySchema } from "@turf-notes/domain";
import * as v from "valibot";
import { expect } from "vitest";

import { test } from "../../api.fixture";
import type { RouterKit } from "../base";
import { createTagsRouter } from "../tags";
import { createMemosRouter } from "./index";

const memosOf = (kit: RouterKit, headers: Headers) =>
  createRouterClient(createMemosRouter(kit), { context: { headers } });

const tagsOf = (kit: RouterKit, headers: Headers) =>
  createRouterClient(createTagsRouter(kit), { context: { headers } });

test("作成したメモは一覧に出る", async ({ kit, ownerHeaders }) => {
  const memos = memosOf(kit, ownerHeaders);

  const { id } = await memos.create({ body: "道中で力みが出た。" });

  expect((await memos.list({})).items.map((item) => item.id)).toStrictEqual([
    id,
  ]);
});

test("作成したメモは詳細で読める", async ({ kit, ownerHeaders }) => {
  const memos = memosOf(kit, ownerHeaders);

  const { id } = await memos.create({ body: "道中で力みが出た。" });
  const detail = await memos.detail({ id });

  expect(detail.body).toBe("道中で力みが出た。");
  expect(detail.version).toBe(0);
});

test("更新すると本文が変わり版番号が1増える", async ({ kit, ownerHeaders }) => {
  const memos = memosOf(kit, ownerHeaders);

  const { id } = await memos.create({ body: "道中で力みが出た。" });

  await expect(
    memos.update({ body: "道中で力みが出た。直線で伸びた。", id, version: 0 })
  ).resolves.toStrictEqual({ id });

  const detail = await memos.detail({ id });
  expect(detail.body).toBe("道中で力みが出た。直線で伸びた。");
  expect(detail.version).toBe(1);
});

test("更新でレース情報も差し替わる", async ({ kit, ownerHeaders }) => {
  const memos = memosOf(kit, ownerHeaders);

  const race = v.parse(raceKeySchema, {
    date: "2026-11-02",
    number: 11,
    venue: "東京",
  });

  const { id } = await memos.create({ body: "本文", race });
  const { version } = await memos.detail({ id });

  await memos.update({
    body: "本文",
    id,
    race: { ...race, number: 12 },
    version,
  });

  expect((await memos.detail({ id })).race).toStrictEqual({
    ...race,
    number: 12,
  });
});

test("削除すると一覧から消える", async ({ kit, ownerHeaders }) => {
  const memos = memosOf(kit, ownerHeaders);

  const { id } = await memos.create({ body: "消すメモ。" });

  await expect(memos.delete({ id })).resolves.toStrictEqual({ ok: true });

  expect((await memos.list({})).items).toStrictEqual([]);
});

test("古い版番号で保存すると memo-conflict", async ({ kit, ownerHeaders }) => {
  const memos = memosOf(kit, ownerHeaders);

  const { id } = await memos.create({ body: "版番号のテスト。" });
  await memos.update({ body: "1回目。", id, version: 0 });

  await expect(
    memos.update({ body: "2回目。", id, version: 0 })
  ).rejects.toMatchObject({ code: "memo-conflict" });
});

test("他人のメモは見えない（memo-not-found）", async ({
  kit,
  ownerHeaders,
  strangerHeaders,
}) => {
  const mine = memosOf(kit, ownerHeaders);
  const theirs = memosOf(kit, strangerHeaders);

  const { id } = await mine.create({ body: "他人には見えない。" });

  await expect(theirs.detail({ id })).rejects.toMatchObject({
    code: "memo-not-found",
  });
  expect((await theirs.list({})).items).toStrictEqual([]);
});

test("他人のメモは削除できない（memo-not-found）", async ({
  kit,
  ownerHeaders,
  strangerHeaders,
}) => {
  const mine = memosOf(kit, ownerHeaders);
  const theirs = memosOf(kit, strangerHeaders);

  const { id } = await mine.create({ body: "持ち主のメモ。" });

  await expect(theirs.delete({ id })).rejects.toMatchObject({
    code: "memo-not-found",
  });
  expect((await mine.detail({ id })).body).toBe("持ち主のメモ。");
});

test("入力が contract に合わなければ拒否される", async ({
  kit,
  ownerHeaders,
}) => {
  const memos = memosOf(kit, ownerHeaders);

  await expect(memos.detail({ id: "" })).rejects.toThrow(
    /Input validation failed/u
  );
});

test("更新でタグと参照を外せる", async ({ kit, ownerHeaders }) => {
  const memos = memosOf(kit, ownerHeaders);
  const tags = tagsOf(kit, ownerHeaders);

  const tag = await tags.create({ kind: "horse", name: "ソダシ" });
  const target = await memos.create({ body: "参照先" });

  const { id } = await memos.create({
    body: "参照元",
    linkIds: [target.id],
    tagIds: [tag.id],
  });

  const before = await memos.detail({ id });
  expect(before.tags.map((item) => item.id)).toStrictEqual([tag.id]);
  expect(before.links.map((item) => item.id)).toStrictEqual([target.id]);

  await memos.update({ body: "参照元", id, version: before.version });

  const after = await memos.detail({ id });
  expect(after.tags).toStrictEqual([]);
  expect(after.links).toStrictEqual([]);
  expect(after.linkCount).toBe(0);
});

test("同じレースのメモだけを forRace で返す", async ({ kit, ownerHeaders }) => {
  const memos = memosOf(kit, ownerHeaders);

  const race = v.parse(raceKeySchema, {
    date: "2026-11-02",
    number: 11,
    venue: "東京",
  });

  const same = await memos.create({
    body: "同じレース",
    race: { ...race, name: "天皇賞（秋）" },
  });

  await memos.create({ body: "別の競馬場", race: { ...race, venue: "京都" } });
  await memos.create({ body: "別のレース番号", race: { ...race, number: 12 } });

  expect(
    (await memos.forRace(race)).items.map((item) => item.id)
  ).toStrictEqual([same.id]);
});

test("タグ名でもメモを探せる（FR-L3）", async ({ kit, ownerHeaders }) => {
  const memos = memosOf(kit, ownerHeaders);
  const tags = tagsOf(kit, ownerHeaders);

  const tag = await tags.create({ kind: "horse", name: "ソダシ" });

  const { id } = await memos.create({
    body: "本文に馬名はない",
    tagIds: [tag.id],
  });

  expect(
    (await memos.list({ q: "ソダシ" })).items.map((item) => item.id)
  ).toStrictEqual([id]);
});

test.for(["%", "_"])(
  "検索語の %s はワイルドカードにならない",
  async (wildcard, { kit, ownerHeaders }) => {
    const memos = memosOf(kit, ownerHeaders);

    await memos.create({ body: `記号 ${wildcard} を含む` });
    await memos.create({ body: "ふつうの本文" });

    expect((await memos.list({ q: wildcard })).items).toHaveLength(1);
  }
);
