import { Link } from "@tanstack/react-router";
import { BLACKOUT_LABEL, SOAK_LABEL, type MicrogreenCultivar } from "@/types/nursery";
import { isMucilageLocked, ppfdForDli } from "@/lib/nurseryMath";
import { formatUsd } from "@/lib/math";
import { cn } from "@/lib/utils";

export function MicrogreenCard({ crop }: { crop: MicrogreenCultivar }) {
  const locked = isMucilageLocked(crop);
  const ppfd = ppfdForDli(crop.targetDliMolM2D, crop.photoperiodHours);
  return (
    <Link
      to="/nursery/$slug"
      params={{ slug: crop.id }}
      className={cn(
        "group flex flex-col rounded-lg border border-border bg-surface p-3.5",
        "shadow-[var(--shadow-border)] transition-[box-shadow,border-color] duration-150",
        "hover:border-accent/50 hover:shadow-[var(--shadow-border-hover)]",
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
            {crop.commonName} · 1020
          </p>
          <h3 className="font-display mt-0.5 text-xl font-semibold tracking-wide text-fg">
            {crop.cultivar}
          </h3>
          <p className="truncate font-mono text-xs text-muted">{crop.botanicalName}</p>
        </div>
        <div className="mt-1 flex shrink-0 flex-col items-end gap-1.5">
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: crop.swatch }}
            aria-hidden
          />
          {locked ? (
            <span className="font-mono text-[9px] tracking-[0.14em] text-danger uppercase">No soak</span>
          ) : null}
        </div>
      </div>
      <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-md bg-border font-mono text-[11px]">
        <Spec k="SEED" v={`${crop.seedWeightGramsPer1020} g`} />
        <Spec k="CYCLE" v={`${crop.totalCycleDays} d`} />
        <Spec k="$/LB" v={formatUsd(crop.targetWholesalePricePerLbUsd)} />
      </dl>
      <p className="mt-3 font-mono text-[10px] tracking-[0.12em] text-subtle uppercase">
        {locked ? "Dry-sow" : SOAK_LABEL[crop.soakProtocol]} · {BLACKOUT_LABEL[crop.blackoutMethod]} · {ppfd} µmol
      </p>
      <p className="mt-3 font-mono text-[10px] tracking-[0.16em] text-subtle uppercase transition-colors group-hover:text-accent">
        Open tray spec →
      </p>
    </Link>
  );
}

function Spec({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-elevated px-2 py-2">
      <dt className="text-[9px] tracking-[0.16em] text-faint">{k}</dt>
      <dd className="mt-0.5 tabular text-fg">{v}</dd>
    </div>
  );
}
