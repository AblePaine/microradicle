import ingredientCatalog from "../data/feed/ingredients.json" with { type: "json" };
import targetCatalog from "../data/feed/targets.json" with { type: "json" };
import type { FarmState } from "../types/farm";
import type {
  FeedBand,
  FeedIngredient,
  FeedNutrientField,
  FeedSettings,
  FeedTarget,
  FeedWarning,
  NutrientKey,
  PearsonResult,
  RationAnalysis,
  RationLine,
  SavedRation,
} from "../types/feed";
import { round2 } from "./soil-chemistry.ts";

export const INGREDIENTS: FeedIngredient[] = ingredientCatalog as FeedIngredient[];
export const INGREDIENT_BY_ID: Map<string, FeedIngredient> = new Map(INGREDIENTS.map((i) => [i.id, i]));
export const TARGETS: FeedTarget[] = targetCatalog as FeedTarget[];
export const TARGET_BY_ID: Map<string, FeedTarget> = new Map(TARGETS.map((t) => [t.id, t]));

export const SALT_ID = "salt";
export const PREMIX_ID = "vitamin-mineral-premix";
export const DEFAULT_TARGET_ID = "layer-production";

/**
 * Starter ration = spec Example B (layer, corn/soy via Pearson with fixed
 * minerals reserved). It analyzes in-band on everything except methionine —
 * the module opens teaching the warning panel instead of hiding it.
 */
export const DEFAULT_FEED: FeedSettings = {
  rations: [
    {
      id: "ration-layer-example",
      name: "Layer ration — corn/soy example",
      target_id: DEFAULT_TARGET_ID,
      lines: [
        { ingredient_id: "corn", pct: 63.22 },
        { ingredient_id: "soybean-meal-44", pct: 25.28 },
        { ingredient_id: "limestone", pct: 9.0 },
        { ingredient_id: "dicalcium-phosphate", pct: 1.5 },
        { ingredient_id: "salt", pct: 0.4 },
        { ingredient_id: "vitamin-mineral-premix", pct: 0.6 },
      ],
      batch_lbs: 100,
      flock_size: 25,
      intake_lb_per_day: 0.24,
      updated_at: "2026-10-13T00:00:00.000Z",
    },
  ],
};

export function cloneDefaultFeed(): FeedSettings {
  return {
    rations: DEFAULT_FEED.rations.map((r) => ({ ...r, lines: r.lines.map((l) => ({ ...l })) })),
  };
}

const NUTRIENT_FIELDS: Record<NutrientKey, FeedNutrientField> = {
  cp: "cp_pct",
  me: "me_kcal_kg",
  lys: "lys_pct",
  met: "met_pct",
  ca: "ca_pct",
  total_p: "total_p_pct",
  avail_p: "avail_p_pct",
  fiber: "fiber_pct",
};

const NUTRIENT_KEYS = Object.keys(NUTRIENT_FIELDS) as NutrientKey[];

/** The preset with the ration's per-band edits merged over it (spec §3.1). */
export function effectiveTarget(ration: SavedRation): FeedTarget {
  const preset = TARGET_BY_ID.get(ration.target_id) ?? TARGET_BY_ID.get(DEFAULT_TARGET_ID)!;
  const o = ration.target_overrides;
  if (!o) return preset;
  const band = (key: NutrientKey, fallback: FeedBand): FeedBand => {
    const b = o[key];
    if (!b || typeof b.min !== "number" || !Number.isFinite(b.min)) return fallback;
    return { min: b.min, max: typeof b.max === "number" && Number.isFinite(b.max) ? b.max : null };
  };
  return {
    ...preset,
    cp: band("cp", preset.cp),
    me_kcal_kg: band("me", preset.me_kcal_kg),
    ca: band("ca", preset.ca),
    avail_p: band("avail_p", preset.avail_p),
    lys: band("lys", preset.lys),
    met: band("met", preset.met),
    // The fiber override carries its ceiling in `max` (the UI's fiber-ceiling field).
    fiber_max_pct: typeof o.fiber?.max === "number" ? o.fiber.max : preset.fiber_max_pct,
  };
}

function fmt(n: number): string {
  return String(round2(n));
}

function bandLabel(band: FeedBand): string {
  return band.max == null ? `≥${fmt(band.min)}` : `${fmt(band.min)}–${fmt(band.max)}`;
}

