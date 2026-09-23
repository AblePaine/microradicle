/**
 * Pasture manure → bed N-P-K credit. Year-1 plant-available N, 125% P cap.
 */
import type { PastureRotationQueueItem } from "../types/pasture.ts";
import type { BedNutrientDeficit, ManureNutrientCredit } from "../types/soil.ts";
import { inferLivestockClass, year1AvailableN } from "./pastureMath.ts";
import {
  elementalKToK2O,
  elementalPToP2O5,
  k2oToElementalK,
  P_OVERLOAD_RATIO,
  p2o5ToElementalP,
  round2,
  round3,
} from "./soil-chemistry.ts";

export const FEATHER_N_PCT = 0.12;
export const BONE_P2O5_PCT = 0.15;
export const POTASH_K2O_PCT = 0.5;

/** Typical 50-lb bag farm-store prices. Shown as manure savings, not an invoice. */
export const MEAL_USD_PER_LB = {
  feather: 45 / 50,
  bone: 38 / 50,
  potash: 52 / 50,
} as const;

function moveLabel(days: number): string {
  return days === 1 ? "1-day move" : `${days}-day move`;
}

export function manureCreditFromRotation(rotation: PastureRotationQueueItem): ManureNutrientCredit {
  const cls = inferLivestockClass(rotation.species_id, rotation.livestock_class);
  return {
    source_id: rotation.id,
    source_name: `${rotation.species_name} (${rotation.head_count} head, ${moveLabel(rotation.move_interval_days)})`,
    available_n_lbs: year1AvailableN(rotation.manure_n_lbs, cls),
    available_p2o5_lbs: round2(Math.max(0, rotation.manure_p2o5_lbs)),
    available_k2o_lbs: round2(Math.max(0, rotation.manure_k2o_lbs)),
    area_sqft: rotation.allocated_paddock_sqft,
    livestock_class: cls,
  };
}

export function netNeedAfterCredit(
  deficit: BedNutrientDeficit,
  credit: ManureNutrientCredit | null,
): { n: number; p: number; k: number } {
  if (!credit) {
    return { n: deficit.total_n_lbs, p: deficit.total_p_lbs, k: deficit.total_k_lbs };
  }
  return {
    n: Math.max(0, round3(deficit.total_n_lbs - credit.available_n_lbs)),
    p: Math.max(0, round3(deficit.total_p_lbs - p2o5ToElementalP(credit.available_p2o5_lbs))),
    k: Math.max(0, round3(deficit.total_k_lbs - k2oToElementalK(credit.available_k2o_lbs))),
  };
}

/** True when manure P2O5 exceeds 125% of crop P2O5 removal. */
export function manurePOverload(deficit: BedNutrientDeficit, credit: ManureNutrientCredit | null): boolean {
  if (!credit) return false;
  const demandP2o5 = elementalPToP2O5(deficit.total_p_lbs);
  if (demandP2o5 <= 0) return credit.available_p2o5_lbs > 0.05;
  return credit.available_p2o5_lbs > demandP2o5 * P_OVERLOAD_RATIO + 1e-6;
}

export function equivalentMealLbs(credit: ManureNutrientCredit | null): {
  feather_meal_12_0_0_lbs: number;
  bone_meal_3_15_0_lbs: number;
  potash_0_0_50_lbs: number;
} {
  if (!credit) {
    return { feather_meal_12_0_0_lbs: 0, bone_meal_3_15_0_lbs: 0, potash_0_0_50_lbs: 0 };
  }
  return {
    feather_meal_12_0_0_lbs: round2(credit.available_n_lbs / FEATHER_N_PCT),
    bone_meal_3_15_0_lbs: round2(credit.available_p2o5_lbs / BONE_P2O5_PCT),
    potash_0_0_50_lbs: round2(credit.available_k2o_lbs / POTASH_K2O_PCT),
  };
}

export function mealSavingsUsd(equiv: ReturnType<typeof equivalentMealLbs>): number {
  return round2(
    equiv.feather_meal_12_0_0_lbs * MEAL_USD_PER_LB.feather +
      equiv.bone_meal_3_15_0_lbs * MEAL_USD_PER_LB.bone +
      equiv.potash_0_0_50_lbs * MEAL_USD_PER_LB.potash,
  );
}

export function cropDemandOxides(deficit: BedNutrientDeficit): {
  n_lbs: number;
  p2o5_lbs: number;
  k2o_lbs: number;
} {
  return {
    n_lbs: round2(deficit.total_n_lbs),
    p2o5_lbs: round2(elementalPToP2O5(deficit.total_p_lbs)),
    k2o_lbs: round2(elementalKToK2O(deficit.total_k_lbs)),
  };
}
