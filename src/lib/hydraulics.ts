import fittingsCatalog from "../data/irrigation/fittings.json" with { type: "json" };
import type { Crop } from "@/types/crop";
import type { FarmState, FieldBlock } from "@/types/farm";
import type {
  BomLine,
  IrrigationFitting,
  IrrigationNetwork,
  IrrigationZone,
  MainlineStation,
  PipeDiameterInches,
  ZoneHydraulicAudit,
} from "@/types/irrigation";
import {
  formatPipe,
  HEADER_LOSS_CAP_PSI,
  hazenWilliamsPsi,
  MAX_VELOCITY_FPS,
  PE_PIPES,
  PIPE_BY_NOMINAL,
  PIPE_DIAMETERS,
  pipeFor,
  round1,
  round2,
  smallestPipeForGpm,
  TAPE_MIN_PSI,
  velocityFps,
} from "@/lib/hazen-williams";
import { emittersOnBed, occupancy, successionsOnBed } from "@/lib/math";

export {
  formatPipe,
  HEADER_LOSS_CAP_PSI,
  hazenWilliamsPsi,
  MAX_VELOCITY_FPS,
  PE_PIPES,
  PIPE_BY_NOMINAL,
  PIPE_DIAMETERS,
  pipeFor,
  round1,
  round2,
  smallestPipeForGpm,
  TAPE_MIN_PSI,
  velocityFps,
};
export { hazenWilliamsFt, PSI_PER_FT, TAPE_MAX_PSI } from "@/lib/hazen-williams";

const FITTINGS = fittingsCatalog as IrrigationFitting[];

export const STANDARD_TAPE = {
  linesPerBed: 2 as const,
  emitterSpacingIn: 8 as const,
  emitterGph: 0.42 as const,
};

export const DEFAULT_NETWORK: Omit<IrrigationNetwork, "zones"> = {
  supply_capacity_gpm: 10,
  supply_pressure_psi: 40,
  mainline_diameter_in: 1.0,
  mainline_length_ft: 80,
  regulator_setpoint_psi: 12,
};

export function headerEquivalentLengthFt(headerLengthFt: number, diameter: PipeDiameterInches): number {
  const elbows = FITTINGS.filter((f) => f.sku_name.includes("elbow") && f.diameter_in === diameter);
  const tees = FITTINGS.filter((f) => f.sku_name.includes("tee") && f.diameter_in === diameter);
  const valves = FITTINGS.filter((f) => f.category === "valve" && f.diameter_in === diameter);
  const elbowEq = elbows[0]?.equivalent_length_ft ?? 3;
  const teeEq = tees[0]?.equivalent_length_ft ?? 6;
  const valveEq = valves[0]?.equivalent_length_ft ?? 12;
  // 2 elbows + 1 tee takeoff + 1 zone valve + 1 flush
  return headerLengthFt + elbowEq * 2 + teeEq + valveEq + 3;
}

function defaultHeaderLength(block: FieldBlock): number {
  // 30 in bed + 18 in aisle = 4 ft centers, plus 8 ft takeoff.
  return round1(block.bed_count * 4 + 8);
}

export function defaultZoneForBlock(block: FieldBlock): IrrigationZone {
  return {
    id: `zn-${block.id}`,
    name: block.name,
    block_ids: [block.id],
    header_diameter_in: 0.75,
    header_length_ft: defaultHeaderLength(block),
  };
}

export function defaultNetwork(farm: FarmState): IrrigationNetwork {
  return {
    ...DEFAULT_NETWORK,
    zones: farm.blocks.map(defaultZoneForBlock),
  };
}

export function resolveNetwork(farm: FarmState): IrrigationNetwork {
  const raw = farm.irrigation;
  if (!raw) return defaultNetwork(farm);
  const zones =
    raw.zones.length > 0
      ? raw.zones.map((z) => ({
          ...z,
          header_diameter_in: normalizeDiameter(z.header_diameter_in, 0.75),
          header_length_ft: Math.max(5, z.header_length_ft),
          block_ids: z.block_ids.filter((id) => farm.blocks.some((b) => b.id === id)),
        }))
      : farm.blocks.map(defaultZoneForBlock);
  return {
    supply_capacity_gpm: Math.max(0.5, raw.supply_capacity_gpm || DEFAULT_NETWORK.supply_capacity_gpm),
    supply_pressure_psi: Math.max(10, raw.supply_pressure_psi || DEFAULT_NETWORK.supply_pressure_psi),
    mainline_diameter_in: normalizeDiameter(raw.mainline_diameter_in, 1.0),
    mainline_length_ft: Math.max(10, raw.mainline_length_ft || DEFAULT_NETWORK.mainline_length_ft),
    regulator_setpoint_psi: Math.max(6, raw.regulator_setpoint_psi || DEFAULT_NETWORK.regulator_setpoint_psi),
    zones,
  };
}