function bandState(value: number, band: FeedBand): "in" | "low" | "high" {
  if (value < band.min) return "low";
  if (band.max != null && value > band.max) return "high";
  return "in";
}

function missSeverity(value: number, band: FeedBand): FeedWarning["severity"] {
  const frac =
    value < band.min
      ? band.min > 0
        ? (band.min - value) / band.min
        : 1
      : band.max != null && band.max > 0
        ? (value - band.max) / band.max
        : 0;
  if (frac <= 0.05) return "info";
  if (frac <= 0.2) return "warn";
  return "alert";
}

function effectiveNutrient(
  line: RationLine,
  key: NutrientKey,
  catalog: Map<string, FeedIngredient>,
): number {
  const field = NUTRIENT_FIELDS[key];
  const override = (line as unknown as Partial<Record<string, number>>)[field];
  if (typeof override === "number" && Number.isFinite(override)) return override;
  return catalog.get(line.ingredient_id)?.[field] ?? 0;
}

function effectivePrice(line: RationLine, catalog: Map<string, FeedIngredient>): number {
  if (typeof line.price_usd_per_lb === "number" && Number.isFinite(line.price_usd_per_lb)) {
    return line.price_usd_per_lb;
  }
  return catalog.get(line.ingredient_id)?.default_price_usd_per_lb ?? 0;
}

function lineName(line: RationLine, catalog: Map<string, FeedIngredient>): string {
  return line.name ?? catalog.get(line.ingredient_id)?.name ?? line.ingredient_id;
}

export function analyzeRation(
  ration: SavedRation,
  target: FeedTarget,
  catalog: Map<string, FeedIngredient> = INGREDIENT_BY_ID,
): RationAnalysis {
  const totals = {} as Record<NutrientKey, number>;
  for (const key of NUTRIENT_KEYS) totals[key] = 0;
  let total_pct = 0;
  let salt_pct = 0;
  let premix_pct = 0;
  const batch: RationAnalysis["batch"] = [];
  let batch_cost = 0;

  for (const line of ration.lines) {
    const pct = Number.isFinite(line.pct) ? line.pct : 0;
    total_pct += pct;
    if (line.ingredient_id === SALT_ID) salt_pct += pct;
    if (line.ingredient_id === PREMIX_ID) premix_pct += pct;
    for (const key of NUTRIENT_KEYS) {
      totals[key] += (pct / 100) * effectiveNutrient(line, key, catalog);
    }
    const lbs = (pct / 100) * ration.batch_lbs;
    const cost = lbs * effectivePrice(line, catalog);
    batch_cost += cost;
    batch.push({ ingredient_id: line.ingredient_id, name: lineName(line, catalog), lbs, cost_usd: cost });
  }

  const nutrients = {} as RationAnalysis["nutrients"];
  const bandFor = (key: NutrientKey): FeedBand | null => {
    switch (key) {
      case "cp":
        return target.cp;
      case "me":
        return target.me_kcal_kg;
      case "lys":
        return target.lys;
      case "met":
        return target.met;
      case "ca":
        return target.ca;
      case "avail_p":
        return target.avail_p;
      default:
        return null;
    }
  };
  for (const key of NUTRIENT_KEYS) {
    const value = totals[key];
    if (key === "fiber") {
      nutrients[key] = { value, state: value > target.fiber_max_pct ? "high" : "in" };
    } else if (key === "total_p") {
      // No total-P band in the target table; it is judged through the Ca:P ratio instead.
      nutrients[key] = { value, state: "in" };
    } else {
      const band = bandFor(key)!;
      nutrients[key] = { value, state: bandState(value, band) };
    }
  }

  const cost_per_lb = ration.batch_lbs > 0 ? batch_cost / ration.batch_lbs : 0;
  const cost_per_bird_day = cost_per_lb * ration.intake_lb_per_day;
  const analysis: RationAnalysis = {
    total_pct,
    nutrients,
    ca_to_p_ratio: totals.total_p > 0 ? totals.ca / totals.total_p : totals.ca > 0 ? Infinity : 0,
    salt_pct,
    premix_pct,
    batch,
    batch_cost_usd: batch_cost,
    cost_per_lb_usd: cost_per_lb,
    cost_per_bird_day_usd: cost_per_bird_day,
    flock_cost_day_usd: cost_per_bird_day * ration.flock_size,
    flock_cost_week_usd: cost_per_bird_day * ration.flock_size * 7,
    warnings: [],
  };
  analysis.warnings = warningsFor(analysis, target);
  return analysis;
}

