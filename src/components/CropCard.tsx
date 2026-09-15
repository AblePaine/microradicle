import { Link } from "@tanstack/react-router";
import { CATEGORY_LABEL, FLOWER_USE_LABEL, isCutFlower, type Crop } from "@/types/crop";
import type { Units } from "@/types/farm";
import { directRevenue, formatLengthIn, formatUsd } from "@/lib/math";
import { cn } from "@/lib/utils";

export function CropCard({ crop, units }: { crop: Crop; units: Units }) {
  return (
    <Link
      to="/crop/$slug"
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
            {crop.family} · {CATEGORY_LABEL[crop.category]}
          </p>
          <h3 className="font-display mt-0.5 text-xl font-semibold tracking-wide text-fg">
            {crop.cultivar}
          </h3>
          <p className="truncate font-mono text-xs text-muted">{crop.commonName}</p>
        </div>
        <div className="mt-1 flex shrink-0 flex-col items-end gap-1.5">
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: crop.swatch }}
            aria-hidden
          />
          {isCutFlower(crop) ? (
            <span className="font-mono text-[9px] tracking-[0.14em] text-accent uppercase">
              {FLOWER_USE_LABEL[crop.flowerSpecifics.primaryUse]}
            </span>
          ) : null}
        </div>
      </div>
      <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-md bg-border font-mono text-[11px]">
        <Spec k="DTM" v={`${crop.timeline.dtmFromField} d`} />
        <Spec
          k="ROWS"
          v={`${crop.fieldGeometry.rowsPerBed} × ${formatLengthIn(crop.fieldGeometry.inRowSpacingIn, units)}`}
        />
        <Spec k="DIR $/FT" v={formatUsd(directRevenue(crop, 1))} />
      </dl>
      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted">{crop.notes}</p>
      <p className="mt-3 font-mono text-[10px] tracking-[0.16em] text-subtle uppercase transition-colors group-hover:text-accent">
        Open spec →
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