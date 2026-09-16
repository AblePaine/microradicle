import { addDays, format } from "date-fns";
import type { BedSuccession, FarmClimate, FarmState, FieldBlock, Units } from "@/types/farm";
import type { IrrigationNetwork, IrrigationZone, PipeDiameterInches } from "@/types/irrigation";
import type { SoilSettings, SoilTexture } from "@/types/soil";
import type { EconomicsSettings, SalesChannel } from "@/types/economics";
import type { NurseryBatchQueueItem } from "@/types/nursery";
import type { PastureForageStand, PastureRotationQueueItem } from "@/types/pasture";
import { cropBySlug, getCrop } from "@/lib/crops";
import { getMicrogreen } from "@/lib/nursery";
import { computeBatch } from "@/lib/nurseryMath";
import { getSpecies } from "@/lib/pasture";
import { computeRotation, inferLivestockClass, isPastureStand } from "@/lib/pastureMath";
import { coerceNurseryLedgerItem, coercePastureLedgerItem } from "@/lib/clipboardIngestion";
import { defaultNetwork, PIPE_DIAMETERS } from "@/lib/hydraulics";
import { DEFAULT_AMENDMENT_IDS, DEFAULT_SOIL } from "@/lib/soilMath";
import { DEFAULT_ECONOMICS } from "@/lib/economicsMath";
import { computeSuccession, iso, recomputeFarm } from "@/lib/math";

export const FARM_STORAGE_KEY = "microradicle:farm:v3";
export const PASTURE_LEDGER_KEY = "microradicle_pasture_batches_v1";
export const NURSERY_LEDGER_KEY = "microradicle_nursery_batches_v1";
export const LEGACY_FARM_KEYS = [
  "microradicle:farm:v2",
  "microradicle:farm:v1",
  "microradicle_farm_state_v1",
] as const;

export function uid(prefix = "id"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

const DEFAULT_CLIMATE: FarmClimate = {
  last_spring_frost: "03-25",
  first_fall_frost: "11-10",
  latitude: 34.6,
};

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
}

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "string") return v;
  }
  return undefined;
}

function pickNum(obj: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return undefined;
}

function harvestFromField(cropId: string, fieldOffsetDays: number): string {
  const crop = getCrop(cropId);
  const dtm = crop?.timeline.dtmFromField ?? 50;
  return format(addDays(new Date(), fieldOffsetDays + dtm), "yyyy-MM-dd");
}

function suc(
  id: string,
  block: FieldBlock,
  bed_index: number,
  crop_id: string,
  fieldOffsetDays: number,
  climate: FarmClimate,
): BedSuccession {
  const crop = getCrop(crop_id);
  const draft = {
    id,
    block_id: block.id,
    bed_index,
    crop_id,
    target_harvest_date: harvestFromField(crop_id, fieldOffsetDays),
  };
  if (!crop) {
    return {
      ...draft,
      field_transplant_date: iso(addDays(new Date(), fieldOffsetDays)),
      nursery_sow_date: iso(addDays(new Date(), fieldOffsetDays)),
      harvest_end_date: draft.target_harvest_date,
      bed_feet_needed: block.bed_length_ft,
      target_units: 0,
    };
  }
  return computeSuccession(draft, crop, block, climate);
}

