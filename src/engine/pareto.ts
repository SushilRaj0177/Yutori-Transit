import type { DoorCandidate, ScoredCandidate, Solution } from "./types";

/** a dominates b: no worse on both objectives and strictly better on at least one. */
export function dominates(a: DoorCandidate, b: DoorCandidate): boolean {
  return a.egressS <= b.egressS && a.loadPct <= b.loadPct && (a.egressS < b.egressS || a.loadPct < b.loadPct);
}

/**
 * Indices of the non-dominated candidates, in O(n log n): sort by time, then
 * sweep keeping the lowest load seen among strictly faster candidates.
 * Exact duplicates do not dominate each other, so both are kept.
 */
export function paretoFrontier(cands: readonly DoorCandidate[]): Set<number> {
  const order = cands.map((_, i) => i).sort((i, j) => cands[i].egressS - cands[j].egressS || cands[i].loadPct - cands[j].loadPct);
  const keep = new Set<number>();
  let bestLoadFaster = Infinity;
  let k = 0;
  while (k < order.length) {
    // Group candidates that tie on time; inside a group only the lowest load survives.
    let end = k;
    while (end < order.length && cands[order[end]].egressS === cands[order[k]].egressS) end++;
    const groupMin = cands[order[k]].loadPct;
    for (let m = k; m < end; m++) {
      const c = cands[order[m]];
      if (c.loadPct === groupMin && c.loadPct < bestLoadFaster) keep.add(order[m]);
    }
    bestLoadFaster = Math.min(bestLoadFaster, groupMin);
    k = end;
  }
  return keep;
}

/**
 * Fixed scales for the two objectives. Min–max normalising over the candidates
 * (the first version of this engine) turns a meaningless 42% vs 54% spread —
 * seats free in every car — into the full crowding range and lets it outweigh a
 * real walking difference. Absolute scales keep the slider's meaning the same
 * at every station and time of day.
 */
export const SCALE = {
  /** Egress time that counts as "as slow as it gets". */
  timeS: 90,
  /** Below this load there are seats free: no discomfort. */
  comfortFreePct: 50,
  /** At this load the car is as bad as it gets (Tokyo "crush" territory). */
  comfortWorstPct: 200,
} as const;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const timeCost = (egressS: number) => clamp01(egressS / SCALE.timeS);
export const crowdCost = (loadPct: number) => clamp01((loadPct - SCALE.comfortFreePct) / (SCALE.comfortWorstPct - SCALE.comfortFreePct));

/**
 * J(c, d) = w_speed · T_norm(c, d) + (1 − w_speed) · trust · C_norm(c), on the fixed scales above.
 *
 * `crowdTrust` discounts the crowding term when loads are only estimated
 * (ESTIMATE_TRUST): walking distance from a verified position is a measurement,
 * a rule-of-thumb crowding estimate is not, and a guess should not overrule a
 * measurement at equal weight. Live loads use trust 1. The Pareto frontier
 * does not depend on it.
 */
export const ESTIMATE_TRUST = 0.5;

export function solve(cands: readonly DoorCandidate[], speedWeight: number, crowdTrust = 1): Solution {
  if (cands.length === 0) throw new Error("no candidates");
  const w = Math.min(1, Math.max(0, speedWeight));
  const front = paretoFrontier(cands);

  const scored: ScoredCandidate[] = cands.map((c, i) => ({
    ...c,
    cost: w * timeCost(c.egressS) + (1 - w) * crowdTrust * crowdCost(c.loadPct),
    pareto: front.has(i),
  }));
  const ranked = [...scored].sort(
    (a, b) => a.cost - b.cost || a.egressS - b.egressS || a.loadPct - b.loadPct || a.car - b.car || a.door - b.door,
  );
  const frontier = scored.filter((s) => s.pareto).sort((a, b) => a.egressS - b.egressS);
  return {
    best: ranked[0],
    ranked,
    frontier,
    fastest: frontier[0],
    roomiest: frontier[frontier.length - 1],
  };
}

/**
 * Slider positions at which the recommendation changes. Lets the UI show the
 * user that, e.g., everything between 0.35 and 0.70 gives the same door.
 */
export function breakpoints(cands: readonly DoorCandidate[], steps = 100, crowdTrust = 1): { from: number; to: number; car: number; door: number }[] {
  const out: { from: number; to: number; car: number; door: number }[] = [];
  for (let s = 0; s <= steps; s++) {
    const w = s / steps;
    const { best } = solve(cands, w, crowdTrust);
    const last = out[out.length - 1];
    if (last && last.car === best.car && last.door === best.door) last.to = w;
    else out.push({ from: w, to: w, car: best.car, door: best.door });
  }
  return out;
}
