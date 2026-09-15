export type PipeDiameterInches = 0.5 | 0.75 | 1.0 | 1.25 | 1.5;

export interface PipeSpecification {
  nominal_diameter_in: PipeDiameterInches;
  /** Inside diameter of PE lateral / header (in). */
  inside_diameter_in: number;
  /** Hazen-Williams roughness. 150 = smooth PE. */
  c_factor: number;
  /** Flow at 5.0 ft/s — do not exceed. */
  max_recommended_gpm: number;
}

export interface IrrigationZone {
  id: string;
  name: string;
  block_ids: string[];
  header_diameter_in: PipeDiameterInches;
  /** Header run along the block face, feet. */
  header_length_ft: number;
}

export interface IrrigationNetwork {
  supply_capacity_gpm: number;
  supply_pressure_psi: number;
  mainline_diameter_in: PipeDiameterInches;
  mainline_length_ft: number;
  /** Downstream of the zone regulator, typically 8–12 psi for tape. */
  regulator_setpoint_psi: number;
  zones: IrrigationZone[];
}

export interface BomLine {
  sku_name: string;
  quantity: number;
  specification: string;
}

export interface ZoneHydraulicAudit {
  zone_id: string;
  zone_name: string;
  bed_count: number;
  total_bed_feet: number;
  total_drip_tape_feet: number;
  active_emitters_count: number;
  gross_demand_gpm: number;
  supply_capacity_gpm: number;
  capacity_utilization_pct: number;
  is_over_capacity: boolean;
  recommended_header_diameter_in: PipeDiameterInches;
  selected_header_diameter_in: PipeDiameterInches;
  header_friction_loss_psi: number;
  header_velocity_fps: number;
  requires_zone_split: boolean;
  suggested_split_count: number;
  bill_of_materials: BomLine[];
  crop_mix: Array<{ crop_id: string; bed_count: number; demand_gpm: number }>;
}

export interface MainlineStation {
  chainage_ft: number;
  label: string;
  flow_gpm: number;
  pressure_psi: number;
  velocity_fps: number;
}

export interface IrrigationFitting {
  sku: string;
  sku_name: string;
  category: "pipe" | "tape" | "valve" | "fitting" | "filter" | "regulator";
  specification: string;
  diameter_in: number | null;
  equivalent_length_ft: number;
  unit: string;
}
