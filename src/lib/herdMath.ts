/**
 * Herd packet date math — pure functions, no storage, no advice.
 *
 * Everything here is calendar arithmetic on dates and day counts the keeper
 * entered: breeding date + a day count = an expected due date on the log
 * sheet. The species defaults are starting points for the day-count field
 * (the common published averages), shown in the UI as editable defaults —
 * the keeper's own records always win. Reminder intervals are likewise the
 * keeper's own numbers; the engine never suggests one.
 */
import { addDays, differenceInCalendarDays, format, isValid, parseISO } from "date-fns";
import type { HerdRecord, HerdReminder, HerdSpecies, ReminderAnchor } from "../types/herd.ts";

export interface GestationDefault {
  species: HerdSpecies;
  label: string;
  /** Common published average day count — a pre-fill for the editable field, not a rule. */
  days: number;
}

export const GESTATION_DEFAULTS: GestationDefault[] = [
  { species: "cattle", label: "Cattle", days: 283 },
  { species: "sheep", label: "Sheep", days: 147 },
  { species: "goat", label: "Goats", days: 150 },
  { species: "pig", label: "Pigs", days: 114 },
  { species: "poultry", label: "Poultry (incubation)", days: 21 },
  { species: "other", label: "Other", days: 0 },
];

export const GESTATION_BY_SPECIES: Map<HerdSpecies, GestationDefault> = new Map(
  GESTATION_DEFAULTS.map((g) => [g.species, g]),
);

export const HERD_SPECIES: HerdSpecies[] = GESTATION_DEFAULTS.map((g) => g.species);

export function defaultGestationDays(species: HerdSpecies): number {
  return GESTATION_BY_SPECIES.get(species)?.days ?? 0;
}

/** Strict YYYY-MM-DD check (parseISO alone happily rolls some junk forward). */
export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = parseISO(value);
  return isValid(parsed) && format(parsed, "yyyy-MM-dd") === value;
}

export function addDaysIso(isoDate: string, days: number): string {
  return format(addDays(parseISO(isoDate), Math.round(days)), "yyyy-MM-dd");
}

/** Expected due date = breeding date + the record's day count. Null when either input is missing. */
export function computeDueDate(breedingDate: string, gestationDays: number): string | null {
  if (!breedingDate || !isIsoDate(breedingDate)) return null;
  if (!Number.isFinite(gestationDays) || gestationDays <= 0) return null;
  return addDaysIso(breedingDate, gestationDays);
}

export function recordDueDate(record: HerdRecord): string | null {
  return computeDueDate(record.breeding_date, record.gestation_days);
}

/**
 * The calendar date a reminder lands on: the anchor date plus the keeper's
 * offset, or the keeper's own custom date. Null when it can't be placed
 * (e.g. anchored to a breeding date that was never recorded).
 */
export function computeReminderDate(reminder: HerdReminder, record: HerdRecord): string | null {
  if (reminder.anchor === "custom") {
    return reminder.custom_date && isIsoDate(reminder.custom_date) ? reminder.custom_date : null;
  }
  const anchorDate =
    reminder.anchor === "due" ? recordDueDate(record) : isIsoDate(record.breeding_date) ? record.breeding_date : null;
  if (!anchorDate) return null;
  if (!Number.isFinite(reminder.offset_days)) return null;
  return addDaysIso(anchorDate, reminder.offset_days);
}

/** Whole days from `today` to `isoDate` (negative = already passed). Both YYYY-MM-DD. */
export function daysUntil(isoDate: string, today: string): number {
  return differenceInCalendarDays(parseISO(isoDate), parseISO(today));
}

export interface UpcomingItem {
  record_id: string;
  animal_id: string;
  kind: "due" | "reminder";
  label: string;
  date: string;
  days_until: number;
}

/**
 * Due dates + reminder dates inside a window, soonest first — the "what's
 * coming up on the log" list. Pure record-keeping: it reports the keeper's
 * own entries back in date order.
 */
