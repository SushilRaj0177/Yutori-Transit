import { carCentreM } from "./geometry";
import type { TrainGeometry } from "./types";

/**
 * Per-car crowding ESTIMATE.
 *
 * ODPT's public train feed does not (as far as this project has verified) publish
 * per-car load, so when no live per-car figure is available the app falls back to
 * this model and labels every number it produces as an estimate.
 *
 * Shape of the model (see docs/MODEL.md for the reasoning and how to calibrate it):
 *   load(c) = mean(t, day, delay) · shape(c)
 *   mean    = linePeak · timeOfDay(t, day) · (1 + delayBoost)
 *   shape   = 1 + A · (k(c) − mean k),  k(c) = Σ_h w_h · exp(−(dist(c, h)/σ)²)
 * Riders board near the stairs at their origin and stand near the exit they will
 * use later, so cars close to those "hotspots" carry more people than the ends.
 */

export const CROWD = {
  /** Gaussian width of a hotspot's pull along the platform, metres. */
  sigmaM: 22,
  /** How strongly hotspots skew the load away from the line average. */
  amplitude: 0.55,
  /** Extra load per 10 minutes of delay, capped at 10 minutes (passengers accumulate). */
  delayBoostPer10Min: 0.2,
  minPct: 10,
  maxPct: 230,
} as const;

export type DayType = "weekday" | "holiday";

export interface Hotspot {
  positionM: number;
  weight: number;
}

export interface CrowdInput {
  geometry: TrainGeometry;
  hotspots: Hotspot[];
  /** Hour of day in Japan time, fractional (8.5 = 08:30). */
  hour: number;
  dayType: DayType;
  /** Typical peak-hour load of the line in %, an input assumption per line. */
  linePeakPct: number;
  /** Live delay of the approaching train in seconds, if known. */
  delayS?: number;
}

export interface CrowdEstimate {
  loadsPct: number[];
  meanPct: number;
  timeFactor: number;
  delayBoost: number;
}

const gauss = (x: number, mu: number, s: number) => Math.exp(-(((x - mu) / s) ** 2));

/** Relative demand by time of day, 1.0 at the weekday morning peak. */
export function timeOfDayFactor(hour: number, day: DayType): number {
  const h = ((hour % 24) + 24) % 24;
  if (day === "holiday") return 0.22 + 0.33 * gauss(h, 14, 3.5);
  // Late night through first trains are quiet; morning peak is sharp, evening peak broader.
  return Math.min(1, 0.22 + 0.78 * gauss(h, 8.2, 0.85) + 0.42 * gauss(h, 18.4, 1.5) + 0.12 * gauss(h, 12.5, 2.5));
}

export function estimateCarLoads(input: CrowdInput): CrowdEstimate {
  const { geometry: g, hotspots } = input;
  const timeFactor = timeOfDayFactor(input.hour, input.dayType);
  const delayBoost = (Math.min(600, Math.max(0, input.delayS ?? 0)) / 600) * CROWD.delayBoostPer10Min;
  const meanPct = Math.max(CROWD.minPct + 5, input.linePeakPct * timeFactor * (1 + delayBoost));

  const k = Array.from({ length: g.carCount }, (_, i) => {
    const x = carCentreM(g, i + 1);
    return hotspots.reduce((sum, h) => sum + h.weight * gauss(x, h.positionM, CROWD.sigmaM), 0);
  });
  const kMax = Math.max(...k, 1e-9);
  const kn = k.map((v) => v / kMax);
  const kMean = kn.reduce((a, b) => a + b, 0) / kn.length;

  const loadsPct = kn.map((v) => {
    const pct = meanPct * (1 + CROWD.amplitude * (v - kMean));
    return Math.round(Math.min(CROWD.maxPct, Math.max(CROWD.minPct, pct)));
  });
  return { loadsPct, meanPct: Math.round(meanPct), timeFactor, delayBoost };
}
