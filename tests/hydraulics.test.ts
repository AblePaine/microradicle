import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hazenWilliamsFt,
  hazenWilliamsPsi,
  maxGpmAtVelocity,
  MAX_VELOCITY_FPS,
  PE_PIPES,
  pipeFor,
  PSI_PER_FT,
  smallestPipeForGpm,
  tapeDemandGpm,
  tapeEmitters,
  velocityFps,
} from "../src/lib/hazen-williams.ts";

describe("Hazen-Williams PE C=150", () => {
  it("returns 0 for zero flow or length", () => {
    const pipe = pipeFor(1.0);
    assert.equal(hazenWilliamsPsi(0, 100, pipe), 0);
    assert.equal(hazenWilliamsPsi(10, 0, pipe), 0);
  });

  it("matches the 10.67 English-unit identity at 10 GPM / 100 ft / 1 in PE", () => {
    const pipe = pipeFor(1.0);
    const hf = hazenWilliamsFt(10, 100, pipe);
    const psi = hazenWilliamsPsi(10, 100, pipe);
    // Independent expansion of 10.67 L Q^1.852 / (C^1.852 d^4.87)
    const expectedFt =
      (10.67 * 100 * 10 ** 1.852) / (150 ** 1.852 * 1.049 ** 4.87);
    assert.ok(Math.abs(hf - expectedFt) < 1e-9);
    assert.ok(Math.abs(psi - expectedFt * PSI_PER_FT) < 1e-9);
    // Sanity: ~2.4 psi on 1 in PE at 10 GPM over 100 ft
    assert.ok(psi > 2.2 && psi < 2.7);
  });

  it("loss increases with flow and length, decreases with diameter", () => {
    const a = hazenWilliamsPsi(8, 80, pipeFor(0.75));
    const b = hazenWilliamsPsi(8, 160, pipeFor(0.75));
    const c = hazenWilliamsPsi(16, 80, pipeFor(0.75));
    const d = hazenWilliamsPsi(8, 80, pipeFor(1.0));
    assert.ok(b > a * 1.9);
    assert.ok(c > a);
    assert.ok(d < a);
  });
});

describe("velocity cap 5 ft/s", () => {
  it("inverts V = 0.4085 Q / d²", () => {
    const d = 0.824;
    const q = maxGpmAtVelocity(d);
    assert.ok(Math.abs(velocityFps(q, d) - MAX_VELOCITY_FPS) < 1e-9);
  });

  it("flags 1/2 in PE over ~4.4 GPM", () => {
    const half = pipeFor(0.5);
    assert.ok(half.max_recommended_gpm > 4.3 && half.max_recommended_gpm < 4.5);
    assert.ok(velocityFps(half.max_recommended_gpm + 0.2, half.inside_diameter_in) > 5);
  });
});

describe("header sizer", () => {
  it("picks 1/2 in for a single 50 ft lettuce bed (2 line, 8 in, 0.42 GPH)", () => {
    const gpm = tapeDemandGpm(50, 2, 8, 0.42);
    assert.equal(tapeEmitters(50, 2, 8), 150);
    assert.ok(Math.abs(gpm - 1.05) < 1e-9);
    const pipe = smallestPipeForGpm(gpm, 24);
    assert.equal(pipe.nominal_diameter_in, 0.5);
  });

  it("upsizes a 20-bed 2-line block off 1/2 in", () => {
    const gpm = tapeDemandGpm(50, 2, 8, 0.42) * 20;
    assert.ok(gpm > 20);
    const pipe = smallestPipeForGpm(gpm, 80);
    assert.ok(pipe.nominal_diameter_in >= 1.25);
  });

  it("returns the largest PE when even 1.5 in cannot hold velocity", () => {
    const pipe = smallestPipeForGpm(80, 40);
    assert.equal(pipe.nominal_diameter_in, 1.5);
    assert.ok(velocityFps(80, pipe.inside_diameter_in) > 5);
  });
});

describe("PE catalog IDs", () => {
  it("uses the specified poly inside diameters", () => {
    assert.equal(pipeFor(0.5).inside_diameter_in, 0.6);
    assert.equal(pipeFor(0.75).inside_diameter_in, 0.824);
    assert.equal(pipeFor(1.0).inside_diameter_in, 1.049);
    assert.equal(PE_PIPES.length, 5);
    assert.ok(PE_PIPES.every((p) => p.c_factor === 150));
  });
});
