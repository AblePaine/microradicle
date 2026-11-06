import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { CORNELL_VVFG_URL, resistanceLabel, seedsNowSearchUrl } from "@/lib/varieties";
import { getSeedVariety } from "@/lib/varietiesFn";
import { canonicalLink, jsonLdScript, ogMeta, webPageJsonLd } from "@/lib/seo";
import type { RangeF } from "@/types/variety";

export const Route = createFileRoute("/variety/$slug")({
  loader: async ({ params }) => {
    const variety = await getSeedVariety({ data: params.slug });
    if (!variety) throw notFound();
    return { variety };
  },
  head: ({ loaderData, params }) => {
    const variety = loaderData?.variety;
    if (!variety) return { meta: [{ title: "Variety — MicroRadicle" }] };
    const title = `${variety.name} — Variety Explorer | MicroRadicle`;
    const description = `${variety.name} (${variety.scientificName}): ${variety.dtmMin}–${variety.dtmMax} days to maturity${variety.maturityFrom === "transplant" ? " from transplant" : ""}. Growing notes, spacing, and documented disease resistance.`;
    const path = `/variety/${params.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        ...ogMeta({ title, description, path }),
      ],
      scripts: [jsonLdScript(webPageJsonLd({ name: title, description, path }))],
      links: [canonicalLink(path)],
    };
  },
  notFoundComponent: () => (
    <main className="px-6 py-24 text-center">
      <p className="font-mono text-xs tracking-widest text-subtle">404</p>
      <h1 className="font-display mt-2 text-3xl font-semibold">Variety not in the explorer.</h1>
      <Link to="/varieties" className="mt-6 inline-block text-accent">
        Back to the explorer
      </Link>
    </main>
  ),
  component: VarietyDetail,
});

function range(rangeF: RangeF | null, unit: string): string | null {
  if (!rangeF) return null;
  return rangeF.min === rangeF.max
    ? `${rangeF.max}${unit}`
    : `${rangeF.min}–${rangeF.max}${unit}`;
}

function Stat({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="rounded-lg border border-border bg-surface p-3.5">
      <p className="font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">{label}</p>
      <p className="mt-1 text-sm font-medium text-fg">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-2xl font-semibold tracking-wide">{title}</h2>
      <div className="mt-3 text-sm leading-relaxed text-muted">{children}</div>
    </section>
  );
}

function VarietyDetail() {
  const { variety } = Route.useLoaderData();
  const dtm =
    variety.dtmMin === variety.dtmMax
      ? `${variety.dtmMax} days`
      : `${variety.dtmMin}–${variety.dtmMax} days`;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="font-mono text-[11px] tracking-[0.22em] text-subtle uppercase">
        <Link to="/varieties" className="hover:text-accent">
          Variety Explorer
        </Link>{" "}
        · {variety.cropGroup}
      </p>
      <h1 className="font-display mt-1 text-4xl font-semibold tracking-wide sm:text-5xl">
        {variety.name}
      </h1>
      <p className="mt-2 font-mono text-sm text-muted">
        {variety.scientificName}
        {variety.subcategory ? ` · ${variety.subcategory}` : ""}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Stat label="Days to maturity" value={`${dtm}${variety.maturityFrom === "transplant" ? " (from transplant)" : " (from seed)"}`} />
        <Stat label="Germination" value={range(variety.germinationDays, " days")} />
        <Stat label="Germ. soil temp" value={range(variety.germinationSoilTempF, " °F")} />
        <Stat
          label="USDA zones"
          value={variety.zones ? `${variety.zones.min}–${variety.zones.max}` : null}
        />
        <Stat label="Spacing" value={range(variety.spacingIn, " in")} />
        <Stat label="Height" value={range(variety.heightIn, " in")} />
        <Stat label="Spread" value={range(variety.spreadIn, " in")} />
        <Stat label="Sun" value={variety.sun} />
        <Stat label="Water" value={variety.water} />
        <Stat label="Frost tolerance" value={variety.frostTolerance} />
        <Stat label="Season" value={variety.season} />
        <Stat label="Sow method" value={variety.sowMethod?.replace(/-/g, " ") ?? null} />
      </div>

      {variety.resistanceCodes.length > 0 || variety.resistances.length > 0 ? (
        <Section title="Documented resistance">
          {variety.resistanceCodes.length > 0 ? (
            <p className="mb-2">
              <span className="font-mono text-xs text-accent">
                {variety.resistanceCodes.join(" · ")}
              </span>{" "}
              — {variety.resistanceCodes.map(resistanceLabel).join(", ")}.
            </p>
          ) : null}
          {variety.resistances.length > 0 ? (
            <p>Resistance or tolerance noted for: {variety.resistances.join(", ")}.</p>
          ) : null}
          <p className="mt-2 text-xs">
            As described in the source material below — resistance is not immunity, and local
            disease pressure varies.
          </p>
        </Section>
      ) : null}

      {variety.plantingNote ? (
        <Section title="Planting notes">
          <p>{variety.plantingNote}</p>
        </Section>
      ) : null}

      {variety.directions ? (
        <Section title="Growing notes">
          <p className="whitespace-pre-line">{variety.directions}</p>
        </Section>
      ) : null}

      <Section title="Find it & read more">
        <ul className="space-y-2">
          <li>
            <a href={seedsNowSearchUrl(variety.name)} className="inline-flex items-center gap-1 text-accent hover:underline">
              Search Seeds Now for {variety.name} seed <ArrowRight className="size-3.5" />
            </a>
          </li>
          <li>
            <a href={CORNELL_VVFG_URL} className="inline-flex items-center gap-1 text-accent hover:underline">
              Gardener ratings &amp; regional reviews at Cornell <ArrowRight className="size-3.5" />
            </a>
          </li>
        </ul>
        {variety.sources.length > 0 ? (
          <p className="mt-4 text-xs">
            Sources for this variety&apos;s data: {variety.sources.join("; ")}. Dataset:
            OpenPlantDB (CC0 1.0).
          </p>
        ) : null}
      </Section>
    </main>
  );
}
