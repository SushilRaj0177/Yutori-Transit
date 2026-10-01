import { estimateCarLoads, type DayType, type Hotspot } from "@/engine/crowding";
import { buildCandidates } from "@/engine/geometry";
import { breakpoints, ESTIMATE_TRUST, solve } from "@/engine/pareto";
import { recommendationStability, type Stability } from "@/engine/stability";
import type { DoorCandidate, Egress, Provenance, Solution } from "@/engine/types";
import { stationEgress } from "@/data/layouts";
import { directionBetween, getLine, stationsAhead, type Direction, type Line, type Station } from "@/data/network";
import { resolveEgress, toEgress, type CommunityBook, type EgressState, type PositionSource } from "./positions";

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
  /** Rider-verified positions; null when unavailable. */
  community: CommunityBook | null;
  /** Use illustrative positions where nothing real is known. Off for real use. */
  demo: boolean;
}

export type CrowdLevel = "quieter" | "average" | "busier";

export interface DoorPlan {
  target: Egress;
  positionSource: PositionSource;
  candidates: DoorCandidate[];
  solution: Solution;
  breakpoints: ReturnType<typeof breakpoints>;
  stability: Stability;
}

export interface Plan {
  line: Line;
  from: Station;
  to: Station;
  direction: Direction;
  egress: EgressState[];
  target: EgressState;
  loadsPct: number[];
  loadSource: Extract<Provenance, "odpt-live" | "estimate">;
  meanLoadPct: number;
  /** Each car relative to the train average. What the UI shows for estimates. */
  crowd: CrowdLevel[];
  /** True when the time-of-day curve puts this in a peak period. */
  peak: boolean;
  /** null when the target's position is not known: no door is recommended. */
  door: DoorPlan | null;
}

export type PlanError = { kind: "unknown-line" } | { kind: "unknown-station" } | { kind: "same-station" } | { kind: "no-layout"; to: Station };

const ORIGIN_WEIGHT = 1;
const AHEAD_WEIGHT = 0.6;
const FALLBACK_HOTSPOT_WEIGHT = 0.5;
/** Within ±7% of the train average counts as "average": finer distinctions are below the model's resolution. */
const CROWD_BAND = 0.07;

/**
 * Where riders on this train are likely to bunch up: around the stairs at the
 * origin and at the stations ahead. Only positions the app actually knows
 * (surveyed, rider-verified, or demo in demo mode) are used.
 */
export function hotspotsFor(line: Line, from: Station, to: Station, community: CommunityBook | null, demo: boolean): Hotspot[] {
  const spots: Hotspot[] = [];
  const add = (code: string, w: number) =>
    resolveEgress(line, code, community, demo).forEach((s) => s.positionM !== null && spots.push({ positionM: s.positionM, weight: w }));
  add(from.code, ORIGIN_WEIGHT);
  for (const s of stationsAhead(line, from.code, to.code)) add(s.code, AHEAD_WEIGHT);
  if (spots.length === 0) {
    const g = line.geometry;
    spots.push({ positionM: (g.carCount * (g.carLengthM + g.couplerGapM)) / 2, weight: FALLBACK_HOTSPOT_WEIGHT });
  }
  return spots;
}

export function crowdLevels(loads: number[]): CrowdLevel[] {
  const mean = loads.reduce((a, b) => a + b, 0) / loads.length;
  return loads.map((l) => (l < mean * (1 - CROWD_BAND) ? "quieter" : l > mean * (1 + CROWD_BAND) ? "busier" : "average"));
}

export function plan(q: PlanQuery): { ok: true; plan: Plan } | { ok: false; error: PlanError } {
  const line = getLine(q.line);
  if (!line) return { ok: false, error: { kind: "unknown-line" } };
  const from = line.stations.find((s) => s.code === q.from);
  const to = line.stations.find((s) => s.code === q.to);
  if (!from || !to) return { ok: false, error: { kind: "unknown-station" } };
  const direction = directionBetween(line, from.code, to.code);
  if (!direction) return { ok: false, error: { kind: "same-station" } };
  if (!stationEgress(line.id, to.code)) return { ok: false, error: { kind: "no-layout", to } };

  const egress = resolveEgress(line, to.code, q.community, q.demo);
  const target = egress.find((s) => s.def.id === q.egressId) ?? egress[0];
  const g = line.geometry;

  const live = q.liveLoadsPct && q.liveLoadsPct.length === g.carCount ? q.liveLoadsPct : null;
  const est = estimateCarLoads({
    geometry: g,
    hotspots: hotspotsFor(line, from, to, q.community, q.demo),
    hour: q.hour,
    dayType: q.dayType,
    linePeakPct: line.peakLoadPct,
    delayS: q.delayS,
  });
  const loadsPct = live ?? est.loadsPct;
  const meanLoadPct = Math.round(loadsPct.reduce((a, b) => a + b, 0) / loadsPct.length);

  let door: DoorPlan | null = null;
  const t = toEgress(target);
  if (t && target.source) {
    const candidates = buildCandidates(g, t, loadsPct);
    const trust = live ? 1 : ESTIMATE_TRUST;
    door = {
      target: t,
      positionSource: target.source,
      candidates,
      solution: solve(candidates, q.speedWeight, trust),
      breakpoints: breakpoints(candidates, 100, trust),
      stability: recommendationStability(g, t, loadsPct, q.speedWeight, { sigma: live ? 0.1 : 0.2, crowdTrust: trust }),
    };
  }

  return {
    ok: true,
    plan: {
      line, from, to, direction, egress, target, loadsPct,
      loadSource: live ? "odpt-live" : "estimate",
      meanLoadPct,
      crowd: crowdLevels(loadsPct),
      peak: est.timeFactor >= 0.6,
      door,
    },
  };
}
