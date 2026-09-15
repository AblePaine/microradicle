export type LivestockClass =
  | "pastured-broilers"
  | "pastured-layers"
  | "hair-sheep"
  | "small-herd-cattle";

export type PastureForageStand =
  | "lush-spring-flush"
  | "standard-perennial-mix"
  | "summer-drought-slump"
  | "vegetative-cover-crop";

export type FenceType =
  | "none-skid-tractor"
  | "poultry-net-48in"
  | "sheep-goat-net-35in"
  | "single-polywire-cattle";

/** Catalog spec for a pastured flock or herd. CamelCase like Crop. */
export interface LivestockSpeciesSpec {
  id: string;
  commonName: string;
  breed: string;
  livestockClass: LivestockClass;
  animalUnitEquivalent: number;
  avgBodyWeightLbs: number;
  dailyDmIntakePctBw: number;
  dailyForageIntakeLbs: number;
  shelterSqftPerHead: number;
  targetGrazeDensity: string;
  recommendedMoveFrequencyDays: number;
  nettingSpec: {
    fenceType: FenceType;
    standardRollLengthFt: number;
  };
  dailyManureNpkLbs: {
    n: number;
    p2o5: number;
    k2o: number;
  };
  fieldNotes: string;
  swatch: string;
}

/** Queued paddock rotation on this farm. Snake_case like BedSuccession. */
export interface PastureRotationQueueItem {
  id: string;
  species_id: string;
  species_name: string;
  livestock_class: LivestockClass;
  head_count: number;
  stand: PastureForageStand;
  start_date: string;
  move_interval_days: number;
  allocated_paddock_sqft: number;
  total_daily_dm_lbs: number;
  recommended_paddock_sqft: number;
  shelter_sqft_needed: number;
  recommended_netting_rolls: number;
  spring_rest_days: number;
  summer_rest_days: number;
  manure_n_lbs: number;
  manure_p2o5_lbs: number;
  manure_k2o_lbs: number;
  overgrazing_warning: boolean;
  saved_at?: string;
}

/** Ledger row for a paddock stay — same shape as a queued rotation, stored for the soil credit. */
export type PasturePaddockAudit = PastureRotationQueueItem;

export const LIVESTOCK_CLASSES: LivestockClass[] = [
  "pastured-broilers",
  "pastured-layers",
  "hair-sheep",
  "small-herd-cattle",
];

export const FORAGE_STANDS: PastureForageStand[] = [
  "lush-spring-flush",
  "standard-perennial-mix",
  "summer-drought-slump",
  "vegetative-cover-crop",
];

export const CLASS_LABEL: Record<LivestockClass, string> = {
  "pastured-broilers": "Pastured broilers",
  "pastured-layers": "Pastured layers",
  "hair-sheep": "Sheep & goats",
  "small-herd-cattle": "Small-herd cattle",
};

export const STAND_LABEL: Record<PastureForageStand, string> = {
  "lush-spring-flush": "Spring flush · 2,800 lb DM/ac",
  "standard-perennial-mix": "Perennial mix · 2,000 lb DM/ac",
  "summer-drought-slump": "Summer slump · 1,200 lb DM/ac",
  "vegetative-cover-crop": "Cover crop · 3,200 lb DM/ac",
};

export const FENCE_LABEL: Record<FenceType, string> = {
  "none-skid-tractor": "Floorless tractor — no net",
  "poultry-net-48in": "48 in poultry net",
  "sheep-goat-net-35in": "35 in sheep/goat net",
  "single-polywire-cattle": "Single polywire",
};

/** Premier 1 / common commercial poultry and sheep net. */
export const NET_ROLL_FT = 164;

export const SQFT_PER_ACRE = 43_560;

/** Take half the stand. Leave the rest for recovery. */
export const FORAGE_UTILIZATION = 0.5;

export const STAND_DM_LBS_PER_ACRE: Record<PastureForageStand, number> = {
  "lush-spring-flush": 2800,
  "standard-perennial-mix": 2000,
  "summer-drought-slump": 1200,
  "vegetative-cover-crop": 3200,
};

export const STAND_REST_DAYS: Record<PastureForageStand, { spring: number; summer: number }> = {
  "lush-spring-flush": { spring: 18, summer: 30 },
  "standard-perennial-mix": { spring: 24, summer: 36 },
  "summer-drought-slump": { spring: 30, summer: 45 },
  "vegetative-cover-crop": { spring: 21, summer: 28 },
};

export const MAX_HEAD_PER_ROTATION = 2000;
export const MAX_MOVE_DAYS = 14;
export const MAX_PADDOCK_SQFT = SQFT_PER_ACRE * 20;

/** Year-1 plant-available N. Poultry loses more to volatilization; ruminants more to organic N. */
export const POULTRY_N_YEAR1 = 0.5;
export const RUMINANT_N_YEAR1 = 0.4;
