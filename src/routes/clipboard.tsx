import { createFileRoute } from "@tanstack/react-router";
import { FieldClipboardPrint } from "@/components/FieldClipboardPrint";
import { useFarmStore } from "@/lib/farm-store";

export const Route = createFileRoute("/clipboard")({
  component: ClipboardPage,
  head: () => ({
    meta: [
      { title: "Field clipboard — MicroRadicle" },
      {
        name: "description",
        content:
          "Printable sow, field, and harvest clipboard for a 30-inch market garden. Local-first. No account.",
      },
    ],
  }),
});

function ClipboardPage() {
  const farm = useFarmStore((s) => s.farm);
  const today = new Date();
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <FieldClipboardPrint farm={farm} today={today} />
    </main>
  );
}
