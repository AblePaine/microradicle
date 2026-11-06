import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatValue, humanizeKey, renderResultsEmail } from "./render.ts";

describe("humanizeKey", () => {
  it("splits camelCase and snake_case into a capitalized label", () => {
    assert.equal(humanizeKey("batchCost"), "Batch cost");
    assert.equal(humanizeKey("bed_ft"), "Bed ft");
    assert.equal(humanizeKey("pricing"), "Pricing");
  });
});

describe("formatValue", () => {
  it("rounds to two decimals and groups thousands", () => {
    assert.equal(formatValue(1234.5), "1,234.5");
    assert.equal(formatValue(0.30000000004), "0.3");
    assert.equal(formatValue(42), "42");
  });
  it("renders booleans as Yes/No", () => {
    assert.equal(formatValue(true), "Yes");
    assert.equal(formatValue(false), "No");
  });
});

describe("renderResultsEmail", () => {
  it("renders a flat pricing snapshot with a per-site subject", () => {
    const out = renderResultsEmail({
      siteName: "DoughMatrix",
      siteUrl: "https://www.doughmatrix.com",
      surface: "pricing",
      snapshot: { product: "Country Loaf", batchCost: 18.25, unitCost: 1.52 },
    });
    assert.equal(out.subject, "Your DoughMatrix pricing results");
    assert.match(out.text, /Product: Country Loaf/);
    assert.match(out.text, /Batch cost: 18\.25/);
    assert.match(out.text, /Unit cost: 1\.52/);
    assert.match(out.html, /Country Loaf/);
  });

  it("renders nested groups as sections and omits null entries", () => {
    const out = renderResultsEmail({
      siteName: "Saponis",
      siteUrl: "https://saponis.app",
      surface: "costing",
      snapshot: {
        costPerBar: { ingredients: 0.84, batchTotal: 96.1 },
        draft: null,
      },
    });
    assert.match(out.text, /Cost per bar:/);
    assert.match(out.text, /Ingredients: 0\.84/);
    assert.doesNotMatch(out.text, /Draft/);
    assert.match(out.html, /Cost per bar/);
  });

  it("renders an array of objects with the naming key as the item heading", () => {
    const out = renderResultsEmail({
      siteName: "MicroRadicle",
      siteUrl: "https://www.microradicle.com",
      surface: "engine",
      snapshot: {
        farm: "Test Farm",
        yieldRollup: [
          { crop: "Tomatoes", bedFt: 120, yieldAmount: 300 },
          { crop: "Basil", bedFt: 40, yieldAmount: 25 },
        ],
      },
    });
    assert.match(out.text, /Yield rollup:/);
    assert.match(out.text, /Tomatoes/);
    assert.match(out.text, /Bed ft: 120/);
    assert.match(out.text, /Basil/);
  });

  it("escapes HTML in values", () => {
    const out = renderResultsEmail({
      siteName: "DoughMatrix",
      siteUrl: "https://www.doughmatrix.com",
      surface: "pricing",
      snapshot: { product: "<script>alert(1)</script>" },
    });
    assert.doesNotMatch(out.html, /<script>alert/);
    assert.match(out.html, /&lt;script&gt;/);
    assert.match(out.text, /<script>alert\(1\)<\/script>/);
  });
});
