export type StorageThermalZone =
  | "zone-1-cold-wet"
  | "zone-2-cool-humid"
  | "zone-3-ambient-dry"
  | "zone-curing";

export type CoolingMethod = "hydrocooling" | "forced-air" | "room-cooling" | "ice-top";

export type RespirationRating = "very-low" | "low" | "moderate" | "high" | "extremely-high";

export type SalesChannel = "wholesale" | "direct" | "mix";

export interface CropPostHarvestSpec {
  crop_id: string;
  storage_zone: StorageThermalZone;
  optimal_temp_f: number;
  min_safe_temp_f: number;
  max_temp_f: number;
  optimal_rh_pct: number;
  shelf_life_days: number;
  cooling_method: CoolingMethod;
  respiration_rate_rating: RespirationRating;
  sensible_heat_btu_per_lb: number;
  totes_per_100_lbs: number;
  harvest_hours_per_100_bed_ft: number;
}

export interface EnterpriseCropBudget {
  crop_id: string;
  crop_name: string;
  bed_feet: number;
  projected_units: number;
  sales_unit: string;
  gross_revenue_usd: number;
  revenue_per_bed_foot_usd: number;
  harvest_labor_hours: number;
  harvest_labor_cost_usd: number;
  seed_prop_cost_usd: number;
  net_margin_usd: number;
  margin_per_bed_foot_usd: number;
}

export interface WeeklyHarvestPickItem {
  succession_id: string;
  crop_id: string;
  crop_name: string;
  block_name: string;
  bed_index: number;
  harvest_date: string;
  units_to_pick: number;
  sales_unit: string;
  gross_lbs: number;
  totes_needed: number;
  thermal_zone: StorageThermalZone;
  target_cooler_temp_f: number;
  min_safe_temp_f: number;
  chill_risk: boolean;
}

export interface ChillingInjuryFlag {
  crop_id: string;
  crop_name: string;
  min_safe_temp_f: number;
  cooler_temp_f: number;
  message: string;
}

export interface ColdRoomThermalAudit {
  target_zone: StorageThermalZone;
  total_field_mass_lbs: number;
  total_totes: number;
  initial_field_temp_f: number;
  target_storage_temp_f: number;
  sensible_heat_btu: number;
  respiration_heat_btu_per_day: number;
  total_cooling_load_btu: number;
  recommended_ac_btu_rating: number;
  minimum_cooler_sqft: number;
  peak_btu_per_hr: number;
  cubic_displacement_cu_ft: number;
  ac_tons: number;
  fits_existing_cooler: boolean;
  chill_flags: ChillingInjuryFlag[];
}

export interface EconomicsSettings {
  labor_usd_per_hour: number;
  channel: SalesChannel;
  mix_direct_pct: number;
  field_temp_f: number;
  pull_down_hours: number;
  cooler_length_ft: number;
  cooler_width_ft: number;
  cooler_height_ft: number;
  week_start: string;
}
