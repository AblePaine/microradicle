import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { BedCrossSection } from "@/components/BedCrossSection";
import { FlowerSpecSummary } from "@/components/FlowerSpecSummary";
import { getCrop } from "@/lib/crops";
import { useFarmStore } from "@/lib/farm-store";
import {
  bedFeetForTarget,
  directRevenue,
  dripGph,
  extractionLbs,
  formatLengthIn,
  formatTemp,
  formatUsd,
  formatWeight,
  greenhouseStart,
  harvestDate,
  iso,
  occupancyDays,
  plantCount,
  round1,
  seasonWindow,
  seedNeeded,
  successionDates,
  weeklyGallons,
  wholesaleRevenue,
} from "@/lib/math";
import {
  CATEGORY_LABEL,
  FERTILITY_LABEL,
  FROST_LABEL,
  PROP_LABEL,
  isCutFlower,
  salesUnitLabel,
} from "@/types/crop";
import type { ReactNode } from "react";

export const Route = createFileRoute("/crop/$slug")({
  loader: ({ params }) => {
    const crop = getCrop(params.slug);
    if (!crop) throw notFound();
    return { crop };
  },
  head: ({ loaderData }) => {
    const crop = loaderData?.crop;
    if (!crop) return { meta: [{ title: "Cultivar — MicroRadicle" }] };
    const g = crop.fieldGeometry;
    const y = crop.yieldAndRevenue;
    return {
      meta: [
        { title: `${crop.cultivar} — ${crop.commonName} | MicroRadicle` },
        {
          name: "description",
          content: `${crop.cultivar} ${crop.commonName}: ${crop.timeline.dtmFromField} d DTM, ${g.rowsPerBed} rows on a 30-inch bed, ${y.unitsPerBedFoot} ${salesUnitLabel(y.salesUnit)} / bed-ft.`,
        },
      ],
    };
  },
  notFoundComponent: () => (
    <main className="px-6 py-24 text-center">
      <p className="font-mono text-xs tracking-widest text-subtle">404</p>
      <h1 className="font-display mt-2 text-3xl font-semibold">Cultivar not in the library.</h1>
      <Link to="/crops" className="mt-6 inline-block text-accent">
        Back to catalog
      </Link>
    </main>
  ),
  component: CropSpec,
});