function normalizeDiameter(n: number, fallback: PipeDiameterInches): PipeDiameterInches {
  const found = PIPE_DIAMETERS.find((d) => Math.abs(d - n) < 0.01);
  return found ?? fallback;
}

type Tape = { linesPerBed: number; emitterSpacingIn: number; emitterGph: number; cropId: string | null };

function tapeForBed(farm: FarmState, block: FieldBlock, bedIndex: number, crops: Map<string, Crop>, today: Date): Tape {
  const onBed = successionsOnBed(farm, block.id, bedIndex);
  const live = onBed.find((s) => {
    const o = occupancy(s);
    return today >= o.start && today <= o.end;
  });
  const pick = live ?? onBed[0];
  const crop = pick ? crops.get(pick.crop_id) : undefined;
  if (!crop) {
    return { ...STANDARD_TAPE, cropId: null };
  }
  const p = crop.irrigationProfile;
  return {
    linesPerBed: p.linesPerBed,
    emitterSpacingIn: p.emitterSpacingIn,
    emitterGph: p.emitterGph,
    cropId: crop.id,
  };
}

function emittersFromTape(lengthFt: number, tape: Tape): number {
  return tape.linesPerBed * Math.max(1, Math.round((lengthFt * 12) / tape.emitterSpacingIn));
}

function fittingBySku(sku: string): IrrigationFitting | undefined {
  return FITTINGS.find((f) => f.sku === sku);
}

function pipeSku(diameter: PipeDiameterInches): IrrigationFitting {
  const hit = FITTINGS.find((f) => f.category === "pipe" && f.diameter_in === diameter);
  return hit ?? FITTINGS[2]!;
}

function valveSku(diameter: PipeDiameterInches): IrrigationFitting {
  const sized = FITTINGS.filter((f) => f.category === "valve" && f.sku.includes("24V"));
  const hit = sized.find((f) => f.diameter_in === diameter) ?? sized.find((f) => (f.diameter_in ?? 0) >= diameter);
  return hit ?? sized[0]!;
}

function regulatorSku(qGpm: number): IrrigationFitting {
  return qGpm > 8 ? fittingBySku("PR-100-12")! : fittingBySku("PR-040-12")!;
}

function filterSku(diameter: PipeDiameterInches): IrrigationFitting {
  return diameter >= 1.25 ? fittingBySku("FILTER-150-155")! : fittingBySku("FILTER-100-155")!;
}

function buildBom(
  audit: Pick<
    ZoneHydraulicAudit,
    "total_drip_tape_feet" | "bed_count" | "recommended_header_diameter_in" | "header_friction_loss_psi" | "gross_demand_gpm"
  >,
  zone: IrrigationZone,
  mainlineFt: number,
): BomLine[] {
  const header = pipeSku(audit.recommended_header_diameter_in);
  const valve = valveSku(audit.recommended_header_diameter_in);
  const tape = fittingBySku("TAPE-08-080-042")!;
  const start = fittingBySku("TAPE-FIT-625")!;
  const end = fittingBySku("TAPE-END-625")!;
  const flush = fittingBySku("FLUSH-075")!;
  const reg = regulatorSku(audit.gross_demand_gpm);
  const filter = filterSku(audit.recommended_header_diameter_in);
  const elbow = FITTINGS.find((f) => f.sku_name.includes("elbow") && f.diameter_in === audit.recommended_header_diameter_in);
  const linesPerBed = STANDARD_TAPE.linesPerBed;
  const lineCount = audit.bed_count * linesPerBed;
  const lines: BomLine[] = [
    {
      sku_name: header.sku_name,
      quantity: Math.ceil(zone.header_length_ft + mainlineFt * 0.15),
      specification: header.specification,
    },
    {
      sku_name: tape.sku_name,
      quantity: Math.ceil(audit.total_drip_tape_feet),
      specification: tape.specification,
    },
    {
      sku_name: start.sku_name,
      quantity: lineCount,
      specification: start.specification,
    },
    {
      sku_name: end.sku_name,
      quantity: lineCount,
      specification: end.specification,
    },
    {
      sku_name: valve.sku_name,
      quantity: 1,
      specification: valve.specification,
    },
    {
      sku_name: reg.sku_name,
      quantity: 1,
      specification: reg.specification,
    },
    {
      sku_name: filter.sku_name,
      quantity: 1,
      specification: filter.specification,
    },
    {
      sku_name: flush.sku_name,
      quantity: 1,
      specification: flush.specification,
    },
  ];
  if (elbow) {
    lines.push({ sku_name: elbow.sku_name, quantity: 2, specification: elbow.specification });
  }
  return lines;
}

