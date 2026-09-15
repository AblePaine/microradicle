import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { PRESERVE_IDS } from "../scripts/seed-cultivars.ts";
import lettuce from "../src/data/crops/lettuce-salanova-butterhead.json" with { type: "json" };
import specs from "../src/data/economics/storageSpecs.json" with { type: "json" };

const CROP_DIR = join(process.cwd(), "src/data/crops");
const CATEGORIES = [
  "leafy-greens",
  "brassicas",
  "root-crops",
  "alliums",
  "solanaceous",
  "cucurbits",
  "legumes",
  "herbs",
] as const;
const CELLS = new Set([72, 128, 200, 288, null]);
const ROWS = new Set([1, 2, 3, 4, 5, 6]);
const GPH = new Set([0.25, 0.42, 0.5, 0.65]);
const SPACING = new Set([4, 8, 12]);
const LINES = new Set([1, 2, 3, 4]);
const UNITS = new Set(["head", "bunch", "pound", "pint", "quart", "stem"]);
const FROST = new Set(["tender", "moderate", "hardy", "extreme"]);
const PROP = new Set(["direct-seed", "transplant", "both"]);
const DEMAND = new Set(["light", "moderate", "heavy"]);
const CAMEL_TOP = [
  "id",
  "commonName",
  "cultivar",
  "botanicalName",
  "family",
  "category",
  "propagation",
  "fieldGeometry",
  "timeline",
  "yieldAndRevenue",
  "irrigationProfile",
  "soilExtractionProfile",
  "flowerSpecifics",
  "successionIntervalDays",
  "maxSuccessions",
  "companions",
  "avoid",
  "notes",
  "swatch",
];

type CropFile = {
  id: string;
  commonName: string;
  cultivar: string;
  botanicalName: string;
  family: string;
  category: string;
  propagation: {
    method: string;
    recommendedCellSize: number | null;
    nurseryLeadDays: number;
    germinationDays: number;
    minGermTempF: number;
    optimumGermTempF: number;
    maxGermTempF: number;
  };
  fieldGeometry: {
    standardBedWidthIn: number;
    rowsPerBed: number;
    inRowSpacingIn: number;
    seedSpacingIn: number;
    plantsPerLinearFoot: number;
  };
  timeline: {
    dtmFromField: number;
    fieldHoldingDays: number;
    isMulticut: boolean;
    regrowthDays: number | null;
    maxHarvests: number;
    fallPhotoperiodMultiplier: number;
    frostHardiness: string;
  };
  yieldAndRevenue: {
    salesUnit: string;
    unitsPerBedFoot: number;
    avgWeightPerUnitLbs: number;
    targetYieldLbsPerBedFoot: number;
    standardCullRate: number;
    targetWholesalePriceUsd: number;
    targetDirectPriceUsd: number;
  };
  irrigationProfile: {
    linesPerBed: number;
    emitterSpacingIn: number;
    emitterGph: number;
    weeklyWaterRequirementIn: number;
  };
  soilExtractionProfile: {
    fertilityDemand: string;
    nRemovalLbsPer100BedFt: number;
    pRemovalLbsPer100BedFt: number;
    kRemovalLbsPer100BedFt: number;
  };
  successionIntervalDays: number;
  maxSuccessions: number;
  companions: string[];
  avoid: string[];
  notes: string;
  swatch: string;
};

function loadCrops(): CropFile[] {
  return readdirSync(CROP_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(CROP_DIR, f), "utf8")) as CropFile);
}

