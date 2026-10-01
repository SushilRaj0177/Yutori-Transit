import type { Bilingual } from "@/engine/types";
import { stationsBehind, type Direction, type Line } from "@/data/network";
import { timetableMinute } from "./time";

/**
 * Live data as the browser receives it. Every block may be null: null means
 * "not available", never "zero". The UI must not fill gaps with made-up values.
 */
export interface LiveSnapshot {
  fetchedAt: string;
  odptConfigured: boolean;
  service: ServiceStatus | null;
  approaching: ApproachingTrain[] | null;
  /** False when ODPT returned no train records at all for the line (not published). */
  positionsPublished: boolean;
  departures: Departure[] | null;
  /** Per-car load for the next train, only if ODPT actually published one. */
  carLoadsPct: number[] | null;
  errors: string[];
}

export interface ServiceStatus {
  disrupted: boolean;
  text: Bilingual | null;
  updatedAt: string | null;
}

export interface ApproachingTrain {
  trainNumber: string;
  trainType: Bilingual | null;
  destination: Bilingual | null;
  delayS: number;
  /** 0 = at the origin platform; 1.5 = between the 2nd and 1st station behind. */
  stationsAway: number;
  position: Bilingual;
}

export interface Departure {
  time: string;
  minutesFromNow: number;
  destination: Bilingual | null;
  trainType: Bilingual | null;
}

type LangMap = { ja?: string; en?: string } | string | undefined;

export function bilingual(v: LangMap): Bilingual | null {
  if (!v) return null;
  if (typeof v === "string") return { en: v, ja: v };
  const en = v.en ?? v.ja;
  const ja = v.ja ?? v.en;
  return en && ja ? { en, ja } : null;
}

/** Name for an ODPT station id; falls back to the id's last segment for other lines. */
export function stationName(line: Line, odptId: string | null | undefined): Bilingual | null {
  if (!odptId) return null;
  const s = line.stations.find((x) => x.odpt === odptId);
  if (s) return s.name;
  const tail = odptId.split(".").pop() ?? odptId;
  return { en: tail, ja: tail };
}

const TRAIN_TYPES: Record<string, Bilingual> = {
  "odpt.TrainType:TokyoMetro.Local": { en: "Local", ja: "各停" },
};

export function trainTypeName(id: string | undefined): Bilingual | null {
  if (!id) return null;
  return TRAIN_TYPES[id] ?? { en: id.split(".").pop() ?? id, ja: id.split(".").pop() ?? id };
}

export function parseService(items: { "odpt:trainInformationStatus"?: LangMap; "odpt:trainInformationText"?: LangMap; "dc:date"?: string }[]): ServiceStatus | null {
  const info = items[0];
  if (!info) return null;
  // ODPT omits the status field during normal operation and sets it when something is wrong.
  return {
    disrupted: Boolean(bilingual(info["odpt:trainInformationStatus"])),
    text: bilingual(info["odpt:trainInformationText"]),
    updatedAt: info["dc:date"] ?? null,
  };
}

interface TrainLike {
  "odpt:railDirection"?: string;
  "odpt:trainNumber"?: string;
  "odpt:trainType"?: string;
  "odpt:fromStation"?: string | null;
  "odpt:toStation"?: string | null;
  "odpt:destinationStation"?: string[] | null;
  "odpt:delay"?: number;
  [key: string]: unknown;
}

/** Trains heading towards the origin in the travel direction, nearest first. */
export function parseApproaching(line: Line, originOdpt: string, originCode: string, direction: Direction, trains: TrainLike[]): ApproachingTrain[] {
  const behind = stationsBehind(line, originCode, direction);
  const out: ApproachingTrain[] = [];
  for (const t of trains) {
    if (t["odpt:railDirection"] !== direction.odpt) continue;
    const from = t["odpt:fromStation"];
    const to = t["odpt:toStation"];
    let away: number;
    if (from === originOdpt && !to) away = 0;
    else {
      const k = behind.findIndex((s) => s.odpt === from);
      if (k < 0) continue; // already past the origin, or on a branch we do not model
      away = to ? k + 0.5 : k + 1;
    }
    const fromName = stationName(line, from) ?? { en: "?", ja: "?" };
    const toName = stationName(line, to);
    out.push({
      trainNumber: t["odpt:trainNumber"] ?? "?",
      trainType: trainTypeName(t["odpt:trainType"]),
      destination: stationName(line, t["odpt:destinationStation"]?.[0]),
      delayS: Math.max(0, t["odpt:delay"] ?? 0),
      stationsAway: away,
      position: toName
        ? { en: `${fromName.en} → ${toName.en}`, ja: `${fromName.ja} → ${toName.ja}` }
        : { en: `At ${fromName.en}`, ja: `${fromName.ja}に停車中` },
    });
  }
  return out.sort((a, b) => a.stationsAway - b.stationsAway).slice(0, 3);
}

/**
 * Per-car load from a live train record. ODPT's documented Train schema has no
 * per-car load field; if a feed (e.g. a Challenge dataset) adds one, set
 * ODPT_CAR_LOAD_FIELD to its key and it is used only when it is a numeric array
 * with exactly one value per car.
 */
export function extractCarLoads(train: TrainLike | undefined, field: string | undefined, carCount: number): number[] | null {
  if (!train || !field) return null;
  const v = train[field];
  if (!Array.isArray(v) || v.length !== carCount || !v.every((x) => typeof x === "number" && Number.isFinite(x))) return null;
  // Accept either fractions (1.2) or percentages (120).
  const scale = v.every((x) => x <= 3) ? 100 : 1;
  return v.map((x) => Math.round(x * scale));
}

export function parseDepartures(
  line: Line,
  timetables: { "odpt:calendar"?: string; "odpt:stationTimetableObject"?: { "odpt:departureTime"?: string; "odpt:destinationStation"?: string[]; "odpt:trainType"?: string }[] }[],
  calendar: string,
  nowMinute: number,
  count = 3,
): Departure[] | null {
  const tt = timetables.find((t) => t["odpt:calendar"] === calendar);
  if (!tt) return null;
  const out: Departure[] = [];
  for (const o of tt["odpt:stationTimetableObject"] ?? []) {
    const time = o["odpt:departureTime"];
    const m = time ? timetableMinute(time) : null;
    if (m === null || m < nowMinute) continue;
    out.push({
      time: time!,
      minutesFromNow: m - nowMinute,
      destination: stationName(line, o["odpt:destinationStation"]?.[0]),
      trainType: trainTypeName(o["odpt:trainType"]),
    });
  }
  return out.sort((a, b) => a.minutesFromNow - b.minutesFromNow).slice(0, count);
}
