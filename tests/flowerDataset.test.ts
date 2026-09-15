import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { PRESERVE_IDS } from "../scripts/seed-cultivars.ts";
import lettuce from "../src/data/crops/lettuce-salanova-butterhead.json" with { type: "json" };
import specs from "../src/data/economics/storageSpecs.json" with { type: "json" };

const CROP_DIR = join(process.cwd(), "src/data/crops");
const USES = ["focal", "spike", "filler", "foliage", "airy-texture"] as const;
const STAGES = new Set(["tight-bud", "cracked-bud", "marshmallow", "one-half-open", "fully-open"]);
const PULSES = new Set([
  "plain-cold-water",
  "citric-acid-hydration",
  "bleach-chlorine-shock",
  "chrysal-holding-soln",
  "hot-water-sear",
]);
const LAYERS = new Set([1, 2]);
const MESH = new Set([6, 8]);
const ROWS = new Set([1, 2, 3, 4, 5, 6]);
const GPH = new Set([0.25, 0.42, 0.5, 0.65]);
const SNAKE = /_/;

type FlowerFile = {
  id: string;
  category: string;
  flowerSpecifics?: {
    primaryUse: string;
    targetStemLengthIn: number;
    supportNetting: {
      required: boolean;
      layers: number;
      meshSizeIn: number;
      firstLayerHeightIn: number;
      secondLayerHeightIn: number | null;
    };
    pinching: {
      required: boolean;
      pinchAtHeightIn: number;
      leaveNodeCount: number;
      dtmPenaltyDays: number;
    };
    harvestProtocol: {
      stage: string;
      cutFrequencyDays: number;
      stemsPerPlant: number;
      stemsPerLinearBedFoot: number;
      recommendedPulse: string;
      vaseLifeDays: number;
    };
  };
  fieldGeometry: { standardBedWidthIn: number; rowsPerBed: number; inRowSpacingIn: number; plantsPerLinearFoot: number };
  irrigationProfile: { emitterGph: number; emitterSpacingIn: number; linesPerBed: number };
  timeline: { dtmFromField: number };
  yieldAndRevenue: { salesUnit: string; unitsPerBedFoot: number };
};

function loadCrops(): FlowerFile[] {
  return readdirSync(CROP_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(CROP_DIR, f), "utf8")) as FlowerFile);
}

function walkKeys(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object") return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, i) => walkKeys(item, `${prefix}[${i}]`));
  }
  const out: string[] = [];
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k;
    out.push(path);
    out.push(...walkKeys(v, path));
  }
  return out;
}

