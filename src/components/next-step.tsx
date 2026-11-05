import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

// One clear workflow next step after a tool's results (engine chains,
// Brad's ruling 2026-11-05). Links follow the farm's real workflow
// adjacencies only — one per surface, no link farms.
export function NextStep({
  to,
  label,
  blurb,
}: {
  to: string;
  label: string;
  blurb: string;
}) {
  return (
    <Link
      to={to}
      className="block rounded-lg border border-accent-dim bg-elevated p-5 transition-colors hover:border-accent sm:p-6"
    >
      <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.22em] text-accent uppercase">
        <span className="size-2 shrink-0 bg-accent" aria-hidden />
        Next step
      </p>
      <p className="mt-3 inline-flex items-center gap-2 font-display text-3xl font-semibold tracking-wide text-fg uppercase">
        {label}
        <ArrowRight className="size-5 text-accent" />
      </p>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        {blurb}
      </p>
    </Link>
  );
}