export function createDefaultFarm(): FarmState {
  const climate = DEFAULT_CLIMATE;
  const blk = (id: string, name: string, bed_count: number): FieldBlock => ({
    id,
    name,
    bed_count,
    bed_length_ft: 50,
    bed_width_in: 30,
  });

  const lettuce = blk("blk-lettuce", "A LETTUCE", 4);
  const carrot = blk("blk-carrot", "B CARROT", 1);
  const brassica = blk("blk-brassica", "C BRASSICA", 3);
  const solanum = blk("blk-solanum", "D SOLANUM", 2);
  const cucurbit = blk("blk-cucurbit", "E CUCURBIT", 2);
  const herb = blk("blk-herb", "F HERB", 3);
  const greens = blk("blk-greens", "G GREENS", 3);
  const allium = blk("blk-allium", "H ALLIUM", 2);
  const blocks = [lettuce, carrot, brassica, solanum, cucurbit, herb, greens, allium];

  const successions: BedSuccession[] = [
    suc("s-a1", lettuce, 0, "lettuce-salanova-butterhead", -25, climate),
    suc("s-a2", lettuce, 1, "lettuce-salanova-red-oak", -18, climate),
    suc("s-a3", lettuce, 2, "lettuce-salanova-butterhead", -11, climate),
    suc("s-a4", lettuce, 3, "lettuce-romaine-green-forest", -4, climate),
    suc("s-b1", carrot, 0, "carrot-nantes-bolero", -44, climate),
    suc("s-c1", brassica, 0, "kale-red-russian", -30, climate),
    suc("s-c2", brassica, 1, "broccoli-arcadia", -35, climate),
    suc("s-c3", brassica, 2, "kale-winterbor", -22, climate),
    suc("s-d1", solanum, 0, "tomato-cherry-sun-gold", -110, climate),
    suc("s-d2", solanum, 1, "pepper-carmen", -100, climate),
    suc("s-e1", cucurbit, 0, "cucumber-marketmore-76", -85, climate),
    suc("s-e2", cucurbit, 1, "squash-costata-romanesco", -85, climate),
    suc("s-f1", herb, 0, "basil-genovese", -90, climate),
    suc("s-f2", herb, 1, "cilantro-santo", -13, climate),
    suc("s-f3", herb, 2, "chard-bright-lights", -100, climate),
    suc("s-g1", greens, 0, "spinach-corvair", -13, climate),
    suc("s-g2", greens, 1, "arugula-astro", -9, climate),
    suc("s-g3", greens, 2, "radish-french-breakfast", -7, climate),
    suc("s-h1", allium, 0, "onion-redwing", -150, climate),
    suc("s-h2", allium, 1, "fennel-orion", -27, climate),
  ];

  const sow = (offset: number) => iso(addDays(new Date(), offset));
  const nb = (
    id: string,
    cultivarId: string,
    trays: number,
    offset: number,
  ): NurseryBatchQueueItem | null => {
    const crop = getMicrogreen(cultivarId);
    if (!crop) return null;
    return computeBatch(crop, trays, sow(offset), id);
  };
  const nursery_batches = [
    nb("nb-broccoli", "mg-broccoli-waltham", 4, -2),
    nb("nb-radish", "mg-radish-daikon", 4, -1),
    nb("nb-sunflower", "mg-sunflower-black-oil", 2, 0),
    nb("nb-pea", "mg-pea-dwarf-grey", 2, -3),
    nb("nb-basil", "mg-basil-genovese", 2, 0),
  ].filter((b): b is NurseryBatchQueueItem => b !== null);

  const start = (offset: number) => iso(addDays(new Date(), offset));
  const pr = (
    id: string,
    speciesId: string,
    head: number,
    stand: PastureForageStand,
    offset: number,
    moveDays: number,
    allocated: number,
  ): PastureRotationQueueItem | null => {
    const spec = getSpecies(speciesId);
    if (!spec) return null;
    return computeRotation(spec, head, stand, start(offset), moveDays, allocated, id);
  };
  const pasture_rotations = [
    pr("pr-broilers", "ps-broiler-cornish-cross", 80, "standard-perennial-mix", 0, 1, 120),
    pr("pr-layers", "ps-layer-isa-brown", 40, "standard-perennial-mix", 0, 2, 0),
    pr("pr-sheep", "ps-sheep-katahdin", 12, "lush-spring-flush", 0, 3, 0),
  ].filter((b): b is PastureRotationQueueItem => b !== null);

  return {
    version: "1.0.0",
    name: "Home Blocks",
    units: "imperial",
    climate,
    blocks,
    successions,
    irrigation: defaultNetwork({
      version: "1.0.0",
      name: "Home Blocks",
      units: "imperial",
      climate,
      blocks,
      successions,
    }),
    soil: { ...DEFAULT_SOIL },
    economics: { ...DEFAULT_ECONOMICS },
    nursery_batches,
    pasture_rotations,
  };
}