export function warningsFor(analysis: RationAnalysis, target: FeedTarget): FeedWarning[] {
  const out: FeedWarning[] = [];
  const n = analysis.nutrients;
  const push = (w: FeedWarning) => out.push(w);

  if (Math.abs(analysis.total_pct - 100) > 0.5) {
    const diff = analysis.total_pct - 100;
    push({
      nutrient: "total",
      severity: "alert",
      message: `Lines total ${fmt(analysis.total_pct)}% — ${diff > 0 ? "over" : "under"} 100% by ${fmt(Math.abs(diff))}%. The panel below is computed on the actual total; fix the blend before trusting it as a finished ration.`,
    });
  }

  if (n.cp.state === "low") {
    push({
      nutrient: "cp",
      severity: missSeverity(n.cp.value, target.cp),
      message: `CP ${fmt(n.cp.value)}% vs ${bandLabel(target.cp)}% target — add protein meal or cut grain.`,
    });
  } else if (n.cp.state === "high") {
    push({
      nutrient: "cp",
      severity: missSeverity(n.cp.value, target.cp),
      message: `CP ${fmt(n.cp.value)}% vs ${bandLabel(target.cp)}% target — excess protein is wasted money and extra nitrogen in the litter; cut the meal or add grain.`,
    });
  }

  if (n.me.state === "low") {
    push({
      nutrient: "me",
      severity: missSeverity(n.me.value, target.me_kcal_kg),
      message: `Energy ${fmt(n.me.value)} kcal/kg vs ${bandLabel(target.me_kcal_kg)} — high-fiber ingredients (oats, alfalfa) dilute energy; raise the corn/wheat share.`,
    });
  } else if (n.me.state === "high") {
    push({
      nutrient: "me",
      severity: missSeverity(n.me.value, target.me_kcal_kg),
      message: `Energy ${fmt(n.me.value)} kcal/kg vs ${bandLabel(target.me_kcal_kg)} — hotter than the class needs; birds eat less of a hot ration and can under-consume protein and minerals.`,
    });
  }

  if (n.lys.state === "low") {
    push({
      nutrient: "lys",
      severity: missSeverity(n.lys.value, target.lys),
      message: `Lysine ${fmt(n.lys.value)}% vs ${fmt(target.lys.min)}% floor — grains are lysine-poor; soybean meal or fish meal is the fix.`,
    });
  }

  if (n.met.state === "low") {
    push({
      nutrient: "met",
      severity: missSeverity(n.met.value, target.met),
      message: `Methionine ${fmt(n.met.value)}% vs ${fmt(target.met.min)}% floor — corn-soy rations usually land here; add fish meal or a methionine-carrying premix.`,
    });
  }

  if (n.ca.state === "low") {
    push({
      nutrient: "ca",
      severity: missSeverity(n.ca.value, target.ca),
      message:
        target.bird_class === "layer"
          ? `Calcium ${fmt(n.ca.value)}% vs ${bandLabel(target.ca)}% — layers need ~4% Ca; raise limestone/oyster shell and expect thin shells below 3.5%.`
          : `Calcium ${fmt(n.ca.value)}% vs ${bandLabel(target.ca)}% — add limestone or dicalcium phosphate.`,
    });
  } else if (n.ca.state === "high") {
    if (target.bird_class !== "layer" && n.ca.value > 1.3) {
      push({
        nutrient: "ca",
        severity: "alert",
        message: `Calcium ${fmt(n.ca.value)}% in a non-layer ration — high Ca damages kidneys and ties up phosphorus; cut the limestone.`,
      });
    } else {
      push({
        nutrient: "ca",
        severity: missSeverity(n.ca.value, target.ca),
        message: `Calcium ${fmt(n.ca.value)}% vs ${bandLabel(target.ca)}% — over the band; trim limestone/oyster shell.`,
      });
    }
  }

  if (n.avail_p.state === "low") {
    push({
      nutrient: "avail_p",
      severity: missSeverity(n.avail_p.value, target.avail_p),
      message: `Available P ${fmt(n.avail_p.value)}% vs ${fmt(target.avail_p.min)}% floor — plant phosphorus is only about a third available (phytate); dicalcium phosphate is the reliable fix.`,
    });
  }

  const ratio = analysis.ca_to_p_ratio;
  if (ratio < 1.5) {
    push({
      nutrient: "ca_to_p",
      severity: "warn",
      message: `Ca:P ratio ${fmt(ratio)}:1 — below the 1.5:1 floor, phosphorus crowds out calcium use; raise limestone or trim the P source.`,
    });
  } else if (target.bird_class !== "layer" && ratio > 8) {
    push({
      nutrient: "ca_to_p",
      severity: "warn",
      message: `Ca:P ratio ${fmt(ratio)}:1 in a non-layer ration — far past what growing birds use; the excess Ca is tying up phosphorus and trace minerals.`,
    });
  }

  if (n.fiber.state === "high") {
    push({
      nutrient: "fiber",
      severity: "warn",
      message: `Crude fiber ${fmt(n.fiber.value)}% vs ${fmt(target.fiber_max_pct)}% ceiling — look at the oats/alfalfa share; fiber is diluting everything else.`,
    });
  }

  if (analysis.premix_pct <= 0) {
    push({
      nutrient: "premix",
      severity: "warn",
      message:
        "No vitamin/mineral premix — a grain+meal mix alone is short on vitamins D, B12, Mn, and Se. Add the label rate (typically 0.5–1.0%).",
    });
  }

  if (analysis.salt_pct < 0.25 || analysis.salt_pct > 0.5) {
    push({
      nutrient: "salt",
      severity: "warn",
      message:
        analysis.salt_pct < 0.25
          ? `Salt ${fmt(analysis.salt_pct)}% — below the 0.25–0.5% band; too little salt cuts intake and growth.`
          : `Salt ${fmt(analysis.salt_pct)}% — above the 0.25–0.5% band; excess salt wets litter and can poison birds.`,
    });
  }

  return out;
}

