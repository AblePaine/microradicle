/**
 * Rotational paddock math. 164-ft net rolls, daily DM, rest days, manure credit.
 */
import type {
  FenceType,
  LivestockSpeciesSpec,
  PastureForageStand,
  PastureRotationQueueItem,
} from "../types/pasture.ts";
import {
  FORAGE_UTILIZATION,
  MAX_HEAD_PER_ROTATION,
  MAX_MOVE_DAYS,
  MAX_PADDOCK_SQFT,
  NET_ROLL_FT,
  SQFT_PER_ACRE,
  STAND_DM_LBS_PER_ACRE,
  STAND_REST_DAYS,
} from "../types/pasture.ts";

export {
  FORAGE_UTILIZATION,
  MAX_HEAD_PER_ROTATION,
  MAX_MOVE_DAYS,
  MAX_PADDOCK_SQFT,
  NET_ROLL_FT,
  SQFT_PER_ACRE,
  STAND_DM_LBS_PER_ACRE,
  STAND_REST_DAYS,
};

export function isPastureStand(v: unknown): v is PastureForageStand {
  return typeof v === "string" && Object.prototype.hasOwnProperty.call(STAND_DM_LBS_PER_ACRE, v);
}

export function clampHead(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(MAX_HEAD_PER_ROTATION, Math.round(n)));
}

export function clampMoveDays(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(MAX_MOVE_DAYS, Math.round(n)));
}

export function clampSqft(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.max(0, Math.min(MAX_PADDOCK_SQFT, Math.round(n)));
}

export function forageLbsPerHead(spec: LivestockSpeciesSpec): number {
  return round2(spec.avgBodyWeightLbs * spec.dailyDmIntakePctBw);
}

export function dailyDmForFlock(spec: LivestockSpeciesSpec, headCount: number): number {
  const head = clampHead(headCount);
  return round1(spec.dailyForageIntakeLbs * head);
}

export function usableDmLbsPerAcre(stand: PastureForageStand): number {
  return STAND_DM_LBS_PER_ACRE[stand] * FORAGE_UTILIZATION;
}

/** Square feet of paddock for one graze (move interval) at 50% utilization. */
export function recommendedPaddockSqft(
  spec: LivestockSpeciesSpec,
  headCount: number,
  stand: PastureForageStand,
  moveDays: number,
): number {
  const need = spec.dailyForageIntakeLbs * clampHead(headCount) * clampMoveDays(moveDays);
  const usable = usableDmLbsPerAcre(stand);
  if (!(usable > 0) || !(need > 0)) return 0;
  return Math.round((need / usable) * SQFT_PER_ACRE);
}

export function shelterSqftNeeded(spec: LivestockSpeciesSpec, headCount: number): number {
  return round1(spec.shelterSqftPerHead * clampHead(headCount));
}

export function paddockSideFt(sqft: number): number {
  if (!(sqft > 0)) return 0;
  return round1(Math.sqrt(sqft));
}

export function paddockPerimeterFt(sqft: number): number {
  return round1(4 * paddockSideFt(sqft));
}

export function nettingRolls(sqft: number, fenceType: FenceType): number {
  if (fenceType === "none-skid-tractor") return 0;
  const peri = 4 * Math.sqrt(Math.max(0, sqft));
  if (!(peri > 0)) return 0;
  return Math.max(1, Math.ceil(peri / NET_ROLL_FT));
}

export function restDays(stand: PastureForageStand): { spring: number; summer: number } {
  return STAND_REST_DAYS[stand];
}

export function manureForGraze(
  spec: LivestockSpeciesSpec,
  headCount: number,
  moveDays: number,
): { n: number; p2o5: number; k2o: number } {
  const head = clampHead(headCount);
  const days = clampMoveDays(moveDays);
  return {
    n: round2(spec.dailyManureNpkLbs.n * head * days),
    p2o5: round2(spec.dailyManureNpkLbs.p2o5 * head * days),
    k2o: round2(spec.dailyManureNpkLbs.k2o * head * days),
  };
}

export function isOvergrazed(allocatedSqft: number, recommendedSqft: number): boolean {
  if (!(recommendedSqft > 0)) return false;
  return allocatedSqft < recommendedSqft * 0.9;
}

export function computeRotation(
  spec: LivestockSpeciesSpec,
  headCount: number,
  stand: PastureForageStand,
  startDate: string,
  moveIntervalDays: number,
  allocatedSqft: number,
  id: string,
): PastureRotationQueueItem {
  const head = clampHead(headCount);
  const days = clampMoveDays(moveIntervalDays);
  const daily = dailyDmForFlock(spec, head);
  const recommended = recommendedPaddockSqft(spec, head, stand, days);
  const shelter = shelterSqftNeeded(spec, head);
  const allocated = clampSqft(allocatedSqft) || recommended;
  const rest = restDays(stand);
  const manure = manureForGraze(spec, head, days);
  return {
    id,
    species_id: spec.id,
    species_name: spec.breed,
    head_count: head,
    stand,
    start_date: startDate,
    move_interval_days: days,
    allocated_paddock_sqft: allocated,
    total_daily_dm_lbs: daily,
    recommended_paddock_sqft: recommended,
    shelter_sqft_needed: shelter,
    recommended_netting_rolls: nettingRolls(allocated, spec.nettingSpec.fenceType),
    spring_rest_days: rest.spring,
    summer_rest_days: rest.summer,
    manure_n_lbs: manure.n,
    manure_p2o5_lbs: manure.p2o5,
    manure_k2o_lbs: manure.k2o,
    overgrazing_warning: isOvergrazed(allocated, recommended),
  };
}

export function acresFromSqft(sqft: number): number {
  return round2(sqft / SQFT_PER_ACRE);
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
