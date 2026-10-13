import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  analyzeRation,
  DEFAULT_FEED,
  effectiveTarget,
  INGREDIENT_BY_ID,
  INGREDIENTS,
  pearsonBalance,
  resolveFeed,
  TARGET_BY_ID,
  TARGETS,
} from "../src/lib/feedMath.ts";
import type { FarmState } from "../src/types/farm.ts";
import type { FeedIngredient, FeedTarget, RationLine, SavedRation } from "../src/types/feed.ts";

function approx(actual: number, expected: number, tol: number, label: string) {
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `${label}: expected ${expected} ±${tol}, got ${actual}`,
  );
}

function fixtureIng(id: string, cp: number): FeedIngredient {
  return {
    id,
    name: id,
    cp_pct: cp,
    me_kcal_kg: 0,
    lys_pct: 0,
    met_pct: 0,
    ca_pct: 0,
    total_p_pct: 0,
    avail_p_pct: 0,
    fiber_pct: 0,
    default_price_usd_per_lb: 0,
    cautions: "",
  };
}

const WIDE_TARGET: FeedTarget = {
  id: "wide",
  label: "Wide test bands",
  bird_class: "broiler",
  cp: { min: 0, max: null },
  me_kcal_kg: { min: 0, max: null },
  ca: { min: 0, max: null },
  avail_p: { min: 0, max: null },
  lys: { min: 0, max: null },
  met: { min: 0, max: null },
  fiber_max_pct: 100,
  default_intake_lb_per_day: 0.1,
};

function ration(lines: RationLine[], extra: Partial<SavedRation> = {}): SavedRation {
  return {
    id: "test-ration",
    name: "Test ration",
    target_id: "layer-production",
    lines,
    batch_lbs: 100,
    flock_size: 25,
    intake_lb_per_day: 0.24,
    updated_at: "",
    ...extra,
  };
}

function linePct(lines: RationLine[], id: string): number {
  return lines.find((l) => l.ingredient_id === id)?.pct ?? 0;
}

const FIXED_EXAMPLE_B: RationLine[] = [
  { ingredient_id: "limestone", pct: 9.0 },
  { ingredient_id: "dicalcium-phosphate", pct: 1.5 },
  { ingredient_id: "salt", pct: 0.4 },
  { ingredient_id: "vitamin-mineral-premix", pct: 0.6 },
];

describe("catalogs", () => {
  it("ships 11 ingredients and 6 target presets from spec §5", () => {
    assert.equal(INGREDIENTS.length, 11);
    assert.equal(TARGETS.length, 6);
    const layer = TARGET_BY_ID.get("layer-production");
    assert.ok(layer);
    assert.deepEqual(layer.ca, { min: 3.5, max: 4.5 });
    assert.equal(layer.default_intake_lb_per_day, 0.24);
    const corn = INGREDIENT_BY_ID.get("corn");
    assert.ok(corn);
    assert.equal(corn.cp_pct, 8.5);
    assert.equal(corn.me_kcal_kg, 3430);
  });
});

describe("Example A — pure Pearson square (fixture CP 9 / 44, target 18)", () => {
  const result = pearsonBalance(18, [], fixtureIng("corn", 9), fixtureIng("sbm", 44));

  it("splits 74.29 / 25.71", () => {
    assert.ok(result.ok);
    approx(linePct(result.lines, "corn"), 74.29, 0.01, "corn parts");
    approx(linePct(result.lines, "sbm"), 25.71, 0.01, "sbm parts");
  });

  it("analyzes back to exactly 18.00% CP", () => {
    assert.ok(result.ok);
    const fixtureCatalog = new Map([
      ["corn", fixtureIng("corn", 9)],
      ["sbm", fixtureIng("sbm", 44)],
    ]);
    const a = analyzeRation(
      ration(result.lines),
      { ...WIDE_TARGET, cp: { min: 17, max: 19 } },
      fixtureCatalog,
    );
    approx(a.nutrients.cp.value, 18.0, 0.01, "analyzed CP");
    assert.equal(a.nutrients.cp.state, "in");
    approx(a.total_pct, 100, 1e-9, "total pct");
  });
});

