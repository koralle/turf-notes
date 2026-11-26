import { implement } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { contract } from "@turf-notes/api-contract";
import type {
  MemoDetail,
  MemoSummary,
  TagWithCount,
} from "@turf-notes/api-contract/schemas";
import type { User } from "@turf-notes/domain";
import { memoId, raceOf, tagId, userId } from "@turf-notes/domain";
import { http } from "msw/http";

export const mockImpl = implement(contract);

const DEFAULT_CREATED_AT = Date.parse("2026-11-02T18:24:00+09:00");

export const defaultUser: User = {
  email: "turf@example.com",
  id: userId("user-1"),
  name: "Turf User",
};

const defaultTags: TagWithCount[] = [
  {
    id: tagId(1),
    kind: "horse",
    lastUsedAt: DEFAULT_CREATED_AT,
    memoCount: 2,
    name: "ソダシ",
  },
  {
    id: tagId(2),
    kind: "person",
    lastUsedAt: DEFAULT_CREATED_AT - 3_600_000,
    memoCount: 1,
    name: "武豊",
  },
  {
    id: tagId(3),
    kind: "theme",
    lastUsedAt: DEFAULT_CREATED_AT - 7_200_000,
    memoCount: 2,
    name: "展開",
  },
];

export const sodashiMemo: MemoSummary = {
  createdAt: DEFAULT_CREATED_AT,
  excerpt: "道中で力みが出て、折り合いを欠いた。",
  heading: "ソダシは道中で力みが出た",
  id: memoId("01a175cd-b61e-7992-8d03-54303f56c654"),
  linkCount: 2,
  race: raceOf({
    date: "2026-11-02",
    name: "天皇賞(秋)",
    number: 11,
    venue: "東京",
  }),
  tags: [
    { id: tagId(1), kind: "horse", name: "ソダシ" },
    { id: tagId(3), kind: "theme", name: "展開" },
  ],
  title: "ソダシは道中で力みが出た",
};

const sanrenpukuMemo: MemoSummary = {
  createdAt: Date.parse("2026-10-26T09:00:00+09:00"),
  excerpt:
    "三連複の1点あたりの金額が多すぎる。的中率ではなく回収率で見るべき。",
  heading: "三連複の1点あたりの金額が多すぎる",
  id: memoId("01a175cd-b66d-7d8c-ab56-99e9e46cfefc"),
  linkCount: 1,
  race: null,
  tags: [{ id: tagId(3), kind: "theme", name: "展開" }],
  title: null,
};

export const defaultMemos: MemoSummary[] = [sodashiMemo, sanrenpukuMemo];

export const defaultMemoDetail: MemoDetail = {
  ...sodashiMemo,
  backlinks: [],
  body: "道中で力みが出て、折り合いを欠いた。\n\n- 次走は距離短縮で見直し",
  links: [{ heading: sanrenpukuMemo.heading, id: sanrenpukuMemo.id }],
  version: 1,
};

const baseProcedures = {
  auth: {
    methods: mockImpl.auth.methods.handler(() => ({
      hasPasskey: true,
      passwordSignInEnabled: false,
    })),
  },
  exportAll: mockImpl.exportAll.handler(() => ({
    exportedAt: DEFAULT_CREATED_AT,
    memos: [],
    tags: [],
    user: defaultUser,
  })),
  health: mockImpl.health.handler(() => ({ ok: true })),
  me: mockImpl.me.handler(() => defaultUser),
  memos: {
    create: mockImpl.memos.create.handler(() => ({
      id: memoId("01a175cd-b61e-7992-8d03-54303f56c699"),
    })),
    delete: mockImpl.memos.delete.handler(() => ({ ok: true })),
    detail: mockImpl.memos.detail.handler(({ errors, input }) => {
      if (input.id === defaultMemoDetail.id) {
        return defaultMemoDetail;
      }

      throw errors["memo-not-found"]();
    }),
    forRace: mockImpl.memos.forRace.handler(() => ({ items: [] })),
    list: mockImpl.memos.list.handler(() => ({
      items: defaultMemos,
      nextCursor: null,
    })),
    update: mockImpl.memos.update.handler(({ input }) => ({ id: input.id })),
  },
  settings: {
    setPasswordSignIn: mockImpl.settings.setPasswordSignIn.handler(() => ({
      ok: true,
    })),
  },
  tags: {
    create: mockImpl.tags.create.handler(({ input }) => ({
      id: tagId(100),
      kind: input.kind,
      name: input.name,
    })),
    list: mockImpl.tags.list.handler(() => defaultTags),
  },
};

export interface RpcMockOverrides {
  auth?: Partial<typeof baseProcedures.auth>;
  exportAll?: typeof baseProcedures.exportAll;
  health?: typeof baseProcedures.health;
  me?: typeof baseProcedures.me;
  memos?: Partial<typeof baseProcedures.memos>;
  settings?: Partial<typeof baseProcedures.settings>;
  tags?: Partial<typeof baseProcedures.tags>;
}

/**
 * contract 準拠の RPCHandler を通して `/rpc/*` をモックする MSW ハンドラを作る。
 * Story ごとに差し替えたい手続きだけを `overrides` で上書きできる。
 */
export const rpcMockHandler = (overrides: RpcMockOverrides = {}) => {
  const router = mockImpl.router({
    ...baseProcedures,
    ...overrides,
    auth: { ...baseProcedures.auth, ...overrides.auth },
    memos: { ...baseProcedures.memos, ...overrides.memos },
    settings: { ...baseProcedures.settings, ...overrides.settings },
    tags: { ...baseProcedures.tags, ...overrides.tags },
  });

  const rpcHandler = new RPCHandler(router);

  return http.post("/rpc/*", async ({ request }) => {
    const { matched, response } = await rpcHandler.handle(request, {
      prefix: "/rpc",
    });

    return matched ? response : new Response("Not Found", { status: 404 });
  });
};
