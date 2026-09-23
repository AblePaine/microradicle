/**
 * 1020-tray microgreen math. Soak hours are forced to 0 on mucilaginous seed.
 */
import { addDays, addHours, format, parseISO } from "date-fns";
import type { MicrogreenCultivar, NurseryBatchQueueItem } from "../types/nursery.ts";
import {
  CLAMSHELL_OZ,
  DEFAULT_RACK,
  MAX_TRAYS_PER_BATCH,
  RACK_TRAY_CAPACITY,
} from "../types/nursery.ts";

export { CLAMSHELL_OZ, DEFAULT_RACK, MAX_TRAYS_PER_BATCH, RACK_TRAY_CAPACITY };

export function isoDay(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function parseDay(iso: string): Date {
  return parseISO(`${iso}T12:00:00`);
}

export function isMucilageLocked(crop: MicrogreenCultivar): boolean {
  return (
    crop.isMucilaginous ||
    crop.soakProtocol === "mucilaginous-no-soak" ||
    crop.soakProtocol === "none-dry-sow"
  );
}

/** Hard 0-hour soak for mucilaginous / dry-sow cultivars. */
export function resolvedSoakHours(crop: MicrogreenCultivar): number {
  if (isMucilageLocked(crop)) return 0;
  return Math.max(0, crop.soakHours);
}

export function mucilageWarning(crop: MicrogreenCultivar): string | null {
  if (!crop.isMucilaginous && crop.soakProtocol !== "mucilaginous-no-soak") return null;
  return `${crop.cultivar} seed gels in water — a soak ruins the tray. Sow it dry.`;
}

export function assertSafeSoak(crop: MicrogreenCultivar, requestedHours: number): void {
  if (isMucilageLocked(crop) && requestedHours > 0) {
    throw new Error(
      mucilageWarning(crop) ?? `${crop.cultivar}: soak is not allowed on this seed.`,
    );
  }
}

export function clampTrays(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(MAX_TRAYS_PER_BATCH, Math.round(n)));
}

export function seedGramsForTrays(crop: MicrogreenCultivar, trayCount: number): number {
  return round1(crop.seedWeightGramsPer1020 * clampTrays(trayCount));
}

export function seedCountForTrays(crop: MicrogreenCultivar, trayCount: number): number {
  return Math.round(seedGramsForTrays(crop, trayCount) * crop.seedCountPerGram);
}

export function yieldOzForTrays(crop: MicrogreenCultivar, trayCount: number): number {
  return round1(crop.targetYieldOzPerTray * clampTrays(trayCount));
}

export function wholesaleUsdForTrays(crop: MicrogreenCultivar, trayCount: number): number {
  return round2((yieldOzForTrays(crop, trayCount) / 16) * crop.targetWholesalePricePerLbUsd);
}

export function clamshellsForTrays(crop: MicrogreenCultivar, trayCount: number): number {
  // m5: floor — a partial clamshell isn't a sellable unit.
  return Math.max(0, Math.floor(yieldOzForTrays(crop, trayCount) / CLAMSHELL_OZ));
}

export function clamshellUsdForTrays(crop: MicrogreenCultivar, trayCount: number): number {
  return round2(clamshellsForTrays(crop, trayCount) * crop.targetClamshellUnitPriceUsd);
}

/** µmol·m⁻²·s⁻¹ required to hit the target DLI over the photoperiod. */
export function ppfdForDli(dliMolM2D: number, photoperiodHours: number): number {
  if (!(photoperiodHours > 0) || !(dliMolM2D > 0)) return 0;
  return round1((dliMolM2D * 1_000_000) / (photoperiodHours * 3600));
}

export function soakStartDate(sowDate: string, soakHours: number): string | null {
  if (soakHours <= 0) return null;
  const start = addHours(parseDay(sowDate), -soakHours);
  return isoDay(start);
}

export function unstackDate(sowDate: string, blackoutDays: number): string {
  return isoDay(addDays(parseDay(sowDate), Math.max(0, blackoutDays)));
}

export function harvestDate(sowDate: string, cycleDays: number): string {
  return isoDay(addDays(parseDay(sowDate), Math.max(1, cycleDays)));
}

export function computeBatch(
  crop: MicrogreenCultivar,
  trayCount: number,
  sowDate: string,
  id: string,
): NurseryBatchQueueItem {
  const trays = clampTrays(trayCount);
  const soakHours = resolvedSoakHours(crop);
  return {
    id,
    cultivar_id: crop.id,
    cultivar_name: crop.cultivar,
    tray_count: trays,
    sow_date: sowDate,
    soak_start_date: soakStartDate(sowDate, soakHours),
    unstack_date: unstackDate(sowDate, crop.blackoutDays),
    harvest_date: harvestDate(sowDate, crop.totalCycleDays),
    total_seed_grams_needed: seedGramsForTrays(crop, trays),
    projected_yield_oz: yieldOzForTrays(crop, trays),
    projected_gross_revenue_usd: wholesaleUsdForTrays(crop, trays),
  };
}

export type RackDayLoad = {
  date: string;
  blackout_trays: number;
  light_trays: number;
  total_trays: number;
  racks_needed: number;
  over_capacity: boolean;
};

export function rackLoadOnDate(batches: NurseryBatchQueueItem[], date: string): RackDayLoad {
  let blackout = 0;
  let light = 0;
  for (const b of batches) {
    if (date < b.sow_date || date > b.harvest_date) continue;
    if (date < b.unstack_date) blackout += b.tray_count;
    else light += b.tray_count;
  }
  const total = blackout + light;
  const racks = Math.ceil(total / RACK_TRAY_CAPACITY);
  return {
    date,
    blackout_trays: blackout,
    light_trays: light,
    total_trays: total,
    racks_needed: racks,
    over_capacity: total > RACK_TRAY_CAPACITY,
  };
}

/** Occupancy for each day in `[startDate, startDate + days)`. Caps at 31 days. */
export function rackHorizon(
  batches: NurseryBatchQueueItem[],
  startDate: string,
  days = 14,
): RackDayLoad[] {
  const start = parseDay(startDate);
  const n = Math.max(1, Math.min(31, Math.round(days)));
  return Array.from({ length: n }, (_, i) => rackLoadOnDate(batches, isoDay(addDays(start, i))));
}

export function harvestsInWindow(
  batches: NurseryBatchQueueItem[],
  from: string,
  to: string,
): NurseryBatchQueueItem[] {
  return batches
    .filter((b) => b.harvest_date >= from && b.harvest_date <= to)
    .slice()
    .sort(
      (a, b) =>
        a.harvest_date.localeCompare(b.harvest_date) || a.cultivar_name.localeCompare(b.cultivar_name),
    );
}

export function seedInventoryGrams(batches: NurseryBatchQueueItem[]): number {
  return round1(batches.reduce((s, b) => s + b.total_seed_grams_needed, 0));
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
