import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AppShell, RequireSession } from "../components/shell";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <RequireSession>
      <AppShell>
        <Outlet />
      </AppShell>
    </RequireSession>
  );
}
