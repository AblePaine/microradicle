import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { useMemo, useState } from "react";
import type { Crop } from "@/types/crop";
import type { FarmState } from "@/types/farm";
import { cropBySlug } from "@/lib/crops";
import { listBeds, occupancy, parseMd } from "@/lib/math";
import { cn } from "@/lib/utils";

type Props = {
  farm: FarmState;
  selectedBlockId: string | null;
  selectedBedIndex: number;
  onSelectBed: (blockId: string, bedIndex: number) => void;
};

export function SuccessionTimeline({ farm, selectedBlockId, selectedBedIndex, onSelectBed }: Props) {
  const today = useMemo(() => new Date(), []);
  const year = today.getFullYear();
  const start = useMemo(
    () => addDays(parseMd(farm.climate.last_spring_frost, year), -42),
    [farm.climate.last_spring_frost, year],
  );
  const end = useMemo(
    () => addDays(parseMd(farm.climate.first_fall_frost, year), 21),
    [farm.climate.first_fall_frost, year],
  );
  const days = Math.max(1, differenceInCalendarDays(end, start));
  const lastFrost = parseMd(farm.climate.last_spring_frost, year);
  const firstFrost = parseMd(farm.climate.first_fall_frost, year);
  const [hover, setHover] = useState<string | null>(null);
  const beds = useMemo(() => listBeds(farm), [farm]);

  const ticks = useMemo(() => {
    const out: Date[] = [];
    let d = new Date(start.getFullYear(), start.getMonth(), 1);
    if (d < start) d = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    while (d <= end) {
      out.push(new Date(d));
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    }
    return out;
  }, [start, end]);

  function xOf(date: Date): number {
    return (differenceInCalendarDays(date, start) / days) * 100;
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
        <span>Succession · field gantt</span>
        <span className="text-faint">
          frost {farm.climate.last_spring_frost} → {farm.climate.first_fall_frost}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="min-w-[640px] p-2 sm:p-3">
          <div className="flex gap-2">
            <div className="w-[88px] shrink-0" />
            <div className="relative h-4 flex-1">
              {ticks.map((t) => (
                <span
                  key={t.toISOString()}
                  className="absolute font-mono text-[9px] tracking-widest text-faint"
                  style={{ left: `${xOf(t)}%` }}
                >
                  {format(t, "MMM").toUpperCase()}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex w-[88px] shrink-0 flex-col gap-1">
              {beds.map((bed) => (
                <button
                  key={bed.key}
                  type="button"
                  onClick={() => onSelectBed(bed.block.id, bed.bed_index)}
                  className={cn(
                    "h-6 truncate px-1 text-left font-mono text-[10px]",
                    selectedBlockId === bed.block.id && selectedBedIndex === bed.bed_index
                      ? "text-accent"
                      : "text-muted hover:text-fg",
                  )}
                >
                  {bed.label}
                </button>
              ))}
            </div>
            <div className="relative flex min-w-0 flex-1 flex-col gap-1">
              <span
                className="pointer-events-none absolute inset-y-0 z-[1] w-px bg-danger/70"
                style={{ left: `${xOf(lastFrost)}%` }}
              />
              <span
                className="pointer-events-none absolute inset-y-0 z-[1] w-px bg-danger/70"
                style={{ left: `${xOf(firstFrost)}%` }}
              />
              <span
                className="pointer-events-none absolute inset-y-0 z-10 w-px bg-fg"
                style={{ left: `${xOf(today)}%` }}
              />
              {beds.map((bed) => (
                <div key={bed.key} className="relative h-6 overflow-hidden rounded-xs bg-elevated">
                  {farm.successions
                    .filter((s) => s.block_id === bed.block.id && s.bed_index === bed.bed_index)
                    .map((s) => {
                      const crop: Crop | undefined = cropBySlug.get(s.crop_id);
                      if (!crop) return null;
                      const occ = occupancy(s);
                      const left = xOf(occ.start);
                      const right = xOf(occ.end);
                      const harvest = xOf(occ.harvest);
                      const id = s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onMouseEnter={() => setHover(id)}
                          onMouseLeave={() => setHover(null)}
                          onFocus={() => setHover(id)}
                          onBlur={() => setHover(null)}
                          onClick={() => onSelectBed(bed.block.id, bed.bed_index)}
                          className="absolute top-0.5 bottom-0.5 overflow-hidden rounded-xs"
                          style={{
                            left: `${left}%`,
                            width: `${Math.max(1.2, right - left)}%`,
                            backgroundColor: crop.swatch,
                          }}
                          title={`${crop.cultivar}  field ${format(parseISO(s.field_transplant_date), "MMM d")} · harvest ${format(occ.harvest, "MMM d")}`}
                        >
                          <span
                            className="absolute inset-y-0 right-0 bg-black/25"
                            style={{ left: `${((harvest - left) / Math.max(0.1, right - left)) * 100}%` }}
                          />
                          {hover === id ? (
                            <span className="absolute inset-0 flex items-center px-1 font-mono text-[9px] font-medium text-bg">
                              {crop.cultivar}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
          <p className="mt-2 pl-[96px] font-mono text-[9px] tracking-widest text-faint">
            SOLID = FIELD · SHADE = HOLDING · WHITE = TODAY · PLAN FROM HARVEST
          </p>
        </div>
      </div>
    </div>
  );
}