function parseBlock(raw: unknown, i: number): FieldBlock {
  const b = asRecord(raw);
  const id = pickStr(b, "id");
  const name = pickStr(b, "name");
  if (!id || !name) throw new Error(`Block ${i} is malformed.`);
  const bed_count = Math.max(1, Math.round(pickNum(b, "bed_count", "bedCount") ?? 1));
  const bed_length_ft = pickNum(b, "bed_length_ft", "bedLengthFt") ?? 50;
  return { id, name, bed_count, bed_length_ft, bed_width_in: 30 };
}

function parseSuccession(raw: unknown): BedSuccession | null {
  const s = asRecord(raw);
  const id = pickStr(s, "id");
  const block_id = pickStr(s, "block_id", "blockId");
  const crop_id = pickStr(s, "crop_id", "cropId");
  const target_harvest_date = pickStr(s, "target_harvest_date", "targetHarvestDate");
  if (!id || !block_id || !crop_id || !target_harvest_date) return null;
  const bed_index = pickNum(s, "bed_index", "bedIndex") ?? 0;
  return {
    id,
    block_id,
    bed_index,
    crop_id,
    target_harvest_date,
    field_transplant_date:
      pickStr(s, "field_transplant_date", "fieldTransplantDate") ?? target_harvest_date,
    nursery_sow_date: pickStr(s, "nursery_sow_date", "nurserySowDate") ?? target_harvest_date,
    harvest_end_date: pickStr(s, "harvest_end_date", "harvestEndDate") ?? target_harvest_date,
    bed_feet_needed: pickNum(s, "bed_feet_needed", "bedFeetNeeded") ?? 50,
    target_units: pickNum(s, "target_units", "targetUnits") ?? 0,
  };
}

function parseClimate(raw: unknown): FarmClimate {
  const c = asRecord(raw);
  return {
    last_spring_frost:
      pickStr(c, "last_spring_frost", "lastSpringFrost") ?? DEFAULT_CLIMATE.last_spring_frost,
    first_fall_frost:
      pickStr(c, "first_fall_frost", "firstFallFrost") ?? DEFAULT_CLIMATE.first_fall_frost,
    latitude: pickNum(c, "latitude") ?? DEFAULT_CLIMATE.latitude,
  };
}

function migrateV1(raw: Record<string, unknown>): FarmState {
  const units: Units = raw.units === "metric" ? "metric" : "imperial";
  const climate: FarmClimate = {
    last_spring_frost:
      typeof raw.lastFrost === "string" ? raw.lastFrost : DEFAULT_CLIMATE.last_spring_frost,
    first_fall_frost:
      typeof raw.firstFrost === "string" ? raw.firstFrost : DEFAULT_CLIMATE.first_fall_frost,
    latitude: DEFAULT_CLIMATE.latitude,
  };
  const oldBeds = Array.isArray(raw.beds) ? raw.beds : [];
  const blocks: FieldBlock[] = [];
  const successions: BedSuccession[] = [];
  oldBeds.forEach((b) => {
    const bed = asRecord(b);
    if (typeof bed.id !== "string" || typeof bed.name !== "string") return;
    const plantings = Array.isArray(bed.plantings) ? bed.plantings : [];
    const bed_count = Math.max(1, plantings.length || 1);
    const block: FieldBlock = {
      id: bed.id,
      name: bed.name,
      bed_count,
      bed_length_ft: typeof bed.lengthFt === "number" ? bed.lengthFt : 50,
      bed_width_in: 30,
    };
    blocks.push(block);
    plantings.forEach((p, pi) => {
      const pl = asRecord(p);
      if (typeof pl.id !== "string" || typeof pl.cropSlug !== "string" || typeof pl.sowDate !== "string") return;
      const crop = getCrop(pl.cropSlug);
      const field = new Date(`${pl.sowDate}T12:00:00`);
      const harvest = crop ? addDays(field, crop.timeline.dtmFromField) : field;
      const draft = {
        id: pl.id,
        block_id: block.id,
        bed_index: Math.min(pi, block.bed_count - 1),
        crop_id: pl.cropSlug,
        target_harvest_date: iso(harvest),
      };
      successions.push(
        crop
          ? computeSuccession(draft, crop, block, climate)
          : {
              ...draft,
              field_transplant_date: pl.sowDate,
              nursery_sow_date: pl.sowDate,
              harvest_end_date: iso(harvest),
              bed_feet_needed: block.bed_length_ft,
              target_units: 0,
            },
      );
    });
  });
  return {
    version: "1.0.0",
    name: typeof raw.name === "string" ? raw.name : "Home Blocks",
    units,
    climate,
    blocks,
    successions,
  };
}