export function auditZone(
  farm: FarmState,
  zone: IrrigationZone,
  crops: Map<string, Crop>,
  today: Date = new Date(),
  network: IrrigationNetwork = resolveNetwork(farm),
): ZoneHydraulicAudit {
  const blocks = farm.blocks.filter((b) => zone.block_ids.includes(b.id));
  let bed_count = 0;
  let total_bed_feet = 0;
  let total_drip_tape_feet = 0;
  let active_emitters_count = 0;
  let totalGph = 0;
  const mix = new Map<string, { bed_count: number; demand_gpm: number }>();

  for (const block of blocks) {
    for (let i = 0; i < block.bed_count; i++) {
      bed_count += 1;
      total_bed_feet += block.bed_length_ft;
      const tape = tapeForBed(farm, block, i, crops, today);
      const emitters = tape.cropId
        ? emittersOnBed(crops.get(tape.cropId)!, block.bed_length_ft)
        : emittersFromTape(block.bed_length_ft, tape);
      const gph = emitters * tape.emitterGph;
      total_drip_tape_feet += tape.linesPerBed * block.bed_length_ft;
      active_emitters_count += emitters;
      totalGph += gph;
      const key = tape.cropId ?? "standard-tape";
      const row = mix.get(key) ?? { bed_count: 0, demand_gpm: 0 };
      row.bed_count += 1;
      row.demand_gpm += gph / 60;
      mix.set(key, row);
    }
  }

  const gross_demand_gpm = totalGph / 60;
  const eqLen = headerEquivalentLengthFt(zone.header_length_ft, zone.header_diameter_in);
  const recommended = smallestPipeForGpm(gross_demand_gpm, eqLen);
  const selected = pipeFor(zone.header_diameter_in);
  const header_friction_loss_psi = hazenWilliamsPsi(gross_demand_gpm, eqLen, selected);
  const header_velocity_fps = velocityFps(gross_demand_gpm, selected.inside_diameter_in);
  const supply_capacity_gpm = network.supply_capacity_gpm;
  const capacity_utilization_pct = supply_capacity_gpm > 0 ? (gross_demand_gpm / supply_capacity_gpm) * 100 : 999;
  const overSupply = gross_demand_gpm > supply_capacity_gpm + 0.01;
  const overVelocity = header_velocity_fps > MAX_VELOCITY_FPS;
  const biggest = PE_PIPES[PE_PIPES.length - 1]!;
  const evenLargestFails =
    velocityFps(gross_demand_gpm, biggest.inside_diameter_in) > MAX_VELOCITY_FPS ||
    hazenWilliamsPsi(gross_demand_gpm, eqLen, biggest) > HEADER_LOSS_CAP_PSI * 2;
  const is_over_capacity = overSupply || overVelocity;
  const maxZoneGpm = Math.min(supply_capacity_gpm, biggest.max_recommended_gpm);
  const suggested_split_count = Math.max(2, Math.ceil(gross_demand_gpm / Math.max(0.5, maxZoneGpm * 0.85)));
  const requires_zone_split = evenLargestFails || (overSupply && suggested_split_count > 1);

  const partial = {
    total_drip_tape_feet,
    bed_count,
    recommended_header_diameter_in: recommended.nominal_diameter_in,
    header_friction_loss_psi,
    gross_demand_gpm,
  };

  return {
    zone_id: zone.id,
    zone_name: zone.name,
    bed_count,
    total_bed_feet,
    total_drip_tape_feet,
    active_emitters_count,
    gross_demand_gpm: round2(gross_demand_gpm),
    supply_capacity_gpm,
    capacity_utilization_pct: round1(capacity_utilization_pct),
    is_over_capacity,
    recommended_header_diameter_in: recommended.nominal_diameter_in,
    selected_header_diameter_in: zone.header_diameter_in,
    header_friction_loss_psi: round2(header_friction_loss_psi),
    header_velocity_fps: round2(header_velocity_fps),
    requires_zone_split,
    suggested_split_count: requires_zone_split ? suggested_split_count : 1,
    bill_of_materials: buildBom(partial, zone, network.mainline_length_ft),
    crop_mix: [...mix.entries()].map(([crop_id, v]) => ({
      crop_id,
      bed_count: v.bed_count,
      demand_gpm: round2(v.demand_gpm),
    })),
  };
}

