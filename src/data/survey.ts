import type { Bilingual, EgressKind } from "@/engine/types";
import raw from "./survey.json";

/**
 * Platform positions from 「電車の停車位置」 (wadattsu261.com), an on-site survey of
 * which car and door is nearest each staircase, escalator and elevator on
 * every station platform. Extracted by scripts/survey/parse.mts; see docs/DATA.md.
 */

export type Dir = "towardsFirst" | "towardsLast";

export interface SurveyPoint {
  platform: number;
  direction: Dir;
  gate: string;
  exits: string[];
  transfers: string[];
  kind: string;
  stepFree: boolean;
  /** Physical door labels as marked on the platform (○号車○番ドア). */
  doors: { car: number; door: number }[];
}

export interface SurveyStation {
  line: "M" | "G";
  station: string;
  source: string;
  updated: string | null;
  alternatingPlatforms: boolean;
  points: SurveyPoint[];
  /** Entries left out because the source contradicts itself (see scripts/survey/parse.mts). */
  omitted: { direction: Dir; gate: string }[];
}

export const SURVEY = raw as { source: string; retrieved: string; stations: SurveyStation[] };

export function surveyStation(line: string, station: string): SurveyStation | undefined {
  return SURVEY.stations.find((s) => s.line === line && s.station === station);
}

export const TRANSFER_NAMES: Record<string, Bilingual> = {
  shinkansen: { en: "Shinkansen", ja: "新幹線" },
  jr: { en: "JR lines", ja: "JR線" },
  "toei-asakusa": { en: "Toei Asakusa Line", ja: "都営浅草線" },
  "toei-mita": { en: "Toei Mita Line", ja: "都営三田線" },
  "toei-shinjuku": { en: "Toei Shinjuku Line", ja: "都営新宿線" },
  "toei-oedo": { en: "Toei Oedo Line", ja: "都営大江戸線" },
  tozai: { en: "Tozai Line", ja: "東西線" },
  chiyoda: { en: "Chiyoda Line", ja: "千代田線" },
  hanzomon: { en: "Hanzomon Line", ja: "半蔵門線" },
  hibiya: { en: "Hibiya Line", ja: "日比谷線" },
  yurakucho: { en: "Yurakucho Line", ja: "有楽町線" },
  fukutoshin: { en: "Fukutoshin Line", ja: "副都心線" },
  namboku: { en: "Namboku Line", ja: "南北線" },
  ginza: { en: "Ginza Line", ja: "銀座線" },
  marunouchi: { en: "Marunouchi Line", ja: "丸ノ内線" },
  tobu: { en: "Tobu lines", ja: "東武線" },
  seibu: { en: "Seibu lines", ja: "西武線" },
  keio: { en: "Keio lines", ja: "京王線" },
  odakyu: { en: "Odakyu Line", ja: "小田急線" },
  keisei: { en: "Keisei lines", ja: "京成線" },
  tokyu: { en: "Tokyu lines", ja: "東急線" },
  yurikamome: { en: "Yurikamome", ja: "ゆりかもめ" },
};

/** Engine kind for a published kind text. Mixed stairs+elevator counts as stairs unless step-free is requested. */
export function engineKind(kindJa: string, stepFreeOnly: boolean): EgressKind {
  const hasLift = /エレベーター/.test(kindJa);
  if (stepFreeOnly && hasLift) return "elevator";
  if (/エスカレーター/.test(kindJa)) return "escalator";
  if (/階段/.test(kindJa)) return "stairs";
  if (hasLift) return "elevator";
  return "way"; // a gate on the platform itself, or a walking route
}

export interface Destination {
  /** Stable id: station + direction + gate (+ platform when platforms alternate). */
  id: string;
  gate: string;
  /** Gate name without floor prefix, for display. */
  gateName: string;
  exits: string[];
  transfers: string[];
  platform: number | null;
  points: SurveyPoint[];
  hasStepFree: boolean;
}

/** Short stable hash so report ids survive re-extraction as long as the gate name does. */
function hash(s: string): string {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.codePointAt(0)!, 16777619);
  return (h >>> 0).toString(36);
}

/** Where riders arriving in this direction can go, grouped by ticket gate. */
export function destinationsFor(line: string, station: string, dir: Dir): Destination[] {
  const st = surveyStation(line, station);
  if (!st) return [];
  const groups = new Map<string, Destination>();
  for (const p of st.points) {
    if (p.direction !== dir) continue;
    const platform = st.alternatingPlatforms ? p.platform : null;
    const key = `${p.gate}|${platform ?? ""}`;
    let d = groups.get(key);
    if (!d) {
      d = {
        id: `${station}.${dir === "towardsFirst" ? "f" : "l"}.${hash(key)}`,
        gate: p.gate,
        gateName: p.gate.replace(/^B?\d+F:/, "").replace(/^(\d+番線ホーム側):/, "$1 "),
        exits: [],
        transfers: [],
        platform,
        points: [],
        hasStepFree: false,
      };
      groups.set(key, d);
    }
    d.points.push(p);
    d.hasStepFree ||= p.stepFree;
    for (const e of p.exits) if (!d.exits.includes(e)) d.exits.push(e);
    for (const t of p.transfers) if (!d.transfers.includes(t)) d.transfers.push(t);
  }
  return [...groups.values()];
}

export function findDestination(line: string, station: string, id: string): Destination | undefined {
  for (const dir of ["towardsFirst", "towardsLast"] as const) {
    const d = destinationsFor(line, station, dir).find((x) => x.id === id);
    if (d) return d;
  }
  return undefined;
}

/** Short bilingual label: transfers first, then exit numbers, then the gate name. */
export function destinationLabel(d: Destination): Bilingual {
  const t = d.transfers.map((k) => TRANSFER_NAMES[k]).filter(Boolean);
  const exits = d.exits.length ? d.exits.join(", ") : "";
  const en = [t.map((x) => x.en).join(", "), exits && `Exits ${exits}`].filter(Boolean).join(" · ") || (d.gate ? d.gateName : "Ticket gate");
  const ja = [t.map((x) => x.ja).join("・"), exits && `${exits}出口`].filter(Boolean).join("・") || (d.gate ? d.gateName : "改札口");
  return { en, ja };
}
