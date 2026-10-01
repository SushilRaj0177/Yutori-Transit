import { buildCandidates } from "./geometry";
import { solve } from "./pareto";
import type { Egress, TrainGeometry } from "./types";

/** Small deterministic PRNG so results are reproducible in tests and on screen. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rand: () => number): number {
  const u = Math.max(rand(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

export interface Stability {
  /** Share of trials in which the same car was recommended. */
  sameCar: number;
  /** Share of trials in which the exact same door was recommended. */
  sameDoor: number;
  trials: number;
}

/**
 * How much the recommendation depends on the crowding numbers being right.
 * Each trial multiplies every car's load by exp(N(0, σ²)) and re-solves.
 * A recommendation that survives most trials can be trusted even when the
 * loads are only estimates; one that flips is a close call and the UI says so.
 */
export function recommendationStability(
  g: TrainGeometry,
  target: Egress,
  loadsPct: number[],
  speedWeight: number,
  { sigma = 0.2, trials = 200, seed = 7 } = {},
): Stability {
  const base = solve(buildCandidates(g, target, loadsPct), speedWeight).best;
  const rand = mulberry32(seed);
  let sameCar = 0;
  let sameDoor = 0;
  for (let t = 0; t < trials; t++) {
    const noisy = loadsPct.map((l) => l * Math.exp(sigma * gaussian(rand)));
    const b = solve(buildCandidates(g, target, noisy), speedWeight).best;
    if (b.car === base.car) {
      sameCar++;
      if (b.door === base.door) sameDoor++;
    }
  }
  return { sameCar: sameCar / trials, sameDoor: sameDoor / trials, trials };
}
