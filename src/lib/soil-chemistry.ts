import type { AmendmentRecipeItem, OrganicAmendment } from "../types/soil";

/** Elemental P → P2O5 (P2O5 / 2P = 141.94 / 61.94). */
export const P_TO_P2O5 = 2.2914;
export const P2O5_TO_P = 1 / P_TO_P2O5;
/** Elemental K → K2O (K2O / 2K = 94.2 / 78.2). */
export const K_TO_K2O = 1.2046;
export const K2O_TO_K = 1 / K_TO_K2O;

export const P_OVERLOAD_RATIO = 1.25;
export const Q10 = 2;
export const Q10_REF_F = 70;

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export function elementalPToP2O5(pLbs: number): number {
  return pLbs * P_TO_P2O5;
}

export function p2o5ToElementalP(p2o5Lbs: number): number {
  return p2o5Lbs * P2O5_TO_P;
}

export function elementalKToK2O(kLbs: number): number {
  return kLbs * K_TO_K2O;
}

export function k2oToElementalK(k2oLbs: number): number {
  return k2oLbs * K2O_TO_K;
}

export function clampTempF(t: number): number {
  return Math.min(95, Math.max(36, t));
}

/** Q10 rate vs 70°F. Below 40°F mineralization is essentially off. */
export function q10Factor(soilTempF: number): number {
  const t = clampTempF(soilTempF);
  if (t <= 40) return 0.08;
  return Math.pow(Q10, (t - Q10_REF_F) / 18);
}

/**
 * Two-pool organic N release.
 * Fast pool = first_4_weeks_n_release_pct with ~2 week half-life at 70°F.
 * Slow pool = remainder over typical_mineralization_weeks.
 */
export function mineralizedFraction(amendment: OrganicAmendment, soilTempF: number, weeks: number): number {
  if (amendment.n_pct <= 0 || weeks <= 0) return 0;
  const s = q10Factor(soilTempF);
  const fast = Math.min(0.95, Math.max(0, amendment.first_4_weeks_n_release_pct));
  const slow = 1 - fast;
  const halfFast = 2 / Math.max(s, 0.05);
  const fastReleased = fast * (1 - Math.exp((-Math.LN2 * weeks) / halfFast));
  const slowWeeks = Math.max(amendment.typical_mineralization_weeks, 4);
  const slowReleased = slow * Math.min(1, (weeks * s) / slowWeeks);
  return Math.min(0.98, fastReleased + slowReleased);
}

export function pFirstSeasonFrac(amendment: OrganicAmendment): number {
  if (amendment.id.startsWith("rock-phosphate")) return 0.15;
  if (amendment.id.startsWith("bone-meal")) return 0.65;
  if (amendment.id.startsWith("compost")) return 0.5;
  if (amendment.id.startsWith("poultry") || amendment.id.startsWith("crab")) return 0.8;
  if (amendment.p_pct <= 0) return 1;
  return 0.9;
}

export type NpkPerLb = { n: number; p: number; k: number };

/** Plant-available elemental N, P, K per lb of product at this temperature and horizon. */
export function availableNpkPerLb(
  amendment: OrganicAmendment,
  soilTempF: number,
  weeks: number,
): NpkPerLb {
  return {
    n: (amendment.n_pct / 100) * mineralizedFraction(amendment, soilTempF, weeks),
    p: (amendment.p_pct / 100) * P2O5_TO_P * pFirstSeasonFrac(amendment),
    k: (amendment.k_pct / 100) * K2O_TO_K,
  };
}

export function estimateSoilTempF(latitude: number, date: Date = new Date()): number {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const doy = Math.floor((date.getTime() - start) / 86400000);
  const mean = 64 - (latitude - 35) * 0.85;
  const amp = Math.max(10, 19 - Math.abs(latitude - 35) * 0.12);
  return round2(mean + amp * Math.sin(((doy - 100) / 365) * 2 * Math.PI));
}

