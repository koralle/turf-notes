import { exportAll } from "../features/export/queries";
import type { RouterKit } from "./base";

export const createExportRouter = ({ impl, requireAuth }: RouterKit) => ({
  exportAll: impl.exportAll
    .use(requireAuth)
    .handler(async ({ context }) => await exportAll(context.db, context.user)),
});
