import { Link } from "@tanstack/react-router";
import { addDays, format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import type { EconomicsSettings, SalesChannel, StorageThermalZone } from "@/types/economics";
import type { FarmState, Units } from "@/types/farm";
import { cropBySlug } from "@/lib/crops";
import {
  budgetTotals,
  enterpriseBudgets,
  mondayIso,
  peakHarvestWeek,
  resolveEconomics,
  resolveWeekStart,
  weeklyPicks,
  ZONE_META,
} from "@/lib/economicsMath";
import { formatBedFt, formatTemp, formatUsd, formatWeight } from "@/lib/math";
import { cn } from "@/lib/utils";

const CHANNELS: { id: SalesChannel; label: string }[] = [
  { id: "wholesale", label: "WHOLE" },
  { id: "direct", label: "DIRECT" },
  { id: "mix", label: "MIX" },
];

const ZONE_SHORT: Record<StorageThermalZone, string> = {
  "zone-1-cold-wet": "Z1",
  "zone-2-cool-humid": "Z2",
  "zone-3-ambient-dry": "Z3",
  "zone-curing": "CURE",
};

type Props = {
  farm: FarmState;
  onPatch: (partial: Partial<EconomicsSettings>) => void;
  cropId?: string;
  zoneId?: StorageThermalZone;
};

export function PackShedPlanner({ farm, onPatch, cropId, zoneId }: Props) {
  const settings = resolveEconomics(farm);
  const units = farm.units;
  const weekStart = resolveWeekStart(farm);
  const autoWeek = !settings.week_start;

  const allPicks = useMemo(() => weeklyPicks(farm, cropBySlug, weekStart), [farm, weekStart]);
  const picks = useMemo(
    () =>
      allPicks.filter((p) => {
        if (cropId && p.crop_id !== cropId) return false;
        if (zoneId && p.thermal_zone !== zoneId) return false;
        return true;
      }),
    [allPicks, cropId, zoneId],
  );
  const budgets = useMemo(() => {
    const rows = enterpriseBudgets(farm, cropBySlug);
    return cropId ? rows.filter((r) => r.crop_id === cropId) : rows;
  }, [farm, cropId]);
  const totals = budgetTotals(budgets);
  const totes = picks.reduce((s, p) => s + p.totes_needed, 0);
  const lbs = picks.reduce((s, p) => s + p.gross_lbs, 0);
  const peak = peakHarvestWeek(farm);
  const emptyWeek = picks.length === 0;

  function shiftWeek(days: number) {
    onPatch({ week_start: format(addDays(parseISO(`${weekStart}T12:00:00`), days), "yyyy-MM-dd") });
  }

  return (
    <div className="space-y-3">
      <section className="rounded-lg border border-border bg-surface">
        <header className="border-b border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
          Pack · labor · channel · week
        </header>
        <div className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-5">
          <NumField
            label="Labor"
            value={settings.labor_usd_per_hour}
            step={0.5}
            min={8}
            max={60}
            onChange={(n) => onPatch({ labor_usd_per_hour: n })}
            hint="$ / hour harvest + pack"
          />
          <div>
            <p className="font-mono text-[10px] tracking-widest text-subtle">CHANNEL</p>
            <div className="mt-1 flex h-11 overflow-hidden rounded-sm border border-border">
              {CHANNELS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onPatch({ channel: c.id })}
                  className={cn(
                    "flex-1 font-mono text-[10px] tracking-widest transition-colors",
                    settings.channel === c.id ? "bg-accent text-accent-fg" : "text-muted hover:text-fg",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <NumField
            label="Mix direct"
            value={Math.round(settings.mix_direct_pct * 100)}
            step={5}
            min={0}
            max={100}
            onChange={(n) => onPatch({ mix_direct_pct: n / 100 })}
            hint={settings.channel === "mix" ? "% of units at farm-gate" : "used only on MIX"}
          />
          <label className="block font-mono text-[10px] tracking-widest text-subtle">
            WEEK START
            <input
              type="date"
              value={weekStart}
              onChange={(e) => {
                const v = e.target.value;
                if (!v) {
                  onPatch({ week_start: "" });
                  return;
                }
                onPatch({ week_start: mondayIso(parseISO(`${v}T12:00:00`)) });
              }}
              className="mt-1 h-11 w-full rounded-sm border border-border bg-elevated px-2 tabular text-sm text-fg outline-none focus:border-accent"
            />
            <span className="mt-1 block text-[9px] tracking-widest text-faint">
              {autoWeek ? "auto · peak if this week is empty" : "pinned Monday"}
            </span>
          </label>
          <div className="flex h-11 items-end gap-1 self-end">
            <button
              type="button"
              aria-label="Previous week"
              onClick={() => shiftWeek(-7)}
              className="inline-flex size-11 items-center justify-center rounded-sm border border-border text-muted hover:text-accent"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onPatch({ week_start: "" })}
              className="h-11 flex-1 rounded-sm border border-border px-2 font-mono text-[10px] tracking-widest text-muted hover:border-accent hover:text-accent"
            >
              AUTO
            </button>
            <button
              type="button"
              aria-label="Next week"
              onClick={() => shiftWeek(7)}
              className="inline-flex size-11 items-center justify-center rounded-sm border border-border text-muted hover:text-accent"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-4">
          <Stat k="Week" v={weekLabel(weekStart)} />
          <Stat k="Cuts" v={`${picks.length} lines`} />
          <Stat k="Mass" v={formatWeight(lbs, units)} />
          <Stat k="Totes" v={String(totes)} />
        </dl>
      </section>

      {emptyWeek ? (
        <p className="rounded-md border border-border bg-elevated px-3 py-2 font-mono text-xs text-muted">
          No cuts this week.
          {peak && peak !== weekStart ? (
            <>
              {" "}
              <button
                type="button"
                onClick={() => onPatch({ week_start: peak })}
                className="text-accent hover:underline"
              >
                Jump to peak harvest week {weekLabel(peak)}
              </button>
              .
            </>
          ) : (
            " Drop harvest dates in the engine first."
          )}
        </p>
      ) : (
        <p className="rounded-md border border-ok/30 bg-elevated px-3 py-2 font-mono text-xs text-ok">
          {totals.net_margin_usd >= 0
            ? `Net ${formatUsd(totals.net_margin_usd)} · ${formatUsd(totals.margin_per_bed_foot_usd)} / bed-foot after harvest+pack labor and seed.`
            : `Negative ${formatUsd(totals.net_margin_usd)} on this channel. Raise price mix or drop slow beds.`}
        </p>
      )}

      <section className="overflow-hidden rounded-lg border border-border bg-surface">
        <header className="border-b border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
          Weekly pick · {weekLabel(weekStart)}
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] font-mono text-xs">
            <thead className="bg-elevated text-[10px] tracking-widest text-faint">
              <tr>
                <th className="px-3 py-2 text-left">DATE</th>
                <th className="px-3 py-2 text-left">BLOCK</th>
                <th className="px-3 py-2 text-right">BED</th>
                <th className="px-3 py-2 text-left">CULTIVAR</th>
                <th className="px-3 py-2 text-right">UNITS</th>
                <th className="px-3 py-2 text-right">{units === "metric" ? "KG" : "LB"}</th>
                <th className="px-3 py-2 text-right">TOTES</th>
                <th className="px-3 py-2 text-left">ZONE</th>
                <th className="px-3 py-2 text-left">BOX</th>
              </tr>
            </thead>
            <tbody>
              {picks.map((p) => (
                <tr key={p.succession_id} className="border-t border-border">
                  <td className="px-3 py-2 tabular text-muted">{p.harvest_date.slice(5)}</td>
                  <td className="px-3 py-2 text-muted">{p.block_name}</td>
                  <td className="px-3 py-2 text-right tabular text-muted">{p.bed_index + 1}</td>
                  <td className="px-3 py-2">
                    <Link to="/economics/$slug" params={{ slug: p.crop_id }} className="text-fg hover:text-accent">
                      {p.crop_name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-right tabular">
                    {p.units_to_pick} {p.sales_unit}
                  </td>
                  <td className="px-3 py-2 text-right tabular">{formatWeight(p.gross_lbs, units)}</td>
                  <td className="px-3 py-2 text-right tabular text-accent">{p.totes_needed}</td>
                  <td className="px-3 py-2">
                    <Link
                      to="/economics/$slug"
                      params={{ slug: p.thermal_zone }}
                      className="text-muted hover:text-accent"
                    >
                      {ZONE_SHORT[p.thermal_zone]}
                    </Link>
                  </td>
                  <td className={cn("px-3 py-2", p.chill_risk ? "text-danger" : "text-ok")}>
                    {p.chill_risk ? `CHILL ${formatTemp(p.min_safe_temp_f, units)}` : formatTemp(p.target_cooler_temp_f, units)}
                  </td>
                </tr>
              ))}
              {picks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-muted">
                    Empty pack list for this filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-surface">
        <header className="border-b border-border px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-subtle uppercase">
          Enterprise · {settings.channel}
          {settings.channel === "mix" ? ` ${Math.round(settings.mix_direct_pct * 100)}% direct` : ""}
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] font-mono text-xs">
            <thead className="bg-elevated text-[10px] tracking-widest text-faint">
              <tr>
                <th className="px-3 py-2 text-left">CULTIVAR</th>
                <th className="px-3 py-2 text-right">FEET</th>
                <th className="px-3 py-2 text-right">UNITS</th>
                <th className="px-3 py-2 text-right">GROSS</th>
                <th className="px-3 py-2 text-right">LABOR</th>
                <th className="px-3 py-2 text-right">SEED</th>
                <th className="px-3 py-2 text-right">MARGIN</th>
                <th className="px-3 py-2 text-right">$/FT</th>
              </tr>
            </thead>
            <tbody>
              {budgets.map((row) => (
                <tr key={row.crop_id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <Link to="/economics/$slug" params={{ slug: row.crop_id }} className="text-fg hover:text-accent">
                      {row.crop_name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-right tabular text-muted">{formatBedFt(row.bed_feet, units)}</td>
                  <td className="px-3 py-2 text-right tabular text-muted">
                    {row.projected_units} {row.sales_unit}
                  </td>
                  <td className="px-3 py-2 text-right tabular">{formatUsd(row.gross_revenue_usd)}</td>
                  <td className="px-3 py-2 text-right tabular text-muted">{formatUsd(row.harvest_labor_cost_usd)}</td>
                  <td className="px-3 py-2 text-right tabular text-muted">{formatUsd(row.seed_prop_cost_usd)}</td>
                  <td
                    className={cn(
                      "px-3 py-2 text-right tabular",
                      row.net_margin_usd < 0 ? "text-danger" : "text-ok",
                    )}
                  >
                    {formatUsd(row.net_margin_usd)}
                  </td>
                  <td className="px-3 py-2 text-right tabular text-accent">{formatUsd(row.margin_per_bed_foot_usd)}</td>
                </tr>
              ))}
              {budgets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-muted">
                    No successions with a post-harvest spec.
                  </td>
                </tr>
              ) : (
                <tr className="border-t border-border bg-elevated">
                  <td className="px-3 py-2 text-fg">TOTAL</td>
                  <td className="px-3 py-2 text-right tabular">{formatBedFt(totals.bed_feet, units)}</td>
                  <td className="px-3 py-2" />
                  <td className="px-3 py-2 text-right tabular">{formatUsd(totals.gross_revenue_usd)}</td>
                  <td className="px-3 py-2 text-right tabular">{formatUsd(totals.harvest_labor_cost_usd)}</td>
                  <td className="px-3 py-2 text-right tabular">{formatUsd(totals.seed_prop_cost_usd)}</td>
                  <td
                    className={cn(
                      "px-3 py-2 text-right tabular",
                      totals.net_margin_usd < 0 ? "text-danger" : "text-ok",
                    )}
                  >
                    {formatUsd(totals.net_margin_usd)}
                  </td>
                  <td className="px-3 py-2 text-right tabular text-accent">
                    {formatUsd(totals.margin_per_bed_foot_usd)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-border px-3 py-2 font-mono text-[10px] tracking-widest text-faint">
          Labor = harvest hours × 1.25 pack factor × ${settings.labor_usd_per_hour.toFixed(0)}/hr. Seed $0.10 / transplant,
          $0.05 / bed-ft direct-seed. {ZONE_META["zone-1-cold-wet"].label} never shares a box with fruiting crops.
        </p>
      </section>
    </div>
  );
}

function weekLabel(isoDate: string): string {
  const start = parseISO(`${isoDate}T12:00:00`);
  const end = addDays(start, 6);
  return `${format(start, "d MMM")}–${format(end, "d MMM")}`;
}

function NumField({
  label,
  value,
  onChange,
  step,
  min,
  max,
  hint,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step: number;
  min: number;
  max: number;
  hint: string;
}) {
  return (
    <label className="block font-mono text-[10px] tracking-widest text-subtle">
      {label.toUpperCase()}
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 h-11 w-full rounded-sm border border-border bg-elevated px-2 tabular text-sm text-fg outline-none focus:border-accent"
      />
      <span className="mt-1 block text-[9px] tracking-widest text-faint">{hint}</span>
    </label>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-elevated px-3 py-3">
      <dt className="font-mono text-[9px] tracking-[0.16em] text-faint uppercase">{k}</dt>
      <dd className="mt-1 font-mono text-xs tabular text-fg">{v}</dd>
    </div>
  );
}
