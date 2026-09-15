import catalog from "../data/economics/storageSpecs.json" with { type: "json" };
import { addDays, format, parseISO, startOfWeek } from "date-fns";
import type { Crop } from "../types/crop";
import { salesUnitLabel } from "../types/crop";
import type { FarmState } from "../types/farm";
import type {
  ColdRoomThermalAudit,
  CropPostHarvestSpec,
  EconomicsSettings,
  EnterpriseCropBudget,
  SalesChannel,
  StorageThermalZone,
  WeeklyHarvestPickItem,
} from "../types/economics";
import {
  DIRECT_SEED_USD_PER_FT,
  PACK_HOUR_FACTOR,
  STORAGE_ZONES,
  TRANSPLANT_USD,
  ZONE_META,
  auditZoneLoad,
  mixWarnings,
  round1,
  round2,
  totesNeeded,
  unitPrice,
} from "./economics-calc";
import { expectedYieldLb, marketableUnits, plantCount } from "./math";

export const STORAGE_SPECS: CropPostHarvestSpec[] = catalog as CropPostHarvestSpec[];
export const SPEC_BY_ID: Map<string, CropPostHarvestSpec> = new Map(STORAGE_SPECS.map((s) => [s.crop_id, s]));

export const DEFAULT_ECONOMICS: EconomicsSettings = {
  labor_usd_per_hour: 18,
  channel: "mix",
  mix_direct_pct: 0.5,
  field_temp_f: 78,
  pull_down_hours: 4,
  cooler_length_ft: 8,
  cooler_width_ft: 8,
  cooler_height_ft: 8,
  week_start: "",
};

export function resolveEconomics(farm: FarmState): EconomicsSettings {
  const raw = farm.economics;
  const channel: SalesChannel =
    raw?.channel === "wholesale" || raw?.channel === "direct" || raw?.channel === "mix" ? raw.channel : "mix";
  return {
    labor_usd_per_hour: clamp(raw?.labor_usd_per_hour ?? DEFAULT_ECONOMICS.labor_usd_per_hour, 8, 60),
    channel,
    mix_direct_pct: clamp(raw?.mix_direct_pct ?? DEFAULT_ECONOMICS.mix_direct_pct, 0, 1),
    field_temp_f: clamp(raw?.field_temp_f ?? DEFAULT_ECONOMICS.field_temp_f, 40, 110),
    pull_down_hours: clamp(raw?.pull_down_hours ?? DEFAULT_ECONOMICS.pull_down_hours, 0.5, 24),
    cooler_length_ft: clamp(raw?.cooler_length_ft ?? DEFAULT_ECONOMICS.cooler_length_ft, 4, 40),
    cooler_width_ft: clamp(raw?.cooler_width_ft ?? DEFAULT_ECONOMICS.cooler_width_ft, 4, 20),
    cooler_height_ft: clamp(raw?.cooler_height_ft ?? DEFAULT_ECONOMICS.cooler_height_ft, 6, 12),
    week_start: raw?.week_start && /^\d{4}-\d{2}-\d{2}$/.test(raw.week_start) ? raw.week_start : "",
  };
}

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}

export function mondayIso(d: Date): string {
  return format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd");
}

function cal(isoDate: string): Date {
  return parseISO(`${isoDate.slice(0, 10)}T12:00:00`);
}

export function resolveWeekStart(farm: FarmState, today = new Date()): string {
  const settings = resolveEconomics(farm);
  if (settings.week_start) return mondayIso(cal(settings.week_start));
  const peak = peakHarvestWeek(farm, today);
  return peak ?? mondayIso(today);
}

export function specFor(cropId: string): CropPostHarvestSpec | undefined {
  return SPEC_BY_ID.get(cropId);
}

export function seedPropCostUsd(crop: Crop, bedFeet: number): number {
  if (crop.propagation.method === "direct-seed") return round2(bedFeet * DIRECT_SEED_USD_PER_FT);
  return round2(plantCount(crop, bedFeet) * TRANSPLANT_USD);
}

