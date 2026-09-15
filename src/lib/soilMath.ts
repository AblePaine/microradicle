import catalog from "../data/soil/amendments.json" with { type: "json" };
import type { Crop } from "../types/crop";
import type { FarmState } from "../types/farm";
import type {
  BedNutrientDeficit,
  ManureNutrientCredit,
  OrganicAmendment,
  SoilAmendmentBalance,
  SoilBalancingPlan,
  SoilSettings,
  SoilTexture,
} from "../types/soil";
import { extractionLbs } from "./math";
import {
  cropDemandOxides,
  equivalentMealLbs,
  mealSavingsUsd,
  manureCreditFromRotation,
  manurePOverload,
  netNeedAfterCredit,
} from "./nutrientBridge";
import {
  elementalKToK2O,
  elementalPToP2O5,
  estimateSoilTempF,
  netBalance,
  P_OVERLOAD_RATIO,
  round2,
  solveAmendmentRecipe,
} from "./soil-chemistry";

export const AMENDMENTS: OrganicAmendment[] = catalog as OrganicAmendment[];
export const AMENDMENT_BY_ID: Map<string, OrganicAmendment> = new Map(AMENDMENTS.map((a) => [a.id, a]));

export const DEFAULT_AMENDMENT_IDS = [
  "feather-meal-12-0-0",
  "bone-meal-3-15-0",
  "sulfate-of-potash-0-0-50",
] as const;

export const FEATHER_MEAL_ID = "feather-meal-12-0-0";
export const BONE_MEAL_ID = "bone-meal-3-15-0";
export const POTASH_ID = "sulfate-of-potash-0-0-50";

export {
  equivalentMealLbs,
  manureCreditFromRotation,
  manurePOverload,
  mealSavingsUsd,
  netNeedAfterCredit,
};

export const DEFAULT_SOIL: SoilSettings = {
  soil_temp_f: 65,
  organic_matter_pct: 4,
  texture: "silt-loam",
  horizon_weeks: 8,
  selected_amendment_ids: [...DEFAULT_AMENDMENT_IDS],
  manure_credit_id: null,
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
    manure_credit_id: raw.manure_credit_id ?? null,
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

export function manureCreditsFromFarm(farm: FarmState): ManureNutrientCredit[] {
  return (farm.pasture_rotations ?? []).map(manureCreditFromRotation);
}

export function creditById(farm: FarmState, id: string | null | undefined): ManureNutrientCredit | null {
  if (!id) return null;
  return manureCreditsFromFarm(farm).find((c) => c.source_id === id) ?? null;
}

function cupsFromLbs(amendmentId: string, lbs: number): number {
  const a = AMENDMENT_BY_ID.get(amendmentId);
  const dens = a?.bulk_density_lbs_per_qt ?? 1;
  if (!(dens > 0) || lbs <= 0) return 0;
  return round2((lbs / dens) * 4);
}

export function recipeLbsById(recipe: SoilBalancingPlan["recipe"], id: string): number {
  return recipe.find((r) => r.amendment.id === id)?.lbs_required ?? 0;
}

export function soilAmendmentBalance(
  deficit: BedNutrientDeficit,
  settings: SoilSettings,
  credit: ManureNutrientCredit | null,
): SoilAmendmentBalance {
  const plan = balancePlan(deficit, settings, credit);
  const demand = cropDemandOxides(deficit);
  const net = netNeedAfterCredit(deficit, credit);
  const remaining = {
    feather_meal_12_0_0_lbs: round2(recipeLbsById(plan.recipe, FEATHER_MEAL_ID)),
    bone_meal_1_13_0_lbs: round2(recipeLbsById(plan.recipe, BONE_MEAL_ID)),
    potash_0_0_50_lbs: round2(recipeLbsById(plan.recipe, POTASH_ID)),
  };
  const equiv = equivalentMealLbs(credit);
  return {
    crop_demand: demand,
    manure_credit_applied: credit,
    net_deficit: {
      n_lbs: round2(net.n),
      p2o5_lbs: round2(elementalPToP2O5(net.p)),
      k2o_lbs: round2(elementalKToK2O(net.k)),
    },
    amendment_recipe: remaining,
    amendment_recipe_cups: {
      feather_meal_cups: cupsFromLbs(FEATHER_MEAL_ID, remaining.feather_meal_12_0_0_lbs),
      bone_meal_cups: cupsFromLbs(BONE_MEAL_ID, remaining.bone_meal_1_13_0_lbs),
      potash_cups: cupsFromLbs(POTASH_ID, remaining.potash_0_0_50_lbs),
    },
    commercial_savings_usd: mealSavingsUsd(equiv),
    p_overload_warning: manurePOverload(deficit, credit) || plan.net_balance.is_p_overloaded,
  };
}

export function balancePlan(
  deficit: BedNutrientDeficit,
  settings: SoilSettings,
  credit: ManureNutrientCredit | null = null,
): SoilBalancingPlan {
  const need = netNeedAfterCredit(deficit, credit);
  const recipe = solveAmendmentRecipe(
    { n: need.n, p: need.p, k: need.k },
    selectedAmendments(settings),
    settings.soil_temp_f,
    settings.horizon_weeks,
    deficit.total_bed_feet,
  );
  return {
    deficit,
    recipe,
    net_balance: netBalance({ n: need.n, p: need.p, k: need.k }, recipe),
    manure_credit: credit,
    net_need: { n_lbs: need.n, p_lbs: need.p, k_lbs: need.k },
  };
}

export { estimateSoilTempF, P_OVERLOAD_RATIO };
