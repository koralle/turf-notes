import { createRouterClient } from "@orpc/server";
import { memos as memoTable } from "@turf-notes/db/schema";
import { eq } from "drizzle-orm";
import { expect } from "vitest";

import { testDb } from "../../test-db";
import type { RouterKit } from "../base";
import { createMemosRouter } from "../memos";
import { test } from "../rpc.fixture";
import { createTagsRouter } from "./index";

const memosOf = (kit: RouterKit, headers: Headers) =>
  createRouterClient(createMemosRouter(kit), { context: { headers } });

const tagsOf = (kit: RouterKit, headers: Headers) =>
  createRouterClient(createTagsRouter(kit), { context: { headers } });

test("メモを削除するとタグの件数が減る", async ({ kit, ownerHeaders }) => {
  const memos = memosOf(kit, ownerHeaders);
  const tags = tagsOf(kit, ownerHeaders);

  const tag = await tags.create({ kind: "theme", name: "展開" });

  const { id } = await memos.create({ body: "本文", tagIds: [tag.id] });

  const countOf = async () =>
    (await tags.list()).find((item) => item.id === tag.id)?.memoCount;

  await expect(countOf()).resolves.toBe(1);
  await memos.delete({ id });
  await expect(countOf()).resolves.toBe(0);
});

test("lastUsedAt は削除されていない最新メモの作成日時になり、0件なら null", async ({
  kit,
  ownerHeaders,
}) => {
  const memos = memosOf(kit, ownerHeaders);
  const tags = tagsOf(kit, ownerHeaders);

  const tag = await tags.create({ kind: "horse", name: "ソダシ" });

  const findTag = async () =>
    (await tags.list()).find((item) => item.id === tag.id);

  await expect(findTag()).resolves.toMatchObject({
    lastUsedAt: null,
    memoCount: 0,
  });

  const first = await memos.create({ body: "1つ目のメモ", tagIds: [tag.id] });

  const firstDetail = await memos.detail({ id: first.id });

  await expect(findTag()).resolves.toMatchObject({
    lastUsedAt: firstDetail.createdAt,
    memoCount: 1,
  });

  const olderCreatedAt = firstDetail.createdAt - 10_000;
  await testDb
    .update(memoTable)
    .set({ createdAt: new Date(olderCreatedAt) })
    .where(eq(memoTable.id, first.id));

  const second = await memos.create({ body: "2つ目のメモ", tagIds: [tag.id] });

  const secondDetail = await memos.detail({ id: second.id });

  await expect(findTag()).resolves.toMatchObject({
    lastUsedAt: secondDetail.createdAt,
    memoCount: 2,
  });

  await memos.delete({ id: second.id });

  await expect(findTag()).resolves.toMatchObject({
    lastUsedAt: olderCreatedAt,
    memoCount: 1,
  });

  await memos.delete({ id: first.id });

  await expect(findTag()).resolves.toMatchObject({
    lastUsedAt: null,
    memoCount: 0,
  });
});

test("他人のタグは付けられない（tag-not-found）", async ({
  kit,
  ownerHeaders,
  strangerHeaders,
}) => {
  const mine = memosOf(kit, ownerHeaders);
  const theirs = tagsOf(kit, strangerHeaders);

  const foreign = await theirs.create({ kind: "horse", name: "他人の馬" });

  await expect(
    mine.create({ body: "本文", tagIds: [foreign.id] })
  ).rejects.toMatchObject({ code: "tag-not-found" });
});
