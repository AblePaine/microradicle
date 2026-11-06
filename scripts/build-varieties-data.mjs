#!/usr/bin/env node
/**
 * build-varieties-data.mjs — Variety Explorer seed-data generator
 * (Build 6, 2026-11-06). Source: OpenPlantDB (CC0 1.0),
 * github.com/cwfrazier1/openplantdb — data/plants.json.
 *
 * Usage:
 *   node scripts/build-varieties-data.mjs [--from <plants.json>]
 * Default fetches the upstream file; --from reads a local copy.
 *
 * Selection (spec: variety-explorer-build-spec-2026-11-06.md):
 * category = vegetable, cultivar epithet present in scientific_name,
 * days_to_maturity present. Outputs committed generated files:
 *   src/data/varieties/varieties-index.json  (slim card/list records)
 *   src/data/varieties/varieties-full.json   (detail records)
 * Rerun occasionally to refresh; the outputs are the runtime data —
 * no live external dependency at runtime.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const UPSTREAM =
  "https://raw.githubusercontent.com/cwfrazier1/openplantdb/main/data/plants.json";
const OUT_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "data",
  "varieties",
);

const args = process.argv.slice(2);
const fromIdx = args.indexOf("--from");
let raw;
if (fromIdx >= 0) {
  raw = readFileSync(args[fromIdx + 1], "utf8");
} else {
  const res = await fetch(UPSTREAM);
  if (!res.ok) throw new Error(`upstream fetch failed: ${res.status}`);
  raw = await res.text();
}
const parsed = JSON.parse(raw);
const records = Array.isArray(parsed) ? parsed : parsed.plants;

/**
 * Crop groups: ordered keyword rules over the (noisy, free-text)
 * upstream subcategory; first match wins, so specific groups are
 * checked before their parents (winter squash before squash, hot
 * pepper before pepper, sweet potato before root).
 */
const GROUP_RULES = [
  [/winter squash|pumpkin|calabaza/, "Winter Squash & Pumpkins"],
  [/tomato|tomatillo/, "Tomatoes"],
  [/superhot|hot pepper|hot chile|chile pepper|habanero|chili/, "Peppers — Hot"],
  [/pepper/, "Peppers"],
  [/sweet potato/, "Sweet Potatoes"],
  [/allium|onion|garlic|leek|bulbing/, "Onions & Alliums"],
  [/cucumber/, "Cucumbers"],
  [/melon|cucurbit/, "Melons & Cucurbits"],
  [/squash|gourd/, "Squash & Gourds"],
  [/bean|pea\b|legume|edamame|cowpea|peanut|soybean/, "Beans & Peas"],
  [/brassica|cabbage|broccoli|kale|collard|cauliflower|kohlrabi|brussels|cole crop|mustard/, "Brassicas & Cooking Greens"],
  [/root|carrot|beet|radish|turnip|parsnip|celeriac|rutabaga|potato|sunchoke|taro|celery root/, "Root Vegetables"],
  [/lettuce|leafy|greens|spinach|chard|arugula|chicory|cress|mizuna|salad/, "Lettuce & Salad Greens"],
  [/eggplant|nightshade|ground cherry/, "Eggplant & Nightshades"],
  [/corn|grain|popcorn|sorghum|amaranth/, "Corn & Grains"],
  [/okra/, "Okra"],
];
function cropGroupFor(subcategory, name) {
  const hay = `${subcategory} ${name}`.toLowerCase();
  for (const [re, group] of GROUP_RULES) {
    if (re.test(hay)) return group;
  }
  return "More Vegetables";
}

/**
 * Named-resistance extraction: disease labels that appear in a
 * sentence which itself speaks of resistance/tolerance, with a
 * negation guard ("without disease-resistance packages" earns
 * nothing). Complements the catalog code strings below.
 */
const DISEASE_PATTERNS = [
  [/powdery mildew/i, "Powdery mildew"],
  [/downy mildew/i, "Downy mildew"],
  [/fusarium wilt/i, "Fusarium wilt"],
  [/fusarium crown/i, "Fusarium crown & root rot"],
  [/verticillium/i, "Verticillium wilt"],
  [/anthracnose/i, "Anthracnose"],
  [/early blight/i, "Early blight"],
  [/late blight/i, "Late blight"],
  [/bacterial leaf spot/i, "Bacterial leaf spot"],
  [/bacterial spot/i, "Bacterial spot"],
  [/bacterial wilt/i, "Bacterial wilt"],
  [/nematode/i, "Nematodes"],
  [/tobacco mosaic/i, "Tobacco mosaic virus"],
  [/cucumber mosaic/i, "Cucumber mosaic virus"],
  [/tomato spotted wilt/i, "Tomato spotted wilt virus"],
  [/mosaic virus/i, "Mosaic virus"],
  [/gray leaf spot/i, "Gray leaf spot"],
  [/alternaria stem canker/i, "Alternaria stem canker"],
  [/leaf mold/i, "Leaf mold"],
  [/black rot/i, "Black rot"],
  [/clubroot/i, "Clubroot"],
  [/angular leaf spot/i, "Angular leaf spot"],
  [/\brust\b/i, "Rust"],
  [/\bscab\b/i, "Scab"],
];
const NEGATION = /\b(without|no known|not resistant|lacks?|susceptible|no disease|no modern)\b/i;

export function extractResistances(text) {
  if (!text || !/resist|toleran/i.test(text)) return [];
  const found = new Set();
  for (const sentence of text.split(/[.;]\s+/)) {
    if (!/resist|toleran/i.test(sentence)) continue;
    if (NEGATION.test(sentence)) continue;
    for (const [re, label] of DISEASE_PATTERNS) {
      if (re.test(sentence)) found.add(label);
    }
  }
  return [...found];
}

