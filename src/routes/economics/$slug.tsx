import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { ColdChainAudit } from "@/components/ColdChainAudit";
import { PackShedPlanner } from "@/components/PackShedPlanner";
import { getCrop } from "@/lib/crops";
import {
  STORAGE_ZONES,
  specFor,
  ZONE_META,
  type StorageThermalZone,
} from "@/lib/economicsMath";
import { useFarmStore } from "@/lib/farm-store";
import { formatTemp } from "@/lib/math";
import { cn } from "@/lib/utils";
import type { CoolingMethod, RespirationRating } from "@/types/economics";

const COOLING: Record<CoolingMethod, string> = {
  hydrocooling: "Hydrocooling",
  "forced-air": "Forced air",
  "room-cooling": "Room cooling",
  "ice-top": "Ice-top",
};

const RESP: Record<RespirationRating, string> = {
  "very-low": "Very low",
  low: "Low",
  moderate: "Moderate",
  high: "High",
  "extremely-high": "Extremely high",
};

function isZone(slug: string): slug is StorageThermalZone {
  return (STORAGE_ZONES as string[]).includes(slug);
}

export const Route = createFileRoute("/economics/$slug")({
  component: EconomicsSlug,
  head: ({ params }) => {
    const crop = getCrop(params.slug);
    const zone = isZone(params.slug) ? ZONE_META[params.slug] : null;
    const title = crop?.cultivar ?? zone?.label ?? params.slug;
    return { meta: [{ title: `${title} — Pack-shed | MicroRadicle` }] };
  },
});

function EconomicsSlug() {
  const { slug } = Route.useParams();
  const farm = useFarmStore((s) => s.farm);
  const hydrated = useFarmStore((s) => s.hydrated);
  const patchEconomics = useFarmStore((s) => s.patchEconomics);

  useEffect(() => {
    if (!farm.economics) patchEconomics({});
  }, [farm.economics, patchEconomics]);

  const zone = isZone(slug) ? slug : undefined;
  const crop = getCrop(slug);
  const spec = specFor(slug);
  const known = Boolean(zone || (crop && spec));
  const zoneMeta = zone ? ZONE_META[zone] : spec ? ZONE_META[spec.storage_zone] : null;

  if (!known) {
    return (
      <main className="px-6 py-24 text-center">
        <p className="font-mono text-xs tracking-widest text-subtle">{hydrated ? "404" : "LOAD"}</p>
        <h1 className="font-display mt-2 text-3xl font-semibold">
          {hydrated ? "Not on this farm." : "Reading farm…"}
        </h1>
        <Link to="/economics" className="mt-6 inline-block text-accent">
          Back to pack-shed
        </Link>
      </main>
    );
  }

  const units = farm.units;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link
        to="/economics"
        className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.18em] text-subtle uppercase hover:text-accent"
      >
        <ArrowLeft className="size-3.5" />
        All pack-shed
      </Link>

      {zone && zoneMeta ? (
        <>
          <header className="mt-3 mb-6">
            <p className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase">
              Thermal zone · {formatTemp(zoneMeta.temp_f, units)} · {zoneMeta.rh}
            </p>
            <h1 className="font-display mt-1 text-4xl font-semibold tracking-wide sm:text-5xl">
              {zoneMeta.label.toUpperCase()}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{zoneMeta.note}</p>
          </header>
          <div className="mb-4">
            <ColdChainAudit farm={farm} onPatch={patchEconomics} zoneId={zone} />
          </div>
          <PackShedPlanner farm={farm} onPatch={patchEconomics} zoneId={zone} />
        </>
      ) : crop && spec && zoneMeta ? (
        <>
          <header className="mt-3 mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase">
                {crop.commonName} · {crop.botanicalName}
              </p>
              <h1 className="font-display mt-1 text-4xl font-semibold tracking-wide sm:text-5xl">{crop.cultivar}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{crop.notes}</p>
            </div>
            <Link
              to="/crop/$slug"
              params={{ slug: crop.id }}
              className="inline-flex h-11 items-center rounded-md border border-border px-4 font-mono text-[11px] tracking-widest text-muted uppercase hover:border-accent hover:text-accent"
            >
              Cultivar spec
            </Link>
          </header>

          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Link
              to="/economics/$slug"
              params={{ slug: spec.storage_zone }}
              className="rounded-lg border border-border bg-surface px-3 py-3 hover:border-accent"
            >
              <p className="font-mono text-[10px] tracking-[0.16em] text-faint uppercase">Zone</p>
              <p className="font-display mt-1 text-xl font-semibold tracking-wide">{zoneMeta.label}</p>
            </Link>
            <SpecTile k="Hold" v={`${formatTemp(spec.optimal_temp_f, units)} · ${spec.optimal_rh_pct}% RH`} />
            <SpecTile k="Min safe" v={formatTemp(spec.min_safe_temp_f, units)} warn={spec.min_safe_temp_f >= 40} />
            <SpecTile k="Shelf" v={`${spec.shelf_life_days} d`} />
            <SpecTile k="Cooling" v={COOLING[spec.cooling_method]} />
            <SpecTile k="Respiration" v={RESP[spec.respiration_rate_rating]} />
            <SpecTile k="cp" v={`${spec.sensible_heat_btu_per_lb} BTU/lb·°F`} />
            <SpecTile k="Totes / 100 lb" v={String(spec.totes_per_100_lbs)} />
          </div>

          <p
            className={cn(
              "mb-4 rounded-md border px-3 py-2 font-mono text-xs",
              spec.storage_zone === "zone-2-cool-humid"
                ? "border-accent/40 bg-elevated text-accent"
                : "border-ok/30 bg-elevated text-ok",
            )}
          >
            {spec.storage_zone === "zone-2-cool-humid"
              ? `Chilling-sensitive. Do not drop into a 34°F Zone 1 box. Floor ${formatTemp(spec.min_safe_temp_f, units)}.`
              : spec.storage_zone === "zone-3-ambient-dry"
                ? "Keep dry. A wet 34°F box starts neck rot."
                : `Zone 1 crop. Hydro or ice, then ${formatTemp(spec.optimal_temp_f, units)} at ${spec.optimal_rh_pct}% RH.`}
          </p>

          <PackShedPlanner farm={farm} onPatch={patchEconomics} cropId={crop.id} />
        </>
      ) : null}
    </main>
  );
}

function SpecTile({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-3">
      <p className="font-mono text-[10px] tracking-[0.16em] text-faint uppercase">{k}</p>
      <p className={cn("font-display mt-1 text-xl font-semibold tracking-wide", warn ? "text-accent" : "text-fg")}>
        {v}
      </p>
    </div>
  );
}
