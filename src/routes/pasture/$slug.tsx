import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { getSpecies } from "@/lib/pasture";
import {
  CLASS_LABEL,
  FENCE_LABEL,
  NET_ROLL_FT,
  STAND_DM_LBS_PER_ACRE,
  type LivestockSpeciesSpec,
} from "@/types/pasture";
import {
  computeRotation,
  forageLbsPerHead,
  recommendedPaddockSqft,
  shelterSqftNeeded,
} from "@/lib/pastureMath";
import { formatWeight } from "@/lib/math";
import { useFarmStore } from "@/lib/farm-store";

export const Route = createFileRoute("/pasture/$slug")({
  loader: ({ params }) => {
    const spec = getSpecies(params.slug);
    if (!spec) throw notFound();
    return { spec };
  },
  head: ({ loaderData }) => {
    const spec = loaderData?.spec;
    if (!spec) return { meta: [{ title: "Stock spec — MicroRadicle" }] };
    return {
      meta: [
        { title: `${spec.breed} — MicroRadicle` },
        {
          name: "description",
          content: `${spec.breed}: ${spec.dailyForageIntakeLbs} lb forage DM/day, move every ${spec.recommendedMoveFrequencyDays} d, ${spec.shelterSqftPerHead} sqft shelter.`,
        },
      ],
    };
  },
  notFoundComponent: () => (
    <main className="px-6 py-24 text-center">
      <p className="font-mono text-xs tracking-widest text-subtle">404</p>
      <h1 className="font-display mt-2 text-3xl font-semibold">Stock spec not in the pasture catalog.</h1>
      <Link to="/pasture" className="mt-6 inline-block text-accent">
        Back to pasture
      </Link>
    </main>
  ),
  component: StockSpec,
});

function StockSpec() {
  const { spec } = Route.useLoaderData();
  const units = useFarmStore((s) => s.farm.units);
  const demo = demoFor(spec);

  return (
    <main className="mx-auto max-w-5xl overflow-x-hidden px-4 py-8 sm:px-6">
      <p className="font-mono text-[11px] tracking-[0.22em] text-subtle uppercase">
        <Link to="/pasture" className="hover:text-accent">
          Pasture
        </Link>
        <span className="text-faint"> / </span>
        {CLASS_LABEL[spec.livestockClass]}
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-4xl font-semibold tracking-wide sm:text-5xl">{spec.breed}</h1>
            <span className="size-3 rounded-full" style={{ backgroundColor: spec.swatch }} aria-hidden />
          </div>
          <p className="mt-1 font-mono text-sm text-muted">
            {spec.commonName} · {spec.avgBodyWeightLbs} lb · {spec.animalUnitEquivalent} AU
          </p>
        </div>
        <Link
          to="/pasture"
          search={{ species: spec.id }}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-accent px-5 font-display text-lg font-semibold tracking-wide text-accent-fg transition-transform duration-150 active:scale-[0.96]"
        >
          Queue on pasture
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <SpecBlock label="Forage DM" value={`${spec.dailyForageIntakeLbs} lb`} hint={`${spec.dailyDmIntakePctBw * 100}% of body weight / day`} />
        <SpecBlock label="Move" value={`${spec.recommendedMoveFrequencyDays} d`} hint={spec.targetGrazeDensity} />
        <SpecBlock label="Shelter" value={`${spec.shelterSqftPerHead} ft²`} hint="per head, in the mobile" />
        <SpecBlock
          label="Fence"
          value={spec.nettingSpec.fenceType === "none-skid-tractor" ? "Tractor" : `${NET_ROLL_FT} ft`}
          hint={FENCE_LABEL[spec.nettingSpec.fenceType]}
        />
        <SpecBlock
          label="Manure N"
          value={formatWeight(spec.dailyManureNpkLbs.n, units)}
          hint="per head per day on the paddock"
        />
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        <Sheet title="Diet & paddock">
          <KV k="Body weight" v={`${spec.avgBodyWeightLbs} lb`} />
          <KV k="Animal units" v={`${spec.animalUnitEquivalent} AU`} />
          <KV k="Forage DM / head" v={`${forageLbsPerHead(spec)} lb / day`} />
          <KV
            k="Paddock · 1 move on mixed grass"
            v={`${recommendedPaddockSqft(spec, demo.head_count, "standard-perennial-mix", spec.recommendedMoveFrequencyDays)} sqft for ${demo.head_count} head`}
          />
          <KV k="Shelter for that bunch" v={`${shelterSqftNeeded(spec, demo.head_count)} sqft`} />
        </Sheet>
        <Sheet title="Fence & recovery">
          <KV k="Fence" v={FENCE_LABEL[spec.nettingSpec.fenceType]} />
          <KV k="Roll length" v={`${spec.nettingSpec.standardRollLengthFt} ft`} />
          <KV k="Spring rest on mixed grass" v="24 days" />
          <KV k="Summer rest on mixed grass" v="36 days" />
          <KV k="Stand DM · mixed grass" v={`${STAND_DM_LBS_PER_ACRE["standard-perennial-mix"]} lb / acre`} />
        </Sheet>
        <Sheet title={`Manure this graze · ${demo.head_count} head`}>
          <KV k="N" v={formatWeight(demo.manure_n_lbs, units)} />
          <KV k="P2O5" v={formatWeight(demo.manure_p2o5_lbs, units)} />
          <KV k="K2O" v={formatWeight(demo.manure_k2o_lbs, units)} />
          <KV k="Stay" v={`${demo.move_interval_days} day${demo.move_interval_days === 1 ? "" : "s"}`} />
        </Sheet>
        <article className="rounded-lg border border-border bg-surface p-4">
          <h2 className="font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">Field notes</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{spec.fieldNotes}</p>
        </article>
      </div>
    </main>
  );
}

function demoFor(spec: LivestockSpeciesSpec) {
  const head =
    spec.livestockClass === "pastured-broilers"
      ? 80
      : spec.livestockClass === "pastured-layers"
        ? 50
        : spec.livestockClass === "hair-sheep"
          ? 25
          : 6;
  return computeRotation(
    spec,
    head,
    "standard-perennial-mix",
    "2026-09-15",
    spec.recommendedMoveFrequencyDays,
    0,
    "demo",
  );
}

function SpecBlock({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-3">
      <p className="font-mono text-[10px] tracking-[0.16em] text-faint uppercase">{label}</p>
      <p className="font-display mt-1 text-3xl font-semibold tracking-wide tabular">{value}</p>
      <p className="mt-1 font-mono text-[11px] text-muted">{hint}</p>
    </div>
  );
}

function Sheet({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface">
      <h2 className="border-b border-border px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
        {title}
      </h2>
      <dl>{children}</dl>
    </section>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border px-4 py-2.5 last:border-0">
      <dt className="font-mono text-[11px] tracking-[0.12em] text-subtle uppercase">{k}</dt>
      <dd className="text-right font-mono text-sm tabular text-fg">{v}</dd>
    </div>
  );
}
