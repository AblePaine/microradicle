export type SoilTexture = "sand" | "silt-loam" | "clay";

export interface OrganicAmendment {
  id: string;
  name: string;
  n_pct: number;
  p_pct: number; // Phosphate P2O5 %
  k_pct: number; // Potash K2O %
  ca_pct: number;
  mg_pct: number;
  bulk_density_lbs_per_qt: number;
  typical_mineralization_weeks: number;
  first_4_weeks_n_release_pct: number;
  omri_listed: boolean;
  standard_bag_weight_lbs: number;
  application_cautions: string;
}

export interface BedNutrientDeficit {
  block_id: string;
  block_name: string;
  total_bed_feet: number;
  total_n_lbs: number;
  total_p_lbs: number;
  total_k_lbs: number;
  crop_breakdown: Array<{
    crop_name: string;
    crop_id: string;
    bed_feet: number;
    n_lbs: number;
    p_lbs: number;
    k_lbs: number;
  }>;
}

export interface AmendmentRecipeItem {
  amendment: OrganicAmendment;
  lbs_required: number;
  oz_per_linear_bed_foot: number;
  quarts_per_100ft_bed: number;
  grams_per_linear_meter: number;
  lbs_per_100ft_bed: number;
  full_50lb_bags_needed: number;
  n_supplied_lbs: number;
  p_supplied_lbs: number;
  k_supplied_lbs: number;
}

export interface SoilBalancingPlan {
  deficit: BedNutrientDeficit;
  recipe: AmendmentRecipeItem[];
  net_balance: {
    n_delta_lbs: number;
    p_delta_lbs: number;
    k_delta_lbs: number;
    is_p_overloaded: boolean;
  };
  manure_credit: ManureNutrientCredit | null;
  net_need: {
    n_lbs: number;
    p_lbs: number;
    k_lbs: number;
  };
}

/** Year-1 plant-available manure from a saved paddock stay. Snake_case farm record. */
export interface ManureNutrientCredit {
  source_id: string;
  source_name: string;
  available_n_lbs: number;
  available_p2o5_lbs: number;
  available_k2o_lbs: number;
  area_sqft: number;
  livestock_class?: string;
}

export interface SoilAmendmentBalance {
  crop_demand: {
    n_lbs: number;
    p2o5_lbs: number;
    k2o_lbs: number;
  };
  manure_credit_applied: ManureNutrientCredit | null;
  net_deficit: {
    n_lbs: number;
    p2o5_lbs: number;
    k2o_lbs: number;
  };
  amendment_recipe: {
    feather_meal_12_0_0_lbs: number;
    bone_meal_3_15_0_lbs: number;
    potash_0_0_50_lbs: number;
  };
  amendment_recipe_cups: {
    feather_meal_cups: number;
    bone_meal_cups: number;
    potash_cups: number;
  };
  commercial_savings_usd: number;
  p_overload_warning: boolean;
}

export interface SoilSettings {
  soil_temp_f: number;
  organic_matter_pct: number;
  texture: SoilTexture;
  horizon_weeks: number;
  selected_amendment_ids: string[];
  manure_credit_id?: string | null;
}

export interface MineralizationPoint {
  week: number;
  fraction: number;
  n_lbs: number;
}
