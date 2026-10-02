import { doorPositionM } from "@/engine/geometry";
import type { Egress, TrainGeometry } from "@/engine/types";
import { destinationsFor, engineKind, type Destination, type Dir } from "@/data/survey";
import type { Line } from "@/data/network";
import type { Consensus } from "./consensus";

/** Rider reports per station and destination id, as served by /api/layouts. */
export type CommunityBook = Record<string, Record<string, Consensus>>;

export interface DestinationState {
  dest: Destination;
  /** Access points usable under the current step-free setting. Empty = none usable. */
  points: Egress[];
  consensus: Consensus | null;
  /**
   * Riders have verified a position for this destination that is more than one
   * door away from every surveyed point: the platform may have changed.
   */
  ridersDisagree: boolean;
}

export function surveyPoints(g: TrainGeometry, d: Destination, stepFreeOnly: boolean): Egress[] {
  const out: Egress[] = [];
  d.points.forEach((p, i) => {
    if (stepFreeOnly && !p.stepFree) return;
    p.doors.forEach((door, j) =>
      out.push({
        id: `${d.id}#${i}.${j}`,
        kind: engineKind(p.kind, stepFreeOnly),
        positionM: doorPositionM(g, door.car, door.door),
        leadsTo: { en: d.gateName, ja: d.gateName },
        stepFree: p.stepFree,
      }),
    );
  });
  return out;
}

export function resolveDestinations(line: Line, station: string, dir: Dir, community: CommunityBook | null, stepFreeOnly: boolean): DestinationState[] {
  const g = line.geometry;
  const spacing = g.carLengthM / g.doorOffsetsM.length + 0.01;
  return destinationsFor(line.id, station, dir).map((dest) => {
    const consensus = community?.[station]?.[dest.id] ?? null;
    const all = surveyPoints(g, dest, false);
    const ridersDisagree =
      consensus?.status === "verified" && consensus.positionM !== undefined && all.every((p) => Math.abs(p.positionM - consensus.positionM!) > spacing);
    return { dest, points: surveyPoints(g, dest, stepFreeOnly), consensus, ridersDisagree };
  });
}