describe("cut-flower catalog", () => {
  const crops = loadCrops();
  const flowers = crops.filter((c) => c.category === "cut-flowers");
  const vegetables = crops.filter((c) => c.category !== "cut-flowers");
  const specIds = new Set((specs as Array<{ crop_id: string }>).map((s) => s.crop_id));
  const preserve = new Set<string>(PRESERVE_IDS);

  it("covers 40+ unique cut-flower cultivars", () => {
    assert.ok(flowers.length >= 40, `got ${flowers.length}`);
    const ids = flowers.map((f) => f.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const f of flowers) {
      assert.ok(readdirSync(CROP_DIR).includes(`${f.id}.json`));
    }
  });

  it("gives every flower camelCase flowerSpecifics, 30-inch geometry, and stem sales", () => {
    for (const f of flowers) {
      assert.ok(f.flowerSpecifics, `${f.id} missing flowerSpecifics`);
      assert.equal(f.fieldGeometry.standardBedWidthIn, 30, `${f.id} bed width`);
      assert.ok(ROWS.has(f.fieldGeometry.rowsPerBed), `${f.id} rows`);
      assert.ok(GPH.has(f.irrigationProfile.emitterGph), `${f.id} gph`);
      assert.equal(f.yieldAndRevenue.salesUnit, "stem", `${f.id} sales unit`);
      const stems = f.flowerSpecifics.harvestProtocol.stemsPerLinearBedFoot;
      assert.ok(
        Math.abs(stems - f.yieldAndRevenue.unitsPerBedFoot) < 0.01,
        `${f.id} stems/ft ${stems} vs units ${f.yieldAndRevenue.unitsPerBedFoot}`,
      );
      assert.ok(f.timeline.dtmFromField > 0 && f.timeline.dtmFromField < 400, `${f.id} dtm`);
      if (f.flowerSpecifics.pinching.required) {
        assert.ok(
          f.timeline.dtmFromField >= f.flowerSpecifics.pinching.dtmPenaltyDays,
          `${f.id} DTM should include pinch penalty`,
        );
      }
    }
  });

  it("validates netting / pinch / harvest unions and stocks every floral use", () => {
    const seen = new Set<string>();
    const stages = new Set<string>();
    const pulses = new Set<string>();
    for (const f of flowers) {
      const spec = f.flowerSpecifics;
      assert.ok(spec, f.id);
      seen.add(spec.primaryUse);
      assert.ok(USES.includes(spec.primaryUse as (typeof USES)[number]), `${f.id} use ${spec.primaryUse}`);
      assert.ok(spec.targetStemLengthIn > 0 && spec.targetStemLengthIn <= 48, `${f.id} stem length`);
      const net = spec.supportNetting;
      assert.equal(typeof net.required, "boolean");
      assert.ok(LAYERS.has(net.layers), `${f.id} layers ${net.layers}`);
      assert.ok(MESH.has(net.meshSizeIn), `${f.id} mesh ${net.meshSizeIn}`);
      if (net.layers === 1) assert.equal(net.secondLayerHeightIn, null, `${f.id} second layer`);
      if (net.layers === 2) {
        assert.ok(typeof net.secondLayerHeightIn === "number" && net.secondLayerHeightIn > net.firstLayerHeightIn);
      }
      const pinch = spec.pinching;
      assert.equal(typeof pinch.required, "boolean");
      if (pinch.required) {
        assert.ok(pinch.pinchAtHeightIn > 0, `${f.id} pinch height`);
        assert.ok(pinch.leaveNodeCount >= 1, `${f.id} nodes`);
        assert.ok(pinch.dtmPenaltyDays >= 0, `${f.id} pinch penalty`);
      }
      const cut = spec.harvestProtocol;
      assert.ok(STAGES.has(cut.stage), `${f.id} stage ${cut.stage}`);
      assert.ok(PULSES.has(cut.recommendedPulse), `${f.id} pulse ${cut.recommendedPulse}`);
      assert.ok(cut.stemsPerPlant > 0);
      assert.ok(cut.stemsPerLinearBedFoot > 0);
      assert.ok(cut.vaseLifeDays > 0);
      stages.add(cut.stage);
      pulses.add(cut.recommendedPulse);
    }
    for (const use of USES) {
      assert.ok(seen.has(use), `missing floral use ${use}`);
    }
    assert.ok(stages.has("tight-bud"), "need at least one tight-bud harvest");
    assert.ok(pulses.has("hot-water-sear") && pulses.has("bleach-chlorine-shock"));
  });

  it("never uses snake_case keys on flower records", () => {
    for (const f of flowers) {
      for (const path of walkKeys(f)) {
        const leaf = path.split(".").pop() ?? path;
        assert.ok(!SNAKE.test(leaf), `${f.id} snake_case key ${path}`);
      }
      assert.ok(!("flower_specifics" in f), `${f.id} snake_case flower_specifics`);
      assert.ok(!("common_name" in f), `${f.id} snake_case common_name`);
    }
  });

  it("has a pack-shed spec per flower and leaves vegetable records untouched", () => {
    for (const f of flowers) {
      assert.ok(specIds.has(f.id), `no storage spec for ${f.id}`);
      assert.ok(!preserve.has(f.id), `flower id collides with demo veg ${f.id}`);
    }
    assert.ok(vegetables.length >= 180, `veg catalog shrank to ${vegetables.length}`);
    const ids = new Set(crops.map((c) => c.id));
    for (const id of PRESERVE_IDS) {
      assert.ok(ids.has(id), `missing demo veg ${id}`);
      const rec = crops.find((c) => c.id === id);
      assert.ok(rec);
      assert.notEqual(rec.category, "cut-flowers");
      assert.ok(!("flowerSpecifics" in rec), `${id} gained flowerSpecifics`);
    }
    const y = lettuce.yieldAndRevenue;
    assert.equal(y.unitsPerBedFoot, 8);
    assert.equal(y.avgWeightPerUnitLbs, 0.4);
    assert.equal(y.targetYieldLbsPerBedFoot, 3.2);
    assert.equal(y.standardCullRate, 0.08);
    const units = y.unitsPerBedFoot * 50 * (1 - y.standardCullRate);
    const lbs = y.targetYieldLbsPerBedFoot * 50 * (1 - y.standardCullRate);
    assert.ok(Math.abs(units - 368) < 1e-9);
    assert.ok(Math.abs(lbs - 147.2) < 1e-9);
    assert.equal(lettuce.category, "leafy-greens");
    assert.ok(!("flowerSpecifics" in lettuce));
  });
});
