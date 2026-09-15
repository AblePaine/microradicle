import assert from "node:assert/strict";
import { describe, it } from "node:test";
import lettuce from "../src/data/crops/lettuce-salanova-butterhead.json" with { type: "json" };
import tomato from "../src/data/crops/tomato-cherry-sun-gold.json" with { type: "json" };
import specs from "../src/data/economics/storageSpecs.json" with { type: "json" };
import {
  AC_SAFETY,
  ZONE_META,
  auditZoneLoad,
  chillFlag,
  cubicDisplacementCuFt,
  mixWarnings,
  peakBtuPerHour,
  recommendedAcBtu,
  respirationBtuPerDay,
  sensibleHeatBtu,
  totesNeeded,
  unitPrice,
} from "../src/lib/economics-calc.ts";
import type { CropPostHarvestSpec } from "../src/types/economics.ts";

const CATALOG = specs as CropPostHarvestSpec[];

function spec(id: string): CropPostHarvestSpec {
  const s = CATALOG.find((x) => x.crop_id === id);
  assert.ok(s, `missing ${id}`);
  return s;
}

describe("lettuce 50 ft pack load", () => {
  it("scales Salanova yield, totes, and wholesale dollars", () => {
    const y = lettuce.yieldAndRevenue;
    const ft = 50;
    const units = y.unitsPerBedFoot * ft * (1 - y.standardCullRate);
    const lbs = y.targetYieldLbsPerBedFoot * ft * (1 - y.standardCullRate);
    assert.equal(y.unitsPerBedFoot, 8);
    assert.equal(y.avgWeightPerUnitLbs, 0.4);
    assert.ok(Math.abs(units - 368) < 1e-9);
    assert.ok(Math.abs(lbs - 147.2) < 1e-9);
    const ph = spec("lettuce-salanova-butterhead");
    assert.equal(ph.storage_zone, "zone-1-cold-wet");
    assert.equal(totesNeeded(lbs, ph.totes_per_100_lbs), 7);
    const wholesale = units * y.targetWholesalePriceUsd;
    assert.ok(Math.abs(wholesale - 644) < 1e-9);
    assert.ok(wholesale / ft > 12);
  });
});

describe("field heat BTU", () => {
  it("Q = m · cp · ΔT for 100 lb lettuce 78°F → 34°F", () => {
    const ph = spec("lettuce-salanova-butterhead");
    const q = sensibleHeatBtu(100, ph.sensible_heat_btu_per_lb, 78, 34);
    assert.equal(ph.sensible_heat_btu_per_lb, 0.96);
    assert.ok(Math.abs(q - 100 * 0.96 * 44) < 1e-9);
    assert.ok(q > 4200 && q < 4300);
  });

  it("zero load when the field is already at setpoint", () => {
    assert.equal(sensibleHeatBtu(100, 0.96, 34, 34), 0);
    assert.equal(sensibleHeatBtu(100, 0.96, 32, 34), 0);
  });

  it("sizes a CoolBot window unit with 1.25× safety on 4-hour pull-down", () => {
    const ph = spec("lettuce-salanova-butterhead");
    const lbs = 147.2;
    const sensible = sensibleHeatBtu(lbs, ph.sensible_heat_btu_per_lb, 78, 34);
    const resp = respirationBtuPerDay(lbs, ph.respiration_rate_rating);
    const peak = peakBtuPerHour(sensible, resp, 4);
    const ac = recommendedAcBtu(peak);
    assert.ok(peak > sensible / 4);
    assert.ok(ac >= peak * AC_SAFETY);
    assert.ok([5000, 8000, 10000, 12000].includes(ac));
  });
});

describe("chilling injury", () => {
  it("flags Sun Gold in a 34°F Zone 1 box", () => {
    const t = spec("tomato-cherry-sun-gold");
    assert.equal(t.min_safe_temp_f, 50);
    const flag = chillFlag(t.crop_id, "Sun Gold", t.min_safe_temp_f, ZONE_META["zone-1-cold-wet"].temp_f);
    assert.ok(flag);
    assert.match(flag.message, /injures below 50/);
  });

  it("does not flag Salanova at 34°F", () => {
    const l = spec("lettuce-salanova-butterhead");
    assert.equal(chillFlag(l.crop_id, "Salanova", l.min_safe_temp_f, 34), null);
  });

  it("warns against co-storing Zone 1 greens with Zone 2 fruit", () => {
    const w = mixWarnings(["zone-1-cold-wet", "zone-2-cool-humid"]);
    assert.ok(w.some((m) => m.includes("Split the load")));
  });
});

describe("walk-in displacement", () => {
  it("turns tote count into cubic feet and a CoolBot floor", () => {
    assert.equal(cubicDisplacementCuFt(10), 17.5);
    const audit = auditZoneLoad(
      "zone-1-cold-wet",
      [
        {
          spec: spec("lettuce-salanova-butterhead"),
          crop_name: "Salanova Butterhead",
          lbs: 147.2,
          totes: 7,
        },
      ],
      {
        field_temp_f: 78,
        pull_down_hours: 4,
        cooler_length_ft: 8,
        cooler_width_ft: 8,
        cooler_height_ft: 8,
      },
    );
    assert.equal(audit.total_totes, 7);
    assert.ok(audit.minimum_cooler_sqft >= 16);
    assert.ok(audit.fits_existing_cooler);
    assert.equal(audit.chill_flags.length, 0);
    assert.ok(audit.recommended_ac_btu_rating >= 5000);
  });
});

describe("channel price", () => {
  it("blends wholesale and direct on a 50% mix", () => {
    const y = tomato.yieldAndRevenue;
    assert.equal(unitPrice(y.targetWholesalePriceUsd, y.targetDirectPriceUsd, "wholesale", 0.5), 3.25);
    assert.equal(unitPrice(y.targetWholesalePriceUsd, y.targetDirectPriceUsd, "direct", 0.5), 5);
    assert.equal(unitPrice(3.25, 5, "mix", 0.5), 4.125);
  });
});

describe("catalog", () => {
  it("covers 180+ cultivars and keeps fruiting crops out of Zone 1", () => {
    assert.ok(CATALOG.length >= 180, `got ${CATALOG.length}`);
    for (const id of ["tomato-cherry-sun-gold", "pepper-carmen", "cucumber-marketmore-76", "basil-genovese"]) {
      assert.equal(spec(id).storage_zone, "zone-2-cool-humid");
      assert.ok(spec(id).min_safe_temp_f >= 40);
    }
    assert.equal(spec("onion-redwing").storage_zone, "zone-3-ambient-dry");
  });
});
