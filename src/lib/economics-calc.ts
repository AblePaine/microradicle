import type {
  ChillingInjuryFlag,
  ColdRoomThermalAudit,
  CropPostHarvestSpec,
  EconomicsSettings,
  RespirationRating,
  StorageThermalZone,
} from "../types/economics";

/** USDA AH-66 order-of-magnitude respiration at storage temperature, BTU / ton / 24 h. */
export const RESPIRATION_BTU_PER_TON_DAY: Record<RespirationRating, number> = {
  "very-low": 500,
  low: 1500,
  moderate: 4000,
  high: 9000,
  "extremely-high": 18000,
};

export const ZONE_META: Record<
  StorageThermalZone,
  { label: string; temp_f: number; rh: string; note: string }
> = {
  "zone-1-cold-wet": {
    label: "Zone 1 · cold wet",
    temp_f: 34,
    rh: "95–98% RH",
    note: "Greens, roots, brassicas. Hydro or ice. Never basil or fruiting crops.",
  },
  "zone-2-cool-humid": {
    label: "Zone 2 · cool humid",
    temp_f: 50,
    rh: "85–90% RH",
    note: "Tomato, pepper, cucumber, basil, snap bean. Chilling-sensitive.",
  },
  "zone-3-ambient-dry": {
    label: "Zone 3 · ambient dry",
    temp_f: 55,
    rh: "60–70% RH",
    note: "Cured onion, garlic, winter squash. Not a wet cooler.",
  },
  "zone-curing": {
    label: "Curing",
    temp_f: 82,
    rh: "80% RH",
    note: "Field-cure alliums and squash before Zone 3.",
  },
};

export const AC_WINDOW_SIZES = [5000, 8000, 10000, 12000, 18000, 24000, 36000] as const;
export const TOTE_CU_FT = 1.75;
export const TOTE_FOOTPRINT_SQFT = 1.45;
export const TOTE_STACK = 4;
export const AISLE_FACTOR = 1.4;
export const AC_SAFETY = 1.25;
export const TRANSPLANT_USD = 0.1;
export const DIRECT_SEED_USD_PER_FT = 0.05;
export const PACK_HOUR_FACTOR = 1.25;

export const STORAGE_ZONES: StorageThermalZone[] = [
  "zone-1-cold-wet",
  "zone-2-cool-humid",
  "zone-3-ambient-dry",
  "zone-curing",
];

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function sensibleHeatBtu(massLbs: number, cpPerLb: number, fieldF: number, targetF: number): number {
  return Math.max(0, massLbs * cpPerLb * (fieldF - targetF));
}

export function respirationBtuPerDay(massLbs: number, rating: RespirationRating): number {
  return (Math.max(0, massLbs) / 2000) * RESPIRATION_BTU_PER_TON_DAY[rating];
}

export function peakBtuPerHour(sensibleBtu: number, respirationDay: number, pullDownHours: number): number {
  const hours = Math.max(0.5, pullDownHours);
  return sensibleBtu / hours + respirationDay / 24;
}

export function recommendedAcBtu(peakHr: number): number {
  const need = Math.max(0, peakHr) * AC_SAFETY;
  const hit = AC_WINDOW_SIZES.find((s) => s >= need);
  if (hit) return hit;
  return Math.ceil(need / 6000) * 6000;
}

export function totesNeeded(lbs: number, totesPer100: number): number {
  if (lbs <= 0 || totesPer100 <= 0) return 0;
  return Math.ceil((lbs / 100) * totesPer100 - 1e-9);
}

export function cubicDisplacementCuFt(totes: number): number {
  return round1(Math.max(0, totes) * TOTE_CU_FT);
}

export function minimumCoolerSqft(totes: number): number {
  if (totes <= 0) return 0;
  const floor = (totes / TOTE_STACK) * TOTE_FOOTPRINT_SQFT * AISLE_FACTOR;
  return round1(Math.max(16, floor));
}

export function chillFlag(
  cropId: string,
  cropName: string,
  minSafeF: number,
  coolerF: number,
): ChillingInjuryFlag | null {
  if (coolerF + 0.4 >= minSafeF) return null;
  return {
    crop_id: cropId,
    crop_name: cropName,
    min_safe_temp_f: minSafeF,
    cooler_temp_f: coolerF,
    message: `${cropName} injures below ${minSafeF}°F. Do not drop into a ${coolerF}°F box.`,
  };
}

export function mixWarnings(zones: StorageThermalZone[]): string[] {
  const set = new Set(zones);
  const out: string[] = [];
  if (set.has("zone-1-cold-wet") && set.has("zone-2-cool-humid")) {
    out.push("Split the load. Zone 1 at 34°F will chill-injure tomato, pepper, cucumber, and basil.");
  }
  if (set.has("zone-1-cold-wet") && set.has("zone-3-ambient-dry")) {
    out.push("Cured alliums go dry. A wet 34°F box starts neck rot.");
  }
  return out;
}

type MassLine = {
  spec: CropPostHarvestSpec;
  crop_name: string;
  lbs: number;
  totes: number;
};

export function auditZoneLoad(
  zone: StorageThermalZone,
  lines: MassLine[],
  settings: Pick<EconomicsSettings, "field_temp_f" | "pull_down_hours" | "cooler_length_ft" | "cooler_width_ft" | "cooler_height_ft">,
): ColdRoomThermalAudit {
  const target = ZONE_META[zone].temp_f;
  let mass = 0;
  let totes = 0;
  let sensible = 0;
  let resp = 0;
  const flags: ChillingInjuryFlag[] = [];
  for (const line of lines) {
    mass += line.lbs;
    totes += line.totes;
    sensible += sensibleHeatBtu(line.lbs, line.spec.sensible_heat_btu_per_lb, settings.field_temp_f, target);
    resp += respirationBtuPerDay(line.lbs, line.spec.respiration_rate_rating);
    const flag = chillFlag(line.spec.crop_id, line.crop_name, line.spec.min_safe_temp_f, target);
    if (flag) flags.push(flag);
  }
  const hours = settings.pull_down_hours;
  const peak = peakBtuPerHour(sensible, resp, hours);
  const ac = recommendedAcBtu(peak);
  const existing = settings.cooler_length_ft * settings.cooler_width_ft * settings.cooler_height_ft;
  const cubic = cubicDisplacementCuFt(totes);
  return {
    target_zone: zone,
    total_field_mass_lbs: round1(mass),
    total_totes: totes,
    initial_field_temp_f: settings.field_temp_f,
    target_storage_temp_f: target,
    sensible_heat_btu: round1(sensible),
    respiration_heat_btu_per_day: round1(resp),
    total_cooling_load_btu: round1(sensible + resp),
    recommended_ac_btu_rating: ac,
    minimum_cooler_sqft: minimumCoolerSqft(totes),
    peak_btu_per_hr: round1(peak),
    cubic_displacement_cu_ft: cubic,
    ac_tons: round2(ac / 12000),
    fits_existing_cooler: cubic <= existing * 0.55,
    chill_flags: flags,
  };
}

export function unitPrice(wholesale: number, direct: number, channel: EconomicsSettings["channel"], mixDirectPct: number): number {
  if (channel === "direct") return direct;
  if (channel === "wholesale") return wholesale;
  const p = Math.min(1, Math.max(0, mixDirectPct));
  return wholesale * (1 - p) + direct * p;
}
