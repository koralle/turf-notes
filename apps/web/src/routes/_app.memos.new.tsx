import { createFileRoute } from "@tanstack/react-router";

import { MemoEditor } from "../components/memo-editor";

export const Route = createFileRoute("/_app/memos/new")({
  component: NewMemoPage,
});

function NewMemoPage() {
  return <MemoEditor />;
}
