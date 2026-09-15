import catalog from "../data/soil/amendments.json" with { type: "json" };
import type { Crop } from "../types/crop";
import type { FarmState } from "../types/farm";
import type {
  BedNutrientDeficit,
  OrganicAmendment,
  SoilBalancingPlan,
  SoilSettings,
  SoilTexture,
} from "../types/soil";
import { extractionLbs } from "./math";
import {
  estimateSoilTempF,
  netBalance,
  P_OVERLOAD_RATIO,
  solveAmendmentRecipe,
} from "./soil-chemistry";

export const AMENDMENTS: OrganicAmendment[] = catalog as OrganicAmendment[];
export const AMENDMENT_BY_ID: Map<string, OrganicAmendment> = new Map(AMENDMENTS.map((a) => [a.id, a]));

export const DEFAULT_AMENDMENT_IDS = [
  "feather-meal-12-0-0",
  "bone-meal-3-15-0",
  "sulfate-of-potash-0-0-50",
] as const;

export const DEFAULT_SOIL: SoilSettings = {
  soil_temp_f: 65,
  organic_matter_pct: 4,
  texture: "silt-loam",
  horizon_weeks: 8,
  selected_amendment_ids: [...DEFAULT_AMENDMENT_IDS],
};

export function resolveSoil(farm: FarmState): SoilSettings {
  const raw = farm.soil;
  const estimated = estimateSoilTempF(farm.climate.latitude);
  if (!raw) {
    return { ...DEFAULT_SOIL, soil_temp_f: estimated };
  }
  const ids = raw.selected_amendment_ids.filter((id) => AMENDMENT_BY_ID.has(id));
  const texture: SoilTexture =
    raw.texture === "sand" || raw.texture === "clay" || raw.texture === "silt-loam" ? raw.texture : "silt-loam";
  return {
    soil_temp_f: raw.soil_temp_f > 0 ? Math.min(95, Math.max(36, raw.soil_temp_f)) : estimated,
    organic_matter_pct: Math.min(12, Math.max(0.5, raw.organic_matter_pct || 4)),
    texture,
    horizon_weeks: Math.min(26, Math.max(2, Math.round(raw.horizon_weeks || 8))),
    selected_amendment_ids: ids.length ? ids : [...DEFAULT_AMENDMENT_IDS],
  };
}

export function selectedAmendments(settings: SoilSettings): OrganicAmendment[] {
  return settings.selected_amendment_ids
    .map((id) => AMENDMENT_BY_ID.get(id))
    .filter((a): a is OrganicAmendment => Boolean(a));
}

export function blockDeficit(
  farm: FarmState,
  blockId: string,
  crops: Map<string, Crop>,
): BedNutrientDeficit | null {
  const block = farm.blocks.find((b) => b.id === blockId);
  if (!block) return null;
  const mix = new Map<
    string,
    { crop_name: string; crop_id: string; bed_feet: number; n_lbs: number; p_lbs: number; k_lbs: number }
  >();
  let n = 0;
  let p = 0;
  let k = 0;
  let feet = 0;
  for (const s of farm.successions) {
    if (s.block_id !== blockId) continue;
    const crop = crops.get(s.crop_id);
    if (!crop) continue;
    const ft = s.bed_feet_needed;
    const ex = extractionLbs(crop, ft);
    feet += ft;
    n += ex.n;
    p += ex.p;
    k += ex.k;
    const row = mix.get(crop.id) ?? {
      crop_name: crop.cultivar,
      crop_id: crop.id,
      bed_feet: 0,
      n_lbs: 0,
      p_lbs: 0,
      k_lbs: 0,
    };
    row.bed_feet += ft;
    row.n_lbs += ex.n;
    row.p_lbs += ex.p;
    row.k_lbs += ex.k;
    mix.set(crop.id, row);
  }
  return {
    block_id: block.id,
    block_name: block.name,
    total_bed_feet: feet || block.bed_count * block.bed_length_ft,
    total_n_lbs: n,
    total_p_lbs: p,
    total_k_lbs: k,
    crop_breakdown: [...mix.values()].sort((a, b) => b.n_lbs - a.n_lbs),
  };
}

export function farmDeficit(farm: FarmState, crops: Map<string, Crop>): BedNutrientDeficit {
  const mix = new Map<
    string,
    { crop_name: string; crop_id: string; bed_feet: number; n_lbs: number; p_lbs: number; k_lbs: number }
  >();
  let n = 0;
  let p = 0;
  let k = 0;
  let feet = 0;
  for (const s of farm.successions) {
    const crop = crops.get(s.crop_id);
    if (!crop) continue;
    const ft = s.bed_feet_needed;
    const ex = extractionLbs(crop, ft);
    feet += ft;
    n += ex.n;
    p += ex.p;
    k += ex.k;
    const row = mix.get(crop.id) ?? {
      crop_name: crop.cultivar,
      crop_id: crop.id,
      bed_feet: 0,
      n_lbs: 0,
      p_lbs: 0,
      k_lbs: 0,
    };
    row.bed_feet += ft;
    row.n_lbs += ex.n;
    row.p_lbs += ex.p;
    row.k_lbs += ex.k;
    mix.set(crop.id, row);
  }
  return {
    block_id: "farm",
    block_name: farm.name,
    total_bed_feet: feet,
    total_n_lbs: n,
    total_p_lbs: p,
    total_k_lbs: k,
    crop_breakdown: [...mix.values()].sort((a, b) => b.n_lbs - a.n_lbs),
  };
}

export function balancePlan(
  deficit: BedNutrientDeficit,
  settings: SoilSettings,
): SoilBalancingPlan {
  const recipe = solveAmendmentRecipe(
    { n: deficit.total_n_lbs, p: deficit.total_p_lbs, k: deficit.total_k_lbs },
    selectedAmendments(settings),
    settings.soil_temp_f,
    settings.horizon_weeks,
    deficit.total_bed_feet,
  );
  return {
    deficit,
    recipe,
    net_balance: netBalance(
      { n: deficit.total_n_lbs, p: deficit.total_p_lbs, k: deficit.total_k_lbs },
      recipe,
    ),
  };
}

export { estimateSoilTempF, P_OVERLOAD_RATIO };
