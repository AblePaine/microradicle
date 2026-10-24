/**
 * Greenhouse reservoir top-off math — pure functions, no storage, no advice.
 *
 * The daily-action question: the reservoir is at some volume and some EC
 * right now; what do I add — concentrate parts, plain water, or both — to
 * land on a target EC? EC blends linearly by volume:
 *
 *   final EC = (V · EC_now + c · EC_recipe) / (V + c + w)
 *
 * where `c` is the full-strength-equivalent volume: the volume of freshly
 * mixed full-strength solution whose concentrate content equals the parts
 * being dosed. A recipe mixed at its full-strength rate is assumed to read
 * the recipe's stated full-strength EC (`recipe_ec`, grower-supplied —
 * brands differ, so the engine never invents it; 2.0 is only a pre-fill).
 * Per-part doses are the recipe rates scaled to `c`: a part dosed at
 * r mL/gal contributes r × (c in gallons) mL.
 *
 * pH is accepted as context only. This engine does no pH dosing math.
 */
export const LITERS_PER_GALLON = 3.785411784;

/** Pre-fill for the recipe's full-strength EC field — the grower's own number always wins. */
export const DEFAULT_RECIPE_EC = 2.0;

export interface TopOffPart {
  /** Optional grower label ("Part A", "Micro") — display only. */
  name?: string;
  /** This part's rate in the full-strength recipe, mL per gallon. */
  ml_per_gal: number;
}

export interface TopOffInput {
  /** Current reservoir volume, liters. */
  volume_l: number;
  /** Current EC reading (mS/cm) — the stored truth; PPM derives from it. */
  ec_now: number;
  /** Target EC (mS/cm). */
  ec_target: number;
  /** EC of the recipe mixed at full strength. Defaults to DEFAULT_RECIPE_EC. */
  recipe_ec?: number;
  /** The last mix recipe: up to 3 parts at their full-strength rates. */
  parts?: TopOffPart[];
  /** Optional: top off to this final volume (liters) while landing on target. */
  fill_volume_l?: number;
  /** Optional: physical reservoir capacity (liters) — drives the overflow flag. */
  capacity_l?: number;
  /** Optional pH reading — context only, never dosed by this engine. */
  ph_now?: number;
  /** Grower-flagged: the mix may be compromised (slime, smell, unknown additions). */
  drift_suspected?: boolean;
}

export type TopOffMode = "concentrate" | "dilute" | "fill" | "none" | "blocked";

export interface TopOffPartDose extends TopOffPart {
  /** mL of this part to add. */
  add_ml: number;
}

export interface TopOffAdvisory {
  /** True when a dump-and-remix is the honest answer instead of a top-off. */
  dump_and_remix: boolean;
  /** Machine-readable trigger codes, in the order they fired. */
  codes: string[];
  /** Plain-language statement of each trigger. */
  messages: string[];
}

export interface TopOffResult {
  input: Required<Omit<TopOffInput, "fill_volume_l" | "capacity_l" | "ph_now">> & {
    fill_volume_l: number | null;
    capacity_l: number | null;
    ph_now: number | null;
  };
  mode: TopOffMode;
  /** Plain water to add, liters. */
  add_water_l: number;
  /**
   * Full-strength-equivalent volume solved for, liters — the volume of
   * full-strength mix whose concentrate content equals the dose. Null when
   * no such volume exists (target at/above the recipe's own EC).
   */
  full_strength_equivalent_l: number | null;
  parts_ml: TopOffPartDose[];
  total_concentrate_ml: number;
  /** Volume after the additions, liters. Null when blocked. */
  final_volume_l: number | null;
  /** EC after the additions, recomputed from the blend. Null when blocked. */
  final_ec: number | null;
  ppm_now: { ppm500: number; ppm700: number };
  ppm_target: { ppm500: number; ppm700: number };
  advisory: TopOffAdvisory;
  notes: string[];
}

const EPS = 1e-9;

export function ppmFromEc(ec: number): { ppm500: number; ppm700: number } {
  return { ppm500: ec * 500, ppm700: ec * 700 };
}

/**
 * Solve the top-off. Assumes validated inputs (see agentApi coercion):
 * volume_l > 0, ec_now >= 0, ec_target > 0, recipe_ec > 0.
 */
