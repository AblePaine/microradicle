import { Link } from "@tanstack/react-router";
import { hasResistance } from "@/lib/varieties";
import { cn } from "@/lib/utils";
import type { VarietyIndexEntry } from "@/types/variety";

export function VarietyCard({ variety }: { variety: VarietyIndexEntry }) {
  const resistant = hasResistance(variety);
  const topResistances = variety.resistances.slice(0, 2);
  return (
    <Link
      to="/variety/$slug"
      params={{ slug: variety.slug }}
      className={cn(
        "group flex flex-col rounded-lg border border-border bg-surface p-3.5",
        "shadow-[var(--shadow-border)] transition-[box-shadow,border-color] duration-150",
        "hover:border-accent/50 hover:shadow-[var(--shadow-border-hover)]",
      )}
    >
      <p className="font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
        {variety.cropGroup}
      </p>
      <h3 className="font-display mt-0.5 text-xl font-semibold tracking-wide text-fg">
        {variety.name}
      </h3>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[11px] text-muted">
          {variety.dtmMin === variety.dtmMax
            ? `${variety.dtmMax} days`
            : `${variety.dtmMin}–${variety.dtmMax} days`}
          {variety.maturityFrom === "transplant" ? " from transplant" : ""}
        </span>
        {variety.resistanceCodes.length > 0 ? (
          <span className="rounded-full border border-accent/40 px-2 py-0.5 font-mono text-[11px] text-accent">
            {variety.resistanceCodes.join(" ")}
          </span>
        ) : null}
      </div>
      {resistant ? (
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">
          Resistance noted:{" "}
          {topResistances.length > 0
            ? topResistances.join(", ").toLowerCase()
            : "catalog resistance package"}
          {variety.resistances.length > topResistances.length ? ", more" : ""}
        </p>
      ) : null}
    </Link>
  );
}