/**
 * Pearson-square assist (spec §5.3): reserve the fixed lines, recompute the
 * protein concentration the remaining grain portion must carry, and square
 * the two chosen ingredients for that portion.
 */
export function pearsonBalance(
  target_cp_pct: number,
  fixed_lines: RationLine[],
  base: FeedIngredient,
  protein_source: FeedIngredient,
): PearsonResult {
  const fixed_total = fixed_lines.reduce((s, l) => s + (Number.isFinite(l.pct) ? l.pct : 0), 0);
  if (fixed_total >= 100) {
    return {
      ok: false,
      reason: "fixed_overflow",
      message: `Fixed inclusions already total ${fmt(fixed_total)}% — nothing left for grain. Lower the mineral lines first.`,
    };
  }
  const grain_share = 100 - fixed_total;
  const fixed_cp_points = fixed_lines.reduce((s, l) => {
    const cp = typeof l.cp_pct === "number" ? l.cp_pct : (INGREDIENT_BY_ID.get(l.ingredient_id)?.cp_pct ?? 0);
    return s + ((Number.isFinite(l.pct) ? l.pct : 0) / 100) * cp;
  }, 0);
  const required_grain_cp = ((target_cp_pct - fixed_cp_points) * 100) / grain_share;

  const lo = Math.min(base.cp_pct, protein_source.cp_pct);
  const hi = Math.max(base.cp_pct, protein_source.cp_pct);
  if (base.cp_pct === protein_source.cp_pct) {
    if (Math.abs(required_grain_cp - base.cp_pct) < 1e-9) {
      return {
        ok: true,
        lines: [
          ...fixed_lines.map((l) => ({ ...l })),
          { ingredient_id: base.id, pct: grain_share },
        ],
        grain_share_pct: grain_share,
        required_grain_cp_pct: required_grain_cp,
      };
    }
    return {
      ok: false,
      reason: "same_cp",
      message: `Both ingredients carry ${fmt(base.cp_pct)}% CP — a square between equals can't move protein. Pick a stronger protein source.`,
    };
  }
  if (required_grain_cp < lo) {
    return {
      ok: false,
      reason: "target_below_base",
      message: `The grain portion would need ${fmt(required_grain_cp)}% CP, below ${base.name} itself (${fmt(base.cp_pct)}%). Raise the target CP or add a lower-protein filler to the square.`,
    };
  }
  if (required_grain_cp > hi) {
    return {
      ok: false,
      reason: "target_above_source",
      message: `The grain portion would need ${fmt(required_grain_cp)}% CP, above ${protein_source.name} itself (${fmt(protein_source.cp_pct)}%). Lower the target CP, cut the fixed inclusions, or pick a stronger protein source.`,
    };
  }

  const base_parts = Math.abs(protein_source.cp_pct - required_grain_cp);
  const source_parts = Math.abs(required_grain_cp - base.cp_pct);
  const total_parts = base_parts + source_parts;
  const base_pct = (grain_share * base_parts) / total_parts;
  const source_pct = (grain_share * source_parts) / total_parts;
  const lines: RationLine[] = fixed_lines.map((l) => ({ ...l }));
  if (base_pct > 1e-9) lines.push({ ingredient_id: base.id, pct: base_pct });
  if (source_pct > 1e-9) lines.push({ ingredient_id: protein_source.id, pct: source_pct });
  return { ok: true, lines, grain_share_pct: grain_share, required_grain_cp_pct: required_grain_cp };
}

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

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function coerceLine(raw: unknown): RationLine | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.ingredient_id === "string" ? o.ingredient_id : "";
  if (!id) return null;
  const name = typeof o.name === "string" && o.name.trim() ? o.name : undefined;
  if (!INGREDIENT_BY_ID.has(id) && !name) return null; // unknown catalog id with no custom identity
  const pctRaw = typeof o.pct === "number" && Number.isFinite(o.pct) ? o.pct : 0;
  const line: RationLine = { ingredient_id: id, pct: clamp(pctRaw, 0, 100) };
  if (name) line.name = name;
  for (const f of OVERRIDE_NUM_FIELDS) {
    const v = o[f];
    if (typeof v === "number" && Number.isFinite(v)) {
      line[f] = f === "me_kcal_kg" ? clamp(v, 0, 6000) : f === "price_usd_per_lb" ? clamp(v, 0, 100) : clamp(v, 0, 100);
    }
  }
  return line;
}