describe("cultivar catalog", () => {
  const crops = loadCrops();
  const specIds = new Set((specs as Array<{ crop_id: string }>).map((s) => s.crop_id));

  it("covers 180+ unique commercial cultivars", () => {
    assert.ok(crops.length >= 180, `got ${crops.length}`);
    const ids = crops.map((c) => c.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const c of crops) {
      assert.equal(c.id + ".json", readdirSync(CROP_DIR).find((f) => f === `${c.id}.json`));
    }
  });

  it("keeps all 8 market-garden categories stocked", () => {
    const byCat = new Map<string, number>();
    for (const c of crops) byCat.set(c.category, (byCat.get(c.category) ?? 0) + 1);
    for (const cat of CATEGORIES) {
      assert.ok((byCat.get(cat) ?? 0) >= 8, `${cat} only ${byCat.get(cat) ?? 0}`);
    }
  });

  it("preserves the 24 demo-farm identities, including Salanova 50 ft math", () => {
    const ids = new Set(crops.map((c) => c.id));
    for (const id of PRESERVE_IDS) assert.ok(ids.has(id), `missing ${id}`);
    const y = lettuce.yieldAndRevenue;
    assert.equal(y.unitsPerBedFoot, 8);
    assert.equal(y.avgWeightPerUnitLbs, 0.4);
    assert.equal(y.targetYieldLbsPerBedFoot, 3.2);
    assert.equal(y.standardCullRate, 0.08);
    const units = y.unitsPerBedFoot * 50 * (1 - y.standardCullRate);
    const lbs = y.targetYieldLbsPerBedFoot * 50 * (1 - y.standardCullRate);
    assert.ok(Math.abs(units - 368) < 1e-9);
    assert.ok(Math.abs(lbs - 147.2) < 1e-9);
    assert.equal(lettuce.fieldGeometry.standardBedWidthIn, 30);
    assert.equal(lettuce.fieldGeometry.rowsPerBed, 4);
  });

  it("validates operating-spec unions and 30-inch geometry", () => {
    for (const c of crops) {
      assert.equal(c.fieldGeometry.standardBedWidthIn, 30);
      assert.ok(ROWS.has(c.fieldGeometry.rowsPerBed), `${c.id} rows ${c.fieldGeometry.rowsPerBed}`);
      assert.ok(GPH.has(c.irrigationProfile.emitterGph), `${c.id} gph`);
      assert.ok(SPACING.has(c.irrigationProfile.emitterSpacingIn), `${c.id} emitter spacing`);
      assert.ok(LINES.has(c.irrigationProfile.linesPerBed), `${c.id} lines`);
      assert.ok(CELLS.has(c.propagation.recommendedCellSize), `${c.id} cell`);
      assert.ok(UNITS.has(c.yieldAndRevenue.salesUnit), `${c.id} unit`);
      assert.ok(FROST.has(c.timeline.frostHardiness), `${c.id} frost`);
      assert.ok(PROP.has(c.propagation.method), `${c.id} prop`);
      assert.ok(DEMAND.has(c.soilExtractionProfile.fertilityDemand), `${c.id} demand`);
      assert.ok(c.timeline.dtmFromField > 0 && c.timeline.dtmFromField < 400, `${c.id} dtm`);
      assert.ok(c.yieldAndRevenue.standardCullRate >= 0 && c.yieldAndRevenue.standardCullRate < 0.4);
      assert.ok(c.yieldAndRevenue.targetDirectPriceUsd >= c.yieldAndRevenue.targetWholesalePriceUsd);
      const expectedPlants = c.fieldGeometry.rowsPerBed * (12 / c.fieldGeometry.inRowSpacingIn);
      assert.ok(
        Math.abs(c.fieldGeometry.plantsPerLinearFoot - expectedPlants) < 0.15,
        `${c.id} plants/ft ${c.fieldGeometry.plantsPerLinearFoot} vs ${expectedPlants}`,
      );
      for (const key of Object.keys(c)) {
        assert.ok(CAMEL_TOP.includes(key), `${c.id} unexpected key ${key}`);
        assert.ok(!key.includes("_"), `${c.id} snake_case key ${key}`);
      }
    }
  });

  it("has a pack-shed storage spec for every cultivar", () => {
    for (const c of crops) {
      assert.ok(specIds.has(c.id), `no storage spec for ${c.id}`);
    }
    assert.ok(specIds.size >= crops.length);
  });
});
