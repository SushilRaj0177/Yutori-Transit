export type Bilingual = { en: string; ja: string };

/** "way" = stairs or escalator, not yet confirmed which. */
export type EgressKind = "stairs" | "escalator" | "way" | "elevator";

/**
 * A vertical circulation point on a platform (stairs, escalator, elevator).
 * `positionM` is measured along the platform from the end where car 1 stops,
 * in the same coordinate frame as door positions.
 */
export interface Egress {
  id: string;
  kind: EgressKind;
  positionM: number;
  leadsTo: Bilingual;
  /** Step-free route (elevator, or escalator in both directions). */
  stepFree: boolean;
}

export interface TrainGeometry {
  carCount: number;
  carLengthM: number;
  couplerGapM: number;
  /** Door centre positions measured from the car-1-side end of each car. */
  doorOffsetsM: number[];
}

/** Where a number came from. Shown to the user next to every figure. */
export type Provenance =
  | "odpt-live" // fetched from ODPT in this session
  | "odpt-timetable" // ODPT static timetable
  | "estimate" // produced by this project's crowding model
  | "surveyed"; // platform positions from an on-site survey

export interface DoorCandidate {
  car: number; // 1-indexed
  door: number; // 1-indexed within the car
  /** Door centre on the platform axis, metres from the car-1 end. */
  xM: number;
  /** Walking distance along the platform to the chosen egress. */
  walkM: number;
  /** Seconds from doors opening to reaching the egress. */
  egressS: number;
  /** Estimated or live load of this car in % of seated+standing capacity (100 = full). */
  loadPct: number;
  /** The egress point this door is measured to (the nearest one of the target's points). */
  via?: { id: string; kind: EgressKind };
}

export interface ScoredCandidate extends DoorCandidate {
  /** Weighted cost J in [0, 1]; lower is better. */
  cost: number;
  pareto: boolean;
}

export interface Solution {
  best: ScoredCandidate;
  ranked: ScoredCandidate[];
  frontier: ScoredCandidate[];
  /** Named extremes of the frontier. */
  fastest: ScoredCandidate;
  roomiest: ScoredCandidate;
}