function parseDiameter(n: unknown, fallback: PipeDiameterInches): PipeDiameterInches {
  if (typeof n === "number" && PIPE_DIAMETERS.includes(n as PipeDiameterInches)) return n as PipeDiameterInches;
  return fallback;
}

function parseZone(raw: unknown): IrrigationZone | null {
  const z = asRecord(raw);
  const id = pickStr(z, "id");
  const name = pickStr(z, "name");
  if (!id || !name) return null;
  const block_ids = Array.isArray(z.block_ids)
    ? z.block_ids.filter((x): x is string => typeof x === "string")
    : [];
  return {
    id,
    name,
    block_ids,
    header_diameter_in: parseDiameter(z.header_diameter_in, 0.75),
    header_length_ft: pickNum(z, "header_length_ft") ?? 24,
  };
}

function parseIrrigation(raw: unknown, farm: FarmState): IrrigationNetwork | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = asRecord(raw);
  const zones = Array.isArray(o.zones)
    ? o.zones.map(parseZone).filter((z): z is IrrigationZone => z !== null)
    : [];
  return {
    supply_capacity_gpm: pickNum(o, "supply_capacity_gpm") ?? 10,
    supply_pressure_psi: pickNum(o, "supply_pressure_psi") ?? 40,
    mainline_diameter_in: parseDiameter(o.mainline_diameter_in, 1.0),
    mainline_length_ft: pickNum(o, "mainline_length_ft") ?? 80,
    regulator_setpoint_psi: pickNum(o, "regulator_setpoint_psi") ?? 12,
    zones: zones.length ? zones : defaultNetwork(farm).zones,
  };
}

function parseSoil(raw: unknown): SoilSettings | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = asRecord(raw);
  const textureRaw = pickStr(o, "texture");
  const texture: SoilTexture =
    textureRaw === "sand" || textureRaw === "clay" || textureRaw === "silt-loam" ? textureRaw : DEFAULT_SOIL.texture;
  const selected = Array.isArray(o.selected_amendment_ids)
    ? o.selected_amendment_ids.filter((x): x is string => typeof x === "string")
    : [...DEFAULT_AMENDMENT_IDS];
  return {
    soil_temp_f: pickNum(o, "soil_temp_f") ?? DEFAULT_SOIL.soil_temp_f,
    organic_matter_pct: pickNum(o, "organic_matter_pct") ?? DEFAULT_SOIL.organic_matter_pct,
    texture,
    horizon_weeks: pickNum(o, "horizon_weeks") ?? DEFAULT_SOIL.horizon_weeks,
    selected_amendment_ids: selected.length ? selected : [...DEFAULT_AMENDMENT_IDS],
    manure_credit_id: pickStr(o, "manure_credit_id") ?? null,
  };
}