export function auditFarm(farm: FarmState, crops: Map<string, Crop>, today: Date = new Date()): ZoneHydraulicAudit[] {
  const network = resolveNetwork(farm);
  return network.zones.map((z) => auditZone(farm, z, crops, today, network));
}

export function peakSimultaneousGpm(audits: ZoneHydraulicAudit[]): number {
  return round2(audits.reduce((s, a) => s + a.gross_demand_gpm, 0));
}

export function peakSequentialGpm(audits: ZoneHydraulicAudit[]): number {
  return round2(Math.max(0, ...audits.map((a) => a.gross_demand_gpm)));
}

/**
 * Residual pressure along the mainline.
 * `mode: "peak-zone"` — only the hungriest zone is open (typical market-garden program).
 * `mode: "simultaneous"` — every zone open (worst case).
 */
export function mainlineStations(
  farm: FarmState,
  crops: Map<string, Crop>,
  mode: "peak-zone" | "simultaneous",
  today: Date = new Date(),
): MainlineStation[] {
  const network = resolveNetwork(farm);
  const pipe = pipeFor(network.mainline_diameter_in);
  const audits = auditFarm(farm, crops, today);
  const n = Math.max(1, network.zones.length);
  const spacing = network.mainline_length_ft / n;

  const flows: number[] = network.zones.map((z, i) => {
    if (mode === "simultaneous") return audits[i]?.gross_demand_gpm ?? 0;
    const peak = peakSequentialGpm(audits);
    const a = audits[i];
    return a && a.gross_demand_gpm === peak ? peak : 0;
  });
  if (mode === "peak-zone" && !flows.some((f) => f > 0) && audits[0]) {
    flows[0] = audits[0].gross_demand_gpm;
  }

  const stations: MainlineStation[] = [];
  let pressure = network.supply_pressure_psi;
  let chainage = 0;

  const startFlow = flows.reduce((s, f) => s + f, 0);
  stations.push({
    chainage_ft: 0,
    label: "SOURCE",
    flow_gpm: round2(startFlow),
    pressure_psi: round1(pressure),
    velocity_fps: round2(velocityFps(startFlow, pipe.inside_diameter_in)),
  });

  let remaining = startFlow;
  for (let i = 0; i < n; i++) {
    const loss = hazenWilliamsPsi(remaining, spacing, pipe);
    pressure -= loss;
    chainage += spacing;
    remaining = Math.max(0, remaining - (flows[i] ?? 0));
    const zone = network.zones[i];
    stations.push({
      chainage_ft: round1(chainage),
      label: zone?.name ?? `Z${i + 1}`,
      flow_gpm: round2(remaining),
      pressure_psi: round1(Math.max(0, pressure)),
      velocity_fps: round2(velocityFps(remaining, pipe.inside_diameter_in)),
    });
  }
  return stations;
}

export function gpmToDisplay(gpm: number, units: "imperial" | "metric"): string {
  if (units === "metric") return `${round1(gpm * 3.785)} L/min`;
  return `${round2(gpm)} GPM`;
}

export function psiToDisplay(psi: number, units: "imperial" | "metric"): string {
  if (units === "metric") return `${round0(psi * 6.895)} kPa`;
  return `${round1(psi)} psi`;
}

export function ftToDisplay(ft: number, units: "imperial" | "metric"): string {
  if (units === "metric") return `${round1(ft * 0.3048)} m`;
  return `${round1(ft)} ft`;
}

function round0(n: number): number {
  return Math.round(n);
}

export { FITTINGS };
