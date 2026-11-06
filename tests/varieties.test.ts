import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CROP_GROUPS,
  VARIETY_COUNT,
  VARIETY_INDEX,
  filterVarieties,
  hasResistance,
  resistanceLabel,
} from "../src/lib/varieties.ts";
import { ALL_VARIETIES, getVarietyFull } from "../src/lib/varietiesFull.ts";

describe("variety dataset integrity (OpenPlantDB seed)", () => {
  it("carries the full curated slice", () => {
    assert.ok(VARIETY_COUNT >= 2500, `expected >= 2500 varieties, got ${VARIETY_COUNT}`);
    assert.equal(ALL_VARIETIES.length, VARIETY_COUNT);
  });

  it("slugs are unique across index and full records", () => {
    assert.equal(new Set(VARIETY_INDEX.map((v) => v.slug)).size, VARIETY_COUNT);
    assert.equal(new Set(ALL_VARIETIES.map((v) => v.slug)).size, VARIETY_COUNT);
  });

  it("every record has the required fields and a sane DTM range", () => {
    for (const v of ALL_VARIETIES) {
      assert.ok(v.name.length > 0, v.slug);
      assert.ok(v.scientificName.includes("'"), v.slug);
      assert.ok(v.dtmMax >= v.dtmMin && v.dtmMax > 0, v.slug);
      assert.ok(Array.isArray(v.sources), v.slug);
      assert.ok(CROP_GROUPS.includes(v.cropGroup), v.slug);
    }
  });

  it("Amelia carries its catalog resistance package", () => {
    const amelia = getVarietyFull("amelia-tomato");
    assert.ok(amelia, "amelia-tomato must exist");
    for (const code of ["V", "F", "FF", "N", "T", "As"]) {
      assert.ok(amelia.resistanceCodes.includes(code), `missing code ${code}`);
    }
    assert.ok(amelia.resistances.includes("Verticillium wilt"));
    assert.ok(amelia.resistances.includes("Nematodes"));
    assert.ok(hasResistance(amelia));
  });
});

describe("filterVarieties", () => {
  it("free-text query finds a variety by name", () => {
    const hits = filterVarieties({ query: "amelia" });
    assert.ok(hits.some((v) => v.slug === "amelia-tomato"));
  });

  it("group filter is exact", () => {
    const hits = filterVarieties({ group: "Tomatoes" });
    assert.ok(hits.length > 100);
    assert.ok(hits.every((v) => v.cropGroup === "Tomatoes"));
  });

  it("maturity band keys on dtmMax", () => {
    const hits = filterVarieties({ band: "le60" });
    assert.ok(hits.length > 0);
    assert.ok(hits.every((v) => v.dtmMax <= 60));
  });

  it("resistantOnly keeps only documented resistance", () => {
    const hits = filterVarieties({ resistantOnly: true });
    assert.ok(hits.length >= 250, `expected a few hundred, got ${hits.length}`);
    assert.ok(hits.every(hasResistance));
  });
});

describe("resistanceLabel", () => {
  it("labels known codes and passes unknown ones through", () => {
    assert.equal(resistanceLabel("V"), "Verticillium wilt");
    assert.equal(resistanceLabel("ZZ"), "ZZ");
  });
});
