import type { DoorCandidate, Egress, EgressKind, TrainGeometry } from "./types";

/**
 * Model constants. Each one is an assumption, not a measurement; they are
 * collected here so they can be calibrated in one place (see docs/MODEL.md).
 */
export const MODEL = {
  /** Unhurried walking speed on a platform, m/s. */
  walkSpeedMps: 1.25,
  /** Extra seconds to get off a car per 100 percentage points of load above 100%. */
  alightDelayPer100PctS: 15,
  /** Fixed time cost of using each egress type (queueing, waiting for the lift). */
  egressPenaltyS: { stairs: 0, escalator: 4, way: 2, elevator: 30 } satisfies Record<EgressKind, number>,
} as const;

/** Evenly spaced door centres, the layout used by Tokyo Metro's 3- and 4-door stock. */
export function evenDoorOffsets(carLengthM: number, doorsPerCar: number): number[] {
  return Array.from({ length: doorsPerCar }, (_, i) => (carLengthM * (2 * i + 1)) / (2 * doorsPerCar));
}

export function trainLengthM(g: TrainGeometry): number {
  return g.carCount * g.carLengthM + (g.carCount - 1) * g.couplerGapM;
}

/** X_door(c, d) = (c − 1)(L_car + L_gap) + DoorOffset(d) */
export function doorPositionM(g: TrainGeometry, car: number, door: number): number {
  return (car - 1) * (g.carLengthM + g.couplerGapM) + g.doorOffsetsM[door - 1];
}

export function carCentreM(g: TrainGeometry, car: number): number {
  return (car - 1) * (g.carLengthM + g.couplerGapM) + g.carLengthM / 2;
}

/** Seconds from the doors opening until the rider reaches the egress. */
export function egressTimeS(walkM: number, kind: EgressKind, loadPct: number): number {
  const alight = Math.max(0, loadPct - 100) / 100 * MODEL.alightDelayPer100PctS;
  return walkM / MODEL.walkSpeedMps + alight + MODEL.egressPenaltyS[kind];
}

/**
 * Enumerate every (car, door) pair with its walking distance and load. A target
 * can have several access points (e.g. a staircase at each end); each door is
 * measured to whichever point gets the rider out fastest.
 */
export function buildCandidates(g: TrainGeometry, target: Egress | Egress[], loadsPct: number[]): DoorCandidate[] {
  if (loadsPct.length !== g.carCount) {
    throw new Error(`expected ${g.carCount} car loads, got ${loadsPct.length}`);
  }
  const points = Array.isArray(target) ? target : [target];
  if (points.length === 0) throw new Error("target has no access points");
  const out: DoorCandidate[] = [];
  for (let car = 1; car <= g.carCount; car++) {
    for (let door = 1; door <= g.doorOffsetsM.length; door++) {
      const xM = doorPositionM(g, car, door);
      const loadPct = loadsPct[car - 1];
      let best: DoorCandidate | null = null;
      for (const p of points) {
        const walkM = Math.abs(xM - p.positionM);
        const egressS = egressTimeS(walkM, p.kind, loadPct);
        if (!best || egressS < best.egressS) best = { car, door, xM, walkM, egressS, loadPct, via: { id: p.id, kind: p.kind } };
      }
      out.push(best!);
    }
  }
  return out;
}
