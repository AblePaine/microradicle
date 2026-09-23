import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { salesUnitLabel, type Crop } from "../types/crop";
import type { BedRef, BedSuccession, FarmClimate, FarmState, FieldBlock, Units } from "../types/farm";

export const BED_WIDTH_IN = 30;
export const IN_TO_CM = 2.54;
export const FT_TO_M = 0.3048;
export const LB_TO_KG = 0.453592;
/** Gallons in one inch of water over one square foot. */
export const GAL_PER_INCH_SQFT = 0.623377;

export function inToCm(inches: number): number {
  return inches * IN_TO_CM;
}

export function ftToM(ft: number): number {
  return ft * FT_TO_M;
}

export function lbToKg(lb: number): number {
  return lb * LB_TO_KG;
}

export function fToC(f: number): number {
  return (f - 32) * (5 / 9);
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function round0(n: number): number {
  return Math.round(n);
}

export function formatLengthIn(inches: number, units: Units): string {
  if (units === "metric") return `${round1(inToCm(inches))} cm`;
  const whole = Math.floor(inches);
  const frac = inches - whole;
  const prefix = whole === 0 ? "" : String(whole);
  if (Math.abs(frac) < 0.05) return `${whole} in`;
  if (Math.abs(frac - 0.25) < 0.05) return `${prefix}¼ in`;
  if (Math.abs(frac - 0.5) < 0.05) return `${prefix}½ in`;
  if (Math.abs(frac - 0.75) < 0.05) return `${prefix}¾ in`;
  return `${round1(inches)} in`;
}

export function formatBedFt(ft: number, units: Units): string {
  if (units === "metric") return `${round1(ftToM(ft))} m`;
  return `${round1(ft)} ft`;
}

export function formatWeight(lb: number, units: Units, unit = "lb"): string {
  if (unit !== "lb" && unit !== "lbs" && unit !== "pound") {
    const n = units === "metric" && unit === "oz" ? round1(lb * 28.35) : round1(lb);
    const label = units === "metric" && unit === "oz" ? "g" : unit;
    return `${n} ${label}`;
  }
  if (units === "metric") return `${round1(lbToKg(lb))} kg`;
  return `${round1(lb)} lb`;
}

export function formatTemp(f: number, units: Units): string {
  if (units === "metric") return `${round0(fToC(f))}°C`;
  return `${round0(f)}°F`;
}

export function formatUsd(n: number): string {
  return `$${n.toFixed(2)}`;
}

export function plantsPerBedFt(crop: Crop): number {
  return crop.fieldGeometry.plantsPerLinearFoot;
}

export function plantCount(crop: Crop, lengthFt: number): number {
  return Math.round(plantsPerBedFt(crop) * lengthFt);
}

export function marketableUnits(crop: Crop, lengthFt: number): number {
  return crop.yieldAndRevenue.unitsPerBedFoot * lengthFt * (1 - crop.yieldAndRevenue.standardCullRate);
}

export function expectedYieldLb(crop: Crop, lengthFt: number): number {
  return crop.yieldAndRevenue.targetYieldLbsPerBedFoot * lengthFt * (1 - crop.yieldAndRevenue.standardCullRate);
}

export function expectedYieldDisplay(crop: Crop, lengthFt: number, units: Units): string {
  const y = crop.yieldAndRevenue;
  if (y.salesUnit === "pound") return formatWeight(expectedYieldLb(crop, lengthFt), units, "lb");
  const n = round1(marketableUnits(crop, lengthFt));
  return `${n} ${salesUnitLabel(y.salesUnit, n)}`;
}

export function wholesaleRevenue(crop: Crop, lengthFt: number): number {
  return marketableUnits(crop, lengthFt) * crop.yieldAndRevenue.targetWholesalePriceUsd;
}

export function directRevenue(crop: Crop, lengthFt: number): number {
  return marketableUnits(crop, lengthFt) * crop.yieldAndRevenue.targetDirectPriceUsd;
}

export function occupancyDays(crop: Crop): number {
  const t = crop.timeline;
  let extra = t.fieldHoldingDays;
  if (t.isMulticut && t.maxHarvests > 1 && t.regrowthDays) {
    extra += (t.maxHarvests - 1) * t.regrowthDays;
  }
  return t.dtmFromField + extra;
}

export function emittersOnBed(crop: Crop, lengthFt: number): number {
  const { linesPerBed, emitterSpacingIn } = crop.irrigationProfile;
  return linesPerBed * Math.max(1, Math.round((lengthFt * 12) / emitterSpacingIn));
}

export function dripGph(crop: Crop, lengthFt: number): number {
  return emittersOnBed(crop, lengthFt) * crop.irrigationProfile.emitterGph;
}

export function weeklyGallons(crop: Crop, lengthFt: number): number {
  const areaSqFt = lengthFt * (BED_WIDTH_IN / 12);
  return crop.irrigationProfile.weeklyWaterRequirementIn * areaSqFt * GAL_PER_INCH_SQFT;
}

export function extractionLbs(
  crop: Crop,
  lengthFt: number,
): { n: number; p: number; k: number } {
  const f = lengthFt / 100;
  const s = crop.soilExtractionProfile;
  return {
    n: s.nRemovalLbsPer100BedFt * f,
    p: s.pRemovalLbsPer100BedFt * f,
    k: s.kRemovalLbsPer100BedFt * f,
  };
}

export function greenhouseStart(fieldDate: Date, crop: Crop): Date {
  return addDays(fieldDate, -crop.propagation.nurseryLeadDays);
}

export function harvestDate(sow: Date, crop: Crop): Date {
  return addDays(sow, crop.timeline.dtmFromField);
}

export function occupancyEnd(sow: Date, crop: Crop): Date {
  return addDays(sow, occupancyDays(crop));
}

export function holdingDays(crop: Crop): number {
  return occupancyDays(crop) - crop.timeline.dtmFromField;
}

export function iso(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function parseMd(md: string, year: number): Date {
  const [m, d] = md.split("-").map(Number);
  return new Date(year, (m ?? 1) - 1, d ?? 1);
}

export function rowCentersIn(rows: number, bedWidthIn = BED_WIDTH_IN, edgeIn = 3): number[] {
  if (rows <= 1) return [bedWidthIn / 2];
  const usable = bedWidthIn - edgeIn * 2;
  const step = usable / (rows - 1);
  return Array.from({ length: rows }, (_, i) => edgeIn + i * step);
}

export function dripLineCentersIn(lines: number, bedWidthIn = BED_WIDTH_IN): number[] {
  return rowCentersIn(lines, bedWidthIn, 4);
}

export function bedFeetForTarget(crop: Crop, targetLb: number): number {
  const per = crop.yieldAndRevenue.targetYieldLbsPerBedFoot * (1 - crop.yieldAndRevenue.standardCullRate);
  return targetLb / Math.max(per, 0.001);
}

export function seedNeeded(crop: Crop, lengthFt: number, germRate = 0.85): number {
  return Math.ceil(plantCount(crop, lengthFt) / germRate);
}

export function dtmAdjusted(crop: Crop, sow: Date, firstFrost: Date): number {
  const base = crop.timeline.dtmFromField;
  const daysToFrost = differenceInCalendarDays(firstFrost, sow);
  if (daysToFrost < 90 && crop.timeline.fallPhotoperiodMultiplier !== 1) {
    return Math.round(base * crop.timeline.fallPhotoperiodMultiplier);
  }
  return base;
}

export function fieldMethod(crop: Crop): "direct" | "transplant" | "either" {
  if (crop.propagation.method === "direct-seed") return "direct";
  if (crop.propagation.method === "transplant") return "transplant";
  return "either";
}

export function bedKey(blockId: string, bedIndex: number): string {
  return `${blockId}:${bedIndex}`;
}

export function parseBedKey(key: string): { blockId: string; bedIndex: number } {
  const i = key.lastIndexOf(":");
  return { blockId: key.slice(0, i), bedIndex: Number(key.slice(i + 1)) || 0 };
}

export function listBeds(farm: FarmState): BedRef[] {
  const out: BedRef[] = [];
  for (const block of farm.blocks) {
    for (let bed_index = 0; bed_index < block.bed_count; bed_index++) {
      out.push({
        block,
        bed_index,
        key: bedKey(block.id, bed_index),
        label: `${block.name} ${bed_index + 1}`,
      });
    }
  }
  return out;
}

export function totalBeds(farm: FarmState): number {
  return farm.blocks.reduce((s, b) => s + b.bed_count, 0);
}

export function totalLinearFt(farm: FarmState): number {
  return farm.blocks.reduce((s, b) => s + b.bed_count * b.bed_length_ft, 0);
}

export function successionsOnBed(farm: FarmState, blockId: string, bedIndex: number): BedSuccession[] {
  return farm.successions.filter((s) => s.block_id === blockId && s.bed_index === bedIndex);
}

export type SuccessionDraft = {
  id?: string;
  block_id: string;
  bed_index: number;
  crop_id: string;
  target_harvest_date: string;
};

export function computeSuccession(
  draft: SuccessionDraft,
  crop: Crop,
  block: FieldBlock,
  climate: FarmClimate,
): BedSuccession {
  const harvest = parseISO(draft.target_harvest_date);
  const year = harvest.getFullYear();
  const firstFrost = parseMd(climate.first_fall_frost, year);
  let dtm = crop.timeline.dtmFromField;
  let field = addDays(harvest, -dtm);
  dtm = dtmAdjusted(crop, field, firstFrost);
  field = addDays(harvest, -dtm);
  const nursery = addDays(field, -crop.propagation.nurseryLeadDays);
  const end = addDays(harvest, holdingDays(crop));
  const bed_feet_needed = block.bed_length_ft;
  return {
    id: draft.id ?? "",
    block_id: draft.block_id,
    bed_index: draft.bed_index,
    crop_id: draft.crop_id,
    target_harvest_date: iso(harvest),
    field_transplant_date: iso(field),
    nursery_sow_date: iso(nursery),
    harvest_end_date: iso(end),
    bed_feet_needed,
    target_units: round1(marketableUnits(crop, bed_feet_needed)),
  };
}

export type Occupancy = {
  succession: BedSuccession;
  start: Date;
  harvest: Date;
  end: Date;
};

export function occupancy(succession: BedSuccession): Occupancy {
  return {
    succession,
    start: parseISO(succession.field_transplant_date),
    harvest: parseISO(succession.target_harvest_date),
    end: parseISO(succession.harvest_end_date),
  };
}

export function datesOverlap(a0: Date, a1: Date, b0: Date, b1: Date): boolean {
  return a0.getTime() < b1.getTime() && b0.getTime() < a1.getTime();
}

export function successionConflicts(
  candidate: BedSuccession,
  farm: FarmState,
  ignoreId?: string,
): BedSuccession[] {
  const a = occupancy(candidate);
  return farm.successions.filter((s) => {
    if (s.id === ignoreId) return false;
    if (s.block_id !== candidate.block_id || s.bed_index !== candidate.bed_index) return false;
    const b = occupancy(s);
    return datesOverlap(a.start, a.end, b.start, b.end);
  });
}

export function seasonWindow(farm: FarmState, crop: Crop, year: number): { start: Date; end: Date } {
  const last = parseMd(farm.climate.last_spring_frost, year);
  const first = parseMd(farm.climate.first_fall_frost, year);
  const dtm = crop.timeline.dtmFromField;
  const hard = crop.timeline.frostHardiness;
  if (hard === "extreme") {
    return { start: addDays(last, -35), end: addDays(first, 14) };
  }
  if (hard === "hardy") {
    return { start: addDays(last, -21), end: first };
  }
  if (hard === "moderate") {
    return { start: last, end: addDays(first, -Math.round(dtm * 0.35)) };
  }
  return { start: addDays(last, 21), end: addDays(first, -Math.max(dtm, 56)) };
}

/** Field-transplant dates that fit the climate window. */
export function successionDates(crop: Crop, windowStart: Date, windowEnd: Date): Date[] {
  const interval = Math.max(1, crop.successionIntervalDays);
  const lastSow = addDays(windowEnd, -crop.timeline.dtmFromField);
  const dates: Date[] = [];
  let cursor = windowStart;
  const cap = Math.max(1, crop.maxSuccessions);
  while (cursor.getTime() <= lastSow.getTime() && dates.length < cap) {
    dates.push(cursor);
    cursor = addDays(cursor, interval);
  }
  return dates;
}

export function harvestDatesForWindow(crop: Crop, windowStart: Date, windowEnd: Date): Date[] {
  return successionDates(crop, windowStart, windowEnd).map((field) => harvestDate(field, crop));
}

export type PlantingPhase = "planned" | "seeded" | "growing" | "harvest" | "complete";

export function successionPhase(succession: BedSuccession, today: Date): PlantingPhase {
  const nursery = parseISO(succession.nursery_sow_date);
  const field = parseISO(succession.field_transplant_date);
  const harvest = parseISO(succession.target_harvest_date);
  const end = parseISO(succession.harvest_end_date);
  if (today.getTime() < nursery.getTime()) return "planned";
  if (today.getTime() < field.getTime()) return "seeded";
  if (today.getTime() < harvest.getTime()) return "growing";
  if (today.getTime() <= end.getTime()) return "harvest";
  return "complete";
}

export const PHASE_LABEL: Record<PlantingPhase, string> = {
  planned: "PLANNED",
  seeded: "NURSERY",
  growing: "FIELD",
  harvest: "HARVEST",
  complete: "CLEAR",
};

export type YieldRow = {
  cropId: string;
  bedFt: number;
  plants: number;
  yieldAmount: number;
  unit: string;
  unitLabel: string;
  wholesaleUsd: number;
  directUsd: number;
};

export function farmYield(farm: FarmState, cropIndex: Map<string, Crop>): YieldRow[] {
  const acc = new Map<string, YieldRow>();
  for (const s of farm.successions) {
    const crop = cropIndex.get(s.crop_id);
    if (!crop) continue;
    const y = crop.yieldAndRevenue;
    const ft = s.bed_feet_needed;
    const row = acc.get(s.crop_id) ?? {
      cropId: s.crop_id,
      bedFt: 0,
      plants: 0,
      yieldAmount: 0,
      unit: y.salesUnit,
      unitLabel: salesUnitLabel(y.salesUnit),
      wholesaleUsd: 0,
      directUsd: 0,
    };
    row.bedFt += ft;
    row.plants += plantCount(crop, ft);
    row.yieldAmount += y.salesUnit === "pound" ? expectedYieldLb(crop, ft) : marketableUnits(crop, ft);
    row.wholesaleUsd += wholesaleRevenue(crop, ft);
    row.directUsd += directRevenue(crop, ft);
    acc.set(s.crop_id, row);
  }
  return [...acc.values()].sort((a, b) => b.bedFt - a.bedFt);
}

export function findFreeBed(
  farm: FarmState,
  block: FieldBlock,
  candidate: BedSuccession,
  ignoreId?: string,
): number | null {
  for (let i = 0; i < block.bed_count; i++) {
    const trial = { ...candidate, bed_index: i };
    if (successionConflicts(trial, farm, ignoreId).length === 0) return i;
  }
  return null;
}

export function recomputeFarm(farm: FarmState, crops: Map<string, Crop>): FarmState {
  const blocks = new Map(farm.blocks.map((b) => [b.id, b]));
  return {
    ...farm,
    successions: farm.successions.map((s) => {
      const crop = crops.get(s.crop_id);
      const block = blocks.get(s.block_id);
      if (!crop || !block) return s;
      return computeSuccession(s, crop, block, farm.climate);
    }),
  };
}

export type FarmTaskKind = "sow" | "field" | "harvest" | "clear";

export type FarmTask = {
  id: string;
  kind: FarmTaskKind;
  date: string;
  successionId: string;
  cropId: string;
  blockId: string;
  bedIndex: number;
};

export const TASK_LABEL: Record<FarmTaskKind, string> = {
  sow: "SOW",
  field: "FIELD",
  harvest: "CUT",
  clear: "CLEAR",
};

const TASK_ORDER: Record<FarmTaskKind, number> = {
  sow: 0,
  field: 1,
  harvest: 2,
  clear: 3,
};

export function farmTasks(farm: FarmState, from: Date, to: Date): FarmTask[] {
  const out: FarmTask[] = [];
  for (const s of farm.successions) {
    const rows: Array<[FarmTaskKind, string]> = [
      ["sow", s.nursery_sow_date],
      ["field", s.field_transplant_date],
      ["harvest", s.target_harvest_date],
      ["clear", s.harvest_end_date],
    ];
    for (const [kind, date] of rows) {
      if (kind === "sow" && s.nursery_sow_date === s.field_transplant_date) continue;
      out.push({
        id: `${s.id}:${kind}`,
        kind,
        date,
        successionId: s.id,
        cropId: s.crop_id,
        blockId: s.block_id,
        bedIndex: s.bed_index,
      });
    }
  }
  const start = from.getTime();
  const end = to.getTime();
  return out
    .filter((t) => {
      const d = parseISO(t.date).getTime();
      return d >= start && d <= end;
    })
    .sort((a, b) => a.date.localeCompare(b.date) || TASK_ORDER[a.kind] - TASK_ORDER[b.kind]);
}

export type FarmInputs = {
  bedFt: number;
  plants: number;
  seeds: number;
  weeklyGallons: number;
  n: number;
  p: number;
  k: number;
  wholesaleUsd: number;
  directUsd: number;
};

export function farmInputs(farm: FarmState, cropIndex: Map<string, Crop>): FarmInputs {
  const acc: FarmInputs = {
    bedFt: 0,
    plants: 0,
    seeds: 0,
    weeklyGallons: 0,
    n: 0,
    p: 0,
    k: 0,
    wholesaleUsd: 0,
    directUsd: 0,
  };
  for (const s of farm.successions) {
    const crop = cropIndex.get(s.crop_id);
    if (!crop) continue;
    const ft = s.bed_feet_needed;
    const ex = extractionLbs(crop, ft);
    acc.bedFt += ft;
    acc.plants += plantCount(crop, ft);
    acc.seeds += seedNeeded(crop, ft);
    acc.weeklyGallons += weeklyGallons(crop, ft);
    acc.n += ex.n;
    acc.p += ex.p;
    acc.k += ex.k;
    acc.wholesaleUsd += wholesaleRevenue(crop, ft);
    acc.directUsd += directRevenue(crop, ft);
  }
  return acc;
}

