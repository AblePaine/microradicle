import { addDays, format, parseISO, startOfDay } from "date-fns";
import { Link } from "@tanstack/react-router";
import { Check, Link2, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { getCrop } from "@/lib/crops";
import {
  farmTasks,
  formatBedFt,
  round0,
  TASK_LABEL,
  totalBeds,
  totalLinearFt,
  type FarmTask,
} from "@/lib/math";
import { engineSearchFromParams, paramsFromSuccession, successionShareHref } from "@/lib/shareUrl";
import { cn } from "@/lib/utils";
import { salesUnitLabel } from "@/types/crop";
import type { FarmState } from "@/types/farm";

type Horizon = 1 | 7 | 14 | 42;

type Props = {
  farm: FarmState;
  today: Date;
};

type HarvestTally = {
  cropId: string;
  cultivar: string;
  cuts: number;
  units: number;
  salesUnit: string;
  beds: string[];
};

export function FieldClipboardPrint({ farm, today }: Props) {
  const [horizon, setHorizon] = useState<Horizon>(42);
  const [copied, setCopied] = useState<string | null>(null);
  const from = useMemo(() => addDays(startOfDay(today), -2), [today]);
  const to = useMemo(() => addDays(startOfDay(today), horizon), [today, horizon]);
  const tasks = useMemo(() => farmTasks(farm, from, to), [farm, from, to]);
  const blocks = useMemo(() => new Map(farm.blocks.map((b) => [b.id, b])), [farm.blocks]);
  const successions = useMemo(() => new Map(farm.successions.map((s) => [s.id, s])), [farm.successions]);

  const days = useMemo(() => {
    const map = new Map<string, FarmTask[]>();
    for (const task of tasks) {
      const list = map.get(task.date) ?? [];
      list.push(task);
      map.set(task.date, list);
    }
    return [...map.entries()];
  }, [tasks]);

  const tally = useMemo(() => {
    const map = new Map<string, HarvestTally>();
    for (const task of tasks) {
      if (task.kind !== "harvest") continue;
      const crop = getCrop(task.cropId);
      const succession = successions.get(task.successionId);
      const block = blocks.get(task.blockId);
      const existing = map.get(task.cropId) ?? {
        cropId: task.cropId,
        cultivar: crop?.cultivar ?? task.cropId,
        cuts: 0,
        units: 0,
        salesUnit: crop ? salesUnitLabel(crop.yieldAndRevenue.salesUnit, 2) : "units",
        beds: [],
      };
      existing.cuts += 1;
      existing.units += succession?.target_units ?? 0;
      if (block) existing.beds.push(`${block.name} ${task.bedIndex + 1}`);
      map.set(task.cropId, existing);
    }
    return [...map.values()].sort((a, b) => a.cultivar.localeCompare(b.cultivar));
  }, [tasks, successions, blocks]);

  async function copyHref(href: string, key: string) {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied("fail");
    }
  }

  const printed = format(today, "d MMM yyyy");
  const beds = totalBeds(farm);
  const linFt = totalLinearFt(farm);

  return (
    <div className="clipboard-sheet">
      <div className="no-print mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase">Field clipboard · print this</p>
          <h1 className="font-display mt-1 text-4xl font-semibold tracking-wide sm:text-5xl">CLIPBOARD</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Print the sow / field / cut list. Clip it to a board. Share a succession as a URL — the other
            grower opens it on their own machine. Nothing is uploaded.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-md border border-border">
            {([1, 7, 14, 42] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setHorizon(d)}
                className={cn(
                  "h-11 min-w-11 px-3 font-mono text-xs tabular",
                  horizon === d ? "bg-accent text-accent-fg" : "text-muted hover:text-fg",
                )}
              >
                {d === 1 ? "TODAY" : `${d}D`}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-accent px-4 font-display text-lg font-semibold tracking-wide text-accent-fg transition-transform duration-150 active:scale-[0.96]"
          >
            <Printer className="size-4" />
            Print
          </button>
        </div>
      </div>

      <section className="rounded-lg border border-border bg-surface p-4 shadow-[var(--shadow-border)] print:rounded-none print:border-zinc-400 print:bg-white print:text-zinc-950 print:shadow-none sm:p-6">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4 print:border-zinc-400">
          <div>
            <p className="font-mono text-[10px] tracking-[0.22em] text-subtle uppercase print:text-zinc-600">
              MicroRadicle · field clipboard
            </p>
            <h2 className="font-display mt-1 text-3xl font-semibold tracking-wide">{farm.name}</h2>
            <p className="mt-1 font-mono text-[11px] text-muted print:text-zinc-600">
              Last frost {farm.climate.last_spring_frost} · first {farm.climate.first_fall_frost} · lat{" "}
              {farm.climate.latitude.toFixed(1)}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-[11px] tabular print:text-zinc-700">
            <div>
              <dt className="text-faint print:text-zinc-500">Printed</dt>
              <dd>{printed}</dd>
            </div>
            <div>
              <dt className="text-faint print:text-zinc-500">Window</dt>
              <dd>
                {format(from, "d MMM")} – {format(to, "d MMM")}
              </dd>
            </div>
            <div>
              <dt className="text-faint print:text-zinc-500">Beds</dt>
              <dd>{beds}</dd>
            </div>
            <div>
              <dt className="text-faint print:text-zinc-500">Lin ft</dt>
              <dd>{round0(linFt)}</dd>
            </div>
          </dl>
        </header>

        {days.length === 0 ? (
          <p className="py-12 text-center font-mono text-sm text-muted print:text-zinc-600">
            No sow, field, or cut work in this window. Schedule a succession in the engine.
          </p>
        ) : (
          <div className="mt-5 space-y-6">
            {days.map(([date, rows]) => (
              <section key={date} className="print:break-inside-avoid">
                <h3 className="border-b border-border pb-1 font-mono text-[11px] tracking-[0.18em] text-accent uppercase print:border-zinc-400 print:text-zinc-950">
                  {format(parseISO(date), "EEEE d MMMM yyyy")}
                </h3>
                <table className="mt-2 w-full text-left">
                  <thead>
                    <tr className="hidden font-mono text-[10px] tracking-widest text-faint uppercase sm:table-row print:table-row print:text-zinc-500">
                      <th className="w-5 pb-1 font-medium" />
                      <th className="w-14 pb-1 font-medium">Act</th>
                      <th className="pb-1 font-medium">Cultivar</th>
                      <th className="w-32 pb-1 font-medium">Bed</th>
                      <th className="w-16 pb-1 font-medium">Ft</th>
                      <th className="w-32 pb-1 text-right font-medium">Units</th>
                      <th className="no-print w-9 pb-1 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((task) => {
                      const crop = getCrop(task.cropId);
                      const succession = successions.get(task.successionId);
                      const block = blocks.get(task.blockId);
                      const params = succession ? paramsFromSuccession(succession) : { cropId: task.cropId };
                      const href = successionShareHref(params);
                      const unitCount = succession?.target_units;
                      const unitLabel = crop
                        ? salesUnitLabel(crop.yieldAndRevenue.salesUnit, unitCount ?? 2)
                        : "";
                      const feet = succession && block ? formatBedFt(succession.bed_feet_needed, farm.units) : "—";
                      const bedLabel = `${block?.name ?? task.blockId} ${task.bedIndex + 1}`;
                      return (
                        <tr key={task.id} className="border-b border-dashed border-border print:border-zinc-300">
                          <td className="py-2 align-middle">
                            <span
                              className="block size-[14px] rounded-[2px] border border-fg print:border-zinc-950"
                              aria-hidden
                            />
                          </td>
                          <td className="py-2 align-middle">
                            <span
                              className={cn(
                                "font-mono text-[10px] tracking-widest",
                                task.kind === "harvest"
                                  ? "text-accent print:text-zinc-950"
                                  : "text-muted print:text-zinc-700",
                              )}
                            >
                              {TASK_LABEL[task.kind]}
                            </span>
                          </td>
                          <td className="py-2 align-middle">
                            <p className="truncate text-sm font-medium text-fg print:text-zinc-950">
                              {crop?.cultivar ?? task.cropId}
                            </p>
                            <p className="truncate font-mono text-[10px] text-faint print:text-zinc-600">
                              {crop?.commonName}
                              <span className="sm:hidden"> · {bedLabel}</span>
                            </p>
                          </td>
                          <td className="hidden py-2 align-middle font-mono text-[11px] text-muted print:table-cell print:text-zinc-700 sm:table-cell">
                            {bedLabel}
                          </td>
                          <td className="hidden py-2 align-middle font-mono text-[11px] tabular text-muted print:table-cell print:text-zinc-700 sm:table-cell">
                            {feet}
                          </td>
                          <td className="py-2 text-right align-middle font-mono text-[11px] tabular print:text-zinc-950">
                            {unitCount != null ? `${round0(unitCount)} ${unitLabel}` : "—"}
                          </td>
                          <td className="no-print hidden py-2 text-right align-middle sm:table-cell">
                            <button
                              type="button"
                              title="Copy succession URL"
                              onClick={() => copyHref(href, task.id)}
                              className="inline-flex size-8 items-center justify-center rounded-sm text-muted hover:text-accent"
                            >
                              {copied === task.id ? (
                                <Check className="size-3.5 text-ok" />
                              ) : (
                                <Link2 className="size-3.5" />
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            ))}
          </div>
        )}

        <section className="mt-8 print:break-inside-avoid">
          <h3 className="border-b border-border pb-1 font-mono text-[11px] tracking-[0.18em] text-subtle uppercase print:border-zinc-400 print:text-zinc-700">
            Harvest tally
          </h3>
          {tally.length === 0 ? (
            <p className="mt-3 font-mono text-xs text-muted print:text-zinc-600">No cuts in this window.</p>
          ) : (
            <table className="mt-3 w-full font-mono text-[12px]">
              <thead>
                <tr className="text-left text-[10px] tracking-widest text-faint uppercase print:text-zinc-500">
                  <th className="pb-1 font-medium">Cultivar</th>
                  <th className="pb-1 font-medium">Cuts</th>
                  <th className="pb-1 font-medium">Units</th>
                  <th className="hidden pb-1 font-medium sm:table-cell">Beds</th>
                </tr>
              </thead>
              <tbody>
                {tally.map((row) => (
                  <tr key={row.cropId} className="border-t border-border print:border-zinc-300">
                    <td className="py-1.5">{row.cultivar}</td>
                    <td className="py-1.5 tabular">{row.cuts}</td>
                    <td className="py-1.5 tabular">
                      {round0(row.units)} {row.salesUnit}
                    </td>
                    <td className="hidden py-1.5 text-muted print:text-zinc-600 sm:table-cell">
                      {row.beds.join(" · ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <footer className="mt-8 flex flex-wrap items-end justify-between gap-3 border-t border-border pt-4 font-mono text-[10px] tracking-widest text-faint uppercase print:border-zinc-400 print:text-zinc-500">
          <p>Free · local-first · no account · no paywall</p>
          <Link to="/engine" className="no-print text-accent hover:text-accent-soft">
            Open engine →
          </Link>
        </footer>
      </section>
    </div>
  );
}

export function clipboardTaskShareSearch(task: FarmTask, farm: FarmState) {
  const succession = farm.successions.find((s) => s.id === task.successionId);
  if (!succession) return engineSearchFromParams({ cropId: task.cropId });
  return engineSearchFromParams(paramsFromSuccession(succession));
}
