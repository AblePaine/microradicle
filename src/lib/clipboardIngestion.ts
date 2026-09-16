/**
 * Daily clipboard rows from beds, 1020 racks, and paddock moves.
 * Pure. No DOM. Node tests import this file with .ts extensions.
 */
import type { Crop } from "../types/crop.ts";
import type { BedSuccession, FieldBlock } from "../types/farm.ts";
import type { NurseryBatchQueueItem } from "../types/nursery.ts";
import type { LivestockClass, PastureRotationQueueItem } from "../types/pasture.ts";

export const NURSERY_LEDGER_KEY = "microradicle_nursery_batches_v1";
export const PASTURE_LEDGER_KEY = "microradicle_pasture_batches_v1";
export const LEGACY_FARM_KEY = "microradicle_farm_state_v1";

export type ClipboardDiscipline = "pasture" | "nursery" | "field";

export interface ClipboardRow {
  id: string;
  discipline: ClipboardDiscipline;
  stage: string;
  subject: string;
  qty: string;
  action: string;
  detail: string;
}

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
}

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function pickNum(obj: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) return Number(v);
  }
  return undefined;
}

function isoDay(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const m = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return m?.[1];
}

/** Spec-shaped 1020 row (may omit cultivar_id). */
export function coerceNurseryLedgerItem(raw: unknown): NurseryBatchQueueItem | null {
  const b = asRecord(raw);
  const id = pickStr(b, "id");
  const sow_date = isoDay(pickStr(b, "sow_date", "sowDate"));
  const cultivar_name = pickStr(b, "cultivar_name", "cultivarName");
  const cultivar_id = pickStr(b, "cultivar_id", "cultivarId") ?? cultivar_name;
  if (!id || !sow_date || !cultivar_id) return null;
  const soak = isoDay(pickStr(b, "soak_start_date", "soakStartDate")) ?? null;
  return {
    id,
    cultivar_id,
    cultivar_name: cultivar_name ?? cultivar_id,
    tray_count: Math.max(1, Math.round(pickNum(b, "tray_count", "trayCount") ?? 1)),
    sow_date,
    soak_start_date: soak && soak.length ? soak : null,
    unstack_date: isoDay(pickStr(b, "unstack_date", "unstackDate")) ?? sow_date,
    harvest_date: isoDay(pickStr(b, "harvest_date", "harvestDate")) ?? sow_date,
    total_seed_grams_needed: pickNum(b, "total_seed_grams_needed", "totalSeedGramsNeeded") ?? 0,
    projected_yield_oz: pickNum(b, "projected_yield_oz", "projectedYieldOz") ?? 0,
    projected_gross_revenue_usd: pickNum(b, "projected_gross_revenue_usd", "projectedGrossRevenueUsd") ?? 0,
  };
}

