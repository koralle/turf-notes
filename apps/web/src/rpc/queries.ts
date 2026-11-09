import { skipToken } from "@tanstack/react-query";
import type { RaceKey } from "@turf-notes/domain";

import { orpc } from "./client";

/**
 * サーバーの読み取りの定義。route の loader が温め、画面は useQuery /
 * useInfiniteQuery で同じ定義を読む。鮮度はここでだけ決める（loader と画面が
 * 同じ staleTime を見るので、温めた直後に画面が取り直すことはない）。
 *
 * queryKey は oRPC が contract のパスから作る（`[['memos','detail'], { input }]`）。
 * 無効化は `orpc.memos.key()` のように親のパスで行う。
 */
export const FRESH_FOR = 30_000;

/** サインイン中のユーザー。セッションは画面を開いている間に変わらない。 */
export const meQuery = orpc.me.queryOptions({
  staleTime: Number.POSITIVE_INFINITY,
});

/** タグ一覧。サイドバーとタグページ、メモ編集画面が同じものを見る。 */
export const tagsQuery = orpc.tags.list.queryOptions({ staleTime: FRESH_FOR });

export const authMethodsQuery = orpc.auth.methods.queryOptions({
  staleTime: FRESH_FOR,
});

/** タイムライン。検索語ごとに 1 本の無限クエリになる。 */
export const memoListQuery = (q: string) =>
  orpc.memos.list.infiniteOptions({
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    input: (cursor: string | undefined) => ({
      ...(q === "" ? {} : { q }),
      ...(cursor === undefined ? {} : { cursor }),
    }),
    staleTime: FRESH_FOR,
  });

/** タグページ。URL の tagId が不正なら問い合わせない（skipToken）。 */
export const tagMemosQuery = (tagId: number | null) =>
  orpc.memos.list.infiniteOptions({
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    input:
      tagId === null
        ? skipToken
        : (cursor: string | undefined) => ({
            tagIds: [tagId],
            ...(cursor === undefined ? {} : { cursor }),
          }),
    staleTime: FRESH_FOR,
  });

/** レースページ。URL の3つ組が不正なら問い合わせない（skipToken）。 */
export const raceMemosQuery = (race: RaceKey | null) =>
  orpc.memos.forRace.queryOptions({
    input: race ?? skipToken,
    staleTime: FRESH_FOR,
  });

/** メモ詳細。編集画面も同じものを読む（保存時に `orpc.memos.key()` で無効化する）。 */
export const memoQuery = (id: string) =>
  orpc.memos.detail.queryOptions({ input: { id }, staleTime: FRESH_FOR });

/** 編集画面の参照検索。1ページ目だけを候補に使う。空文字では問い合わせない。 */
export const memoRefSearchQuery = (q: string) =>
  orpc.memos.list.queryOptions({
    input: q === "" ? skipToken : { q },
    staleTime: FRESH_FOR,
  });
