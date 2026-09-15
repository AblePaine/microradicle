import assert from "node:assert/strict";
import { describe, it } from "node:test";
import catalog from "../src/data/pasture/species.json" with { type: "json" };
import {
  computeRotation,
  dailyDmForFlock,
  forageLbsPerHead,
  nettingRolls,
  recommendedPaddockSqft,
  restDays,
  shelterSqftNeeded,
} from "../src/lib/pastureMath.ts";
import type { LivestockSpeciesSpec } from "../src/types/pasture.ts";

const SPECS = catalog as LivestockSpeciesSpec[];

function spec(id: string): LivestockSpeciesSpec {
  const s = SPECS.find((x) => x.id === id);
  assert.ok(s, `missing ${id}`);
  return s;
}

describe("Cornish Cross tractor", () => {
  it("feeds 80 birds 12.8 lb DM/day and flags a 10×12 tractor as too tight on grass", () => {
    const s = spec("ps-broiler-cornish-cross");
    assert.equal(s.dailyForageIntakeLbs, 0.16);
    assert.equal(s.shelterSqftPerHead, 1.5);
    assert.equal(s.nettingSpec.fenceType, "none-skid-tractor");
    assert.equal(s.nettingSpec.standardRollLengthFt, 164);
    assert.equal(forageLbsPerHead(s), 0.16);
    assert.equal(dailyDmForFlock(s, 80), 12.8);
    assert.equal(shelterSqftNeeded(s, 80), 120);
    assert.equal(recommendedPaddockSqft(s, 80, "standard-perennial-mix", 1), 558);
    const audit = computeRotation(s, 80, "standard-perennial-mix", "2026-09-15", 1, 120, "pr-1");
    assert.equal(audit.total_daily_dm_lbs, 12.8);
    assert.equal(audit.recommended_paddock_sqft, 558);
    assert.equal(audit.shelter_sqft_needed, 120);
    assert.equal(audit.allocated_paddock_sqft, 120);
    assert.equal(audit.recommended_netting_rolls, 0);
    assert.equal(audit.overgrazing_warning, true);
    assert.equal(audit.manure_n_lbs, 1.76);
    assert.equal(audit.manure_p2o5_lbs, 1.28);
    assert.equal(audit.manure_k2o_lbs, 0.96);
  });

  it("clears the warning when the strip matches the forage need", () => {
    const s = spec("ps-broiler-cornish-cross");
    const audit = computeRotation(s, 80, "standard-perennial-mix", "2026-09-15", 1, 558, "pr-2");
    assert.equal(audit.overgrazing_warning, false);
    assert.equal(audit.recommended_netting_rolls, 0);
  });
});

describe("164 ft netting", () => {
  it("sizes Katahdin ewes on a 3-day paddock", () => {
    const s = spec("ps-sheep-katahdin");
    assert.equal(s.dailyForageIntakeLbs, 5.25);
    assert.equal(s.nettingSpec.standardRollLengthFt, 164);
    assert.equal(s.nettingSpec.fenceType, "sheep-goat-net-35in");
    const audit = computeRotation(s, 25, "standard-perennial-mix", "2026-09-15", 3, 0, "pr-k");
    assert.equal(audit.total_daily_dm_lbs, 131.3);
    assert.equal(audit.recommended_paddock_sqft, 17152);
    assert.equal(audit.allocated_paddock_sqft, 17152);
    assert.equal(audit.recommended_netting_rolls, 4);
    assert.equal(audit.overgrazing_warning, false);
    assert.equal(audit.spring_rest_days, 24);
    assert.equal(audit.summer_rest_days, 36);
  });

  it("uses one 164 ft poultry net roll for 50 ISA Browns on a 2-day yard", () => {
    const s = spec("ps-layer-isa-brown");
    const audit = computeRotation(s, 50, "standard-perennial-mix", "2026-09-15", 2, 0, "pr-l");
    assert.equal(s.nettingSpec.fenceType, "poultry-net-48in");
    assert.equal(audit.total_daily_dm_lbs, 6.8);
    assert.equal(audit.recommended_paddock_sqft, 588);
    assert.equal(audit.recommended_netting_rolls, 1);
  });

  it("sizes 6 Dexters on a 2-day polywire break", () => {
    const s = spec("ps-cattle-dexter");
    assert.equal(s.dailyForageIntakeLbs, 20);
    assert.equal(s.animalUnitEquivalent, 0.8);
    const audit = computeRotation(s, 6, "standard-perennial-mix", "2026-09-15", 2, 0, "pr-d");
    assert.equal(audit.total_daily_dm_lbs, 120);
    assert.equal(audit.recommended_paddock_sqft, 10454);
    assert.equal(nettingRolls(audit.recommended_paddock_sqft, s.nettingSpec.fenceType), 3);
    assert.equal(audit.recommended_netting_rolls, 3);
    assert.equal(audit.manure_n_lbs, 3.84);
  });
});

describe("rest and drought", () => {
  it("lengthens rest and paddock on a summer slump", () => {
    assert.deepEqual(restDays("lush-spring-flush"), { spring: 18, summer: 30 });
    assert.deepEqual(restDays("summer-drought-slump"), { spring: 30, summer: 45 });
    const s = spec("ps-sheep-katahdin");
    const lush = recommendedPaddockSqft(s, 25, "lush-spring-flush", 3);
    const dry = recommendedPaddockSqft(s, 25, "summer-drought-slump", 3);
    assert.ok(dry > lush);
    assert.equal(Math.round(dry / lush), Math.round(2800 / 1200));
  });
});

describe("catalog integrity", () => {
  it("stocks all four classes with camelCase keys and 164 ft rolls", () => {
    assert.ok(SPECS.length >= 8, `got ${SPECS.length}`);
    const ids = SPECS.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length);
    const classes = new Set(SPECS.map((s) => s.livestockClass));
    for (const c of ["pastured-broilers", "pastured-layers", "hair-sheep", "small-herd-cattle"]) {
      assert.ok(classes.has(c as LivestockSpeciesSpec["livestockClass"]), `missing ${c}`);
    }
    for (const s of SPECS) {
      assert.ok(s.id.startsWith("ps-"), s.id);
      assert.ok(s.dailyForageIntakeLbs > 0);
      assert.equal(s.nettingSpec.standardRollLengthFt, 164);
      assert.ok(Math.abs(forageLbsPerHead(s) - s.dailyForageIntakeLbs) < 0.02);
      for (const key of Object.keys(s)) {
        assert.ok(!key.includes("_"), `${s.id} snake_case ${key}`);
      }
      for (const key of Object.keys(s.nettingSpec)) {
        assert.ok(!key.includes("_"), `${s.id} netting ${key}`);
      }
      for (const key of Object.keys(s.dailyManureNpkLbs)) {
        assert.ok(!key.includes("_"), `${s.id} manure ${key}`);
      }
    }
  });
});
