/**
 * Seed & Variety Explorer — data + filtering (Build 6, 2026-11-06).
 *
 * Seed data: OpenPlantDB (CC0 1.0), generated into
 * src/data/varieties/ by scripts/build-varieties-data.mjs. Positioning
 * (kill-check 2026-10-05, Brad's ruling 2026-11-06): a gardener-facing
 * research explorer — modern/mobile UX over open data. No stock or
 * availability data, no crowdsourced reviews, no farm-OS conversion
 * pretense. Cornell VVfG is linked (reviews authority), never copied.
 */
import indexData from "../data/varieties/varieties-index.json" with { type: "json" };
import type { VarietyIndexEntry } from "../types/variety.ts";

export const VARIETY_INDEX = indexData as unknown as VarietyIndexEntry[];

export const VARIETY_COUNT = VARIETY_INDEX.length;

export const CROP_GROUPS: string[] = [
  ...new Set(VARIETY_INDEX.map((v) => v.cropGroup)),
].sort();

export interface DtmBand {
  id: string;
  label: string;
  test: (v: VarietyIndexEntry) => boolean;
}

/** Bands key on dtmMax — the "ready by" end of the source range. */
export const DTM_BANDS: DtmBand[] = [
  { id: "le60", label: "≤ 60 days", test: (v) => v.dtmMax <= 60 },
  { id: "d61-80", label: "61–80 days", test: (v) => v.dtmMax > 60 && v.dtmMax <= 80 },
  { id: "d81-100", label: "81–100 days", test: (v) => v.dtmMax > 80 && v.dtmMax <= 100 },
  { id: "gt100", label: "100+ days", test: (v) => v.dtmMax > 100 },
];

export interface VarietyFilter {
  query?: string;
  group?: string | "all";
  band?: string | "all";
  resistantOnly?: boolean;
}

export function hasResistance(v: VarietyIndexEntry): boolean {
  return v.resistanceCodes.length > 0 || v.resistances.length > 0;
}

export function filterVarieties(filter: VarietyFilter): VarietyIndexEntry[] {
  const q = (filter.query ?? "").trim().toLowerCase();
  const band = DTM_BANDS.find((b) => b.id === filter.band);
  return VARIETY_INDEX.filter((v) => {
    if (filter.group && filter.group !== "all" && v.cropGroup !== filter.group) return false;
    if (band && !band.test(v)) return false;
    if (filter.resistantOnly && !hasResistance(v)) return false;
    if (q) {
      const hay = `${v.name} ${v.cropGroup}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/** Catalog resistance code -> plain-language label (display only). */
export const RESISTANCE_CODE_LABELS: Record<string, string> = {
  V: "Verticillium wilt",
  F: "Fusarium wilt",
  FF: "Fusarium wilt, races 1–2",
  N: "Nematodes",
  T: "Tobacco mosaic virus",
  Tm: "Tomato mosaic virus",
  A: "Alternaria stem canker",
  As: "Alternaria stem canker",
  St: "Gray leaf spot",
  EB: "Early blight",
  LB: "Late blight",
  PM: "Powdery mildew",
  DM: "Downy mildew",
  CMV: "Cucumber mosaic virus",
  TSWV: "Tomato spotted wilt virus",
  BLS: "Bacterial leaf spot",
  An: "Anthracnose",
  Rs: "Bacterial wilt",
  For: "Fusarium crown & root rot",
  Cf: "Leaf mold",
  Sw: "Gray leaf spot",
  Mj: "Root-knot nematodes",
  Pc: "Phytophthora",
};

export function resistanceLabel(code: string): string {
  return RESISTANCE_CODE_LABELS[code] ?? code;
}

/**
 * Seeds Now affiliate tag (Refersion) — empty until Brad enrolls.
 * Links render untagged while this is ""; affiliate is a secondary
 * surface by design (kill-check: the big vendors pay nothing).
 */
export const SEEDS_NOW_AFFILIATE_TAG = "";

export function seedsNowSearchUrl(varietyName: string): string {
  const base = `https://www.seedsnow.com/search?q=${encodeURIComponent(varietyName)}`;
  return SEEDS_NOW_AFFILIATE_TAG
    ? `${base}&ref=${encodeURIComponent(SEEDS_NOW_AFFILIATE_TAG)}`
    : base;
}

/** Cornell's gardener-review database (link-out only; © Cornell). */
export const CORNELL_VVFG_URL = "https://vegvariety.cce.cornell.edu/";