export function enterpriseBudgets(farm: FarmState, crops: Map<string, Crop>): EnterpriseCropBudget[] {
  const settings = resolveEconomics(farm);
  const acc = new Map<string, EnterpriseCropBudget>();
  for (const s of farm.successions) {
    const crop = crops.get(s.crop_id);
    const spec = SPEC_BY_ID.get(s.crop_id);
    if (!crop || !spec) continue;
    const ft = s.bed_feet_needed;
    const units = marketableUnits(crop, ft);
    const price = unitPrice(
      crop.yieldAndRevenue.targetWholesalePriceUsd,
      crop.yieldAndRevenue.targetDirectPriceUsd,
      settings.channel,
      settings.mix_direct_pct,
    );
    const gross = units * price;
    const hours = (ft / 100) * spec.harvest_hours_per_100_bed_ft * PACK_HOUR_FACTOR;
    const labor = hours * settings.labor_usd_per_hour;
    const seed = seedPropCostUsd(crop, ft);
    const row = acc.get(crop.id) ?? {
      crop_id: crop.id,
      crop_name: crop.cultivar,
      bed_feet: 0,
      projected_units: 0,
      sales_unit: salesUnitLabel(crop.yieldAndRevenue.salesUnit),
      gross_revenue_usd: 0,
      revenue_per_bed_foot_usd: 0,
      harvest_labor_hours: 0,
      harvest_labor_cost_usd: 0,
      seed_prop_cost_usd: 0,
      net_margin_usd: 0,
      margin_per_bed_foot_usd: 0,
    };
    row.bed_feet += ft;
    row.projected_units += units;
    row.gross_revenue_usd += gross;
    row.harvest_labor_hours += hours;
    row.harvest_labor_cost_usd += labor;
    row.seed_prop_cost_usd += seed;
    acc.set(crop.id, row);
  }
  return [...acc.values()]
    .map((row) => {
      const ft = Math.max(row.bed_feet, 0.01);
      row.projected_units = round1(row.projected_units);
      row.gross_revenue_usd = round2(row.gross_revenue_usd);
      row.harvest_labor_hours = round2(row.harvest_labor_hours);
      row.harvest_labor_cost_usd = round2(row.harvest_labor_cost_usd);
      row.seed_prop_cost_usd = round2(row.seed_prop_cost_usd);
      row.net_margin_usd = round2(row.gross_revenue_usd - row.harvest_labor_cost_usd - row.seed_prop_cost_usd);
      row.revenue_per_bed_foot_usd = round2(row.gross_revenue_usd / ft);
      row.margin_per_bed_foot_usd = round2(row.net_margin_usd / ft);
      return row;
    })
    .sort((a, b) => b.net_margin_usd - a.net_margin_usd);
}

function inHarvestWindow(s: { target_harvest_date: string; harvest_end_date: string }, weekStart: string): boolean {
  const start = weekStart;
  const end = format(addDays(cal(weekStart), 6), "yyyy-MM-dd");
  const a = s.target_harvest_date;
  const b = s.harvest_end_date || s.target_harvest_date;
  return a <= end && b >= start;
}

/** Single-cut: full yield the week of target harvest. Multi-cut: season yield / maxHarvests each overlapping week. */
function weekPickFraction(crop: Crop, s: { target_harvest_date: string; harvest_end_date: string }, weekStart: string): number {
  const end = format(addDays(cal(weekStart), 6), "yyyy-MM-dd");
  if (!crop.timeline.isMulticut) {
    return s.target_harvest_date >= weekStart && s.target_harvest_date <= end ? 1 : 0;
  }
  if (!inHarvestWindow(s, weekStart)) return 0;
  return 1 / Math.max(1, crop.timeline.maxHarvests);
}

