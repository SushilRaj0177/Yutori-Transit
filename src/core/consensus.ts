import { doorPositionM } from "@/engine/geometry";
import type { TrainGeometry } from "@/engine/types";

/**
 * Turning rider reports into a platform position.
 *
 * A rider on the platform reports the car and door (as painted on the platform,
 * e.g. "4-2") nearest to a staircase, escalator or lift. Reports are noisy:
 * people pick the neighbouring door, mistype, or deliberately troll. The rules:
 *
 *  - One vote per device per egress point (the store keeps only the latest).
 *  - Position = median of the reported door positions (robust to outliers).
 *  - Agreement = share of reports within one door spacing of the median.
 *  - VERIFIED only with ≥ MIN_REPORTS reports and ≥ MIN_AGREEMENT agreement.
 *    Fewer reports → "pending"; enough reports that disagree → "disputed".
 *
 * Only VERIFIED positions are used for recommendations.
 */

export const MIN_REPORTS = 3;
export const MIN_AGREEMENT = 0.75;

export interface Report {
  car: number;
  door: number;
}

export type ConsensusStatus = "verified" | "pending" | "disputed" | "none";

export interface Consensus {
  status: ConsensusStatus;
  reports: number;
  /** Share of reports agreeing with the consensus position (0–1). */
  agreement: number;
  /** Consensus door, snapped to the nearest real door. Present unless status is "none". */
  car?: number;
  door?: number;
  positionM?: number;
}

/** Valid reports only: integers within the train's car and door range. */
export function isValidReport(g: TrainGeometry, r: Report): boolean {
  return Number.isInteger(r.car) && Number.isInteger(r.door) && r.car >= 1 && r.car <= g.carCount && r.door >= 1 && r.door <= g.doorOffsetsM.length;
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  // Lower median: always an actually reported position, never a midpoint between two.
  return s[Math.floor((s.length - 1) / 2)];
}

/** Nearest real door to a platform position. */
export function nearestDoor(g: TrainGeometry, xM: number): { car: number; door: number; positionM: number } {
  let best = { car: 1, door: 1, positionM: doorPositionM(g, 1, 1) };
  for (let car = 1; car <= g.carCount; car++)
    for (let door = 1; door <= g.doorOffsetsM.length; door++) {
      const x = doorPositionM(g, car, door);
      if (Math.abs(x - xM) < Math.abs(best.positionM - xM)) best = { car, door, positionM: x };
    }
  return best;
}

export function consensus(g: TrainGeometry, reports: Report[]): Consensus {
  const valid = reports.filter((r) => isValidReport(g, r));
  if (valid.length === 0) return { status: "none", reports: 0, agreement: 0 };

  const xs = valid.map((r) => doorPositionM(g, r.car, r.door));
  const m = median(xs);
  // One door spacing: reports at the neighbouring door still agree.
  const tolerance = g.carLengthM / g.doorOffsetsM.length + 0.01;
  const agreeing = xs.filter((x) => Math.abs(x - m) <= tolerance);
  const agreement = agreeing.length / xs.length;
  const snapped = nearestDoor(g, median(agreeing));

  const status: ConsensusStatus =
    valid.length < MIN_REPORTS ? "pending" : agreement >= MIN_AGREEMENT ? "verified" : "disputed";
  return { status, reports: valid.length, agreement, ...snapped };
}
