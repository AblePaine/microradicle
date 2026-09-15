import type { PipeDiameterInches, PipeSpecification } from "../types/irrigation";

/** ft of water → psi */
export const PSI_PER_FT = 0.433;
export const MAX_VELOCITY_FPS = 5;
export const TAPE_MIN_PSI = 8;
export const TAPE_MAX_PSI = 12;
/** Header friction cap before we upsize or split (psi). */
export const HEADER_LOSS_CAP_PSI = 3;
export const HW_EXP_Q = 1.852;
export const HW_EXP_D = 4.87;

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Q (gpm) at a given velocity (ft/s) and inside diameter (in). V = 0.4085 Q / d² */
export function maxGpmAtVelocity(insideDiameterIn: number, fps = MAX_VELOCITY_FPS): number {
  return (fps * insideDiameterIn * insideDiameterIn) / 0.4085;
}

export const PE_PIPES: PipeSpecification[] = (
  [
    [0.5, 0.6],
    [0.75, 0.824],
    [1.0, 1.049],
    [1.25, 1.38],
    [1.5, 1.61],
  ] as Array<[PipeDiameterInches, number]>
).map(([nominal_diameter_in, inside_diameter_in]) => ({
  nominal_diameter_in,
  inside_diameter_in,
  c_factor: 150,
  max_recommended_gpm: round2(maxGpmAtVelocity(inside_diameter_in)),
}));

export const PIPE_BY_NOMINAL: Record<PipeDiameterInches, PipeSpecification> = PE_PIPES.reduce(
  (acc, p) => {
    acc[p.nominal_diameter_in] = p;
    return acc;
  },
  {} as Record<PipeDiameterInches, PipeSpecification>,
);

export const PIPE_DIAMETERS: PipeDiameterInches[] = [0.5, 0.75, 1.0, 1.25, 1.5];

/**
 * Hazen-Williams friction loss for water in PE pipe.
 * hf (ft) = 10.67 · L · Q^1.852 / (C^1.852 · d^4.87)
 * Q = gpm, d = inside diameter inches, L = feet.
 */
export function hazenWilliamsFt(qGpm: number, lengthFt: number, pipe: PipeSpecification): number {
  if (qGpm <= 0 || lengthFt <= 0) return 0;
  const num = 10.67 * lengthFt * Math.pow(qGpm, HW_EXP_Q);
  const den = Math.pow(pipe.c_factor, HW_EXP_Q) * Math.pow(pipe.inside_diameter_in, HW_EXP_D);
  return num / den;
}

export function hazenWilliamsPsi(qGpm: number, lengthFt: number, pipe: PipeSpecification): number {
  return hazenWilliamsFt(qGpm, lengthFt, pipe) * PSI_PER_FT;
}

/** Velocity in ft/s. Q gpm, d inside inches. */
export function velocityFps(qGpm: number, insideDiameterInches: number): number {
  if (insideDiameterInches <= 0) return 0;
  return (0.4085 * qGpm) / (insideDiameterInches * insideDiameterInches);
}

export function pipeFor(nominal: PipeDiameterInches): PipeSpecification {
  return PIPE_BY_NOMINAL[nominal];
}

export function smallestPipeForGpm(
  qGpm: number,
  lengthFt: number,
  lossCapPsi = HEADER_LOSS_CAP_PSI,
): PipeSpecification {
  for (const pipe of PE_PIPES) {
    const v = velocityFps(qGpm, pipe.inside_diameter_in);
    const loss = hazenWilliamsPsi(qGpm, lengthFt, pipe);
    if (v <= MAX_VELOCITY_FPS && loss <= lossCapPsi) return pipe;
  }
  return PE_PIPES[PE_PIPES.length - 1]!;
}

export function formatPipe(d: PipeDiameterInches): string {
  if (d === 0.5) return "½ in";
  if (d === 0.75) return "¾ in";
  if (d === 1.0) return "1 in";
  if (d === 1.25) return "1¼ in";
  return "1½ in";
}

export function tapeEmitters(lengthFt: number, linesPerBed: number, emitterSpacingIn: number): number {
  return linesPerBed * Math.max(1, Math.round((lengthFt * 12) / emitterSpacingIn));
}

export function tapeDemandGpm(
  lengthFt: number,
  linesPerBed: number,
  emitterSpacingIn: number,
  emitterGph: number,
): number {
  return (tapeEmitters(lengthFt, linesPerBed, emitterSpacingIn) * emitterGph) / 60;
}
