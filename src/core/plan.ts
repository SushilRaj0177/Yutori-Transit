import { estimateCarLoads, type DayType, type Hotspot } from "@/engine/crowding";
import { buildCandidates } from "@/engine/geometry";
import { breakpoints, ESTIMATE_TRUST, solve } from "@/engine/pareto";
import { recommendationStability, type Stability } from "@/engine/stability";
import type { DoorCandidate, Provenance, Solution } from "@/engine/types";
import { surveyStation, type Dir } from "@/data/survey";
import { directionBetween, getLine, stationsAhead, type Direction, type Line, type Station } from "@/data/network";
import { resolveDestinations, surveyPoints, type CommunityBook, type DestinationState } from "./positions";

export interface PlanQuery {
  line: string;
  from: string;
  to: string;
  destId?: string;
  /** 0 = most space, 1 = fastest exit. */
  speedWeight: number;
  hour: number;
  dayType: DayType;
  delayS?: number;
  /** Per-car load from a live source, if one exists. Overrides the estimate. */
  liveLoadsPct?: number[] | null;
  /** Rider reports; used to flag possible changes, never to override the survey. */
  community: CommunityBook | null;
  /** Only use elevator / same-level routes. */
  stepFree: boolean;
}

export type CrowdLevel = "quieter" | "average" | "busier";

export interface DoorPlan {
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
  dir: Dir;
  destinations: DestinationState[];
  target: DestinationState;
  source: { url: string; updated: string | null };
  alternatingPlatforms: boolean;
  /** Gates whose entries for this direction were dropped as self-contradictory. */
  omitted: string[];
  loadsPct: number[];
  loadSource: Extract<Provenance, "odpt-live" | "estimate">;
  crowd: CrowdLevel[];
  peak: boolean;
  /** null when the target has no usable access point (e.g. no step-free route listed). */
  door: DoorPlan | null;
}

export type PlanError = { kind: "unknown-line" } | { kind: "unknown-station" } | { kind: "same-station" } | { kind: "no-data"; to: Station };

const ORIGIN_WEIGHT = 1;
const AHEAD_WEIGHT = 0.6;
const FALLBACK_HOTSPOT_WEIGHT = 0.5;
/** Within ±7% of the train average counts as "average": finer distinctions are below the model's resolution. */
const CROWD_BAND = 0.07;

/**
 * Where riders on this train bunch up: at the stairs where they boarded (origin
 * platform) and near the stairs they will use at the stations ahead. Positions
 * come from the survey for the direction of travel.
 */
export function hotspotsFor(line: Line, from: Station, to: Station, dir: Dir): Hotspot[] {
  const spots: Hotspot[] = [];
  const add = (code: string, w: number) => {
    for (const d of resolveDestinations(line, code, dir, null, false)) for (const p of surveyPoints(line.geometry, d.dest, false)) spots.push({ positionM: p.positionM, weight: w / Math.max(1, d.dest.points.length) });
  };
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
  const dir: Dir = direction === line.towardsFirst ? "towardsFirst" : "towardsLast";

  const st = surveyStation(line.id, to.code);
  const destinations = resolveDestinations(line, to.code, dir, q.community, q.stepFree);
  if (!st || destinations.length === 0) return { ok: false, error: { kind: "no-data", to } };
  const target = destinations.find((d) => d.dest.id === q.destId) ?? destinations[0];
  const g = line.geometry;

  const live = q.liveLoadsPct && q.liveLoadsPct.length === g.carCount ? q.liveLoadsPct : null;
  const est = estimateCarLoads({ geometry: g, hotspots: hotspotsFor(line, from, to, dir), hour: q.hour, dayType: q.dayType, linePeakPct: line.peakLoadPct, delayS: q.delayS });
  const loadsPct = live ?? est.loadsPct;

  let door: DoorPlan | null = null;
  if (target.points.length > 0) {
    const candidates = buildCandidates(g, target.points, loadsPct);
    const trust = live ? 1 : ESTIMATE_TRUST;
    door = {
      candidates,
      solution: solve(candidates, q.speedWeight, trust),
      breakpoints: breakpoints(candidates, 100, trust),
      stability: recommendationStability(g, target.points, loadsPct, q.speedWeight, { sigma: live ? 0.1 : 0.2, crowdTrust: trust }),
    };
  }

  return {
    ok: true,
    plan: {
      line, from, to, direction, dir, destinations, target,
      source: { url: st.source, updated: st.updated },
      alternatingPlatforms: st.alternatingPlatforms,
      omitted: st.omitted.filter((o) => o.direction === dir).map((o) => o.gate.replace(/^B?\d+F:/, "")),
      loadsPct,
      loadSource: live ? "odpt-live" : "estimate",
      crowd: crowdLevels(loadsPct),
      peak: est.timeFactor >= 0.6,
      door,
    },
  };
}
