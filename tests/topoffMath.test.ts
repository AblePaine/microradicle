import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeTopOff, DEFAULT_RECIPE_EC, ppmFromEc } from "../src/lib/topoffMath.ts";

function approx(actual: number | null, expected: number, eps = 1e-9): void {
  assert.ok(actual !== null && Math.abs(actual - expected) < eps, `expected ${actual} ≈ ${expected}`);
}

const PARTS_3X5 = [{ ml_per_gal: 5 }, { ml_per_gal: 5 }, { ml_per_gal: 5 }];

describe("hand-check case 1 — raise with concentrates, no water", () => {
  // 40 L at EC 1.2, target 1.8, recipe full-strength EC 2.0.
  // c = V(Et − E0)/(Efs − Et) = 40 × 0.6 / 0.2 = 120 L full-strength equivalent.
  const r = computeTopOff({ volume_l: 40, ec_now: 1.2, ec_target: 1.8, recipe_ec: 2.0, parts: PARTS_3X5 });
  it("solves the full-strength-equivalent volume exactly", () => {
    approx(r.full_strength_equivalent_l, 120);
    approx(r.add_water_l, 0);
    approx(r.final_volume_l, 160);
    approx(r.final_ec, 1.8);
    assert.equal(r.mode, "concentrate");
  });
  it("splits the dose by recipe rates", () => {
    // 120 L = 31.7006 gal; each 5 mL/gal part → 158.503 mL.
    for (const p of r.parts_ml) approx(p.add_ml, 5 * (120 / 3.785411784), 1e-9);
    approx(r.total_concentrate_ml, 15 * (120 / 3.785411784), 1e-9);
  });
  it("flags the extreme correction (equivalent exceeds the reservoir)", () => {
    assert.equal(r.advisory.dump_and_remix, true);
    assert.deepEqual(r.advisory.codes, ["correction_exceeds_volume"]);
  });
});

describe("hand-check case 2 — dilute with plain water", () => {
  // 50 L at EC 2.4, target 1.8. w = V(E0 − Et)/Et = 50 × 0.6 / 1.8 = 16.667 L.
  const r = computeTopOff({ volume_l: 50, ec_now: 2.4, ec_target: 1.8, parts: PARTS_3X5 });
  it("solves the dilution volume exactly", () => {
    approx(r.add_water_l, 50 / 3, 1e-9);
    approx(r.full_strength_equivalent_l, 0);
    approx(r.final_volume_l, 50 + 50 / 3, 1e-9);
    approx(r.final_ec, 1.8);
    assert.equal(r.mode, "dilute");
    assert.equal(r.total_concentrate_ml, 0);
    assert.equal(r.advisory.dump_and_remix, false);
  });
});

describe("hand-check case 3 — top off to a fill volume with water + concentrate", () => {
  // 50 L at EC 1.0, fill to 100 L at target 1.5, recipe EC 2.5.
  // c = (Et·Vf − V·E0)/Efs = (150 − 50)/2.5 = 40 L; w = 50 − 40 = 10 L.
  const r = computeTopOff({ volume_l: 50, ec_now: 1.0, ec_target: 1.5, recipe_ec: 2.5, fill_volume_l: 100, parts: PARTS_3X5 });
  it("solves concentrate and water exactly", () => {
    assert.equal(r.mode, "fill");
    approx(r.full_strength_equivalent_l, 40);
    approx(r.add_water_l, 10);
    approx(r.final_volume_l, 100);
    approx(r.final_ec, 1.5);
    for (const p of r.parts_ml) approx(p.add_ml, 5 * (40 / 3.785411784), 1e-9);
    assert.equal(r.advisory.dump_and_remix, false);
  });
});

describe("advisory triggers", () => {
  it("blocks when the target is at or above the recipe's own full-strength EC", () => {
    const r = computeTopOff({ volume_l: 40, ec_now: 1.2, ec_target: 2.2, recipe_ec: 2.0 });
    assert.equal(r.mode, "blocked");
    assert.equal(r.full_strength_equivalent_l, null);
    assert.equal(r.final_ec, null);
    assert.ok(r.advisory.codes.includes("target_unreachable"));
    assert.equal(r.advisory.dump_and_remix, true);
  });
  it("flags dilution that would overflow a stated capacity", () => {
    const r = computeTopOff({ volume_l: 50, ec_now: 2.4, ec_target: 1.8, capacity_l: 60 });
    assert.equal(r.mode, "dilute");
    approx(r.add_water_l, 50 / 3, 1e-9); // lands at 66.7 L > 60 L capacity
    assert.ok(r.advisory.codes.includes("exceeds_capacity"));
  });
  it("flags a fill line that dilution cannot reach", () => {
    const r = computeTopOff({ volume_l: 40, ec_now: 2.4, ec_target: 1.8, fill_volume_l: 45 });
    assert.equal(r.mode, "dilute");
    approx(r.add_water_l, 5);
    approx(r.final_ec, 96 / 45, 1e-9);
    assert.ok(r.advisory.codes.includes("dilution_exceeds_fill"));
  });
  it("fills to the line with water plus a small concentrate dose when above target", () => {
    // c = (1.8×60 − 40×2.4)/2.0 = 6 L equivalent; w = 20 − 6 = 14 L; lands on 1.8 at 60 L.
    const r = computeTopOff({ volume_l: 40, ec_now: 2.4, ec_target: 1.8, recipe_ec: 2.0, fill_volume_l: 60 });
    assert.equal(r.mode, "fill");
    approx(r.full_strength_equivalent_l, 6);
    approx(r.add_water_l, 14);
    approx(r.final_volume_l, 60);
    approx(r.final_ec, 1.8);
    assert.equal(r.advisory.dump_and_remix, false);
  });
  it("flags grower-suspected drift without changing the math", () => {
    const r = computeTopOff({ volume_l: 50, ec_now: 2.4, ec_target: 1.8, drift_suspected: true });
    assert.ok(r.advisory.codes.includes("drift_suspected"));
    assert.equal(r.advisory.dump_and_remix, true);
    approx(r.final_ec, 1.8);
  });
});

describe("steady state and defaults", () => {
  it("does nothing when already on target", () => {
    const r = computeTopOff({ volume_l: 40, ec_now: 1.8, ec_target: 1.8 });
    assert.equal(r.mode, "none");
    approx(r.add_water_l, 0);
    approx(r.final_volume_l, 40);
    approx(r.final_ec, 1.8);
  });
  it("defaults the recipe EC to the stated pre-fill", () => {
    const r = computeTopOff({ volume_l: 40, ec_now: 1.2, ec_target: 1.8 });
    assert.equal(r.input.recipe_ec, DEFAULT_RECIPE_EC);
  });
  it("carries pH as a note, never a dose", () => {
    const r = computeTopOff({ volume_l: 40, ec_now: 1.2, ec_target: 1.8, ph_now: 6.4 });
    assert.equal(r.notes.length, 1);
    assert.match(r.notes[0]!, /does not dose pH/);
  });
});

describe("PPM scales", () => {
  it("derives both scales from EC", () => {
    assert.deepEqual(ppmFromEc(1.8), { ppm500: 900, ppm700: 1260 });
    const r = computeTopOff({ volume_l: 40, ec_now: 1.2, ec_target: 1.8 });
    assert.deepEqual(r.ppm_now, { ppm500: 600, ppm700: 840 });
    assert.deepEqual(r.ppm_target, { ppm500: 900, ppm700: 1260 });
  });
});
