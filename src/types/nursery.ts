export type SeedSoakProtocol =
  | "none-dry-sow"
  | "mucilaginous-no-soak"
  | "warm-water-4hr"
  | "cold-water-8-12hr"
  | "overnight-16hr";

export type TrayBlackoutMethod = "stacked-with-weight" | "domed-no-weight" | "direct-to-light";

/** Catalog spec for a 1020-tray microgreen. CamelCase like Crop. */
export interface MicrogreenCultivar {
  id: string;
  commonName: string;
  cultivar: string;
  botanicalName: string;
  flavorProfile: string;
  seedWeightGramsPer1020: number;
  seedCountPerGram: number;
  soakProtocol: SeedSoakProtocol;
  soakHours: number;
  blackoutMethod: TrayBlackoutMethod;
  paverWeightLbs: number;
  blackoutDays: number;
  targetDliMolM2D: number;
  photoperiodHours: number;
  totalCycleDays: number;
  targetYieldOzPerTray: number;
  targetWholesalePricePerLbUsd: number;
  targetClamshellUnitPriceUsd: number;
  isMucilaginous: boolean;
  fieldNotes: string;
  swatch: string;
}

/** Queued 1020 flats on this farm. Snake_case like BedSuccession. */
export interface NurseryBatchQueueItem {
  id: string;
  cultivar_id: string;
  cultivar_name: string;
  tray_count: number;
  sow_date: string;
  soak_start_date: string | null;
  unstack_date: string;
  harvest_date: string;
  total_seed_grams_needed: number;
  projected_yield_oz: number;
  projected_gross_revenue_usd: number;
}

export const SOAK_LABEL: Record<SeedSoakProtocol, string> = {
  "none-dry-sow": "Dry-sow · no soak",
  "mucilaginous-no-soak": "Do not soak — seed gels",
  "warm-water-4hr": "Warm water · 4 h",
  "cold-water-8-12hr": "Cold water · 8–12 h",
  "overnight-16hr": "Overnight · 16 h",
};

export const BLACKOUT_LABEL: Record<TrayBlackoutMethod, string> = {
  "stacked-with-weight": "Stacked + paver",
  "domed-no-weight": "Dome · no weight",
  "direct-to-light": "Direct to light",
};

/** Interior of a standard 1020 flat. */
export const TRAY_1020_IN = { width: 10, length: 20 } as const;

export const DEFAULT_RACK = {
  tiers: 4,
  traysPerShelf: 4,
} as const;

export const RACK_TRAY_CAPACITY = DEFAULT_RACK.tiers * DEFAULT_RACK.traysPerShelf;

export const CLAMSHELL_OZ = 4;

export const MAX_TRAYS_PER_BATCH = 200;
