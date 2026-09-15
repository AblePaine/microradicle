import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  decodeSuccessionFromParams,
  decodeSuccessionFromUnknown,
  encodeSuccessionToParams,
  engineSearchFromParams,
  engineSearchFromUnknown,
  paramsFromSuccession,
  parseEngineCategory,
  successionShareHref,
} from "../src/lib/shareUrl.ts";

describe("encodeSuccessionToParams", () => {
  it("returns empty string when nothing is set", () => {
    assert.equal(encodeSuccessionToParams({}), "");
  });

  it("writes crop, units, and date as clean query keys", () => {
    const q = encodeSuccessionToParams({
      cropId: "lettuce-salanova-butterhead",
      units: 368,
      date: "2026-10-20",
    });
    const params = new URLSearchParams(q);
    assert.equal(params.get("crop"), "lettuce-salanova-butterhead");
    assert.equal(params.get("units"), "368");
    assert.equal(params.get("date"), "2026-10-20");
    assert.equal([...params.keys()].sort().join(","), "crop,date,units");
  });

  it("omits zero, negative, and non-finite units", () => {
    assert.equal(encodeSuccessionToParams({ units: 0 }), "");
    assert.equal(encodeSuccessionToParams({ units: -12 }), "");
    assert.equal(encodeSuccessionToParams({ units: Number.NaN }), "");
  });

  it("omits malformed dates", () => {
    assert.equal(encodeSuccessionToParams({ date: "10/20/2026" }), "");
    assert.equal(encodeSuccessionToParams({ date: "2026-13-40" }).includes("date"), true);
  });
});

describe("decodeSuccessionFromParams", () => {
  it("round-trips the Salanova 50 ft identity", () => {
    const encoded = encodeSuccessionToParams({
      cropId: "lettuce-salanova-butterhead",
      units: 368,
      date: "2026-10-20",
    });
    const decoded = decodeSuccessionFromParams(encoded);
    assert.equal(decoded.cropId, "lettuce-salanova-butterhead");
    assert.equal(decoded.units, 368);
    assert.equal(decoded.date, "2026-10-20");
  });

  it("accepts a leading question mark", () => {
    const decoded = decodeSuccessionFromParams("?crop=basil-prospera&units=80&date=2026-09-15");
    assert.equal(decoded.cropId, "basil-prospera");
    assert.equal(decoded.units, 80);
    assert.equal(decoded.date, "2026-09-15");
  });

  it("treats missing and invalid units as undefined", () => {
    assert.equal(decodeSuccessionFromParams("crop=x").units, undefined);
    assert.equal(decodeSuccessionFromParams("units=abc").units, undefined);
    assert.equal(decodeSuccessionFromParams("units=-4").units, undefined);
  });

  it("drops non-ISO dates", () => {
    assert.equal(decodeSuccessionFromParams("date=Sept-15").date, undefined);
  });
});

describe("decodeSuccessionFromUnknown", () => {
  it("accepts either crop or cropId", () => {
    assert.equal(decodeSuccessionFromUnknown({ crop: "arugula-astro" }).cropId, "arugula-astro");
    assert.equal(decodeSuccessionFromUnknown({ cropId: "arugula-astro" }).cropId, "arugula-astro");
  });

  it("parses numeric and string units from a router search object", () => {
    assert.equal(decodeSuccessionFromUnknown({ units: 368 }).units, 368);
    assert.equal(decodeSuccessionFromUnknown({ units: "368" }).units, 368);
  });
});

describe("paramsFromSuccession / href", () => {
  it("builds an engine path a grower can paste", () => {
    const params = paramsFromSuccession({
      crop_id: "lettuce-salanova-butterhead",
      target_units: 368,
      target_harvest_date: "2026-10-20",
    });
    assert.equal(
      successionShareHref(params),
      "/engine?crop=lettuce-salanova-butterhead&units=368&date=2026-10-20",
    );
    assert.equal(
      successionShareHref(params, "https://microradicle.example"),
      "https://microradicle.example/engine?crop=lettuce-salanova-butterhead&units=368&date=2026-10-20",
    );
  });

  it("maps back onto engine search keys", () => {
    const search = engineSearchFromParams({
      cropId: "pepper-carmen",
      units: 40,
      date: "2026-08-01",
    });
    assert.deepEqual(search, { crop: "pepper-carmen", units: 40, date: "2026-08-01" });
  });
});

describe("parseEngineCategory / gateway trade view", () => {
  it("accepts crop categories and the vegetables alias", () => {
    assert.equal(parseEngineCategory("cut-flowers"), "cut-flowers");
    assert.equal(parseEngineCategory("leafy-greens"), "leafy-greens");
    assert.equal(parseEngineCategory("vegetables"), "vegetables");
  });

  it("drops unknown trades", () => {
    assert.equal(parseEngineCategory("microgreens"), undefined);
    assert.equal(parseEngineCategory(""), undefined);
    assert.equal(parseEngineCategory(12), undefined);
  });

  it("merges category onto engine search without touching share keys", () => {
    const search = engineSearchFromUnknown({
      crop: "zinnia-benarys-giant-coral",
      category: "cut-flowers",
      units: "80",
    });
    assert.equal(search.crop, "zinnia-benarys-giant-coral");
    assert.equal(search.category, "cut-flowers");
    assert.equal(search.units, 80);
    const share = encodeSuccessionToParams({
      cropId: search.crop,
      units: search.units,
    });
    assert.equal(share.includes("category"), false);
  });
});
