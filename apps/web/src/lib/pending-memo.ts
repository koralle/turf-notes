import type { MemoSummary } from "@turf-notes/api-contract/schemas";
import { excerptOf, headingOf, memoId } from "@turf-notes/domain";

/**
 * 保存が終わるまで一覧に出す行。見出しと抜粋はサーバーと同じ関数で作る。
 * 契約（memoSummarySchema）を満たすことは pending-memo.test.ts で確認する。
 */
export const pendingMemo = (body: string): MemoSummary => ({
  createdAt: Date.now(),
  excerpt: excerptOf(body),
  heading: headingOf(null, body),
  // 保存が終わればサーバーの id に置き換わるので、一意であればよい。
  id: memoId(crypto.randomUUID()),
  linkCount: 0,
  race: null,
  tags: [],
  title: null,
});