describe("Example B — full layer ration via auto-balance (catalog values)", () => {
  const corn = INGREDIENT_BY_ID.get("corn")!;
  const sbm = INGREDIENT_BY_ID.get("soybean-meal-44")!;
  const result = pearsonBalance(16.5, FIXED_EXAMPLE_B, corn, sbm);
  const layer = TARGET_BY_ID.get("layer-production")!;

  it("reserves fixed inclusions and squares the grain portion", () => {
    assert.ok(result.ok);
    approx(result.grain_share_pct, 88.5, 1e-9, "grain share");
    approx(result.required_grain_cp_pct, 18.64, 0.01, "required grain CP");
    approx(linePct(result.lines, "corn"), 63.22, 0.1, "corn %");
    approx(linePct(result.lines, "soybean-meal-44"), 25.28, 0.1, "SBM %");
    approx(linePct(result.lines, "limestone"), 9.0, 1e-9, "limestone %");
  });

  it("analyzes to CP 16.50, Ca 3.85, Lys 0.84, Avail P 0.38 — with the methionine warning", () => {
    assert.ok(result.ok);
    const a = analyzeRation(ration(result.lines), layer);
    approx(a.nutrients.cp.value, 16.5, 0.02, "CP");
    assert.equal(a.nutrients.cp.state, "in");
    approx(a.nutrients.ca.value, 3.85, 0.02, "Ca");
    assert.equal(a.nutrients.ca.state, "in");
    approx(a.nutrients.lys.value, 0.84, 0.02, "Lys");
    assert.equal(a.nutrients.lys.state, "in");
    approx(a.nutrients.avail_p.value, 0.38, 0.02, "avail P");
    approx(a.nutrients.met.value, 0.27, 0.02, "Met");
    assert.equal(a.nutrients.met.state, "low");
    assert.ok(
      a.warnings.some((w) => w.nutrient === "met"),
      "methionine-low warning must fire (it is the teaching warning)",
    );
    approx(a.nutrients.me.value, 2785, 5, "ME");
    assert.equal(a.nutrients.me.state, "low", "2,785 < 2,800 floor");
  });
});

describe("Example C — cost math on Example B (100 lb batch, 25 layers)", () => {
  it("batch $19.13, $0.046/bird/day, $1.15/day and $8.03/week for the flock", () => {
    const corn = INGREDIENT_BY_ID.get("corn")!;
    const sbm = INGREDIENT_BY_ID.get("soybean-meal-44")!;
    const result = pearsonBalance(16.5, FIXED_EXAMPLE_B, corn, sbm);
    assert.ok(result.ok);
    const a = analyzeRation(
      ration(result.lines, { batch_lbs: 100, flock_size: 25, intake_lb_per_day: 0.24 }),
      TARGET_BY_ID.get("layer-production")!,
    );
    const cornRow = a.batch.find((b) => b.ingredient_id === "corn");
    assert.ok(cornRow);
    approx(cornRow.lbs, 63.22, 0.1, "corn weigh-out");
    approx(cornRow.cost_usd, 9.48, 0.02, "corn cost");
    approx(a.batch_cost_usd, 19.13, 0.02, "batch cost");
    approx(a.cost_per_lb_usd, 0.191, 0.002, "cost per lb");
    approx(a.cost_per_bird_day_usd, 0.046, 0.001, "cost per bird-day");
    approx(a.flock_cost_day_usd, 1.15, 0.02, "flock cost/day");
    approx(a.flock_cost_week_usd, 8.03, 0.05, "flock cost/week");
  });
});

