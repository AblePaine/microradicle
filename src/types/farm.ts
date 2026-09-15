import type { CropSpecification } from "./crop";
import type { IrrigationNetwork } from "./irrigation";
import type { SoilSettings } from "./soil";
import type { EconomicsSettings } from "./economics";
import type { NurseryBatchQueueItem } from "./nursery";
import type { PastureRotationQueueItem } from "./pasture";

export type Units = "imperial" | "metric";

/** Practical per-block ceiling so the plot map stays usable. Not a license gate. */
export const MAX_BEDS_PER_BLOCK = 500;
export const MAX_BED_LENGTH_FT = 400;

export interface BedSuccession {
  id: string;
  block_id: string;
  bed_index: number;
  crop_id: CropSpecification["id"];
  target_harvest_date: string; // ISO YYYY-MM-DD
  // Computed fields:
  field_transplant_date: string;
  nursery_sow_date: string;
  harvest_end_date: string;
  bed_feet_needed: number;
  target_units: number;
}

export interface FieldBlock {
  id: string;
  name: string;
  bed_count: number;
  bed_length_ft: number;
  bed_width_in: 30;
}

export interface FarmClimate {
  last_spring_frost: string;
  first_fall_frost: string;
  latitude: number;
}

export interface FarmState {
  version: "1.0.0";
  name: string;
  units: Units;
  climate: FarmClimate;
  blocks: FieldBlock[];
  successions: BedSuccession[];
  /** Optional drip topology. Absent farms get a default 1-zone-per-block network at audit time. */
  irrigation?: IrrigationNetwork;
  /** Optional soil test / amendment palette. Deficits still come from successions. */
  soil?: SoilSettings;
  /** Optional pack-shed labor, channel, and cooler geometry. */
  economics?: EconomicsSettings;
  /** Optional 1020-tray microgreen queue. Absent farms start empty. */
  nursery_batches?: NurseryBatchQueueItem[];
  /** Optional paddock rotations. Absent farms start empty. */
  pasture_rotations?: PastureRotationQueueItem[];
}

export type BedRef = {
  block: FieldBlock;
  bed_index: number;
  key: string;
  label: string;
};
