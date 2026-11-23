import { createRouterClient } from "@orpc/server";
import { expect } from "vitest";

import type { RouterKit } from "../base";
import { createMemosRouter } from "../memos";
import { test } from "../rpc.fixture";
import { createExportRouter } from "./index";

const exportOf = (kit: RouterKit, headers: Headers) =>
  createRouterClient(createExportRouter(kit), { context: { headers } });

const memosOf = (kit: RouterKit, headers: Headers) =>
  createRouterClient(createMemosRouter(kit), { context: { headers } });

test("参照先を削除すると linkIds から消える", async ({ kit, ownerHeaders }) => {
  const memos = memosOf(kit, ownerHeaders);
  const exported = exportOf(kit, ownerHeaders);

  const target = await memos.create({ body: "参照先" });

  const source = await memos.create({
    body: "参照元",
    linkIds: [target.id],
  });

  await memos.delete({ id: target.id });

  const dump = await exported.exportAll();
  expect(
    dump.memos.find((memo) => memo.id === source.id)?.linkIds
  ).toStrictEqual([]);
});
