/**
 * Agent-facing API logic — the shared core behind the REST routes
 * (src/routes/api/*), the MCP endpoint (src/routes/mcp.ts), and the
 * OpenAPI document. Everything here wraps the same engine libraries the
 * web UI uses (feedMath, crops) without altering their math.
 *
 * Conventions borrowed from the DoughMatrix agent API: partial JSON in,
 * every field optional, house defaults applied, the normalized input
 * echoed back beside the result.
 */
import { crops, FAMILIES, filterCrops, getCrop } from "./crops.ts";
import {
  analyzeRation,
  DEFAULT_FEED,
  DEFAULT_TARGET_ID,
  effectiveTarget,
  INGREDIENT_BY_ID,
  INGREDIENTS,
  TARGET_BY_ID,
  TARGETS,
} from "./feedMath.ts";
import { CROP_CATEGORIES, FROST_BANDS, type CropCategory, type FrostHardiness } from "../types/crop.ts";
import type { FeedBand, NutrientKey, RationLine, SavedRation } from "../types/feed.ts";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** JSON.stringify that renders non-finite numbers (e.g. an infinite Ca:P ratio) as null. */
export function stringifyJson(data: unknown): string {
  return JSON.stringify(data, (_key, value: unknown) =>
    typeof value === "number" && !Number.isFinite(value) ? null : value,
  );
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(stringifyJson(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export function errorResponse(err: unknown): Response {
  if (err instanceof ApiError) return jsonResponse({ error: err.message }, err.status);
  return jsonResponse({ error: err instanceof Error ? err.message : "Internal error" }, 500);
}

// ---------------------------------------------------------------------------
// Feed Studio — ration calculation
// ---------------------------------------------------------------------------

const OVERRIDE_NUM_FIELDS = [
  "cp_pct",
  "me_kcal_kg",
  "lys_pct",
  "met_pct",
  "ca_pct",
  "total_p_pct",
  "avail_p_pct",
  "fiber_pct",
  "price_usd_per_lb",
] as const;

const NUTRIENT_KEYS: NutrientKey[] = ["cp", "me", "lys", "met", "ca", "total_p", "avail_p", "fiber"];

function num(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function coerceApiLine(raw: unknown, index: number): RationLine {
  if (!raw || typeof raw !== "object") {
    throw new ApiError(400, `lines[${index}] must be an object with ingredient_id and pct.`);
  }
  const o = raw as Record<string, unknown>;
  const id = typeof o.ingredient_id === "string" ? o.ingredient_id : "";
  if (!id) throw new ApiError(400, `lines[${index}].ingredient_id is required.`);
  const name = typeof o.name === "string" && o.name.trim() ? o.name : undefined;
  if (!INGREDIENT_BY_ID.has(id) && !name) {
    throw new ApiError(
      400,
      `Unknown ingredient_id '${id}' at lines[${index}]. Use GET /api/feed/ingredients for catalog ids, or give the line a name plus its nutrient values to define a custom ingredient.`,
    );
  }
  const pct = num(o.pct);
  if (pct === undefined) throw new ApiError(400, `lines[${index}].pct must be a number.`);
  const line: RationLine = { ingredient_id: id, pct: clamp(pct, 0, 100) };
  if (name) line.name = name;
  for (const f of OVERRIDE_NUM_FIELDS) {
    const v = num(o[f]);
    if (v !== undefined) {
      line[f] = f === "me_kcal_kg" ? clamp(v, 0, 6000) : f === "price_usd_per_lb" ? clamp(v, 0, 100) : clamp(v, 0, 100);
    }
  }
  return line;
}

function coerceBand(raw: unknown, key: string): FeedBand {
  if (!raw || typeof raw !== "object") {
    throw new ApiError(400, `target_overrides.${key} must be an object { min, max }.`);
  }
  const o = raw as Record<string, unknown>;
  const min = num(o.min);
  if (min === undefined) throw new ApiError(400, `target_overrides.${key}.min must be a number.`);
  const max = o.max === null || o.max === undefined ? null : num(o.max);
  if (o.max !== null && o.max !== undefined && max === undefined) {
    throw new ApiError(400, `target_overrides.${key}.max must be a number or null.`);
  }
  return { min, max: max ?? null };
}

export interface FeedCalculateResult {
  input: {
    target_id: string;
    lines: RationLine[];
    batch_lbs: number;
    flock_size: number;
    intake_lb_per_day: number;
    target_overrides?: Partial<Record<NutrientKey, FeedBand>>;
  };
  target: ReturnType<typeof effectiveTarget>;
  analysis: ReturnType<typeof analyzeRation>;
}

/**
 * Run the Feed Studio engine for an agent-supplied ration. All fields are
 * optional; with no lines at all the built-in layer example ration is
 * analyzed so a bare call still returns the canonical worked example.
 * Numeric handling mirrors the UI's own coercion (feedMath.resolveFeed).
 */
export function calculateFeed(rawInput: unknown): FeedCalculateResult {
  const input = (rawInput ?? {}) as Record<string, unknown>;
  if (typeof input !== "object" || Array.isArray(input)) {
    throw new ApiError(400, "Feed calculate expects a JSON object body.");
  }

  let target_id = DEFAULT_TARGET_ID;
  if (input.target_id !== undefined) {
    if (typeof input.target_id !== "string" || !TARGET_BY_ID.has(input.target_id)) {
      throw new ApiError(
        400,
        `Unknown target_id '${String(input.target_id)}'. Known targets: ${TARGETS.map((t) => t.id).join(", ")}.`,
      );
    }
    target_id = input.target_id;
  }

  let lines: RationLine[];
  if (input.lines === undefined) {
    const example = DEFAULT_FEED.rations[0]!;
    lines = example.lines.map((l) => ({ ...l }));
    if (input.target_id === undefined) target_id = example.target_id;
  } else {
    if (!Array.isArray(input.lines)) throw new ApiError(400, "lines must be an array.");
    if (input.lines.length === 0) {
      throw new ApiError(400, "lines must include at least one ingredient (omit lines entirely for the built-in example ration).");
    }
    lines = input.lines.map((l, i) => coerceApiLine(l, i));
  }

  const overrides: Partial<Record<NutrientKey, FeedBand>> = {};
  if (input.target_overrides !== undefined) {
    if (!input.target_overrides || typeof input.target_overrides !== "object" || Array.isArray(input.target_overrides)) {
      throw new ApiError(400, "target_overrides must be an object keyed by nutrient (cp, me, lys, met, ca, total_p, avail_p, fiber).");
    }
    for (const key of NUTRIENT_KEYS) {
      const rawBand = (input.target_overrides as Record<string, unknown>)[key];
      if (rawBand !== undefined) overrides[key] = coerceBand(rawBand, key);
    }
  }

  const preset = TARGET_BY_ID.get(target_id)!;
  const ration: SavedRation = {
    id: "api-ration",
    name: "API ration",
    target_id,
    ...(Object.keys(overrides).length ? { target_overrides: overrides } : {}),
    lines,
    batch_lbs: clamp(num(input.batch_lbs) ?? 100, 1, 2000),
    flock_size: Math.round(clamp(num(input.flock_size) ?? 25, 0, 100000)),
    intake_lb_per_day: clamp(num(input.intake_lb_per_day) ?? preset.default_intake_lb_per_day, 0.01, 2),
    updated_at: "",
  };

  const target = effectiveTarget(ration);
  const analysis = analyzeRation(ration, target);
  return {
    input: {
      target_id: ration.target_id,
      lines: ration.lines,
      batch_lbs: ration.batch_lbs,
      flock_size: ration.flock_size,
      intake_lb_per_day: ration.intake_lb_per_day,
      ...(ration.target_overrides ? { target_overrides: ration.target_overrides } : {}),
    },
    target,
    analysis,
  };
}

/** Parse the GET form of the feed calculate call: `lines=corn:63.2,soybean-meal-44:25.3`. */
export function feedInputFromQuery(searchParams: URLSearchParams): Record<string, unknown> {
  const input: Record<string, unknown> = {};
  const targetId = searchParams.get("target_id");
  if (targetId) input.target_id = targetId;
  const linesRaw = searchParams.get("lines");
  if (linesRaw) {
    input.lines = linesRaw
      .split(",")
      .map((pair) => pair.trim())
      .filter(Boolean)
      .map((pair) => {
        const idx = pair.lastIndexOf(":");
        if (idx <= 0) throw new ApiError(400, `lines entry '${pair}' must look like ingredient_id:pct.`);
        return { ingredient_id: pair.slice(0, idx), pct: pair.slice(idx + 1) };
      });
  }
  for (const key of ["batch_lbs", "flock_size", "intake_lb_per_day"] as const) {
    const v = searchParams.get(key);
    if (v !== null) input[key] = v;
  }
  return input;
}

// ---------------------------------------------------------------------------
// Herd packet — due-date calculation (the log itself is web-only)
// ---------------------------------------------------------------------------

import {
  computeDueDate,
  computeReminderDate,
  defaultGestationDays,
  GESTATION_DEFAULTS,
  isIsoDate,
} from "./herdMath.ts";
import type { HerdRecord, HerdReminder, HerdSpecies } from "../types/herd.ts";

export interface HerdDueDateResult {
  input: {
    species?: string;
    breeding_date: string;
    gestation_days: number;
    reminders: HerdReminder[];
  };
  due_date: string;
  reminders: Array<HerdReminder & { date: string | null }>;
}

const REMINDER_ANCHORS = ["breeding", "due", "custom"] as const;

/**
 * Stateless herd due-date math for agents — the same arithmetic the web
 * herd log uses. The log itself (the keeper's records) is web-only: it
 * lives in the browser's local storage and is never sent to this API.
 * Reminder intervals are the caller's own numbers; nothing here suggests
 * an interval, a schedule, or any animal-care action.
 */
export function calculateHerdDueDate(rawInput: unknown): HerdDueDateResult {
  const input = (rawInput ?? {}) as Record<string, unknown>;
  if (typeof input !== "object" || Array.isArray(input)) {
    throw new ApiError(400, "Herd due-date calculate expects a JSON object body.");
  }

  let species: HerdSpecies | undefined;
  if (input.species !== undefined) {
    if (typeof input.species !== "string" || !GESTATION_DEFAULTS.some((g) => g.species === input.species)) {
      throw new ApiError(
        400,
        `Unknown species '${String(input.species)}'. Known species: ${GESTATION_DEFAULTS.map((g) => g.species).join(", ")}.`,
      );
    }
    species = input.species as HerdSpecies;
  }

  const breedingRaw = input.breeding_date;
  if (typeof breedingRaw !== "string" || !isIsoDate(breedingRaw)) {
    throw new ApiError(400, "breeding_date is required, as an ISO date (YYYY-MM-DD).");
  }

  let gestation = species ? defaultGestationDays(species) : 283;
  if (input.gestation_days !== undefined) {
    const g = num(input.gestation_days);
    if (g === undefined || g <= 0) throw new ApiError(400, "gestation_days must be a positive number.");
    gestation = Math.round(g);
  }

  const reminders: HerdReminder[] = [];
  if (input.reminders !== undefined) {
    if (!Array.isArray(input.reminders)) throw new ApiError(400, "reminders must be an array.");
    input.reminders.forEach((raw, i) => {
      if (!raw || typeof raw !== "object") throw new ApiError(400, `reminders[${i}] must be an object.`);
      const o = raw as Record<string, unknown>;
      const label = typeof o.label === "string" && o.label.trim() ? o.label.trim() : `Reminder ${i + 1}`;
      const anchorRaw = typeof o.anchor === "string" ? o.anchor : "breeding";
      if (!(REMINDER_ANCHORS as readonly string[]).includes(anchorRaw)) {
        throw new ApiError(400, `reminders[${i}].anchor must be one of: ${REMINDER_ANCHORS.join(", ")}.`);
      }
      const offset = o.offset_days === undefined ? 0 : num(o.offset_days);
      if (offset === undefined) throw new ApiError(400, `reminders[${i}].offset_days must be a number.`);
      const custom = typeof o.custom_date === "string" ? o.custom_date : undefined;
      if (anchorRaw === "custom" && (!custom || !isIsoDate(custom))) {
        throw new ApiError(400, `reminders[${i}].custom_date must be an ISO date (YYYY-MM-DD) when anchor is 'custom'.`);
      }
      reminders.push({
        id: `api-reminder-${i + 1}`,
        label,
        anchor: anchorRaw as HerdReminder["anchor"],
        offset_days: Math.round(offset),
        ...(custom && isIsoDate(custom) ? { custom_date: custom } : {}),
      });
    });
  }

  const due = computeDueDate(breedingRaw, gestation);
  if (!due) throw new ApiError(400, "Could not compute a due date from the given inputs.");
  const stub: HerdRecord = {
    id: "api-record",
    animal_id: "api",
    species: species ?? "other",
    breeding_date: breedingRaw,
    gestation_days: gestation,
    reminders,
    updated_at: "",
  };
  return {
    input: {
      ...(species ? { species } : {}),
      breeding_date: breedingRaw,
      gestation_days: gestation,
      reminders,
    },
    due_date: due,
    reminders: reminders.map((r) => ({ ...r, date: computeReminderDate(r, stub) })),
  };
}

/** Parse the GET form: `?species=cattle&breeding_date=2026-01-01&gestation_days=283`. */
export function herdInputFromQuery(searchParams: URLSearchParams): Record<string, unknown> {
  const input: Record<string, unknown> = {};
  const species = searchParams.get("species");
  if (species) input.species = species;
  const breeding = searchParams.get("breeding_date");
  if (breeding) input.breeding_date = breeding;
  const gestation = searchParams.get("gestation_days");
  if (gestation !== null) input.gestation_days = gestation;
  return input;
}

// ---------------------------------------------------------------------------
// Greenhouse — reservoir top-off calculation
// ---------------------------------------------------------------------------

import { computeTopOff, DEFAULT_RECIPE_EC, type TopOffInput, type TopOffPart } from "./topoffMath.ts";

export type TopOffCalculateResult = ReturnType<typeof computeTopOff>;

/**
 * Reservoir top-off math for agents — the same linear-blend engine as the
 * web greenhouse page. Stateless: it answers "what do I add right now"
 * (concentrate parts, plain water, or both) for a reservoir state the
 * caller supplies, and flags a dump-and-remix when the correction is
 * extreme. pH is context only — no pH dosing is computed.
 */
export function calculateTopOff(rawInput: unknown): TopOffCalculateResult {
  const input = (rawInput ?? {}) as Record<string, unknown>;
  if (typeof input !== "object" || Array.isArray(input)) {
    throw new ApiError(400, "Greenhouse top-off calculate expects a JSON object body.");
  }

  const volume = num(input.volume_l);
  if (volume === undefined || volume <= 0) throw new ApiError(400, "volume_l is required and must be a positive number (liters).");
  const ecNow = num(input.ec_now);
  if (ecNow === undefined || ecNow < 0) throw new ApiError(400, "ec_now is required and must be a number >= 0.");
  const ecTarget = num(input.ec_target);
  if (ecTarget === undefined || ecTarget <= 0) throw new ApiError(400, "ec_target is required and must be a positive number.");

  const topoff: TopOffInput = {
    volume_l: clamp(volume, 0.01, 1_000_000),
    ec_now: clamp(ecNow, 0, 20),
    ec_target: clamp(ecTarget, 0.01, 20),
  };

  if (input.recipe_ec !== undefined) {
    const v = num(input.recipe_ec);
    if (v === undefined || v <= 0) throw new ApiError(400, "recipe_ec must be a positive number.");
    topoff.recipe_ec = clamp(v, 0.01, 20);
  } else {
    topoff.recipe_ec = DEFAULT_RECIPE_EC;
  }

  if (input.parts !== undefined) {
    if (!Array.isArray(input.parts)) throw new ApiError(400, "parts must be an array of { name?, ml_per_gal } (max 3).");
    if (input.parts.length > 3) throw new ApiError(400, "parts is capped at 3 — a recipe has at most 3 concentrate parts.");
    topoff.parts = input.parts.map((raw, i): TopOffPart => {
      if (!raw || typeof raw !== "object") throw new ApiError(400, `parts[${i}] must be an object with ml_per_gal.`);
      const o = raw as Record<string, unknown>;
      const rate = num(o.ml_per_gal);
      if (rate === undefined || rate < 0) throw new ApiError(400, `parts[${i}].ml_per_gal must be a number >= 0.`);
      const name = typeof o.name === "string" && o.name.trim() ? o.name.trim() : undefined;
      return { ...(name ? { name } : {}), ml_per_gal: clamp(rate, 0, 1000) };
    });
  }

  for (const key of ["fill_volume_l", "capacity_l"] as const) {
    if (input[key] !== undefined) {
      const v = num(input[key]);
      if (v === undefined || v <= 0) throw new ApiError(400, `${key} must be a positive number (liters).`);
      topoff[key] = clamp(v, 0.01, 1_000_000);
    }
  }

  if (input.ph_now !== undefined) {
    const v = num(input.ph_now);
    if (v === undefined || v < 0 || v > 14) throw new ApiError(400, "ph_now must be a number between 0 and 14.");
    topoff.ph_now = v;
  }

  if (input.drift_suspected !== undefined) {
    if (typeof input.drift_suspected !== "boolean") throw new ApiError(400, "drift_suspected must be a boolean.");
    topoff.drift_suspected = input.drift_suspected;
  }

  return computeTopOff(topoff);
}

/** Parse the GET form: `?volume_l=40&ec_now=1.2&ec_target=1.8&parts=5,5,5&recipe_ec=2.0`. */
export function topoffInputFromQuery(searchParams: URLSearchParams): Record<string, unknown> {
  const input: Record<string, unknown> = {};
  for (const key of ["volume_l", "ec_now", "ec_target", "recipe_ec", "fill_volume_l", "capacity_l", "ph_now"] as const) {
    const v = searchParams.get(key);
    if (v !== null) input[key] = v;
  }
  const partsRaw = searchParams.get("parts");
  if (partsRaw) {
    input.parts = partsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((rate) => ({ ml_per_gal: rate }));
  }
  const drift = searchParams.get("drift_suspected");
  if (drift !== null) input.drift_suspected = drift === "1" || drift.toLowerCase() === "true";
  return input;
}

export function listFeedIngredients() {
  return { count: INGREDIENTS.length, ingredients: INGREDIENTS };
}

export function listFeedTargets() {
  return { count: TARGETS.length, targets: TARGETS };
}

// ---------------------------------------------------------------------------
// Crop variety library
// ---------------------------------------------------------------------------

export interface VarietySearchParams {
  q?: unknown;
  query?: unknown;
  category?: unknown;
  frost?: unknown;
  family?: unknown;
  limit?: unknown;
  offset?: unknown;
}

export function searchVarieties(params: VarietySearchParams) {
  const queryRaw = typeof params.q === "string" ? params.q : typeof params.query === "string" ? params.query : undefined;

  let category: CropCategory | "all" | undefined;
  if (params.category !== undefined && params.category !== null && params.category !== "") {
    if (typeof params.category !== "string" || !(CROP_CATEGORIES as readonly string[]).includes(params.category)) {
      throw new ApiError(400, `Unknown category '${String(params.category)}'. Known categories: ${CROP_CATEGORIES.join(", ")}.`);
    }
    category = params.category as CropCategory;
  }

  let frost: FrostHardiness | "all" | undefined;
  if (params.frost !== undefined && params.frost !== null && params.frost !== "") {
    if (typeof params.frost !== "string" || !(FROST_BANDS as readonly string[]).includes(params.frost)) {
      throw new ApiError(400, `Unknown frost band '${String(params.frost)}'. Known bands: ${FROST_BANDS.join(", ")}.`);
    }
    frost = params.frost as FrostHardiness;
  }

  const family = typeof params.family === "string" && params.family ? params.family : undefined;

  const limitRaw = num(params.limit);
  const offsetRaw = num(params.offset);
  if (params.limit !== undefined && limitRaw === undefined) throw new ApiError(400, "limit must be a number.");
  if (params.offset !== undefined && offsetRaw === undefined) throw new ApiError(400, "offset must be a number.");
  const limit = Math.min(200, Math.max(1, Math.floor(limitRaw ?? 50)));
  const offset = Math.max(0, Math.floor(offsetRaw ?? 0));

  const matches = filterCrops({ query: queryRaw, category, frost, family });
  const page = matches.slice(offset, offset + limit);
  return {
    total: matches.length,
    limit,
    offset,
    count: page.length,
    families: FAMILIES,
    varieties: page,
  };
}

export function getVarietyById(id: string) {
  const crop = getCrop(id);
  if (!crop) {
    throw new ApiError(404, `No variety with id '${id}'. Search GET /api/crops?q=... to find ids.`);
  }
  return crop;
}

export function varietyCount(): number {
  return crops.length;
}