describe("Example D — warning vectors (80/20 corn/SBM vs broiler starter)", () => {
  const a = analyzeRation(
    ration([
      { ingredient_id: "corn", pct: 80 },
      { ingredient_id: "soybean-meal-44", pct: 20 },
    ]),
    TARGET_BY_ID.get("broiler-starter")!,
  );

  it("computes CP 15.60, Ca 0.07, Lys 0.75", () => {
    approx(a.nutrients.cp.value, 15.6, 0.02, "CP");
    approx(a.nutrients.ca.value, 0.07, 0.02, "Ca");
    approx(a.nutrients.lys.value, 0.75, 0.02, "Lys");
  });

  it("fires protein-low, Ca-low, lysine-low, and premix-missing — but no total warning", () => {
    const kinds = new Set(a.warnings.map((w) => w.nutrient));
    assert.ok(kinds.has("cp"), "protein-low");
    assert.ok(kinds.has("ca"), "calcium-low");
    assert.ok(kinds.has("lys"), "lysine-low");
    assert.ok(kinds.has("premix"), "premix-missing");
    assert.ok(!kinds.has("total"), "total is exactly 100% — no total warning");
  });
});

describe("Pearson edge cases", () => {
  const corn = INGREDIENT_BY_ID.get("corn")!;
  const sbm = INGREDIENT_BY_ID.get("soybean-meal-44")!;

  it("target above the protein source is a typed infeasible, never negative parts", () => {
    const r = pearsonBalance(50, [], corn, sbm);
    assert.ok(!r.ok);
    assert.equal(r.reason, "target_above_source");
  });

  it("target below the base is a typed infeasible", () => {
    const r = pearsonBalance(5, [], corn, sbm);
    assert.ok(!r.ok);
    assert.equal(r.reason, "target_below_base");
  });

  it("fixed inclusions at 100% leave no grain share", () => {
    const r = pearsonBalance(16.5, [{ ingredient_id: "limestone", pct: 100 }], corn, sbm);
    assert.ok(!r.ok);
    assert.equal(r.reason, "fixed_overflow");
  });

  it("target equal to base CP gives a 100/0 split", () => {
    const r = pearsonBalance(8.5, [], corn, sbm);
    assert.ok(r.ok);
    approx(linePct(r.lines, "corn"), 100, 1e-9, "corn");
    assert.equal(linePct(r.lines, "soybean-meal-44"), 0);
  });
});

describe("overrides and resolveFeed coercion", () => {
  it("a per-line nutrient override wins over the catalog", () => {
    const a = analyzeRation(
      ration([{ ingredient_id: "corn", pct: 100, cp_pct: 9.2 }]),
      WIDE_TARGET,
    );
    approx(a.nutrients.cp.value, 9.2, 1e-9, "overridden CP");
  });

  it("resolveFeed drops unknown ingredient ids and clamps a 140% line to 100", () => {
    const farm = {
      feed: {
        rations: [
          {
            id: "r1",
            name: "Test",
            target_id: "layer-production",
            lines: [
              { ingredient_id: "not-a-real-feed", pct: 50 },
              { ingredient_id: "corn", pct: 140 },
            ],
            batch_lbs: 100,
            flock_size: 10,
            intake_lb_per_day: 0.24,
            updated_at: "",
          },
        ],
      },
    } as unknown as FarmState;
    const resolved = resolveFeed(farm);
    assert.equal(resolved.rations.length, 1);
    assert.equal(resolved.rations[0].lines.length, 1);
    assert.equal(resolved.rations[0].lines[0].ingredient_id, "corn");
    assert.equal(resolved.rations[0].lines[0].pct, 100);
  });

  it("resolveFeed falls back to the default ration when the slice is absent", () => {
    const resolved = resolveFeed({} as FarmState);
    assert.equal(resolved.rations.length, 1);
    assert.equal(resolved.rations[0].id, DEFAULT_FEED.rations[0].id);
  });

  it("the default ration passes everything except the methionine teaching warning", () => {
    const r = DEFAULT_FEED.rations[0];
    const a = analyzeRation(r, effectiveTarget(r));
    assert.equal(a.nutrients.cp.state, "in");
    assert.equal(a.nutrients.ca.state, "in");
    assert.ok(a.warnings.some((w) => w.nutrient === "met"));
  });
});