const KNOWN_CODES = new Set([
  "V", "F", "FF", "N", "T", "A", "As", "St", "EB", "LB", "PM", "DM",
  "CMV", "TSWV", "BLS", "An", "Rs", "For", "Tm", "Sw", "Mj", "Pc", "Cf",
]);
const CLUSTER_CODES = [
  "TSWV", "CMV", "BLS", "For", "FF", "As", "St", "EB", "LB", "PM", "DM",
  "An", "Rs", "Tm", "Sw", "Mj", "Pc", "Cf", "V", "F", "N", "T", "A",
];

/**
 * Conservative resistance-code extraction: only sentences that mention
 * resistance, only parenthesized code tokens from the known set, plus a
 * leading code cluster directly attached to "resistance" (e.g.
 * "VFFNTAs disease resistance package"). Absence stays absent.
 */
export function extractResistanceCodes(text) {
  if (!text || !/resist/i.test(text)) return [];
  const found = new Set();
  for (const sentence of text.split(/[.;]\s+/)) {
    if (!/resist/i.test(sentence)) continue;
    for (const m of sentence.matchAll(
      /\(([A-Za-z]{1,4}(?:\s*,\s*[A-Za-z]{1,4})*)\)/g,
    )) {
      for (const tok of m[1].split(/\s*,\s*/)) {
        if (KNOWN_CODES.has(tok)) found.add(tok);
      }
    }
    for (const m of sentence.matchAll(
      /\b([A-Z][A-Za-z]{1,12}?)\s+(?:disease\s+)?resistance/g,
    )) {
      let rest = m[1];
      while (rest.length > 0) {
        const hit = CLUSTER_CODES.find((c) => rest.startsWith(c));
        if (!hit) break;
        found.add(hit);
        rest = rest.slice(hit.length);
      }
    }
  }
  return [...found];
}

function stripParens(name) {
  return name.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

const selected = records.filter(
  (r) =>
    (r.category || "").toLowerCase() === "vegetable" &&
    (r.scientific_name || "").includes("'") &&
    r.days_to_maturity &&
    typeof r.days_to_maturity.max === "number",
);

const usedSlugs = new Set();
const index = [];
const full = [];
const unmapped = new Map();
for (const r of selected) {
  let slug = r.slug;
  if (usedSlugs.has(slug)) {
    let n = 2;
    while (usedSlugs.has(`${slug}-${n}`)) n += 1;
    slug = `${slug}-${n}`;
  }
  usedSlugs.add(slug);

  const epithet = (r.scientific_name.match(/'([^']+)'/) || [])[1] || "";
  const name = stripParens(r.common_name || epithet);
  const sub = (r.subcategory || "").toLowerCase();
  const group = cropGroupFor(sub, name);
  if (group === "More Vegetables") {
    unmapped.set(sub, (unmapped.get(sub) || 0) + 1);
  }
  const prose = `${(r.planting && r.planting.note) || ""} ${r.directions || ""}`;
  const resistanceCodes = extractResistanceCodes(prose);
  const resistances = extractResistances(prose);

  const entry = {
    slug,
    name,
    cropGroup: group,
    dtmMin: r.days_to_maturity.min ?? r.days_to_maturity.max,
    dtmMax: r.days_to_maturity.max,
    maturityFrom: r.maturity_from || "seed",
    resistanceCodes,
    resistances,
  };
  index.push(entry);
  full.push({
    ...entry,
    cultivar: epithet,
    scientificName: r.scientific_name,
    subcategory: r.subcategory,
    germinationDays: r.days_to_germination || null,
    germinationSoilTempF: r.germination_soil_temp_f || null,
    zones: r.usda_zones || null,
    spacingIn: r.spacing_in || null,
    heightIn: r.height_in || null,
    spreadIn: r.spread_in || null,
    sun: r.sun || null,
    water: r.water || null,
    frostTolerance: r.frost_tolerance || null,
    season: r.season || null,
    sowMethod: r.sow_method || null,
    plantingNote: (r.planting && r.planting.note) || null,
    directions: r.directions || null,
    sources: Array.isArray(r.sources) ? r.sources : [],
  });
}

index.sort((a, b) => a.name.localeCompare(b.name));
full.sort((a, b) => a.name.localeCompare(b.name));

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, "varieties-index.json"), JSON.stringify(index));
writeFileSync(join(OUT_DIR, "varieties-full.json"), JSON.stringify(full));

// Sitemap inclusion is handled by scripts/generate-sitemap.mjs
// (DYNAMIC_SOURCES["/variety"] reads varieties-index.json) on build.

const withRes = index.filter((v) => v.resistanceCodes.length > 0).length;
const withNamed = index.filter((v) => v.resistances.length > 0).length;
console.log(`selected: ${index.length} varieties`);
console.log(`with resistance codes: ${withRes}; with named resistances: ${withNamed}`);
import("node:fs").then(() => {
  const groups = {};
  for (const v of index) groups[v.cropGroup] = (groups[v.cropGroup] || 0) + 1;
  console.log("groups:", JSON.stringify(groups, null, 0));
});
if (unmapped.size > 0) {
  console.log("unmapped subcategories -> More Vegetables:");
  for (const [k, v] of [...unmapped.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v}`);
  }
}
const amelia = full.find((v) => v.slug === "amelia-tomato");
console.log("amelia resistance:", amelia ? amelia.resistanceCodes.join(",") : "NOT FOUND");
