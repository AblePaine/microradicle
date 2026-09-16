import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/clip")({
  component: ClipAlias,
  head: () => ({
    meta: [{ title: "Field clipboard — MicroRadicle" }],
  }),
});

function ClipAlias() {
  return <Navigate to="/clipboard" replace />;
}