function coerceBand(raw: unknown): FeedBand | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.min !== "number" || !Number.isFinite(o.min)) return null;
  return { min: o.min, max: typeof o.max === "number" && Number.isFinite(o.max) ? o.max : null };
}

function coerceRation(raw: unknown, index: number): SavedRation | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const target_id =
    typeof o.target_id === "string" && TARGET_BY_ID.has(o.target_id) ? o.target_id : DEFAULT_TARGET_ID;
  const target = TARGET_BY_ID.get(target_id)!;
  const lines = Array.isArray(o.lines)
    ? o.lines.map(coerceLine).filter((l): l is RationLine => l !== null)
    : [];
  const overrides: SavedRation["target_overrides"] = {};
  if (o.target_overrides && typeof o.target_overrides === "object") {
    for (const key of NUTRIENT_KEYS) {
      const b = coerceBand((o.target_overrides as Record<string, unknown>)[key]);
      if (b) overrides[key] = b;
    }
  }
  return {
    id: typeof o.id === "string" && o.id ? o.id : `ration-${index + 1}`,
    name: typeof o.name === "string" && o.name.trim() ? o.name : `Ration ${index + 1}`,
    target_id,
    ...(Object.keys(overrides).length ? { target_overrides: overrides } : {}),
    lines,
    batch_lbs:
      typeof o.batch_lbs === "number" && Number.isFinite(o.batch_lbs) ? clamp(o.batch_lbs, 1, 2000) : 100,
    flock_size:
      typeof o.flock_size === "number" && Number.isFinite(o.flock_size)
        ? Math.round(clamp(o.flock_size, 0, 100000))
        : 25,
    intake_lb_per_day:
      typeof o.intake_lb_per_day === "number" && Number.isFinite(o.intake_lb_per_day)
        ? clamp(o.intake_lb_per_day, 0.01, 2)
        : target.default_intake_lb_per_day,
    updated_at: typeof o.updated_at === "string" ? o.updated_at : "",
  };
}

export function resolveFeed(farm: FarmState): FeedSettings {
  const raw = farm.feed;
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.rations)) return cloneDefaultFeed();
  const rations = raw.rations
    .map((r, i) => coerceRation(r, i))
    .filter((r): r is SavedRation => r !== null);
  return { rations: rations.length ? rations : cloneDefaultFeed().rations };
}
