import { Link } from "@tanstack/react-router";
import { CLASS_LABEL, FENCE_LABEL, NET_ROLL_FT, type LivestockSpeciesSpec } from "@/types/pasture";
import { cn } from "@/lib/utils";

export function SpeciesCard({ spec }: { spec: LivestockSpeciesSpec }) {
  return (
    <Link
      to="/pasture/$slug"
      params={{ slug: spec.id }}
      className={cn(
        "group flex flex-col rounded-lg border border-border bg-surface p-3.5",
        "shadow-[var(--shadow-border)] transition-[box-shadow,border-color] duration-150",
        "hover:border-accent/50 hover:shadow-[var(--shadow-border-hover)]",
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
            {CLASS_LABEL[spec.livestockClass]}
          </p>
          <h3 className="font-display mt-0.5 text-xl font-semibold tracking-wide text-fg">{spec.breed}</h3>
          <p className="truncate font-mono text-xs text-muted">{spec.commonName}</p>
        </div>
        <span className="mt-1 size-2.5 shrink-0 rounded-full" style={{ backgroundColor: spec.swatch }} aria-hidden />
      </div>
      <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-md bg-border font-mono text-[11px]">
        <Spec k="DM/D" v={`${spec.dailyForageIntakeLbs} lb`} />
        <Spec k="MOVE" v={`${spec.recommendedMoveFrequencyDays} d`} />
        <Spec k="SHELTER" v={`${spec.shelterSqftPerHead} ft²`} />
      </dl>
      <p className="mt-3 font-mono text-[10px] tracking-[0.12em] text-subtle uppercase">
        {FENCE_LABEL[spec.nettingSpec.fenceType]}
        {spec.nettingSpec.fenceType === "none-skid-tractor" ? "" : ` · ${NET_ROLL_FT} ft`}
      </p>
      <p className="mt-3 font-mono text-[10px] tracking-[0.16em] text-subtle uppercase transition-colors group-hover:text-accent">
        Open stock spec →
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