export function weeklyPicks(
  farm: FarmState,
  crops: Map<string, Crop>,
  weekStart: string,
): WeeklyHarvestPickItem[] {
  const out: WeeklyHarvestPickItem[] = [];
  for (const s of farm.successions) {
    const crop = crops.get(s.crop_id);
    const spec = SPEC_BY_ID.get(s.crop_id);
    const block = farm.blocks.find((b) => b.id === s.block_id);
    if (!crop || !spec || !block) continue;
    const frac = weekPickFraction(crop, s, weekStart);
    if (frac <= 0) continue;
    const ft = s.bed_feet_needed;
    const lbs = expectedYieldLb(crop, ft) * frac;
    const cooler = ZONE_META[spec.storage_zone].temp_f;
    out.push({
      succession_id: s.id,
      crop_id: crop.id,
      crop_name: crop.cultivar,
      block_name: block.name,
      bed_index: s.bed_index,
      harvest_date: s.target_harvest_date,
      units_to_pick: round1(marketableUnits(crop, ft) * frac),
      sales_unit: salesUnitLabel(crop.yieldAndRevenue.salesUnit),
      gross_lbs: round1(lbs),
      totes_needed: totesNeeded(lbs, spec.totes_per_100_lbs),
      thermal_zone: spec.storage_zone,
      target_cooler_temp_f: cooler,
      min_safe_temp_f: spec.min_safe_temp_f,
      chill_risk: cooler + 0.4 < spec.min_safe_temp_f,
    });
  }
  return out.sort((a, b) => a.harvest_date.localeCompare(b.harvest_date) || a.block_name.localeCompare(b.block_name));
}

export function peakHarvestWeek(farm: FarmState, today = new Date()): string | null {
  const weeks = new Map<string, number>();
  for (const s of farm.successions) {
    const key = mondayIso(cal(s.target_harvest_date));
    weeks.set(key, (weeks.get(key) ?? 0) + 1);
  }
  if (!weeks.size) return null;
  const todayKey = mondayIso(today);
  if (weeks.has(todayKey)) return todayKey;
  return [...weeks.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null;
}

export function farmAudits(
  farm: FarmState,
  crops: Map<string, Crop>,
  weekStart: string,
): ColdRoomThermalAudit[] {
  const settings = resolveEconomics(farm);
  const picks = weeklyPicks(farm, crops, weekStart);
  return STORAGE_ZONES.map((zone) => {
    const slice = picks.filter((p) => p.thermal_zone === zone);
    const lines = slice.map((p) => ({
      spec: SPEC_BY_ID.get(p.crop_id)!,
      crop_name: p.crop_name,
      lbs: p.gross_lbs,
      totes: p.totes_needed,
    }));
    return auditZoneLoad(zone, lines, settings);
  });
}

export function packMixWarnings(picks: WeeklyHarvestPickItem[]): string[] {
  return mixWarnings(picks.map((p) => p.thermal_zone));
}

export function budgetTotals(rows: EnterpriseCropBudget[]): {
  bed_feet: number;
  gross_revenue_usd: number;
  harvest_labor_cost_usd: number;
  seed_prop_cost_usd: number;
  net_margin_usd: number;
  margin_per_bed_foot_usd: number;
} {
  const bed = rows.reduce((s, r) => s + r.bed_feet, 0);
  const gross = rows.reduce((s, r) => s + r.gross_revenue_usd, 0);
  const labor = rows.reduce((s, r) => s + r.harvest_labor_cost_usd, 0);
  const seed = rows.reduce((s, r) => s + r.seed_prop_cost_usd, 0);
  const net = gross - labor - seed;
  return {
    bed_feet: round1(bed),
    gross_revenue_usd: round2(gross),
    harvest_labor_cost_usd: round2(labor),
    seed_prop_cost_usd: round2(seed),
    net_margin_usd: round2(net),
    margin_per_bed_foot_usd: bed > 0 ? round2(net / bed) : 0,
  };
}

export { ZONE_META, STORAGE_ZONES };
export type { StorageThermalZone };
