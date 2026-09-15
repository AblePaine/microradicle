import assert from "node:assert/strict";
import { describe, it } from "node:test";
import catalog from "../src/data/nursery/microgreens.json" with { type: "json" };
import {
  assertSafeSoak,
  clamshellsForTrays,
  computeBatch,
  isMucilageLocked,
  ppfdForDli,
  rackHorizon,
  rackLoadOnDate,
  resolvedSoakHours,
  seedGramsForTrays,
  soakStartDate,
  wholesaleUsdForTrays,
  yieldOzForTrays,
} from "../src/lib/nurseryMath.ts";
import type { MicrogreenCultivar } from "../src/types/nursery.ts";

const CROPS = catalog as MicrogreenCultivar[];

function crop(id: string): MicrogreenCultivar {
  const c = CROPS.find((x) => x.id === id);
  assert.ok(c, `missing ${id}`);
  return c;
}

describe("mucilaginous soak lock", () => {
  it("forces 0-hour soak on basil, cress, chia, and flax", () => {
    for (const id of [
      "mg-basil-genovese",
      "mg-basil-lemon",
      "mg-basil-dark-opal",
      "mg-cress-curled",
      "mg-chia",
      "mg-flax-golden",
    ]) {
      const c = crop(id);
      assert.equal(c.isMucilaginous, true);
      assert.equal(c.soakHours, 0);
      assert.equal(resolvedSoakHours(c), 0);
      assert.equal(isMucilageLocked(c), true);
      const batch = computeBatch(c, 2, "2026-09-15", "t");
      assert.equal(batch.soak_start_date, null);
    }
  });

  it("throws if a soak is requested on mucilaginous seed", () => {
    assert.throws(() => assertSafeSoak(crop("mg-basil-genovese"), 8), /gels in water/);
    assert.throws(() => assertSafeSoak(crop("mg-chia"), 4), /gels in water/);
  });

  it("allows soak on broccoli and sunflower", () => {
    assert.equal(resolvedSoakHours(crop("mg-broccoli-waltham")), 10);
    assert.equal(resolvedSoakHours(crop("mg-sunflower-black-oil")), 16);
    assert.doesNotThrow(() => assertSafeSoak(crop("mg-broccoli-waltham"), 10));
  });
});

describe("1020 tray mass", () => {
  it("scales Waltham broccoli seed, cut ounces, and wholesale dollars", () => {
    const c = crop("mg-broccoli-waltham");
    assert.equal(c.seedWeightGramsPer1020, 40);
    assert.equal(c.targetYieldOzPerTray, 10);
    assert.equal(c.targetWholesalePricePerLbUsd, 20);
    assert.equal(seedGramsForTrays(c, 4), 160);
    assert.equal(yieldOzForTrays(c, 4), 40);
    assert.equal(wholesaleUsdForTrays(c, 4), 50);
    assert.equal(clamshellsForTrays(c, 4), 10);
    const batch = computeBatch(c, 4, "2026-09-15", "nb-1");
    assert.equal(batch.total_seed_grams_needed, 160);
    assert.equal(batch.projected_yield_oz, 40);
    assert.equal(batch.projected_gross_revenue_usd, 50);
    assert.equal(batch.tray_count, 4);
  });

  it("keeps sunflower paver weight on a stacked protocol", () => {
    const c = crop("mg-sunflower-black-oil");
    assert.equal(c.blackoutMethod, "stacked-with-weight");
    assert.ok(c.paverWeightLbs >= 10);
    const batch = computeBatch(c, 2, "2026-09-15", "nb-sf");
    assert.equal(batch.unstack_date, "2026-09-18");
    assert.equal(batch.harvest_date, "2026-09-24");
    assert.equal(batch.soak_start_date, "2026-09-14");
  });
});

describe("calendar", () => {
  it("puts 16 h soak on the previous calendar day and 4 h soak on sow day", () => {
    assert.equal(soakStartDate("2026-09-15", 16), "2026-09-14");
    assert.equal(soakStartDate("2026-09-15", 4), "2026-09-15");
    assert.equal(soakStartDate("2026-09-15", 0), null);
  });

  it("sets unstack = sow + blackout and harvest = sow + cycle", () => {
    const pea = computeBatch(crop("mg-pea-dwarf-grey"), 2, "2026-09-01", "nb-pea");
    assert.equal(pea.unstack_date, "2026-09-05");
    assert.equal(pea.harvest_date, "2026-09-13");
    assert.equal(pea.soak_start_date, "2026-08-31");
  });
});

describe("DLI → PPFD", () => {
  it("converts 14 mol over 16 h to ~243 µmol", () => {
    const ppfd = ppfdForDli(14, 16);
    assert.ok(Math.abs(ppfd - 14e6 / (16 * 3600)) < 0.15);
    assert.ok(ppfd > 240 && ppfd < 245);
  });

  it("returns 0 when photoperiod is missing", () => {
    assert.equal(ppfdForDli(14, 0), 0);
  });
});

describe("rack occupancy", () => {
  it("splits blackout vs light trays on a 16-slot rack", () => {
    const broccoli = computeBatch(crop("mg-broccoli-waltham"), 10, "2026-09-15", "a");
    const amaranth = computeBatch(crop("mg-amaranth-red-garnet"), 8, "2026-09-15", "b");
    const sowDay = rackLoadOnDate([broccoli, amaranth], "2026-09-15");
    assert.equal(sowDay.blackout_trays, 10);
    assert.equal(sowDay.light_trays, 8);
    assert.equal(sowDay.total_trays, 18);
    assert.equal(sowDay.over_capacity, true);
    const afterUnstack = rackLoadOnDate([broccoli, amaranth], "2026-09-18");
    assert.equal(afterUnstack.blackout_trays, 0);
    assert.equal(afterUnstack.light_trays, 18);
  });

  it("projects a 14-day occupancy horizon", () => {
    const broccoli = computeBatch(crop("mg-broccoli-waltham"), 10, "2026-09-15", "a");
    const days = rackHorizon([broccoli], "2026-09-15", 14);
    assert.equal(days.length, 14);
    assert.equal(days[0].blackout_trays, 10);
    assert.equal(days[3].blackout_trays, 0);
    assert.equal(days[3].light_trays, 10);
  });
});

describe("catalog integrity", () => {
  it("stocks 24+ 1020 cultivars with camelCase keys and locked mucilage", () => {
    assert.ok(CROPS.length >= 24, `got ${CROPS.length}`);
    const ids = CROPS.map((c) => c.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const c of CROPS) {
      assert.ok(c.seedWeightGramsPer1020 > 0);
      assert.ok(c.totalCycleDays >= c.blackoutDays);
      assert.ok(c.targetYieldOzPerTray > 0);
      for (const key of Object.keys(c)) {
        assert.ok(!key.includes("_"), `${c.id} snake_case ${key}`);
      }
      if (c.isMucilaginous) {
        assert.equal(c.soakHours, 0);
        assert.equal(c.paverWeightLbs, 0);
      }
    }
  });
});