function parseEconomics(raw: unknown): EconomicsSettings | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = asRecord(raw);
  const channelRaw = pickStr(o, "channel");
  const channel: SalesChannel =
    channelRaw === "wholesale" || channelRaw === "direct" || channelRaw === "mix"
      ? channelRaw
      : DEFAULT_ECONOMICS.channel;
  let mix = pickNum(o, "mix_direct_pct", "mixDirectPct") ?? DEFAULT_ECONOMICS.mix_direct_pct;
  if (mix > 1) mix = mix / 100;
  const week = pickStr(o, "week_start", "weekStart") ?? "";
  return {
    labor_usd_per_hour: pickNum(o, "labor_usd_per_hour", "laborUsdPerHour") ?? DEFAULT_ECONOMICS.labor_usd_per_hour,
    channel,
    mix_direct_pct: mix,
    field_temp_f: pickNum(o, "field_temp_f", "fieldTempF") ?? DEFAULT_ECONOMICS.field_temp_f,
    pull_down_hours: pickNum(o, "pull_down_hours", "pullDownHours") ?? DEFAULT_ECONOMICS.pull_down_hours,
    cooler_length_ft: pickNum(o, "cooler_length_ft", "coolerLengthFt") ?? DEFAULT_ECONOMICS.cooler_length_ft,
    cooler_width_ft: pickNum(o, "cooler_width_ft", "coolerWidthFt") ?? DEFAULT_ECONOMICS.cooler_width_ft,
    cooler_height_ft: pickNum(o, "cooler_height_ft", "coolerHeightFt") ?? DEFAULT_ECONOMICS.cooler_height_ft,
    week_start: week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? week : "",
  };
}

function parseNurseryBatch(raw: unknown): NurseryBatchQueueItem | null {
  const row = coerceNurseryLedgerItem(raw);
  if (!row) return null;
  const crop = getMicrogreen(row.cultivar_id);
  if (crop) return computeBatch(crop, row.tray_count, row.sow_date, row.id);
  return row;
}

function parsePastureRotation(raw: unknown): PastureRotationQueueItem | null {
  const row = coercePastureLedgerItem(raw);
  if (!row) return null;
  const b = asRecord(raw);
  const standRaw = pickStr(b, "stand") ?? "standard-perennial-mix";
  const stand: PastureForageStand = isPastureStand(standRaw) ? standRaw : "standard-perennial-mix";
  const spec = getSpecies(row.species_id);
  const start = row.start_date;
  if (spec && start) {
    return computeRotation(spec, row.head_count, stand, start, row.move_interval_days, row.allocated_paddock_sqft, row.id);
  }
  return {
    id: row.id,
    species_id: row.species_id,
    species_name: row.species_name,
    head_count: row.head_count,
    stand,
    start_date: start ?? "",
    move_interval_days: row.move_interval_days,
    allocated_paddock_sqft: row.allocated_paddock_sqft,
    total_daily_dm_lbs: pickNum(b, "total_daily_dm_lbs", "totalDailyDmLbs") ?? 0,
    recommended_paddock_sqft: pickNum(b, "recommended_paddock_sqft", "recommendedPaddockSqft") ?? 0,
    shelter_sqft_needed: pickNum(b, "shelter_sqft_needed", "shelterSqftNeeded") ?? 0,
    recommended_netting_rolls: row.recommended_netting_rolls,
    spring_rest_days: pickNum(b, "spring_rest_days", "springRestDays") ?? 24,
    summer_rest_days: pickNum(b, "summer_rest_days", "summerRestDays") ?? 36,
    manure_n_lbs: pickNum(b, "manure_n_lbs", "manureNLbs") ?? 0,
    manure_p2o5_lbs: pickNum(b, "manure_p2o5_lbs", "manureP2o5Lbs") ?? 0,
    manure_k2o_lbs: pickNum(b, "manure_k2o_lbs", "manureK2oLbs") ?? 0,
    overgrazing_warning: Boolean(b.overgrazing_warning ?? b.overgrazingWarning),
    livestock_class: inferLivestockClass(row.species_id, row.livestock_class ?? pickStr(b, "livestock_class", "livestockClass")),
    saved_at: pickStr(b, "saved_at", "savedAt"),
  };
}

