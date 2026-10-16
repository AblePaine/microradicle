/**
 * Clean query-string sharing for a single succession calculation.
 * URL keys: crop, units, date. Interface fields use cropId.
 * Gateway trade view uses category (EngineTradeFilter) — not part of a share URL.
 * No accounts. The receiving grower opens /engine?… on their own machine.
 */

import { isEngineTradeFilter, type EngineTradeFilter } from "../types/crop.ts";
import type { RationLine } from "../types/feed.ts";

export interface SharedSuccessionParams {
  cropId?: string;
  units?: number;
  date?: string;
}

export type EngineSearch = {
  crop?: string;
  units?: number;
  date?: string;
  category?: EngineTradeFilter;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function finitePositiveInt(n: number): number | undefined {
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.round(n);
}

export function encodeSuccessionToParams(params: SharedSuccessionParams): string {
  const search = new URLSearchParams();
  if (params.cropId) search.set("crop", params.cropId);
  const units = params.units != null ? finitePositiveInt(params.units) : undefined;
  if (units) search.set("units", units.toString());
  if (params.date && ISO_DATE.test(params.date)) search.set("date", params.date);
  return search.toString();
}

export function decodeSuccessionFromParams(searchStr: string): SharedSuccessionParams {
  const raw = searchStr.startsWith("?") ? searchStr.slice(1) : searchStr;
  const search = new URLSearchParams(raw);
  const unitsRaw = search.get("units");
  const parsed = unitsRaw ? parseInt(unitsRaw, 10) : undefined;
  const date = search.get("date") || undefined;
  return {
    cropId: search.get("crop") || undefined,
    units: parsed != null ? finitePositiveInt(parsed) : undefined,
    date: date && ISO_DATE.test(date) ? date : undefined,
  };
}

/** Map TanStack search / unknown records onto the share contract. */
export function decodeSuccessionFromUnknown(search: Record<string, unknown>): SharedSuccessionParams {
  const params = new URLSearchParams();
  const crop = search.crop ?? search.cropId;
  if (typeof crop === "string" && crop) params.set("crop", crop);
  if (search.units != null && search.units !== "") params.set("units", String(search.units));
  if (typeof search.date === "string" && search.date) params.set("date", search.date);
  return decodeSuccessionFromParams(params.toString());
}

export function parseEngineCategory(raw: unknown): EngineTradeFilter | undefined {
  if (typeof raw !== "string") return undefined;
  const value = raw.trim();
  return isEngineTradeFilter(value) ? value : undefined;
}

export function paramsFromSuccession(s: {
  crop_id: string;
  target_units: number;
  target_harvest_date: string;
}): SharedSuccessionParams {
  return {
    cropId: s.crop_id,
    units: finitePositiveInt(s.target_units),
    date: s.target_harvest_date,
  };
}

export function successionShareHref(params: SharedSuccessionParams, origin = ""): string {
  const q = encodeSuccessionToParams(params);
  const path = q ? `/engine?${q}` : "/engine";
  return origin ? `${origin}${path}` : path;
}

export function engineSearchFromParams(params: SharedSuccessionParams): {
  crop?: string;
  units?: number;
  date?: string;
} {
  return {
    crop: params.cropId,
    units: params.units,
    date: params.date,
  };
}

/** Full /engine search: share keys plus optional gateway category. */
export function engineSearchFromUnknown(search: Record<string, unknown>): EngineSearch {
  return {
    ...engineSearchFromParams(decodeSuccessionFromUnknown(search)),
    category: parseEngineCategory(search.category),
  };
}
/* ------------------------------------------------------------------ */
/* Feed Studio ration share state (/feed/<id>?target=…&lines=…)        */
/*                                                                     */
/* Plain catalog lines encode readably as `id:pct,id:pct`. A ration    */
/* whose lines carry custom names or nutrient/price overrides falls    */
/* back to a base64url JSON payload (`lines64`) so a shared link never  */
/* silently drops an override — the recipient sees the same ration.    */
/* ------------------------------------------------------------------ */

export interface SharedRationParams {
  targetId?: string;
  lines?: RationLine[];
  batchLbs?: number;
  flockSize?: number;
  intakeLbPerDay?: number;
  name?: string;
}

const RATION_LINE_OVERRIDE_KEYS = [
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

function isPlainCatalogLine(line: RationLine): boolean {
  if (line.name) return false;
  return RATION_LINE_OVERRIDE_KEYS.every((k) => line[k] === undefined);
}

function formatPct(pct: number): string {
  return String(Math.round(pct * 100) / 100);
}

function encodeLines64(lines: RationLine[]): string {
  const bytes = new TextEncoder().encode(JSON.stringify(lines));
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeLines64(raw: string): RationLine[] | undefined {
  try {
    const b64 = raw.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!Array.isArray(parsed)) return undefined;
    const lines: RationLine[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") return undefined;
      const o = item as Record<string, unknown>;
      if (typeof o.ingredient_id !== "string" || typeof o.pct !== "number" || !Number.isFinite(o.pct)) return undefined;
      lines.push(item as RationLine);
    }
    return lines.length ? lines : undefined;
  } catch {
    return undefined;
  }
}

function parsePlainLines(raw: string): RationLine[] | undefined {
  const lines: RationLine[] = [];
  for (const part of raw.split(",")) {
    const [id, pctRaw] = part.split(":");
    const pct = Number(pctRaw);
    if (!id || !Number.isFinite(pct)) continue;
    lines.push({ ingredient_id: id, pct });
  }
  return lines.length ? lines : undefined;
}

export function encodeRationToParams(p: SharedRationParams): URLSearchParams {
  const sp = new URLSearchParams();
  if (p.targetId) sp.set("target", p.targetId);
  if (p.lines && p.lines.length) {
    if (p.lines.every(isPlainCatalogLine)) {
      sp.set("lines", p.lines.map((l) => `${l.ingredient_id}:${formatPct(l.pct)}`).join(","));
    } else {
      sp.set("lines64", encodeLines64(p.lines));
    }
  }
  if (p.batchLbs !== undefined && Number.isFinite(p.batchLbs)) sp.set("batch", String(p.batchLbs));
  if (p.flockSize !== undefined && Number.isFinite(p.flockSize)) sp.set("flock", String(p.flockSize));
  if (p.intakeLbPerDay !== undefined && Number.isFinite(p.intakeLbPerDay)) sp.set("intake", String(p.intakeLbPerDay));
  if (p.name) sp.set("name", p.name);
  return sp;
}

export function decodeRationFromParams(sp: URLSearchParams): SharedRationParams {
  const out: SharedRationParams = {};
  const target = sp.get("target");
  if (target) out.targetId = target;
  const lines64 = sp.get("lines64");
  const plain = sp.get("lines");
  const lines = lines64 ? decodeLines64(lines64) : plain ? parsePlainLines(plain) : undefined;
  if (lines) out.lines = lines;
  const batch = sp.get("batch");
  if (batch !== null && batch !== "" && Number.isFinite(Number(batch))) out.batchLbs = Number(batch);
  const flock = sp.get("flock");
  if (flock !== null && flock !== "" && Number.isFinite(Number(flock))) out.flockSize = Number(flock);
  const intake = sp.get("intake");
  if (intake !== null && intake !== "" && Number.isFinite(Number(intake))) out.intakeLbPerDay = Number(intake);
  const name = sp.get("name");
  if (name) out.name = name;
  return out;
}

/** TanStack Router validateSearch input -> ration params (validateSearch for /feed/$slug). */
export function decodeRationFromUnknown(search: Record<string, unknown>): SharedRationParams {
  const sp = new URLSearchParams();
  for (const key of ["target", "lines", "lines64", "batch", "flock", "intake", "name"] as const) {
    const value = search[key];
    if (value === undefined || value === null) continue;
    sp.set(key, String(value));
  }
  return decodeRationFromParams(sp);
}

export function paramsFromRation(ration: {
  target_id: string;
  lines: RationLine[];
  batch_lbs: number;
  flock_size: number;
  intake_lb_per_day: number;
  name: string;
}): SharedRationParams {
  return {
    targetId: ration.target_id,
    lines: ration.lines,
    batchLbs: ration.batch_lbs,
    flockSize: ration.flock_size,
    intakeLbPerDay: ration.intake_lb_per_day,
    name: ration.name,
  };
}

export function feedShareHref(rationId: string, params: SharedRationParams, origin = ""): string {
  const qs = encodeRationToParams(params).toString();
  return `${origin}/feed/${encodeURIComponent(rationId)}${qs ? `?${qs}` : ""}`;
}
