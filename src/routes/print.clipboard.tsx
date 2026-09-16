import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/print/clipboard")({
  component: PrintClipboardAlias,
  head: () => ({
    meta: [{ title: "Field clipboard — MicroRadicle" }],
  }),
});

function PrintClipboardAlias() {
  return <Navigate to="/clipboard" replace />;
}