export function upcomingItems(records: HerdRecord[], today: string, withinDays: number): UpcomingItem[] {
  const items: UpcomingItem[] = [];
  for (const record of records) {
    const due = recordDueDate(record);
    if (due) {
      const d = daysUntil(due, today);
      if (d >= 0 && d <= withinDays) {
        items.push({ record_id: record.id, animal_id: record.animal_id, kind: "due", label: "Due date (from your dates)", date: due, days_until: d });
      }
    }
    for (const reminder of record.reminders) {
      const date = computeReminderDate(reminder, record);
      if (!date) continue;
      const d = daysUntil(date, today);
      if (d >= 0 && d <= withinDays) {
        items.push({ record_id: record.id, animal_id: record.animal_id, kind: "reminder", label: reminder.label, date, days_until: d });
      }
    }
  }
  return items.sort((a, b) => a.days_until - b.days_until || a.date.localeCompare(b.date) || a.label.localeCompare(b.label));
}

/** Records ordered by due date (soonest first); records with no due date go last, by animal id. */
export function sortRecordsByDue(records: HerdRecord[]): HerdRecord[] {
  return [...records].sort((a, b) => {
    const da = recordDueDate(a);
    const db = recordDueDate(b);
    if (da && db) return da.localeCompare(db) || a.animal_id.localeCompare(b.animal_id);
    if (da) return -1;
    if (db) return 1;
    return a.animal_id.localeCompare(b.animal_id);
  });
}

// ---------------------------------------------------------------------------
// Coercion — untrusted localStorage / import data in, clean records out
// ---------------------------------------------------------------------------

function pickStr(obj: Record<string, unknown>, key: string): string | undefined {
  const v = obj[key];
  return typeof v === "string" ? v : undefined;
}

function pickNum(obj: Record<string, unknown>, key: string): number | undefined {
  const v = obj[key];
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

export function parseHerdReminder(raw: unknown): HerdReminder | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = pickStr(o, "id");
  const label = pickStr(o, "label")?.trim();
  if (!id || !label) return null;
  const anchorRaw = pickStr(o, "anchor");
  const anchor: ReminderAnchor = anchorRaw === "due" || anchorRaw === "custom" ? anchorRaw : "breeding";
  const custom = pickStr(o, "custom_date");
  return {
    id,
    label,
    anchor,
    offset_days: Math.round(pickNum(o, "offset_days") ?? 0),
    ...(custom && isIsoDate(custom) ? { custom_date: custom } : {}),
  };
}

export function parseHerdRecord(raw: unknown): HerdRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = pickStr(o, "id");
  const animalId = pickStr(o, "animal_id")?.trim();
  if (!id || !animalId) return null;
  const speciesRaw = pickStr(o, "species");
  const species: HerdSpecies = (HERD_SPECIES as string[]).includes(speciesRaw ?? "")
    ? (speciesRaw as HerdSpecies)
    : "other";
  const breeding = pickStr(o, "breeding_date") ?? "";
  const gestation = pickNum(o, "gestation_days");
  const remindersRaw = Array.isArray(o.reminders) ? o.reminders : [];
  return {
    id,
    animal_id: animalId,
    ...(pickStr(o, "group_label")?.trim() ? { group_label: pickStr(o, "group_label")!.trim() } : {}),
    species,
    ...(pickStr(o, "breed")?.trim() ? { breed: pickStr(o, "breed")!.trim() } : {}),
    breeding_date: isIsoDate(breeding) ? breeding : "",
    gestation_days: gestation !== undefined ? Math.max(0, Math.round(gestation)) : defaultGestationDays(species),
    ...(pickStr(o, "notes")?.trim() ? { notes: pickStr(o, "notes")!.trim() } : {}),
    reminders: remindersRaw.map(parseHerdReminder).filter((r): r is HerdReminder => r !== null),
    updated_at: pickStr(o, "updated_at") ?? "",
  };
}
