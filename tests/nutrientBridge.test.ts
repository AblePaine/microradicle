import assert from "node:assert/strict";
import { describe, it } from "node:test";
import catalog from "../src/data/pasture/species.json" with { type: "json" };
import { computeRotation, nYear1Factor, year1AvailableN } from "../src/lib/pastureMath.ts";
import {
  equivalentMealLbs,
  manureCreditFromRotation,
  manurePOverload,
  mealSavingsUsd,
  netNeedAfterCredit,
} from "../src/lib/nutrientBridge.ts";
import { elementalPToP2O5, P_OVERLOAD_RATIO } from "../src/lib/soil-chemistry.ts";
import type { LivestockSpeciesSpec } from "../src/types/pasture.ts";
import type { BedNutrientDeficit } from "../src/types/soil.ts";

const SPECS = catalog as LivestockSpeciesSpec[];

function spec(id: string): LivestockSpeciesSpec {
  const s = SPECS.find((x) => x.id === id);
  assert.ok(s, `missing ${id}`);
  return s;
}

function deficit(n: number, p: number, k: number, feet = 400): BedNutrientDeficit {
  return {
    block_id: "blk-test",
    block_name: "TEST",
    total_bed_feet: feet,
    total_n_lbs: n,
    total_p_lbs: p,
    total_k_lbs: k,
    crop_breakdown: [],
  };
}

describe("year-1 plant-available N", () => {
  it("credits 50% of poultry manure N and 40% of ruminant manure N", () => {
    assert.equal(nYear1Factor("pastured-broilers"), 0.5);
    assert.equal(nYear1Factor("pastured-layers"), 0.5);
    assert.equal(nYear1Factor("hair-sheep"), 0.4);
    assert.equal(nYear1Factor("small-herd-cattle"), 0.4);
    assert.equal(year1AvailableN(1.76, "pastured-broilers"), 0.88);
    assert.equal(year1AvailableN(10, "hair-sheep"), 4);
  });
});

describe("Cornish Cross 80-head 1-day tractor", () => {
  it("turns 1.76 lb raw N into 0.88 lb plant-available N and keeps P2O5 / K2O", () => {
    const audit = computeRotation(
      spec("ps-broiler-cornish-cross"),
      80,
      "standard-perennial-mix",
      "2026-09-15",
      1,
      120,
      "pr-1",
    );
    assert.equal(audit.manure_n_lbs, 1.76);
    assert.equal(audit.manure_p2o5_lbs, 1.28);
    assert.equal(audit.manure_k2o_lbs, 0.96);
    assert.equal(audit.livestock_class, "pastured-broilers");
    const credit = manureCreditFromRotation(audit);
    assert.equal(credit.available_n_lbs, 0.88);
    assert.equal(credit.available_p2o5_lbs, 1.28);
    assert.equal(credit.available_k2o_lbs, 0.96);
    assert.equal(credit.area_sqft, 120);
    assert.match(credit.source_name, /Cornish Cross \(80 head, 1-day move\)/);
  });

  it("subtracts the credit before the meal recipe and flags a 125% P cap", () => {
    const audit = computeRotation(
      spec("ps-broiler-cornish-cross"),
      80,
      "standard-perennial-mix",
      "2026-09-15",
      1,
      558,
      "pr-p",
    );
    const credit = manureCreditFromRotation(audit);
    const beds = deficit(5, 0.2, 2);
    const net = netNeedAfterCredit(beds, credit);
    assert.equal(net.n, 4.12);
    assert.equal(net.p, 0);
    assert.ok(manurePOverload(beds, credit));
    assert.ok(credit.available_p2o5_lbs > elementalPToP2O5(0.2) * P_OVERLOAD_RATIO);

    const bags = equivalentMealLbs(credit);
    assert.ok(Math.abs(bags.feather_meal_12_0_0_lbs - 0.88 / 0.12) < 0.02);
    assert.ok(Math.abs(bags.bone_meal_1_13_0_lbs - 1.28 / 0.15) < 0.02);
    assert.ok(Math.abs(bags.potash_0_0_50_lbs - 0.96 / 0.5) < 0.02);
    assert.ok(mealSavingsUsd(bags) > 0);
  });
});

describe("Katahdin ewes", () => {
  it("uses the 40% ruminant factor on a 3-day paddock", () => {
    const audit = computeRotation(
      spec("ps-sheep-katahdin"),
      25,
      "standard-perennial-mix",
      "2026-09-15",
      3,
      0,
      "pr-k",
    );
    const credit = manureCreditFromRotation(audit);
    assert.equal(audit.livestock_class, "hair-sheep");
    assert.equal(credit.available_n_lbs, year1AvailableN(audit.manure_n_lbs, "hair-sheep"));
    assert.equal(nYear1Factor("hair-sheep"), 0.4);
    const beds = deficit(20, 8, 16);
    assert.equal(manurePOverload(beds, credit), false);
    const net = netNeedAfterCredit(beds, credit);
    assert.ok(net.n < 20);
    assert.ok(net.n > 0);
  });
});