function solveNxN(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]!]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r]![col]!) > Math.abs(M[pivot]![col]!)) pivot = r;
    }
    if (Math.abs(M[pivot]![col]!) < 1e-12) return null;
    const tmp = M[col]!;
    M[col] = M[pivot]!;
    M[pivot] = tmp;
    const div = M[col]![col]!;
    for (let c = col; c <= n; c++) M[col]![c]! /= div;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r]![col]!;
      for (let c = col; c <= n; c++) M[r]![c]! -= f * M[col]![c]!;
    }
  }
  return M.map((row) => row[n]!);
}

function nRatio(a: NpkPerLb): number {
  return a.n / Math.max(a.p, 0.0001);
}

function kRatio(a: NpkPerLb): number {
  return a.k / Math.max(a.p, 0.0001);
}

function toRecipeItem(
  amendment: OrganicAmendment,
  lbs: number,
  per: NpkPerLb,
  bedFeet: number,
): AmendmentRecipeItem {
  const safeFeet = Math.max(bedFeet, 0.01);
  const lbsPer100 = (lbs / safeFeet) * 100;
  const ozPerFt = (lbs / safeFeet) * 16;
  const quarts = amendment.bulk_density_lbs_per_qt > 0 ? lbsPer100 / amendment.bulk_density_lbs_per_qt : 0;
  const gPerM = (lbs / safeFeet) * (453.592 / 0.3048);
  const bag = Math.max(1, amendment.standard_bag_weight_lbs);
  return {
    amendment,
    lbs_required: round2(lbs),
    oz_per_linear_bed_foot: round3(ozPerFt),
    quarts_per_100ft_bed: round2(quarts),
    grams_per_linear_meter: round1g(gPerM),
    lbs_per_100ft_bed: round2(lbsPer100),
    full_50lb_bags_needed: Math.ceil(lbs / bag - 1e-9),
    n_supplied_lbs: round3(lbs * per.n),
    p_supplied_lbs: round3(lbs * per.p),
    k_supplied_lbs: round3(lbs * per.k),
  };
}

