import { createFileRoute } from "@tanstack/react-router";
import { MicrogreenCard } from "@/components/MicrogreenCard";
import { NurseryRackPlanner } from "@/components/NurseryRackPlanner";
import { MICROGREEN_COUNT, MICROGREENS } from "@/lib/nursery";
import { useFarmStore } from "@/lib/farm-store";
import { RACK_TRAY_CAPACITY } from "@/types/nursery";

export type NurserySearch = { crop?: string };

export const Route = createFileRoute("/nursery/")({
  validateSearch: (s: Record<string, unknown>): NurserySearch => ({
    crop: typeof s.crop === "string" && s.crop ? s.crop : undefined,
  }),
  component: NurseryIndex,
  head: () => ({
    meta: [
      { title: "Nursery — MicroRadicle" },
      {
        name: "description",
        content:
          "1020-tray microgreen rack. Seed weight, soak (or don't), days in the dark, and a harvest calendar. Separate from the outdoor 30-inch beds.",
      },
    ],
  }),
});

function NurseryIndex() {
  const search = Route.useSearch();
  const farm = useFarmStore((s) => s.farm);
  const addNurseryBatch = useFarmStore((s) => s.addNurseryBatch);
  const removeNurseryBatch = useFarmStore((s) => s.removeNurseryBatch);
  const batches = farm.nursery_batches ?? [];

  return (
    <main className="mx-auto max-w-6xl overflow-x-hidden px-4 py-8 sm:px-6">
      <header className="mb-6">
        <p className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase">
          Indoor trays · {MICROGREEN_COUNT} cultivars
        </p>
        <h1 className="font-display mt-1 text-4xl font-semibold tracking-wide sm:text-5xl">NURSERY</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          This is the tray rack — not the outdoor 30-inch beds. A {RACK_TRAY_CAPACITY}-slot bay holds the
          flats. Weigh the seed, soak what should be soaked, stack a paver when the crop wants weight, and
          cut on the calendar. Basil, chia, flax, and cress never go in water: wet seed turns to gel and
          you lose the tray.
        </p>
      </header>

      <NurseryRackPlanner
        units={farm.units}
        batches={batches}
        initialCropId={search.crop}
        onAdd={addNurseryBatch}
        onRemove={removeNurseryBatch}
      />

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-4 border-b border-border pb-2">
          <div>
            <p className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">Catalog</p>
            <h2 className="font-display text-2xl font-semibold tracking-wide text-fg">TRAY SPECS</h2>
          </div>
          <p className="hidden font-mono text-[11px] tracking-[0.16em] text-subtle uppercase sm:block">
            {MICROGREEN_COUNT} cultivars
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MICROGREENS.map((c) => (
            <MicrogreenCard key={c.id} crop={c} />
          ))}
        </div>
      </section>
    </main>
  );
}
