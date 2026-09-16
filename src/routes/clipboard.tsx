import { createFileRoute } from "@tanstack/react-router";
import { UnifiedClipboard } from "@/components/UnifiedClipboard";
import { useFarmStore } from "@/lib/farm-store";

export const Route = createFileRoute("/clipboard")({
  component: ClipboardPage,
  head: () => ({
    meta: [
      { title: "Field clipboard — MicroRadicle" },
      {
        name: "description",
        content:
          "Printable daily sheet for 30-inch beds, 1020 racks, and paddock moves. Local-first. No account.",
      },
    ],
  }),
});

function isoToday(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function ClipboardPage() {
  const farm = useFarmStore((s) => s.farm);
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <UnifiedClipboard farm={farm} todayIso={isoToday()} />
    </main>
  );
}
