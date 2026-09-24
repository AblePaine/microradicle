import { createFileRoute } from "@tanstack/react-router";
import { PasturePlanner } from "@/components/PasturePlanner";
import { SpeciesCard } from "@/components/SpeciesCard";
import { SPECIES, SPECIES_COUNT } from "@/lib/pasture";
import { useFarmStore } from "@/lib/farm-store";
import { NET_ROLL_FT } from "@/types/pasture";

export type PastureSearch = { species?: string };

export const Route = createFileRoute("/pasture/")({
  validateSearch: (s: Record<string, unknown>): PastureSearch => ({
    species: typeof s.species === "string" && s.species ? s.species : undefined,
  }),
  component: PastureIndex,
  head: () => ({
    meta: [
      { title: "Pasture — MicroRadicle" },
      {
        name: "description",
        content:
          "Rotational grazing for a small flock or herd. Daily dry matter, 164-ft net rolls, rest days, and manure credit. Separate from the 30-inch beds.",
      },
    ],
  }),
});

function PastureIndex() {
  const search = Route.useSearch();
  const farm = useFarmStore((s) => s.farm);
  const addPastureRotation = useFarmStore((s) => s.addPastureRotation);
  const removePastureRotation = useFarmStore((s) => s.removePastureRotation);
  const rotations = farm.pasture_rotations ?? [];

  return (
    <main className="mx-auto max-w-6xl overflow-x-hidden px-4 py-8 sm:px-6">
      <header className="mb-6">
        <p className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase">
          Paddocks · {SPECIES_COUNT} stock specs
        </p>
        <h1 className="font-display mt-1 text-4xl font-semibold tracking-wide sm:text-5xl">PASTURE</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          This is the grass, not the 30-inch beds. Size a daily tractor pull, an egg-mobile yard, or a
          polywire break from how much dry matter the animals eat. Net is counted in {NET_ROLL_FT}-foot
          commercial rolls. Leave the paddock alone for the rest window or you graze it twice and it
          doesn't come back.
        </p>
      </header>

      <PasturePlanner
        units={farm.units}
        rotations={rotations}
        initialSpeciesId={search.species}
        onAdd={addPastureRotation}
        onRemove={removePastureRotation}
      />

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-4 border-b border-border pb-2">
          <div>
            <p className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">Catalog</p>
            <h2 className="font-display text-2xl font-semibold tracking-wide text-fg">STOCK SPECS</h2>
          </div>
          <p className="hidden font-mono text-[11px] tracking-[0.16em] text-subtle uppercase sm:block">
            {SPECIES_COUNT} breeds
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SPECIES.map((s) => (
            <SpeciesCard key={s.id} spec={s} />
          ))}
        </div>
      </section>
    </main>
  );
}
