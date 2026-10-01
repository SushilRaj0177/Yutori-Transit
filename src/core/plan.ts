import { estimateCarLoads, type DayType, type Hotspot } from "@/engine/crowding";
import { buildCandidates } from "@/engine/geometry";
import { breakpoints, solve } from "@/engine/pareto";
import { recommendationStability, type Stability } from "@/engine/stability";
import type { DoorCandidate, Egress, Provenance, Solution } from "@/engine/types";
import { getLayout, type PlatformLayout } from "@/data/layouts";
import { directionBetween, getLine, stationsAhead, type Direction, type Line, type Station } from "@/data/network";

export interface PlanQuery {
  line: string;
  from: string;
  to: string;
  egressId?: string;
  /** 0 = most space, 1 = fastest exit. */
  speedWeight: number;
  hour: number;
  dayType: DayType;
  delayS?: number;
  /** Per-car load from a live source, if one exists. Overrides the estimate. */
  liveLoadsPct?: number[] | null;
}

export interface Plan {
  line: Line;
  from: Station;
  to: Station;
  direction: Direction;
  layout: PlatformLayout;
  target: Egress;
  loadsPct: number[];
  loadSource: Extract<Provenance, "odpt-live" | "estimate">;
  meanLoadPct: number;
  candidates: DoorCandidate[];
  solution: Solution;
  breakpoints: ReturnType<typeof breakpoints>;
  stability: Stability;
}

export type PlanError =
  | { kind: "unknown-line" }
  | { kind: "unknown-station" }
  | { kind: "same-station" }
  | { kind: "no-layout"; to: Station };

/** Hotspot weights: boarding concentration at the origin vs. standing near later exits. */
const ORIGIN_WEIGHT = 1;
const AHEAD_WEIGHT = 0.6;
const FALLBACK_HOTSPOT_WEIGHT = 0.5;

/**
 * Where riders on this train are likely to bunch up: around the stairs at the
 * origin (where they boarded) and around the exits of the stations ahead (where
 * they intend to leave). Only stations with a layout contribute.
 */
export function hotspotsFor(line: Line, from: Station, to: Station): Hotspot[] {
  const spots: Hotspot[] = [];
  const add = (code: string, w: number) =>
    getLayout(line.id, code)?.egress.forEach((g) => spots.push({ positionM: g.positionM, weight: w }));
  add(from.code, ORIGIN_WEIGHT);
  for (const s of stationsAhead(line, from.code, to.code)) add(s.code, AHEAD_WEIGHT);
  if (spots.length === 0) {
    // No layout data on this stretch: assume a single central staircase.
    const g = line.geometry;
    spots.push({ positionM: (g.carCount * (g.carLengthM + g.couplerGapM)) / 2, weight: FALLBACK_HOTSPOT_WEIGHT });
  }
  return spots;
}

export function plan(q: PlanQuery): { ok: true; plan: Plan } | { ok: false; error: PlanError } {
  const line = getLine(q.line);
  if (!line) return { ok: false, error: { kind: "unknown-line" } };
  const from = line.stations.find((s) => s.code === q.from);
  const to = line.stations.find((s) => s.code === q.to);
  if (!from || !to) return { ok: false, error: { kind: "unknown-station" } };
  const direction = directionBetween(line, from.code, to.code);
  if (!direction) return { ok: false, error: { kind: "same-station" } };
  const layout = getLayout(line.id, to.code);
  if (!layout) return { ok: false, error: { kind: "no-layout", to } };

  const target = layout.egress.find((g) => g.id === q.egressId) ?? layout.egress[0];
  const g = line.geometry;

  const live = q.liveLoadsPct && q.liveLoadsPct.length === g.carCount ? q.liveLoadsPct : null;
  const est = estimateCarLoads({
    geometry: g,
    hotspots: hotspotsFor(line, from, to),
    hour: q.hour,
    dayType: q.dayType,
    linePeakPct: line.peakLoadPct,
    delayS: q.delayS,
  });
  const loadsPct = live ?? est.loadsPct;
  const meanLoadPct = Math.round(loadsPct.reduce((a, b) => a + b, 0) / loadsPct.length);

  const candidates = buildCandidates(g, target, loadsPct);
  return {
    ok: true,
    plan: {
      line, from, to, direction, layout, target, loadsPct,
      loadSource: live ? "odpt-live" : "estimate",
      meanLoadPct,
      candidates,
      solution: solve(candidates, q.speedWeight),
      breakpoints: breakpoints(candidates),
      // Live loads still carry measurement noise, but less than the model.
      stability: recommendationStability(g, target, loadsPct, q.speedWeight, { sigma: live ? 0.1 : 0.2 }),
    },
  };
}