export function computeTopOff(raw: TopOffInput): TopOffResult {
  const V = raw.volume_l;
  const E0 = raw.ec_now;
  const Et = raw.ec_target;
  const Efs = raw.recipe_ec ?? DEFAULT_RECIPE_EC;
  const parts = (raw.parts ?? []).slice(0, 3);
  const fill = raw.fill_volume_l !== undefined && raw.fill_volume_l > V ? raw.fill_volume_l : null;
  const capacity = raw.capacity_l !== undefined && raw.capacity_l > 0 ? raw.capacity_l : null;

  const codes: string[] = [];
  const messages: string[] = [];
  const notes: string[] = [];

  if (raw.drift_suspected) {
    codes.push("drift_suspected");
    messages.push(
      "You flagged this mix as possibly compromised (slime, smell, or unknown additions). Top-off math assumes the salts in the tank are the ones you mixed — dump and remix is the reliable fix.",
    );
  }
  if (raw.ph_now !== undefined) {
    notes.push(
      `pH ${raw.ph_now} recorded as context only — this engine does not dose pH. Settle EC first, then adjust pH separately in small steps if your readings call for it.`,
    );
  }

  let mode: TopOffMode = "none";
  let c: number | null = 0;
  let w = 0;

  if (fill !== null) {
    // Top off to a fixed final volume: c + w = fill − V and the blend must hit Et.
    const headroom = fill - V;
    const cFill = (Et * fill - V * E0) / Efs;
    if (cFill < -EPS) {
      // Above target and the fill line is too close to dilute into: even a
      // brim-full tank of plain water stays above target (the exact dilution
      // volume always exceeds the headroom in this branch). Best effort:
      // fill with water to the line, report the EC it actually reaches.
      const wReq = (V * (E0 - Et)) / Et;
      mode = "dilute";
      c = 0;
      w = headroom;
      codes.push("dilution_exceeds_fill");
      messages.push(
        `Diluting to ${Et} EC needs ${wReq.toFixed(1)} L of water but only ${headroom.toFixed(1)} L of headroom remains before the fill line — filling to the brim still leaves the mix above target. Drain some solution first, or dump and remix.`,
      );
    } else if (cFill > headroom + EPS) {
      // Reaching target inside the fill volume would take more full-strength
      // equivalent than the headroom holds. Fall back to the pure-concentrate
      // solve (which overshoots the fill volume) and flag it.
      if (Efs <= Et + EPS) {
        mode = "blocked";
        c = null;
        codes.push("target_unreachable");
        messages.push(
          `The recipe itself mixes to ${Efs} EC at full strength, at or below the ${Et} target — no amount of top-off concentrate gets there. Dump and remix stronger, or lower the target.`,
        );
      } else {
        mode = "concentrate";
        c = (V * (Et - E0)) / (Efs - Et);
        w = 0;
        codes.push("fill_cannot_reach_target");
        messages.push(
          `Landing on ${Et} EC by the ${fill} L fill line would take more concentrate than the headroom holds. The dose below reaches target but overshoots the fill volume — or dump and remix at the fill volume.`,
        );
      }
    } else {
      mode = "fill";
      c = Math.max(0, cFill);
      w = headroom - c;
    }
  } else if (E0 < Et - EPS) {
    // Raise: add concentrates (as full-strength equivalent).
    if (Efs <= Et + EPS) {
      mode = "blocked";
      c = null;
      codes.push("target_unreachable");
      messages.push(
        `The recipe itself mixes to ${Efs} EC at full strength, at or below the ${Et} target — no amount of top-off concentrate gets there. Dump and remix stronger, or lower the target.`,
      );
    } else {
      mode = "concentrate";
      c = (V * (Et - E0)) / (Efs - Et);
      w = 0;
      if (c > V) {
        codes.push("correction_exceeds_volume");
        messages.push(
          `The correction needs ${c.toFixed(1)} L of full-strength equivalent into a ${V} L reservoir — more solution than the tank holds. That is a remix wearing a top-off costume: dump and remix.`,
        );
      }
    }
  } else if (E0 > Et + EPS) {
    // Lower: add plain water.
    mode = "dilute";
    c = 0;
    w = (V * (E0 - Et)) / Et;
  } else {
    mode = "none";
    c = 0;
    w = 0;
  }

  if (mode !== "blocked" && c !== null) {
    const finalV = V + c + w;
    if (capacity !== null && finalV > capacity + EPS) {
      codes.push("exceeds_capacity");
      messages.push(
        `The additions bring the reservoir to ${finalV.toFixed(1)} L, past its ${capacity} L capacity — drain ${(finalV - capacity).toFixed(1)} L first, or dump and remix.`,
      );
    }
  }

  const blocked = mode === "blocked" || c === null;
  const finalVolume = blocked ? null : V + (c ?? 0) + w;
  const finalEc = blocked || finalVolume === null ? null : (V * E0 + (c ?? 0) * Efs) / finalVolume;
  const gallons = c === null ? 0 : c / LITERS_PER_GALLON;
  const partsMl: TopOffPartDose[] = parts.map((p) => ({ ...p, add_ml: c === null ? 0 : p.ml_per_gal * gallons }));

  return {
    input: {
      volume_l: V,
      ec_now: E0,
      ec_target: Et,
      recipe_ec: Efs,
      parts,
      fill_volume_l: fill,
      capacity_l: capacity,
      ph_now: raw.ph_now ?? null,
      drift_suspected: Boolean(raw.drift_suspected),
    },
    mode,
    add_water_l: w,
    full_strength_equivalent_l: c,
    parts_ml: partsMl,
    total_concentrate_ml: partsMl.reduce((sum, p) => sum + p.add_ml, 0),
    final_volume_l: finalVolume,
    final_ec: finalEc,
    ppm_now: ppmFromEc(E0),
    ppm_target: ppmFromEc(Et),
    advisory: { dump_and_remix: codes.length > 0, codes, messages },
    notes,
  };
}
