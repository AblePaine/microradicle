import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { AlertTriangle, Moon, Sun, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { MICROGREENS_BY_COMMON_NAME, getMicrogreen } from "@/lib/nursery";
import {
  CLAMSHELL_OZ,
  DEFAULT_RACK,
  MAX_TRAYS_PER_BATCH,
  RACK_TRAY_CAPACITY,
  type NurseryBatchQueueItem,
} from "@/types/nursery";
import type { Units } from "@/types/farm";
import {
  clamshellsForTrays,
  clampTrays,
  harvestsInWindow,
  isoDay,
  isMucilageLocked,
  mucilageWarning,
  parseDay,
  ppfdForDli,
  rackHorizon,
  rackLoadOnDate,
  seedGramsForTrays,
  seedInventoryGrams,
  wholesaleUsdForTrays,
  yieldOzForTrays,
} from "@/lib/nurseryMath";
import { formatUsd, formatWeight } from "@/lib/math";
import { cn } from "@/lib/utils";

const DEFAULT_CROP = "mg-broccoli-waltham";
const HORIZON_DAYS = 14;

type Props = {
  units: Units;
  batches: NurseryBatchQueueItem[];
  initialCropId?: string;
  onAdd: (cultivarId: string, trayCount: number, sowDate: string) => void;
  onRemove: (id: string) => void;
};

export function NurseryRackPlanner({ units, batches, initialCropId, onAdd, onRemove }: Props) {
  const today = isoDay(new Date());
  const [cropId, setCropId] = useState(() =>
    initialCropId && getMicrogreen(initialCropId) ? initialCropId : DEFAULT_CROP,
  );
  const [trays, setTrays] = useState(4);
  const [sowDate, setSowDate] = useState(today);

  useEffect(() => {
    if (initialCropId && getMicrogreen(initialCropId)) setCropId(initialCropId);
  }, [initialCropId]);

  const crop = getMicrogreen(cropId) ?? getMicrogreen(DEFAULT_CROP);
  const locked = crop ? isMucilageLocked(crop) : false;
  const warning = crop ? mucilageWarning(crop) : null;
  const n = clampTrays(trays);
  const preview = crop
    ? {
        grams: seedGramsForTrays(crop, n),
        oz: yieldOzForTrays(crop, n),
        usd: wholesaleUsdForTrays(crop, n),
        shells: clamshellsForTrays(crop, n),
        ppfd: ppfdForDli(crop.targetDliMolM2D, crop.photoperiodHours),
      }
    : null;

  const todayLoad = useMemo(() => rackLoadOnDate(batches, today), [batches, today]);
  const horizon = useMemo(() => rackHorizon(batches, today, HORIZON_DAYS), [batches, today]);
  const harvests = useMemo(
    () => harvestsInWindow(batches, today, horizon[horizon.length - 1]?.date ?? today),
    [batches, today, horizon],
  );
  const seedG = seedInventoryGrams(batches);
  const yieldOz = round1(batches.reduce((s, b) => s + b.projected_yield_oz, 0));
  const gross = round2(batches.reduce((s, b) => s + b.projected_gross_revenue_usd, 0));
  const trayTotal = batches.reduce((s, b) => s + b.tray_count, 0);

  function queue() {
    if (!crop) return;
    onAdd(crop.id, n, sowDate);
  }

  return (
    <div className="min-w-0 space-y-3">
      <section className="rounded-lg border border-border bg-surface">
        <header className="border-b border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
          Queue · 1020 flat
        </header>
        <div className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block font-mono text-[10px] tracking-widest text-subtle sm:col-span-2 lg:col-span-1">
            CULTIVAR
            <select
              id="nursery-crop"
              value={crop?.id ?? ""}
              onChange={(e) => setCropId(e.target.value)}
              aria-label="Microgreen cultivar"
              className="mt-1 h-11 w-full rounded-sm border border-border bg-elevated px-2 text-sm text-fg outline-none focus:border-accent"
            >
              {MICROGREENS_BY_COMMON_NAME.map((g) => (
                <optgroup key={g.name} label={g.name}>
                  {g.items.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.cultivar}
                      {c.isMucilaginous ? " · NO SOAK" : ""}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="block font-mono text-[10px] tracking-widest text-subtle">
            TRAYS
            <input
              id="nursery-trays"
              type="number"
              min={1}
              max={MAX_TRAYS_PER_BATCH}
              step={1}
              value={trays}
              onChange={(e) => setTrays(Number(e.target.value))}
              aria-label="Tray count"
              className="mt-1 h-11 w-full rounded-sm border border-border bg-elevated px-2 tabular text-sm text-fg outline-none focus:border-accent"
            />
            <span className="mt-1 block text-[9px] tracking-widest text-faint">
              1–{MAX_TRAYS_PER_BATCH} · 10×20 in
            </span>
          </label>
          <label className="block font-mono text-[10px] tracking-widest text-subtle">
            SOW
            <input
              id="nursery-sow"
              type="date"
              value={sowDate}
              onChange={(e) => setSowDate(e.target.value)}
              aria-label="Sow date"
              className="mt-1 h-11 w-full rounded-sm border border-border bg-elevated px-2 tabular text-sm text-fg outline-none focus:border-accent"
            />
            <span className="mt-1 block text-[9px] tracking-widest text-faint">
              {locked ? "do not soak" : crop ? `${crop.soakHours} h soak` : "—"}
            </span>
          </label>
          <div className="flex flex-col justify-end">
            <button
              id="nursery-queue"
              type="button"
              disabled={!crop}
              onClick={queue}
              className="flex h-11 items-center justify-center bg-accent px-3 font-mono text-[11px] font-semibold tracking-[0.16em] text-accent-fg uppercase transition-transform duration-150 active:scale-[0.96] disabled:opacity-40"
            >
              Queue batch
            </button>
          </div>
        </div>

        {warning ? (
          <div
            id="mucilage-banner"
            role="alert"
            className="flex items-start gap-2 border-t border-danger/40 bg-danger/10 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-danger"
          >
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            <span>{warning}</span>
          </div>
        ) : null}

        {crop && preview ? (
          <dl className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-4 lg:grid-cols-7">
            <Stat k="Seed" v={`${preview.grams} g`} />
            <Stat k="Cut" v={formatWeight(preview.oz, units, "oz")} />
            <Stat k="Wholesale" v={formatUsd(preview.usd)} />
            <Stat k="Clamshells" v={`${preview.shells} × ${CLAMSHELL_OZ} oz`} />
            <Stat
              k="Soak"
              v={locked ? "0 h · dry" : `${crop.soakHours} h`}
              warn={locked}
            />
            <Stat
              k="Blackout"
              v={
                crop.blackoutDays === 0
                  ? "direct light"
                  : `${crop.blackoutDays} d · ${crop.paverWeightLbs > 0 ? formatWeight(crop.paverWeightLbs, units) : "dome"}`
              }
            />
            <Stat k="PPFD" v={`${preview.ppfd} µmol`} />
          </dl>
        ) : null}
      </section>

      <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
        <RackFace load={todayLoad} />
        <HorizonStrip horizon={horizon} harvests={harvests} units={units} />
      </div>

      <section className="overflow-hidden rounded-lg border border-border bg-surface">
        <header className="flex flex-wrap items-end justify-between gap-2 border-b border-border px-3 py-1.5">
          <p className="font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
            Batches · {batches.length} queued · {trayTotal} trays
          </p>
          <p className="font-mono text-[10px] tracking-widest text-faint uppercase">
            {seedG} g seed · {formatWeight(yieldOz, units, "oz")} · {formatUsd(gross)}
          </p>
        </header>
        {batches.length === 0 ? (
          <p className="px-3 py-10 text-center font-mono text-sm text-muted">
            Queue a 1020 flat to occupy the rack.
          </p>
        ) : (
          <>
            <div className="hidden min-w-0 overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-left font-mono text-[11px]">
                <thead className="border-b border-border text-[10px] tracking-[0.16em] text-faint uppercase">
                  <tr>
                    <th className="px-3 py-2 font-medium">Cultivar</th>
                    <th className="px-3 py-2 text-right font-medium">Trays</th>
                    <th className="px-3 py-2 font-medium">Soak</th>
                    <th className="px-3 py-2 font-medium">Sow</th>
                    <th className="px-3 py-2 font-medium">Unstack</th>
                    <th className="px-3 py-2 font-medium">Harvest</th>
                    <th className="px-3 py-2 text-right font-medium">Seed</th>
                    <th className="px-3 py-2 text-right font-medium">Cut</th>
                    <th className="px-3 py-2 text-right font-medium">$</th>
                    <th className="px-3 py-2 font-medium">
                      <span className="sr-only">Remove</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((b) => (
                    <BatchRow key={b.id} batch={b} units={units} today={today} onRemove={onRemove} />
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-border md:hidden">
              {batches.map((b) => (
                <li key={b.id} className="px-3 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display text-lg font-semibold tracking-wide text-fg">
                        {b.cultivar_name}
                      </p>
                      <p className="font-mono text-[10px] tracking-widest text-subtle uppercase">
                        {b.tray_count} trays · sow {b.sow_date}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(b.id)}
                      aria-label={`Remove ${b.cultivar_name}`}
                      className="inline-flex size-11 items-center justify-center text-muted hover:text-danger"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px] text-muted">
                    <div>
                      Soak {b.soak_start_date ?? "—"}
                    </div>
                    <div>Unstack {b.unstack_date}</div>
                    <div>Harvest {b.harvest_date}</div>
                    <div>
                      {b.total_seed_grams_needed} g · {formatWeight(b.projected_yield_oz, units, "oz")} ·{" "}
                      {formatUsd(b.projected_gross_revenue_usd)}
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

function BatchRow({
  batch,
  units,
  today,
  onRemove,
}: {
  batch: NurseryBatchQueueItem;
  units: Units;
  today: string;
  onRemove: (id: string) => void;
}) {
  const phase =
    today < batch.sow_date
      ? "queued"
      : today < batch.unstack_date
        ? "blackout"
        : today <= batch.harvest_date
          ? "light"
          : "done";
  const crop = getMicrogreen(batch.cultivar_id);
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-3 py-2">
        <Link
          to="/nursery/$slug"
          params={{ slug: batch.cultivar_id }}
          className="text-fg hover:text-accent"
        >
          {batch.cultivar_name}
        </Link>
        <span
          className={cn(
            "ml-2 text-[9px] tracking-widest uppercase",
            phase === "blackout" ? "text-subtle" : phase === "light" ? "text-ok" : "text-faint",
          )}
        >
          {phase}
        </span>
      </td>
      <td className="px-3 py-2 text-right tabular text-fg">{batch.tray_count}</td>
      <td className="px-3 py-2 tabular text-muted">
        {batch.soak_start_date ?? (crop && isMucilageLocked(crop) ? "locked" : "—")}
      </td>
      <td className="px-3 py-2 tabular text-muted">{batch.sow_date}</td>
      <td className="px-3 py-2 tabular text-muted">{batch.unstack_date}</td>
      <td className="px-3 py-2 tabular text-fg">{batch.harvest_date}</td>
      <td className="px-3 py-2 text-right tabular text-muted">{batch.total_seed_grams_needed} g</td>
      <td className="px-3 py-2 text-right tabular text-muted">
        {formatWeight(batch.projected_yield_oz, units, "oz")}
      </td>
      <td className="px-3 py-2 text-right tabular text-fg">
        {formatUsd(batch.projected_gross_revenue_usd)}
      </td>
      <td className="px-3 py-2 text-right">
        <button
          type="button"
          onClick={() => onRemove(batch.id)}
          aria-label={`Remove ${batch.cultivar_name}`}
          className="inline-flex size-9 items-center justify-center text-muted hover:text-danger"
        >
          <Trash2 className="size-3.5" />
        </button>
      </td>
    </tr>
  );
}

function RackFace({ load }: { load: ReturnType<typeof rackLoadOnDate> }) {
  const slots: Array<"blackout" | "light" | "empty"> = [];
  for (let i = 0; i < RACK_TRAY_CAPACITY; i++) {
    if (i < load.blackout_trays) slots.push("blackout");
    else if (i < load.blackout_trays + load.light_trays) slots.push("light");
    else slots.push("empty");
  }
  const overflow = Math.max(0, load.total_trays - RACK_TRAY_CAPACITY);
  const rows: Array<typeof slots> = [];
  for (let t = 0; t < DEFAULT_RACK.tiers; t++) {
    const start = t * DEFAULT_RACK.traysPerShelf;
    rows.push(slots.slice(start, start + DEFAULT_RACK.traysPerShelf));
  }

  return (
    <section className="rounded-lg border border-border bg-surface">
      <header className="flex items-end justify-between gap-2 border-b border-border px-3 py-1.5">
        <p className="font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
          Rack · today
        </p>
        <p
          className={cn(
            "font-mono text-[10px] tracking-widest uppercase",
            load.over_capacity ? "text-danger" : "text-ok",
          )}
        >
          {load.total_trays}/{RACK_TRAY_CAPACITY}
        </p>
      </header>
      <div className="space-y-2 p-3">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-6 shrink-0 font-mono text-[9px] tracking-widest text-faint">
              T{DEFAULT_RACK.tiers - i}
            </span>
            <div className="grid flex-1 grid-cols-4 gap-1.5">
              {row.map((kind, j) => (
                <div
                  key={j}
                  title={kind}
                  className={cn(
                    "h-8 rounded-sm border",
                    kind === "blackout" && "border-border-strong bg-elevated",
                    kind === "light" && "border-ok/40 bg-ok/20",
                    kind === "empty" && "border-dashed border-border bg-bg",
                  )}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <dl className="grid grid-cols-3 gap-px border-t border-border bg-border">
        <Stat
          k="Blackout"
          v={`${load.blackout_trays}`}
          icon={<Moon className="size-3" />}
        />
        <Stat k="Light" v={`${load.light_trays}`} icon={<Sun className="size-3" />} />
        <Stat
          k="Racks"
          v={`${Math.max(1, load.racks_needed)}`}
          warn={load.over_capacity}
        />
      </dl>
      {overflow > 0 ? (
        <p className="border-t border-danger/40 bg-danger/10 px-3 py-2 font-mono text-[11px] text-danger">
          +{overflow} trays over a 16-slot rack — split to a second bay.
        </p>
      ) : (
        <p className="border-t border-border px-3 py-2 font-mono text-[10px] tracking-widest text-faint">
          4 tiers × 4 trays · stacked flats occupy blackout until unstack.
        </p>
      )}
    </section>
  );
}

function HorizonStrip({
  horizon,
  harvests,
  units,
}: {
  horizon: ReturnType<typeof rackHorizon>;
  harvests: NurseryBatchQueueItem[];
  units: Units;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-surface">
      <header className="border-b border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
        Occupancy · {HORIZON_DAYS} d · harvest calendar
      </header>
      <div className="grid grid-cols-7 gap-px bg-border">
        {horizon.map((d) => {
          const cap = Math.min(100, (d.total_trays / RACK_TRAY_CAPACITY) * 100);
          const bo = d.total_trays > 0 ? (d.blackout_trays / d.total_trays) * cap : 0;
          const lt = cap - bo;
          return (
            <div key={d.date} className="bg-elevated px-1 py-2 text-center">
              <p className="font-mono text-[9px] tracking-widest text-faint uppercase">
                {format(parseDay(d.date), "EEEEE")}
              </p>
              <p className="font-mono text-[11px] tabular text-muted">{format(parseDay(d.date), "dd")}</p>
              <div className="mx-auto mt-1 flex h-8 w-2.5 flex-col-reverse overflow-hidden rounded-sm bg-bg">
                <span className="w-full bg-border-strong" style={{ height: `${bo}%` }} />
                <span className="w-full bg-ok/70" style={{ height: `${lt}%` }} />
              </div>
              <p
                className={cn(
                  "mt-1 font-mono text-[11px] tabular",
                  d.over_capacity ? "text-danger" : "text-fg",
                )}
              >
                {d.total_trays}
              </p>
            </div>
          );
        })}
      </div>
      <div className="border-t border-border px-3 py-2">
        <p className="font-mono text-[10px] tracking-[0.16em] text-faint uppercase">Cut window</p>
        {harvests.length === 0 ? (
          <p className="mt-1 font-mono text-[11px] text-muted">No harvests in this {HORIZON_DAYS} d window.</p>
        ) : (
          <ul className="mt-1 space-y-0.5 font-mono text-[11px] text-fg">
            {harvests.map((b) => (
              <li key={b.id} className="flex flex-wrap justify-between gap-2">
                <span>
                  {b.harvest_date} · {b.cultivar_name} · {b.tray_count} trays
                </span>
                <span className="text-muted">
                  {formatWeight(b.projected_yield_oz, units, "oz")} · {formatUsd(b.projected_gross_revenue_usd)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Stat({
  k,
  v,
  warn,
  icon,
}: {
  k: string;
  v: string;
  warn?: boolean;
  icon?: ReactNode;
}) {
  return (
    <div className="bg-elevated px-3 py-2">
      <dt className="flex items-center gap-1 text-[9px] tracking-[0.16em] text-faint uppercase">
        {icon}
        {k}
      </dt>
      <dd className={cn("mt-0.5 font-mono text-sm tabular", warn ? "text-danger" : "text-fg")}>{v}</dd>
    </div>
  );
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
