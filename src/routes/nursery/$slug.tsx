import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { getMicrogreen } from "@/lib/nursery";
import {
  BLACKOUT_LABEL,
  CLAMSHELL_OZ,
  SOAK_LABEL,
  TRAY_1020_IN,
} from "@/types/nursery";
import {
  clamshellsForTrays,
  isMucilageLocked,
  mucilageWarning,
  ppfdForDli,
  seedCountForTrays,
  seedGramsForTrays,
  wholesaleUsdForTrays,
  yieldOzForTrays,
} from "@/lib/nurseryMath";
import { formatUsd, formatWeight } from "@/lib/math";
import { useFarmStore } from "@/lib/farm-store";

export const Route = createFileRoute("/nursery/$slug")({
  loader: ({ params }) => {
    const crop = getMicrogreen(params.slug);
    if (!crop) throw notFound();
    return { crop };
  },
  head: ({ loaderData }) => {
    const crop = loaderData?.crop;
    if (!crop) return { meta: [{ title: "Tray spec — MicroRadicle" }] };
    return {
      meta: [
        { title: `${crop.cultivar} microgreen — MicroRadicle` },
        {
          name: "description",
          content: `${crop.cultivar} ${crop.commonName}: ${crop.seedWeightGramsPer1020} g / 1020, ${crop.totalCycleDays} d cycle, ${crop.targetYieldOzPerTray} oz cut.`,
        },
      ],
    };
  },
  notFoundComponent: () => (
    <main className="px-6 py-24 text-center">
      <p className="font-mono text-xs tracking-widest text-subtle">404</p>
      <h1 className="font-display mt-2 text-3xl font-semibold">Tray spec not in the nursery.</h1>
      <Link to="/nursery" className="mt-6 inline-block text-accent">
        Back to nursery
      </Link>
    </main>
  ),
  component: TraySpec,
});

function TraySpec() {
  const { crop } = Route.useLoaderData();
  const units = useFarmStore((s) => s.farm.units);
  const locked = isMucilageLocked(crop);
  const warning = mucilageWarning(crop);
  const ppfd = ppfdForDli(crop.targetDliMolM2D, crop.photoperiodHours);
  const four = 4;

  return (
    <main className="mx-auto max-w-5xl overflow-x-hidden px-4 py-8 sm:px-6">
      <p className="font-mono text-[11px] tracking-[0.22em] text-subtle uppercase">
        <Link to="/nursery" className="hover:text-accent">
          Nursery
        </Link>
        <span className="text-faint"> / </span>
        {crop.commonName}
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-4xl font-semibold tracking-wide sm:text-5xl">{crop.cultivar}</h1>
            <span
              className="size-3 rounded-full"
              style={{ backgroundColor: crop.swatch }}
              aria-hidden
            />
          </div>
          <p className="mt-1 font-mono text-sm text-muted">
            {crop.commonName} · <em className="not-italic">{crop.botanicalName}</em>
          </p>
          <p className="mt-1 text-sm text-muted">{crop.flavorProfile}</p>
        </div>
        <Link
          to="/nursery"
          search={{ crop: crop.id }}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-accent px-5 font-display text-lg font-semibold tracking-wide text-accent-fg transition-transform duration-150 active:scale-[0.96]"
        >
          Queue in nursery
          <ArrowRight className="size-4" />
        </Link>
      </div>

      {warning ? (
        <p
          id="mucilage-banner"
          role="alert"
          className="mt-6 border border-danger/40 bg-danger/10 px-4 py-3 font-mono text-[12px] leading-relaxed text-danger"
        >
          {warning}
        </p>
      ) : null}

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <SpecBlock
          label="Seed / 1020"
          value={`${crop.seedWeightGramsPer1020} g`}
          hint={`${crop.seedCountPerGram} seeds / g`}
        />
        <SpecBlock
          label="Soak"
          value={locked ? "0 h" : `${crop.soakHours} h`}
          hint={SOAK_LABEL[crop.soakProtocol]}
        />
        <SpecBlock
          label="Blackout"
          value={crop.blackoutDays === 0 ? "none" : `${crop.blackoutDays} d`}
          hint={
            crop.paverWeightLbs > 0
              ? `${formatWeight(crop.paverWeightLbs, units)} paver`
              : BLACKOUT_LABEL[crop.blackoutMethod]
          }
        />
        <SpecBlock
          label="DLI"
          value={`${crop.targetDliMolM2D} mol`}
          hint={`${crop.photoperiodHours} h · ${ppfd} µmol`}
        />
        <SpecBlock
          label="Cut"
          value={`${crop.targetYieldOzPerTray} oz`}
          hint={`${formatUsd(crop.targetWholesalePricePerLbUsd)} / lb · ${crop.totalCycleDays} d`}
        />
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        <Sheet title="Soak protocol">
          <KV k="Protocol" v={SOAK_LABEL[crop.soakProtocol]} />
          <KV k="Hours" v={locked ? "none — sow dry" : `${crop.soakHours} h`} />
          <KV k="Gel seed" v={crop.isMucilaginous ? "Yes — do not soak" : "no"} />
          <KV k="Tray" v={`${TRAY_1020_IN.width} × ${TRAY_1020_IN.length} in 1020`} />
        </Sheet>
        <Sheet title="Blackout & light">
          <KV k="Method" v={BLACKOUT_LABEL[crop.blackoutMethod]} />
          <KV k="Blackout days" v={`${crop.blackoutDays} d`} />
          <KV
            k="Paver"
            v={crop.paverWeightLbs > 0 ? formatWeight(crop.paverWeightLbs, units) : "none — do not stack weight"}
          />
          <KV k="Target DLI" v={`${crop.targetDliMolM2D} mol·m⁻²·d⁻¹`} />
          <KV k="Photoperiod" v={`${crop.photoperiodHours} h`} />
          <KV k="PPFD" v={`${ppfd} µmol·m⁻²·s⁻¹`} />
        </Sheet>
        <Sheet title="Yield · one 1020">
          <KV k="Cycle" v={`${crop.totalCycleDays} d sow → cut`} />
          <KV k="Fresh cut" v={formatWeight(crop.targetYieldOzPerTray, units, "oz")} />
          <KV k="Wholesale" v={`${formatUsd(crop.targetWholesalePricePerLbUsd)} / lb`} />
          <KV k="Clamshell" v={`${formatUsd(crop.targetClamshellUnitPriceUsd)} · ${CLAMSHELL_OZ} oz`} />
          <KV k="Clamshells / tray" v={`${clamshellsForTrays(crop, 1)}`} />
        </Sheet>
        <Sheet title={`On this farm · ${four} trays`}>
          <KV k="Seed" v={`${seedGramsForTrays(crop, four)} g · ${seedCountForTrays(crop, four)} seeds`} />
          <KV k="Cut" v={formatWeight(yieldOzForTrays(crop, four), units, "oz")} />
          <KV k="Wholesale" v={formatUsd(wholesaleUsdForTrays(crop, four))} />
          <KV k="Clamshells" v={`${clamshellsForTrays(crop, four)} × ${CLAMSHELL_OZ} oz`} />
        </Sheet>
      </div>

      <article className="mt-6 rounded-lg border border-border bg-surface p-4">
        <h2 className="font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">Bench notes</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{crop.fieldNotes}</p>
      </article>
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
