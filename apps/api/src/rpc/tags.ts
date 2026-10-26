import { createTag, listTags, removeTag } from "../features/tags/queries";
import type { RouterKit } from "./base";

export const createTagsRouter = ({ impl, requireAuth }: RouterKit) => {
  const tags = impl.tags;

  return {
    list: tags.list
      .use(requireAuth)
      .handler(
        async ({ context }) => await listTags(context.db, context.user.id)
      ),

    create: tags.create
      .use(requireAuth)
      .handler(
        async ({ context, input }) =>
          await createTag(context.db, context.user.id, input.name, input.kind)
      ),

    remove: tags.remove
      .use(requireAuth)
      .handler(async ({ context, errors, input }) => {
        const removed = await removeTag(context.db, context.user.id, input.id);
        if (!removed) {
          throw errors["tag-not-found"]();
        }
        return { ok: true };
      }),
  };
};
