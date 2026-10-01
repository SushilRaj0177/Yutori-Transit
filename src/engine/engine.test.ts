import { describe, expect, it } from "vitest";
import { estimateCarLoads, timeOfDayFactor } from "./crowding";
import { buildCandidates, doorPositionM, egressTimeS, evenDoorOffsets, MODEL, trainLengthM } from "./geometry";
import { breakpoints, dominates, paretoFrontier, solve } from "./pareto";
import { mulberry32, recommendationStability } from "./stability";
import type { DoorCandidate, Egress, TrainGeometry } from "./types";

const G: TrainGeometry = { carCount: 6, carLengthM: 18, couplerGapM: 0.6, doorOffsetsM: evenDoorOffsets(18, 3) };
const stairsAt = (positionM: number): Egress => ({ id: "s", kind: "stairs", positionM, leadsTo: { en: "", ja: "" }, stepFree: false });
const cand = (egressS: number, loadPct: number, car = 1, door = 1): DoorCandidate => ({ car, door, xM: 0, walkM: 0, egressS, loadPct });

describe("geometry", () => {
  it("spaces doors evenly inside a car", () => {
    expect(evenDoorOffsets(18, 3)).toEqual([3, 9, 15]);
  });

  it("projects doors onto the platform axis", () => {
    expect(doorPositionM(G, 1, 1)).toBe(3);
    expect(doorPositionM(G, 2, 1)).toBeCloseTo(18.6 + 3);
    expect(doorPositionM(G, 6, 3)).toBeCloseTo(5 * 18.6 + 15);
    expect(trainLengthM(G)).toBeCloseTo(111);
  });

  it("adds alighting delay only above 100% load", () => {
    expect(egressTimeS(25, "stairs", 80)).toBeCloseTo(25 / MODEL.walkSpeedMps);
    expect(egressTimeS(25, "stairs", 200)).toBeCloseTo(25 / MODEL.walkSpeedMps + MODEL.alightDelayPer100PctS);
    expect(egressTimeS(0, "elevator", 50)).toBe(MODEL.egressPenaltyS.elevator);
  });

  it("enumerates N × M candidates and rejects mismatched loads", () => {
    expect(buildCandidates(G, stairsAt(50), [50, 60, 70, 80, 90, 100])).toHaveLength(18);
    expect(() => buildCandidates(G, stairsAt(50), [1, 2])).toThrow();
  });
});

describe("pareto frontier", () => {
  it("matches the brute-force definition on random inputs", () => {
    const rand = mulberry32(42);
    for (let trial = 0; trial < 300; trial++) {
      // Integer values force plenty of ties, which is where sweeps usually break.
      const cs = Array.from({ length: 1 + Math.floor(rand() * 30) }, () => cand(Math.floor(rand() * 8), Math.floor(rand() * 8)));
      const brute = new Set(cs.map((_, i) => i).filter((i) => !cs.some((o, j) => j !== i && dominates(o, cs[i]))));
      expect(paretoFrontier(cs)).toEqual(brute);
    }
  });

  it("keeps exact duplicates", () => {
    expect(paretoFrontier([cand(1, 1), cand(1, 1)]).size).toBe(2);
  });
});

describe("solve", () => {
  const cs = [cand(10, 180, 3), cand(30, 120, 2), cand(60, 70, 1), cand(70, 190, 4)];

  it("picks the fastest door at w = 1 and the emptiest car at w = 0", () => {
    expect(solve(cs, 1).best.car).toBe(3);
    expect(solve(cs, 0).best.car).toBe(1);
  });

  it("always recommends a non-dominated door", () => {
    for (let w = 0; w <= 1; w += 0.05) expect(solve(cs, w).best.pareto).toBe(true);
  });

  it("names the frontier extremes", () => {
    const s = solve(cs, 0.5);
    expect(s.fastest.car).toBe(3);
    expect(s.roomiest.car).toBe(1);
    expect(s.frontier.map((f) => f.car)).toEqual([3, 2, 1]);
  });

  it("reports contiguous slider ranges that cover [0, 1]", () => {
    const bp = breakpoints(cs);
    expect(bp[0].from).toBe(0);
    expect(bp[bp.length - 1].to).toBe(1);
    for (let i = 1; i < bp.length; i++) expect(bp[i].car !== bp[i - 1].car || bp[i].door !== bp[i - 1].door).toBe(true);
  });

  it("solves a 10-car × 4-door train in well under 2 ms", () => {
    const g10: TrainGeometry = { carCount: 10, carLengthM: 20, couplerGapM: 0.5, doorOffsetsM: evenDoorOffsets(20, 4) };
    const c = buildCandidates(g10, stairsAt(97), [90, 120, 150, 180, 170, 160, 140, 120, 100, 80]);
    const t0 = performance.now();
    for (let i = 0; i < 1000; i++) solve(c, i / 1000);
    expect((performance.now() - t0) / 1000).toBeLessThan(2);
  });
});

describe("crowding estimate", () => {
  it("peaks on weekday mornings and is quiet late at night", () => {
    expect(timeOfDayFactor(8.2, "weekday")).toBeGreaterThan(0.95);
    expect(timeOfDayFactor(3, "weekday")).toBeLessThan(0.3);
    expect(timeOfDayFactor(8.2, "holiday")).toBeLessThan(timeOfDayFactor(8.2, "weekday"));
  });

  it("loads cars near hotspots more than cars far away", () => {
    const { loadsPct } = estimateCarLoads({ geometry: G, hotspots: [{ positionM: 10, weight: 1 }], hour: 8.2, dayType: "weekday", linePeakPct: 150 });
    expect(loadsPct[0]).toBeGreaterThan(loadsPct[5]);
  });

  it("raises load when the train is delayed", () => {
    const base = { geometry: G, hotspots: [{ positionM: 55, weight: 1 }], hour: 12, dayType: "weekday" as const, linePeakPct: 150 };
    expect(estimateCarLoads({ ...base, delayS: 600 }).meanPct).toBeGreaterThan(estimateCarLoads(base).meanPct);
  });
});

describe("stability", () => {
  it("is deterministic and near 1 when one car is clearly best", () => {
    const loads = [40, 200, 200, 200, 200, 200];
    const a = recommendationStability(G, stairsAt(5), loads, 0.5);
    expect(a).toEqual(recommendationStability(G, stairsAt(5), loads, 0.5));
    expect(a.sameCar).toBeGreaterThan(0.95);
  });
});

describe("cost scales", () => {
  it("ignores load differences while every car still has seats", () => {
    // Car 1 is a long walk but slightly emptier; with seats free everywhere the walk should win.
    const cs = [cand(60, 30, 1), cand(10, 45, 2)];
    expect(solve(cs, 0.2).best.car).toBe(2);
  });

  it("lets real crowding outweigh a short walk when the user asks for space", () => {
    const cs = [cand(60, 70, 1), cand(10, 190, 2)];
    expect(solve(cs, 0.3).best.car).toBe(1);
    expect(solve(cs, 0.9).best.car).toBe(2);
  });
});
