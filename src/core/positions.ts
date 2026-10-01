import { doorPositionM } from "@/engine/geometry";
import type { Egress } from "@/engine/types";
import { DEMO_POSITIONS, stationEgress, SURVEYED, type EgressDef } from "@/data/layouts";
import type { Line } from "@/data/network";
import type { Consensus } from "./consensus";

/** Where a platform position came from. Anything else means "unknown". */
export type PositionSource = "surveyed" | "community" | "demo";

/** Community consensus per station and egress id, as served by /api/layouts. */
export type CommunityBook = Record<string, Record<string, Consensus>>;

export interface EgressState {
  def: EgressDef;
  /** null = position unknown: no recommendation may be made towards it. */
  positionM: number | null;
  source: PositionSource | null;
  consensus: Consensus | null;
}

/**
 * Precedence: maintainer survey > community-verified consensus > demo value
 * (only when demo mode is explicitly on) > unknown. Pending or disputed
 * community reports never produce a position.
 */
export function resolveEgress(line: Line, station: string, community: CommunityBook | null, demo: boolean): EgressState[] {
  const defs = stationEgress(line.id, station)?.egress ?? [];
  return defs.map((def) => {
    const c = community?.[station]?.[def.id] ?? null;
    const s = SURVEYED[def.id];
    if (s) return { def, positionM: doorPositionM(line.geometry, s.car, s.door), source: "surveyed", consensus: c };
    if (c?.status === "verified" && c.positionM !== undefined) return { def, positionM: c.positionM, source: "community", consensus: c };
    if (demo && DEMO_POSITIONS[def.id] !== undefined) return { def, positionM: DEMO_POSITIONS[def.id], source: "demo", consensus: c };
    return { def, positionM: null, source: null, consensus: c };
  });
}

export function toEgress(s: EgressState): Egress | null {
  return s.positionM === null ? null : { ...s.def, positionM: s.positionM };
}
