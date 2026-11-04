import { oc } from "@orpc/contract";
import { memoIdSchema, tagIdSchema } from "@turf-notes/domain";
import * as v from "valibot";

import {
  authMethodsSchema,
  exportDataSchema,
  memoCreateInputSchema,
  memoDetailSchema,
  memoListInputSchema,
  memoListOutputSchema,
  memoSummarySchema,
  memoUpdateInputSchema,
  raceKeySchema,
  tagCreateInputSchema,
  tagSummarySchema,
  tagWithCountSchema,
  userSchema,
} from "./schemas";

/** 認証済みの手続き。未認証は UNAUTHORIZED を返す。 */
const authed = oc.errors({
  UNAUTHORIZED: { status: 401 },
  "memo-not-found": { status: 404 },
  "tag-not-found": { status: 404 },
  // パスキーが1つも無い状態ではパスワードサインインを無効化できない（ADR-0002）。
  "no-passkey": { status: 409 },
});

const okSchema = v.object({ ok: v.literal(true) });

export const contract = {
  health: oc.output(okSchema),

  me: authed.output(userSchema),

  memos: {
    list: authed.input(memoListInputSchema).output(memoListOutputSchema),
    detail: authed
      .input(v.object({ id: memoIdSchema }))
      .output(memoDetailSchema),
    create: authed
      .input(memoCreateInputSchema)
      .output(v.object({ id: memoIdSchema })),
    update: authed
      .input(memoUpdateInputSchema)
      .output(v.object({ id: memoIdSchema })),
    delete: authed.input(v.object({ id: memoIdSchema })).output(okSchema),
    /** 同じ開催日・競馬場・レース番号のメモ（レースページ）。 */
    forRace: authed
      .input(raceKeySchema)
      .output(v.object({ items: v.array(memoSummarySchema) })),
  },

  auth: {
    /** パスワードサインインが有効か、パスキーが登録済みか。サインイン画面が使う。 */
    methods: oc.output(authMethodsSchema),
  },

  settings: {
    setPasswordSignIn: authed
      .input(v.object({ enabled: v.boolean() }))
      .output(okSchema),
  },

  exportAll: authed.output(exportDataSchema),

  tags: {
    list: authed.output(v.array(tagWithCountSchema)),
    create: authed.input(tagCreateInputSchema).output(tagSummarySchema),
    remove: authed.input(v.object({ id: tagIdSchema })).output(okSchema),
  },
} as const;

export type ApiContract = typeof contract;
