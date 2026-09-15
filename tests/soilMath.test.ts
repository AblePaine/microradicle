import assert from "node:assert/strict";
import { describe, it } from "node:test";
import lettuce from "../src/data/crops/lettuce-salanova-butterhead.json" with { type: "json" };
import catalog from "../src/data/soil/amendments.json" with { type: "json" };
import {
  availableNpkPerLb,
  elementalKToK2O,
  elementalPToP2O5,
  k2oToElementalK,
  K_TO_K2O,
  mineralizedFraction,
  netBalance,
  P_OVERLOAD_RATIO,
  P_TO_P2O5,
  p2o5ToElementalP,
  q10Factor,
  Q10,
  Q10_REF_F,
  solveAmendmentRecipe,
} from "../src/lib/soil-chemistry.ts";
import type { OrganicAmendment } from "../src/types/soil.ts";

const AMENDMENTS = catalog as OrganicAmendment[];

function byId(id: string): OrganicAmendment {
  const a = AMENDMENTS.find((x) => x.id === id);
  assert.ok(a, `missing ${id}`);
  return a;
}

/** Same scale as src/lib/math.ts extractionLbs — kept local so Node tests skip @/ modules. */
function extractionLbs(
  crop: {
    soilExtractionProfile: {
      nRemovalLbsPer100BedFt: number;
      pRemovalLbsPer100BedFt: number;
      kRemovalLbsPer100BedFt: number;
    };
  },
  lengthFt: number,
): { n: number; p: number; k: number } {
  const f = lengthFt / 100;
  const s = crop.soilExtractionProfile;
  return {
    n: s.nRemovalLbsPer100BedFt * f,
    p: s.pRemovalLbsPer100BedFt * f,
    k: s.kRemovalLbsPer100BedFt * f,
  };
}

describe("oxide conversions", () => {
  it("uses P2O5/2P = 141.94/61.94 and K2O/2K = 94.2/78.2", () => {
    assert.equal(P_TO_P2O5, 2.2914);
    assert.equal(K_TO_K2O, 1.2046);
    assert.ok(Math.abs(P_TO_P2O5 - 141.94 / 61.94) < 2e-4);
    assert.ok(Math.abs(K_TO_K2O - 94.2 / 78.2) < 1e-4);
    assert.equal(elementalPToP2O5(1), P_TO_P2O5);
    assert.equal(elementalKToK2O(1), K_TO_K2O);
  });

  it("round-trips elemental P and K", () => {
    assert.ok(Math.abs(p2o5ToElementalP(elementalPToP2O5(3.7)) - 3.7) < 1e-12);
    assert.ok(Math.abs(k2oToElementalK(elementalKToK2O(2.2)) - 2.2) < 1e-12);
  });
});

describe("Q10 mineralization", () => {
  it("is 1 at the 70°F reference and doubles every 18°F", () => {
    assert.equal(Q10, 2);
    assert.equal(Q10_REF_F, 70);
    assert.equal(q10Factor(70), 1);
    assert.equal(q10Factor(88), 2);
    assert.equal(q10Factor(52), 0.5);
  });

  it("nearly stalls at or below 40°F", () => {
    assert.equal(q10Factor(40), 0.08);
    assert.ok(q10Factor(36) <= 0.08);
  });

  it("releases more N in 8 weeks at 70°F than at 50°F", () => {
    const feather = byId("feather-meal-12-0-0");
    const warm = mineralizedFraction(feather, 70, 8);
    const cool = mineralizedFraction(feather, 50, 8);
    assert.ok(warm > cool);
    assert.ok(warm > 0.85);
    assert.ok(cool < warm * 0.85);
    assert.equal(mineralizedFraction(feather, 70, 0), 0);
  });
});

