/** Feed Studio (poultry ration) types. Mirrors the soil module's catalog/settings split. */

export interface FeedBand {
  min: number;
  /** null = floor-only band (no ceiling). */
  max: number | null;
}

export interface FeedIngredient {
  // catalog row (src/data/feed/ingredients.json), as-fed basis
  id: string;
  name: string;
  cp_pct: number;
  me_kcal_kg: number;
  lys_pct: number;
  met_pct: number;
  ca_pct: number;
  total_p_pct: number;
  avail_p_pct: number;
  fiber_pct: number;
  default_price_usd_per_lb: number;
  cautions: string;
}

export type BirdClass = "broiler" | "pullet" | "layer";

export interface FeedTarget {
  // preset row (src/data/feed/targets.json)
  id: string;
  label: string;
  bird_class: BirdClass;
  cp: FeedBand;
  me_kcal_kg: FeedBand;
  ca: FeedBand;
  avail_p: FeedBand;
  lys: FeedBand;
  met: FeedBand;
  fiber_max_pct: number;
  default_intake_lb_per_day: number;
}

/** Nutrient fields a ration line may override (plus price). */
export type FeedNutrientField =
  | "cp_pct"
  | "me_kcal_kg"
  | "lys_pct"
  | "met_pct"
  | "ca_pct"
  | "total_p_pct"
  | "avail_p_pct"
  | "fiber_pct";

export type NutrientKey = "cp" | "me" | "lys" | "met" | "ca" | "total_p" | "avail_p" | "fiber";

export interface RationLine {
  ingredient_id: string;
  /** % of ration as mixed. Lines are expected to total 100; the engine computes on the actual total. */
  pct: number;
  /** Set only for user-added custom ingredients (no catalog row). */
  name?: string;
  cp_pct?: number;
  me_kcal_kg?: number;
  lys_pct?: number;
  met_pct?: number;
  ca_pct?: number;
  total_p_pct?: number;
  avail_p_pct?: number;
  fiber_pct?: number;
  price_usd_per_lb?: number;
}

export interface SavedRation {
  id: string;
  name: string;
  target_id: string;
  /** Per-ration band edits (spec §3.1: every target value is individually editable). Merged over the preset. */
  target_overrides?: Partial<Record<NutrientKey, FeedBand>>;
  lines: RationLine[];
  batch_lbs: number;
  flock_size: number;
  intake_lb_per_day: number;
  updated_at: string;
}

export interface FeedSettings {
  rations: SavedRation[];
}

export type NutrientState = "in" | "low" | "high";

export interface FeedWarning {
  nutrient: NutrientKey | "ca_to_p" | "total" | "premix" | "salt";
  severity: "info" | "warn" | "alert";
  message: string;
}

export interface RationAnalysis {
  total_pct: number;
  nutrients: Record<NutrientKey, { value: number; state: NutrientState }>;
  /** Ca : total P. Infinity when the blend carries Ca but no P. */
  ca_to_p_ratio: number;
  salt_pct: number;
  premix_pct: number;
  batch: Array<{ ingredient_id: string; name: string; lbs: number; cost_usd: number }>;
  batch_cost_usd: number;
  cost_per_lb_usd: number;
  cost_per_bird_day_usd: number;
  flock_cost_day_usd: number;
  flock_cost_week_usd: number;
  warnings: FeedWarning[];
}

export type PearsonResult =
  | {
      ok: true;
      lines: RationLine[];
      grain_share_pct: number;
      required_grain_cp_pct: number;
    }
  | {
      ok: false;
      reason: "target_below_base" | "target_above_source" | "fixed_overflow" | "same_cp";
      message: string;
    };
