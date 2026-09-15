/**
 * Clean query-string sharing for a single succession calculation.
 * URL keys: crop, units, date. Interface fields use cropId.
 * Gateway trade view uses category (EngineTradeFilter) — not part of a share URL.
 * No accounts. The receiving grower opens /engine?… on their own machine.
 */

import { isEngineTradeFilter, type EngineTradeFilter } from "../types/crop.ts";

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