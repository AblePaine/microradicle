/**
 * Herd packet — record-keeping types.
 *
 * A herd/flock log is a notebook, not a medical record: it stores the dates
 * and notes a keeper writes down, plus date arithmetic on those entries.
 * Nothing in this module prescribes care, treatment, or schedules — every
 * interval is a number the keeper typed in for their own reminder list.
 */

export type HerdSpecies = "cattle" | "sheep" | "goat" | "pig" | "poultry" | "other";

export type ReminderAnchor = "breeding" | "due" | "custom";

export interface HerdReminder {
  id: string;
  /** Keeper's own label, e.g. "booster — my note" or "check the gate list". */
  label: string;
  anchor: ReminderAnchor;
  /** Days from the anchor date; negative counts back (e.g. -14 = two weeks before). Unused for "custom". */
  offset_days: number;
  /** ISO YYYY-MM-DD when anchor is "custom". */
  custom_date?: string;
}

export interface HerdRecord {
  id: string;
  /** Tag, name, or pen label — whatever the keeper calls the animal or group. */
  animal_id: string;
  /** Optional pen / pasture / group label. */
  group_label?: string;
  species: HerdSpecies;
  breed?: string;
  /** ISO YYYY-MM-DD the keeper recorded as the breeding (or set/incubation-start) date. Empty = not recorded. */
  breeding_date: string;
  /** Day count from breeding_date to the expected due date. Pre-filled from the species default, always editable. */
  gestation_days: number;
  /** Free-text keeper notes — records only. */
  notes?: string;
  reminders: HerdReminder[];
  updated_at: string; // ISO timestamp
}