describe("lettuce 50 ft extraction", () => {
  it("scales Salanova butterhead 1.4-0.35-1.6 per 100 bed-ft", () => {
    const crop = lettuce;
    assert.equal(crop.soilExtractionProfile.nRemovalLbsPer100BedFt, 1.4);
    assert.equal(crop.soilExtractionProfile.pRemovalLbsPer100BedFt, 0.35);
    assert.equal(crop.soilExtractionProfile.kRemovalLbsPer100BedFt, 1.6);
    const ex = extractionLbs(crop, 50);
    assert.equal(ex.n, 0.7);
    assert.equal(ex.p, 0.175);
    assert.equal(ex.k, 0.8);
  });
});

describe("12-0-0 + 3-15-0 + 0-0-50 recipe", () => {
  it("meets lettuce-50 N and K without overloading P", () => {
    const need = extractionLbs(lettuce, 50);
    const recipe = solveAmendmentRecipe(
      need,
      [byId("feather-meal-12-0-0"), byId("bone-meal-3-15-0"), byId("sulfate-of-potash-0-0-50")],
      70,
      8,
      50,
    );
    const ids = recipe.map((r) => r.amendment.id);
    assert.ok(ids.includes("feather-meal-12-0-0"));
    assert.ok(ids.includes("bone-meal-3-15-0"));
    assert.ok(ids.includes("sulfate-of-potash-0-0-50"));
    const net = netBalance(need, recipe);
    const nGot = need.n + net.n_delta_lbs;
    const kGot = need.k + net.k_delta_lbs;
    const pGot = need.p + net.p_delta_lbs;
    assert.ok(nGot >= need.n * 0.95, `N short: ${nGot} vs ${need.n}`);
    assert.ok(kGot >= need.k * 0.95, `K short: ${kGot} vs ${need.k}`);
    assert.ok(pGot <= need.p * P_OVERLOAD_RATIO + 1e-6, `P over: ${pGot} vs cap ${need.p * P_OVERLOAD_RATIO}`);
    assert.equal(net.is_p_overloaded, false);
    const feather = recipe.find((r) => r.amendment.id === "feather-meal-12-0-0")!;
    assert.ok(feather.oz_per_linear_bed_foot > 0);
    assert.ok(feather.grams_per_linear_meter > 0);
    assert.ok(feather.lbs_per_100ft_bed > 0);
    assert.ok(feather.full_50lb_bags_needed >= 1);
    assert.equal(recipe.every((r) => r.lbs_required >= 0), true);
  });
});

describe("P overload guard", () => {
  it("caps poultry pellets so available P stays at or under 125% of deficit", () => {
    const need = { n: 2, p: 0.2, k: 0.5 };
    const poultry = byId("poultry-pellets-4-3-3");
    const recipe = solveAmendmentRecipe(need, [poultry], 70, 8, 100);
    const net = netBalance(need, recipe);
    assert.equal(net.is_p_overloaded, false);
    const pGot = need.p + net.p_delta_lbs;
    assert.ok(pGot <= need.p * P_OVERLOAD_RATIO + 1e-6);
    const nGot = need.n + net.n_delta_lbs;
    assert.ok(nGot < need.n * 0.95, "N should stay short when P is the binding constraint");
  });

  it("a naive N-scaled poultry rate would overload P on a high-N low-P bed", () => {
    const need = { n: 2, p: 0.2, k: 0.5 };
    const poultry = byId("poultry-pellets-4-3-3");
    const per = availableNpkPerLb(poultry, 70, 8);
    const lbs = need.n / per.n;
    const pNaive = lbs * per.p;
    assert.ok(pNaive > need.p * P_OVERLOAD_RATIO);
  });
});

describe("catalog", () => {
  it("ships 12 OMRI materials including the default N/P/K trio", () => {
    assert.equal(AMENDMENTS.length, 12);
    assert.ok(AMENDMENTS.every((a) => a.omri_listed));
    assert.ok(AMENDMENTS.some((a) => a.id === "feather-meal-12-0-0" && a.n_pct === 12 && a.p_pct === 0));
    assert.ok(AMENDMENTS.some((a) => a.id === "bone-meal-3-15-0" && a.p_pct === 15));
    assert.ok(AMENDMENTS.some((a) => a.id === "sulfate-of-potash-0-0-50" && a.k_pct === 50));
  });
});