export function parseFarm(raw: unknown): FarmState {
  if (!raw || typeof raw !== "object") throw new Error("Farm file is empty.");
  const o = raw as Record<string, unknown>;
  if (o.version === 1) return migrateV1(o);
  if (o.version !== "1.0.0") throw new Error("Unsupported farm file version.");
  const units: Units = o.units === "metric" ? "metric" : "imperial";
  const climate = parseClimate(o.climate);
  if (!Array.isArray(o.blocks)) throw new Error("Blocks missing.");
  const blocks = o.blocks.map(parseBlock);
  const successions = Array.isArray(o.successions)
    ? o.successions.map(parseSuccession).filter((s): s is BedSuccession => s !== null)
    : [];
  const base: FarmState = {
    version: "1.0.0",
    name: typeof o.name === "string" ? o.name : "Home Blocks",
    units,
    climate,
    blocks,
    successions,
  };
  const irrigation = parseIrrigation(o.irrigation, base);
  const soil = parseSoil(o.soil);
  const economics = parseEconomics(o.economics);
  const nursery_batches = Array.isArray(o.nursery_batches)
    ? o.nursery_batches.map(parseNurseryBatch).filter((b): b is NurseryBatchQueueItem => b !== null)
    : [];
  const pasture_rotations = Array.isArray(o.pasture_rotations)
    ? o.pasture_rotations.map(parsePastureRotation).filter((b): b is PastureRotationQueueItem => b !== null)
    : [];
  return recomputeFarm(
    {
      ...base,
      ...(irrigation ? { irrigation } : {}),
      ...(soil ? { soil } : {}),
      ...(economics ? { economics } : {}),
      ...(nursery_batches.length ? { nursery_batches } : {}),
      ...(pasture_rotations.length ? { pasture_rotations } : {}),
    },
    cropBySlug,
  );
}

export function loadPastureLedger(): PastureRotationQueueItem[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(PASTURE_LEDGER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(parsePastureRotation).filter((b): b is PastureRotationQueueItem => b !== null);
  } catch {
    return [];
  }
}

export function savePastureLedger(items: PastureRotationQueueItem[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(PASTURE_LEDGER_KEY, JSON.stringify(items));
}

export function loadNurseryLedger(): NurseryBatchQueueItem[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(NURSERY_LEDGER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(parseNurseryBatch).filter((b): b is NurseryBatchQueueItem => b !== null);
  } catch {
    return [];
  }
}

export function saveNurseryLedger(items: NurseryBatchQueueItem[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(NURSERY_LEDGER_KEY, JSON.stringify(items));
}

function mergePastureLedger(farm: FarmState): FarmState {
  const ledger = loadPastureLedger();
  if (!ledger.length) return farm;
  const have = new Set((farm.pasture_rotations ?? []).map((r) => r.id));
  const extra = ledger.filter((r) => !have.has(r.id));
  if (!extra.length) return farm;
  return { ...farm, pasture_rotations: [...(farm.pasture_rotations ?? []), ...extra] };
}

function mergeNurseryLedger(farm: FarmState): FarmState {
  const ledger = loadNurseryLedger();
  if (!ledger.length) return farm;
  const have = new Set((farm.nursery_batches ?? []).map((r) => r.id));
  const extra = ledger.filter((r) => !have.has(r.id));
  if (!extra.length) return farm;
  return { ...farm, nursery_batches: [...(farm.nursery_batches ?? []), ...extra] };
}

export function loadFarm(): FarmState {
  if (typeof localStorage === "undefined") return createDefaultFarm();
  try {
    const raw =
      localStorage.getItem(FARM_STORAGE_KEY) ??
      LEGACY_FARM_KEYS.map((k) => localStorage.getItem(k)).find((v) => v);
    if (!raw) return mergeNurseryLedger(mergePastureLedger(createDefaultFarm()));
    return mergeNurseryLedger(mergePastureLedger(parseFarm(JSON.parse(raw))));
  } catch {
    return createDefaultFarm();
  }
}

export function saveFarm(farm: FarmState): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(FARM_STORAGE_KEY, JSON.stringify(farm));
  savePastureLedger(farm.pasture_rotations ?? []);
  saveNurseryLedger(farm.nursery_batches ?? []);
}

export function exportFarmJson(farm: FarmState): string {
  return JSON.stringify(farm, null, 2);
}

export function downloadFarmBackup(farm: FarmState): void {
  const blob = new Blob([exportFarmJson(farm)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `microradicle-${farm.name.replace(/\s+/g, "-").toLowerCase()}-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function readFarmFile(file: File): Promise<FarmState> {
  return file.text().then((text) => parseFarm(JSON.parse(text)));
}
