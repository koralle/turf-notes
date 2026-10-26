import { getAuthMethods } from "../features/settings/queries";
import type { RouterKit } from "./base";

export const createAuthRouter = ({ impl, withDb }: RouterKit) => ({
  methods: impl.auth.methods
    .use(withDb)
    .handler(async ({ context }) => await getAuthMethods(context.db)),
});
