import { setPasswordSignIn } from "../features/settings/queries";
import type { RouterKit } from "./base";

export const createSettingsRouter = ({ impl, requireAuth }: RouterKit) => ({
  setPasswordSignIn: impl.settings.setPasswordSignIn
    .use(requireAuth)
    .handler(async ({ context, errors, input }) => {
      const result = await setPasswordSignIn(
        context.db,
        context.user.id,
        input.enabled
      );
      if (result.kind === "no-passkey") {
        throw errors["no-passkey"]();
      }

      return { ok: true };
    }),
});