function CropSpec() {
  const { crop } = Route.useLoaderData();
  const farm = useFarmStore((s) => s.farm);
  const year = new Date().getFullYear();
  const window = seasonWindow(farm, crop, year);
  const dates = successionDates(crop, window.start, window.end);
  const sow = window.start;
  const gh = greenhouseStart(sow, crop);
  const g = crop.fieldGeometry;
  const p = crop.propagation;
  const t = crop.timeline;
  const y = crop.yieldAndRevenue;
  const irr = crop.irrigationProfile;
  const soil = crop.soilExtractionProfile;
  const extract50 = extractionLbs(crop, 50);
  const unit = farm.units;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <p className="font-mono text-[11px] tracking-[0.22em] text-subtle uppercase">
        <Link to="/crops" className="hover:text-accent">
          Cultivars
        </Link>
        <span className="text-faint"> / </span>
        {CATEGORY_LABEL[crop.category]}
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-wide sm:text-5xl">{crop.cultivar}</h1>
          <p className="mt-1 font-mono text-sm text-muted">
            {crop.commonName} · <em className="not-italic">{crop.botanicalName}</em>
          </p>
        </div>
        <Link
          to="/engine"
          search={{ crop: crop.id }}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-accent px-5 font-display text-lg font-semibold tracking-wide text-accent-fg transition-transform duration-150 active:scale-[0.96]"
        >
          Plant in engine
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <SpecBlock
          label="DTM"
          value={`${t.dtmFromField} d`}
          hint={`${occupancyDays(crop)} d occupancy · ${FROST_LABEL[t.frostHardiness].toLowerCase()}`}
        />
        <SpecBlock
          label="Rows"
          value={`${g.rowsPerBed}`}
          hint={`${formatLengthIn(g.inRowSpacingIn, unit)} in-row`}
        />
        <SpecBlock label="Density" value={`${g.plantsPerLinearFoot}`} hint="plants / bed-ft" />
        <SpecBlock
          label="Yield"
          value={`${y.unitsPerBedFoot}`}
          hint={`${salesUnitLabel(y.salesUnit)} / bed-ft`}
        />
        <SpecBlock
          label="Direct $/ft"
          value={formatUsd(directRevenue(crop, 1))}
          hint={`${formatUsd(y.targetDirectPriceUsd)} / ${salesUnitLabel(y.salesUnit, 1)}`}
        />
      </div>

      <div className="mt-6">
        <BedCrossSection crop={crop} units={unit} />
      </div>

      {isCutFlower(crop) ? (
        <div className="mt-6">
          <FlowerSpecSummary crop={crop} flower={crop.flowerSpecifics} units={unit} />
        </div>
      ) : null}

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        <Sheet title="Propagation">
          <KV k="Method" v={PROP_LABEL[p.method]} />
          <KV k="Cell size" v={p.recommendedCellSize ? `${p.recommendedCellSize}s` : "—"} />
          <KV k="Nursery lead" v={p.nurseryLeadDays ? `${p.nurseryLeadDays} d` : "direct only"} />
          <KV k="Germination" v={`${p.germinationDays} d`} />
          <KV
            k="Germ temp"
            v={`${formatTemp(p.minGermTempF, unit)} – ${formatTemp(p.maxGermTempF, unit)} (opt ${formatTemp(p.optimumGermTempF, unit)})`}
          />
          <KV k="Seed spacing" v={formatLengthIn(g.seedSpacingIn, unit)} />
        </Sheet>
        <Sheet title="Field geometry · 30 in">
          <KV k="Bed width" v={formatLengthIn(g.standardBedWidthIn, unit)} />
          <KV k="Rows / bed" v={`${g.rowsPerBed}`} />
          <KV k="In-row" v={formatLengthIn(g.inRowSpacingIn, unit)} />
          <KV k="Seed spacing" v={formatLengthIn(g.seedSpacingIn, unit)} />
          <KV k="Plants / linear ft" v={`${g.plantsPerLinearFoot}`} />
          <KV k="Plants / 50 ft" v={`${plantCount(crop, 50)}`} />
        </Sheet>
        <Sheet title="Timeline">
          <KV k="DTM from field" v={`${t.dtmFromField} d`} />
          <KV k="Holding" v={`${t.fieldHoldingDays} d`} />
          <KV k="Occupancy" v={`${occupancyDays(crop)} d`} />
          <KV
            k="Multicut"
            v={
              t.isMulticut
                ? `yes · ${t.maxHarvests} cuts · ${t.regrowthDays ?? "—"} d`
                : "no"
            }
          />
          <KV k="Fall photoperiod" v={`×${t.fallPhotoperiodMultiplier}`} />
          <KV k="Frost hardiness" v={FROST_LABEL[t.frostHardiness]} />
        </Sheet>
        <Sheet title="Yield & revenue">
          <KV k="Sales unit" v={salesUnitLabel(y.salesUnit, 1)} />
          <KV k="Units / bed-ft" v={`${y.unitsPerBedFoot}`} />
          <KV k="Avg unit wt" v={formatWeight(y.avgWeightPerUnitLbs, unit)} />
          <KV k="Target lb / bed-ft" v={formatWeight(y.targetYieldLbsPerBedFoot, unit)} />
          <KV k="Cull rate" v={`${Math.round(y.standardCullRate * 100)}%`} />
          <KV
            k="Wholesale / Direct"
            v={`${formatUsd(y.targetWholesalePriceUsd)} / ${formatUsd(y.targetDirectPriceUsd)}`}
          />
        </Sheet>
        <Sheet title="Irrigation">
          <KV k="Drip lines / bed" v={`${irr.linesPerBed}`} />
          <KV k="Emitter spacing" v={formatLengthIn(irr.emitterSpacingIn, unit)} />
          <KV k="Emitter GPH" v={`${irr.emitterGph}`} />
          <KV k="Weekly water" v={`${irr.weeklyWaterRequirementIn} in`} />
          <KV k="GPH / 50 ft" v={`${round1(dripGph(crop, 50))}`} />
          <KV k="Gal / week · 50 ft" v={`${round1(weeklyGallons(crop, 50))}`} />
        </Sheet>
        <Sheet title="Soil extraction">
          <KV k="Fertility demand" v={FERTILITY_LABEL[soil.fertilityDemand]} />
          <KV k="N / 100 bed-ft" v={`${soil.nRemovalLbsPer100BedFt} lb`} />
          <KV k="P / 100 bed-ft" v={`${soil.pRemovalLbsPer100BedFt} lb`} />
          <KV k="K / 100 bed-ft" v={`${soil.kRemovalLbsPer100BedFt} lb`} />
          <KV
            k="N-P-K / 50 ft"
            v={`${round1(extract50.n)} / ${round1(extract50.p)} / ${round1(extract50.k)} lb`}
          />
          <KV k="Family" v={crop.family} />
        </Sheet>
      </div>

      <Sheet title="On this farm · 50 ft block" className="mt-3">
        <KV k="Season window" v={`${iso(window.start)} → ${iso(window.end)}`} />
        <KV k="First greenhouse" v={p.nurseryLeadDays ? iso(gh) : "—"} />
        <KV k="First harvest" v={iso(harvestDate(sow, crop))} />
        <KV k="Successions that fit" v={`${dates.length} · every ${crop.successionIntervalDays || "—"} d`} />
        <KV k="Bed-ft for 50 lb" v={`${Math.ceil(bedFeetForTarget(crop, 50))} ft`} />
        <KV k="Seed for 50 ft" v={`${seedNeeded(crop, 50)} seeds · ${plantCount(crop, 50)} plants`} />
        <KV
          k="Wholesale / Direct · 50 ft"
          v={`${formatUsd(wholesaleRevenue(crop, 50))} / ${formatUsd(directRevenue(crop, 50))}`}
        />
      </Sheet>

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        <article className="rounded-lg border border-border bg-surface p-4">
          <h2 className="font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">Notes</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{crop.notes}</p>
        </article>
        <article className="rounded-lg border border-border bg-surface p-4">
          <h2 className="font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">Companions</h2>
          <p className="mt-2 text-sm text-fg">{crop.companions.length ? crop.companions.join(" · ") : "—"}</p>
          <h2 className="mt-4 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">Avoid</h2>
          <p className="mt-2 text-sm text-fg">{crop.avoid.length ? crop.avoid.join(" · ") : "—"}</p>
        </article>
      </div>
    </main>
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

function Sheet({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`overflow-hidden rounded-lg border border-border bg-surface ${className}`}>
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
