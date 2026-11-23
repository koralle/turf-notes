import { createRouterClient } from "@orpc/server";
import { expect } from "vitest";

import type { RouterKit } from "../base";
import { test } from "../rpc.fixture";
import { createTagsRouter } from "../tags";
import { createMemosRouter } from "./index";

const memosOf = (kit: RouterKit, headers: Headers) =>
  createRouterClient(createMemosRouter(kit), { context: { headers } });

const tagsOf = (kit: RouterKit, headers: Headers) =>
  createRouterClient(createTagsRouter(kit), { context: { headers } });

test("作成・一覧・詳細・更新が一続きで通る", async ({ kit, ownerHeaders }) => {
  const memos = memosOf(kit, ownerHeaders);

  const { id } = await memos.create({ body: "道中で力みが出た。" });

  const list = await memos.list({});
  expect(list.items.map((item) => item.id)).toStrictEqual([id]);

  const detail = await memos.detail({ id });
  expect(detail.body).toBe("道中で力みが出た。");
  expect(detail.version).toBe(0);

  await expect(
    memos.update({ body: "道中で力みが出た。直線で伸びた。", id, version: 0 })
  ).resolves.toStrictEqual({ id });

  expect((await memos.detail({ id })).version).toBe(1);
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

test("入力が contract に合わなければ拒否される", async ({
  kit,
  ownerHeaders,
}) => {
  const memos = memosOf(kit, ownerHeaders);

  await expect(memos.detail({ id: "" })).rejects.toThrow(
    /Input validation failed/u
  );
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

test("検索語の % はワイルドカードにならない", async ({ kit, ownerHeaders }) => {
  const memos = memosOf(kit, ownerHeaders);

  await memos.create({ body: "100% 的中させる" });
  await memos.create({ body: "ふつうの本文" });

  expect((await memos.list({ q: "%" })).items).toHaveLength(1);
});