function round1g(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Non-negative recipe: meet N and K, keep P ≤ 125% of deficit.
 * Prefers a 3-source N/P/K basis (feather / bone / SOP style), then greedily fills gaps
 * with the lowest P-per-nutrient remaining materials.
 */
export function solveAmendmentRecipe(
  need: { n: number; p: number; k: number },
  amendments: OrganicAmendment[],
  soilTempF: number,
  weeks: number,
  bedFeet: number,
): AmendmentRecipeItem[] {
  const usable = amendments.filter((a) => a.n_pct + a.p_pct + a.k_pct > 0);
  if (!usable.length || (need.n <= 0 && need.p <= 0 && need.k <= 0)) return [];

  const per = new Map<string, NpkPerLb>();
  for (const a of usable) per.set(a.id, availableNpkPerLb(a, soilTempF, weeks));

  const pCap = need.p * P_OVERLOAD_RATIO;
  const lbsById = new Map<string, number>();

  const add = (id: string, lbs: number) => {
    if (lbs <= 1e-6) return;
    lbsById.set(id, (lbsById.get(id) ?? 0) + lbs);
  };

  const current = () => {
    let n = 0;
    let p = 0;
    let k = 0;
    for (const [id, lbs] of lbsById) {
      const v = per.get(id)!;
      n += lbs * v.n;
      p += lbs * v.p;
      k += lbs * v.k;
    }
    return { n, p, k };
  };

  const nSources = [...usable].filter((a) => (per.get(a.id)?.n ?? 0) > 0.001).sort((a, b) => nRatio(per.get(b.id)!) - nRatio(per.get(a.id)!));
  const kSources = [...usable].filter((a) => (per.get(a.id)?.k ?? 0) > 0.001).sort((a, b) => kRatio(per.get(b.id)!) - kRatio(per.get(a.id)!));
  const pSources = [...usable]
    .filter((a) => (per.get(a.id)?.p ?? 0) > 0.001)
    .sort((a, b) => (per.get(b.id)!.p - per.get(a.id)!.p) * 100 + (per.get(a.id)!.n - per.get(b.id)!.n));

  const n0 = nSources[0];
  const k0 = kSources[0];
  const p0 = pSources.find((a) => a.id !== n0?.id && a.id !== k0?.id);

  if (n0 && k0 && p0) {
    const an = per.get(n0.id)!;
    const ak = per.get(k0.id)!;
    const ap = per.get(p0.id)!;
    const x = solveNxN(
      [
        [an.n, ak.n, ap.n],
        [an.p, ak.p, ap.p],
        [an.k, ak.k, ap.k],
      ],
      [need.n, need.p, need.k],
    );
    if (x && x.every((v) => Number.isFinite(v))) {
      const [xn, xk, xp] = x;
      if ((xn ?? 0) >= -1e-6 && (xk ?? 0) >= -1e-6 && (xp ?? 0) >= -1e-6) {
        add(n0.id, Math.max(0, xn ?? 0));
        add(k0.id, Math.max(0, xk ?? 0));
        add(p0.id, Math.max(0, xp ?? 0));
        const now = current();
        if (now.p > pCap + 1e-6) {
          lbsById.delete(p0.id);
        }
      }
    }
  }

  const fill = (
    remaining: () => number,
    sources: OrganicAmendment[],
    nutrient: "n" | "k" | "p",
    capP: boolean,
  ) => {
    for (const a of sources) {
      const left = remaining();
      if (left <= 0.001) return;
      const v = per.get(a.id)!;
      const rate = v[nutrient];
      if (rate <= 1e-8) continue;
      const now = current();
      const roomP = capP ? Math.max(0, pCap - now.p) : Infinity;
      const maxByP = v.p > 1e-8 ? roomP / v.p : Infinity;
      const lbs = Math.min(left / rate, maxByP);
      if (lbs > 0.002) add(a.id, lbs);
    }
  };

  fill(() => need.n - current().n, nSources, "n", true);
  fill(() => need.k - current().k, kSources, "k", true);
  fill(() => need.p - current().p, pSources, "p", true);

  return [...lbsById.entries()]
    .map(([id, lbs]) => {
      const a = usable.find((x) => x.id === id)!;
      return toRecipeItem(a, lbs, per.get(id)!, bedFeet);
    })
    .filter((row) => row.lbs_required >= 0.05)
    .sort((a, b) => b.lbs_required - a.lbs_required);
}

export function netBalance(
  need: { n: number; p: number; k: number },
  recipe: AmendmentRecipeItem[],
): { n_delta_lbs: number; p_delta_lbs: number; k_delta_lbs: number; is_p_overloaded: boolean } {
  const n = recipe.reduce((s, r) => s + r.n_supplied_lbs, 0);
  const p = recipe.reduce((s, r) => s + r.p_supplied_lbs, 0);
  const k = recipe.reduce((s, r) => s + r.k_supplied_lbs, 0);
  return {
    n_delta_lbs: round3(n - need.n),
    p_delta_lbs: round3(p - need.p),
    k_delta_lbs: round3(k - need.k),
    is_p_overloaded: need.p > 0 ? p > need.p * P_OVERLOAD_RATIO + 1e-6 : p > 0.05,
  };
}

export function mineralizationSeries(
  amendment: OrganicAmendment,
  soilTempF: number,
  totalNlbs: number,
  weeks = 16,
): Array<{ week: number; fraction: number; n_lbs: number }> {
  const out = [];
  for (let w = 0; w <= weeks; w++) {
    const fraction = mineralizedFraction(amendment, soilTempF, w);
    out.push({ week: w, fraction: round3(fraction), n_lbs: round3(totalNlbs * fraction) });
  }
  return out;
}
