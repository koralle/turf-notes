import {
  createMemo,
  softDeleteMemo,
  updateMemo,
} from "../features/memos/mutations";
import {
  getMemoDetail,
  listMemos,
  listMemosForRace,
} from "../features/memos/queries";
import type { RouterKit } from "./base";

export const createMemosRouter = ({ impl, requireAuth }: RouterKit) => {
  const memos = impl.memos;

  return {
    list: memos.list
      .use(requireAuth)
      .handler(
        async ({ context, input }) =>
          await listMemos(context.db, context.user.id, input)
      ),

    detail: memos.detail
      .use(requireAuth)
      .handler(async ({ context, errors, input }) => {
        const detail = await getMemoDetail(
          context.db,
          context.user.id,
          input.id
        );
        if (detail === null) {
          throw errors["memo-not-found"]();
        }
        return detail;
      }),

    create: memos.create
      .use(requireAuth)
      .handler(async ({ context, errors, input }) => {
        const result = await createMemo(context.db, context.user.id, input);
        if (result.kind === "tag-not-found") {
          throw errors["tag-not-found"]();
        }
        if (result.kind === "link-not-found") {
          throw errors["memo-not-found"]();
        }
        return { id: result.id };
      }),

    update: memos.update
      .use(requireAuth)
      .handler(async ({ context, errors, input }) => {
        const result = await updateMemo(context.db, context.user.id, input);
        if (result.kind === "not-found") {
          throw errors["memo-not-found"]();
        }
        if (result.kind === "conflict") {
          throw errors["memo-conflict"]();
        }
        if (result.kind === "tag-not-found") {
          throw errors["tag-not-found"]();
        }
        if (result.kind === "link-not-found") {
          throw errors["memo-not-found"]();
        }
        return { id: input.id };
      }),

    delete: memos.delete
      .use(requireAuth)
      .handler(async ({ context, errors, input }) => {
        const deleted = await softDeleteMemo(
          context.db,
          context.user.id,
          input.id
        );
        if (!deleted) {
          throw errors["memo-not-found"]();
        }
        return { ok: true };
      }),

    forRace: memos.forRace
      .use(requireAuth)
      .handler(async ({ context, input }) => ({
        items: await listMemosForRace(context.db, context.user.id, input),
      })),
  };
};