/** Spec-shaped paddock row (batch_id, timestamp, no species_id). */
export function coercePastureLedgerItem(
  raw: unknown,
): (Pick<
  PastureRotationQueueItem,
  | "id"
  | "species_id"
  | "species_name"
  | "head_count"
  | "move_interval_days"
  | "allocated_paddock_sqft"
  | "recommended_netting_rolls"
> & { start_date?: string; livestock_class?: string }) | null {
  const b = asRecord(raw);
  const id = pickStr(b, "id", "batch_id", "batchId");
  const species_name = pickStr(b, "species_name", "speciesName");
  const species_id = pickStr(b, "species_id", "speciesId") ?? species_name;
  if (!id || !species_id) return null;
  const start =
    isoDay(pickStr(b, "start_date", "startDate")) ?? isoDay(pickStr(b, "timestamp", "saved_at", "savedAt"));
  return {
    id,
    species_id,
    species_name: species_name ?? species_id,
    head_count: Math.max(1, Math.round(pickNum(b, "head_count", "headCount") ?? 1)),
    move_interval_days: Math.max(1, Math.round(pickNum(b, "move_interval_days", "moveIntervalDays") ?? 1)),
    allocated_paddock_sqft: pickNum(b, "allocated_paddock_sqft", "allocatedPaddockSqft") ?? 0,
    recommended_netting_rolls: pickNum(b, "recommended_netting_rolls", "recommendedNettingRolls") ?? 0,
    ...(start ? { start_date: start } : {}),
    livestock_class: pickStr(b, "livestock_class", "livestockClass"),
  };
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = Date.parse(`${fromIso.slice(0, 10)}T12:00:00`);
  const b = Date.parse(`${toIso.slice(0, 10)}T12:00:00`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return NaN;
  return Math.round((b - a) / 86_400_000);
}

export function addIsoDays(iso: string, days: number): string {
  const t = Date.parse(`${iso.slice(0, 10)}T12:00:00`);
  if (!Number.isFinite(t)) return iso.slice(0, 10);
  const d = new Date(t + days * 86_400_000);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function isMoveDay(startIso: string, intervalDays: number, targetIso: string): boolean {
  const interval = Math.max(1, Math.round(intervalDays || 1));
  const delta = daysBetween(startIso, targetIso);
  if (!Number.isFinite(delta) || delta < 0) return false;
  return delta % interval === 0;
}

export function isPoultryName(speciesName: string, livestockClass?: LivestockClass | string): boolean {
  const cls = (livestockClass ?? "").toLowerCase();
  if (cls.includes("broiler") || cls.includes("layer")) return true;
  const n = speciesName.toLowerCase();
  return n.includes("broiler") || n.includes("layer") || n.includes("cornish") || n.includes("isa brown");
}

/** Days from transplant to a pinch check. ~0.5 in/day of field growth. */
export function pinchOffsetDays(pinchAtHeightIn: number): number {
  if (!(pinchAtHeightIn > 0)) return 0;
  return Math.max(10, Math.round(pinchAtHeightIn * 1.8));
}

/** Days from transplant to first Hortonova layer. */
export function nettingOffsetDays(firstLayerHeightIn: number): number {
  if (!(firstLayerHeightIn > 0)) return 14;
  return Math.max(7, Math.round(firstLayerHeightIn * 1.1));
}

export function pastureRowsForDate(
  rotations: Array<
    Pick<
      PastureRotationQueueItem,
      | "id"
      | "species_name"
      | "head_count"
      | "move_interval_days"
      | "allocated_paddock_sqft"
      | "recommended_netting_rolls"
    > & { livestock_class?: string; start_date?: string }
  >,
  targetIso: string,
): ClipboardRow[] {
  const day = targetIso.slice(0, 10);
  const out: ClipboardRow[] = [];
  for (const m of rotations) {
    const start = (m.start_date ?? "").slice(0, 10);
    if (start && !isMoveDay(start, m.move_interval_days, day)) continue;
    const poultry = isPoultryName(m.species_name, m.livestock_class);
    const tractor = poultry && m.move_interval_days <= 1;
    out.push({
      id: `pasture:${m.id}:${day}`,
      discipline: "pasture",
      stage: tractor ? "TRACTOR PULL" : "PADDOCK SHIFT",
      subject: m.species_name,
      qty: `${m.head_count} head`,
      action: tractor
        ? "Tractor pull forward 1 length"
        : `Shift paddock (${m.move_interval_days}d cycle)`,
      detail:
        m.recommended_netting_rolls > 0
          ? `${m.allocated_paddock_sqft.toLocaleString()} sqft · ${m.recommended_netting_rolls} rolls net (164')`
          : `${m.allocated_paddock_sqft.toLocaleString()} sqft · tractor skid, water check`,
    });
  }
  return out;
}

export function nurseryRowsForDate(
  batches: Array<
    Pick<
      NurseryBatchQueueItem,
      | "id"
      | "cultivar_name"
      | "tray_count"
      | "sow_date"
      | "soak_start_date"
      | "unstack_date"
      | "harvest_date"
      | "total_seed_grams_needed"
      | "projected_yield_oz"
    >
  >,
  targetIso: string,
): ClipboardRow[] {
  const day = targetIso.slice(0, 10);
  const out: ClipboardRow[] = [];
  for (const b of batches) {
    if (b.soak_start_date && b.soak_start_date.slice(0, 10) === day) {
      out.push({
        id: `nursery:${b.id}:soak`,
        discipline: "nursery",
        stage: "SOAK",
        subject: b.cultivar_name,
        qty: `${b.tray_count} flats`,
        action: "Start soak · drain before sow",
        detail: `Sow / stack ${b.sow_date}`,
      });
    }
    if (b.sow_date.slice(0, 10) === day) {
      out.push({
        id: `nursery:${b.id}:sow`,
        discipline: "nursery",
        stage: "SOW / STACK",
        subject: b.cultivar_name,
        qty: `${b.tray_count} flats`,
        action: `${b.total_seed_grams_needed} g dry seed`,
        detail: `Unstack ${b.unstack_date}`,
      });
    }
    if (b.unstack_date.slice(0, 10) === day && b.sow_date.slice(0, 10) !== day) {
      out.push({
        id: `nursery:${b.id}:unstack`,
        discipline: "nursery",
        stage: "UNSTACK / LIGHTS",
        subject: b.cultivar_name,
        qty: `${b.tray_count} flats`,
        action: "Pull from blackout · lights on",
        detail: `Cut ${b.harvest_date} · target ${b.projected_yield_oz} oz`,
      });
    }
    if (b.harvest_date.slice(0, 10) === day) {
      out.push({
        id: `nursery:${b.id}:cut`,
        discipline: "nursery",
        stage: "CUT HARVEST",
        subject: b.cultivar_name,
        qty: `${b.tray_count} flats`,
        action: `Target ${b.projected_yield_oz} oz cut`,
        detail: "Pack clamshells clean · wash knives",
      });
    }
  }
  return out;
}

export function fieldRowsForDate(
  successions: BedSuccession[],
  blocks: FieldBlock[],
  getCrop: (id: string) => Crop | undefined,
  targetIso: string,
): ClipboardRow[] {
  const day = targetIso.slice(0, 10);
  const blockById = new Map(blocks.map((b) => [b.id, b]));
  const out: ClipboardRow[] = [];
  for (const s of successions) {
    const crop = getCrop(s.crop_id);
    const block = blockById.get(s.block_id);
    const bed = `${block?.name ?? s.block_id} ${s.bed_index + 1}`;
    const feet = `${Math.round(s.bed_feet_needed)} ft`;
    const name = crop?.cultivar ?? s.crop_id;
    const flower = crop?.flowerSpecifics;

    if (s.nursery_sow_date === day && s.nursery_sow_date !== s.field_transplant_date) {
      out.push({
        id: `field:${s.id}:sow`,
        discipline: "field",
        stage: "SOW",
        subject: name,
        qty: feet,
        action: crop?.propagation.method === "direct-seed" ? "Direct seed the bed" : "Sow cells",
        detail: bed,
      });
    }
    if (s.field_transplant_date === day) {
      out.push({
        id: `field:${s.id}:field`,
        discipline: "field",
        stage: "FIELD",
        subject: name,
        qty: feet,
        action: crop?.propagation.method === "direct-seed" ? "Direct seed / thin" : "Transplant",
        detail: bed,
      });
    }
    if (flower?.pinching.required) {
      const pinchDay = addIsoDays(s.field_transplant_date, pinchOffsetDays(flower.pinching.pinchAtHeightIn));
      if (pinchDay === day) {
        out.push({
          id: `field:${s.id}:pinch`,
          discipline: "field",
          stage: "PINCH",
          subject: name,
          qty: feet,
          action: `Pinch at ${flower.pinching.pinchAtHeightIn} in · leave ${flower.pinching.leaveNodeCount} nodes`,
          detail: bed,
        });
      }
    }
    if (flower?.supportNetting.required) {
      const first = addIsoDays(
        s.field_transplant_date,
        nettingOffsetDays(flower.supportNetting.firstLayerHeightIn),
      );
      if (first === day) {
        out.push({
          id: `field:${s.id}:net1`,
          discipline: "field",
          stage: "NET",
          subject: name,
          qty: feet,
          action: `${flower.supportNetting.layers} layer${flower.supportNetting.layers === 1 ? "" : "s"} · ${flower.supportNetting.meshSizeIn} in mesh at ${flower.supportNetting.firstLayerHeightIn} in`,
          detail: bed,
        });
      }
      if (flower.supportNetting.layers === 2 && flower.supportNetting.secondLayerHeightIn) {
        const second = addIsoDays(first, 14);
        if (second === day) {
          out.push({
            id: `field:${s.id}:net2`,
            discipline: "field",
            stage: "NET 2",
            subject: name,
            qty: feet,
            action: `Second layer at ${flower.supportNetting.secondLayerHeightIn} in`,
            detail: bed,
          });
        }
      }
    }
    if (s.target_harvest_date === day) {
      out.push({
        id: `field:${s.id}:cut`,
        discipline: "field",
        stage: "CUT",
        subject: name,
        qty: feet,
        action: flower
          ? `Cut ${flower.harvestProtocol.stage.replace(/-/g, " ")} · every ${flower.harvestProtocol.cutFrequencyDays} d`
          : "Harvest",
        detail: bed,
      });
    } else if (
      flower &&
      crop?.timeline.isMulticut &&
      daysBetween(s.target_harvest_date, day) > 0 &&
      daysBetween(day, s.harvest_end_date) >= 0 &&
      daysBetween(s.target_harvest_date, day) % Math.max(1, flower.harvestProtocol.cutFrequencyDays) === 0
    ) {
      out.push({
        id: `field:${s.id}:recut:${day}`,
        discipline: "field",
        stage: "CUT",
        subject: name,
        qty: feet,
        action: `Repeat cut · ${flower.harvestProtocol.stage.replace(/-/g, " ")}`,
        detail: bed,
      });
    }
  }
  return out;
}

export function mergeById<T extends { id: string }>(primary: T[], extra: T[]): T[] {
  const have = new Set(primary.map((x) => x.id));
  return extra.length ? [...primary, ...extra.filter((x) => !have.has(x.id))] : primary;
}

export function ingestClipboard(args: {
  successions: BedSuccession[];
  blocks: FieldBlock[];
  nursery: NurseryBatchQueueItem[];
  pasture: PastureRotationQueueItem[];
  getCrop: (id: string) => Crop | undefined;
  targetIso: string;
}): { pasture: ClipboardRow[]; nursery: ClipboardRow[]; field: ClipboardRow[] } {
  const day = args.targetIso.slice(0, 10);
  return {
    pasture: pastureRowsForDate(args.pasture, day),
    nursery: nurseryRowsForDate(args.nursery, day),
    field: fieldRowsForDate(args.successions, args.blocks, args.getCrop, day),
  };
}
