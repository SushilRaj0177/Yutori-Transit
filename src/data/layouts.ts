import type { EgressKind } from "@/engine/types";
import type { Bilingual } from "@/engine/types";

/**
 * Platform exits and transfers ("egress points") per destination platform.
 *
 * The CONNECTIONS below are real: each station has these stairs, escalators
 * and lifts leading to these lines and exits. Their POSITIONS along the
 * platform are not part of any open dataset (ODPT does not publish them; see
 * docs/DATA.md), so a position only becomes usable once it is:
 *   - surveyed: checked by a maintainer on site and recorded in SURVEYED, or
 *   - community-verified: at least 3 riders independently reported the same
 *     car and door (src/core/consensus.ts).
 *
 * DEMO_POSITIONS are illustrative values invented to show how the app works.
 * They are used ONLY in the explicitly labelled demo mode and never for real
 * recommendations.
 */

export interface EgressDef {
  id: string;
  kind: EgressKind;
  leadsTo: Bilingual;
  stepFree: boolean;
}

export interface StationEgress {
  line: "M" | "G";
  station: string; // station code
  egress: EgressDef[];
}

/** Maintainer-surveyed positions: egress id → car and door as signed on the platform. */
export const SURVEYED: Record<string, { car: number; door: number; surveyedOn: string; note?: string }> = {};

const e = (id: string, kind: EgressKind, en: string, ja: string, stepFree = kind === "elevator"): EgressDef => ({ id, kind, leadsTo: { en, ja }, stepFree });

export const STATION_EGRESS: StationEgress[] = [
  {
    line: "M", station: "M08",
    egress: [
      e("m08-west", "way", "JR, Odakyu & Keio (West Gate side)", "JR・小田急・京王（西口方面）"),
      e("m08-lift", "elevator", "Ticket gates (step-free)", "改札（段差なし）"),
      e("m08-east", "way", "East Exit side", "東口方面"),
      e("m08-toei", "way", "Toei Shinjuku & Oedo lines", "都営新宿線・大江戸線"),
    ],
  },
  {
    line: "M", station: "M15",
    egress: [
      e("m15-hibiya", "way", "Hibiya Line", "日比谷線"),
      e("m15-chiyoda", "way", "Chiyoda Line", "千代田線"),
      e("m15-lift", "elevator", "Ticket gates (step-free)", "改札（段差なし）"),
      e("m15-gov", "way", "Government offices exits", "官庁街方面出口"),
    ],
  },
  {
    line: "M", station: "M16",
    egress: [
      e("m16-hibiya", "way", "Hibiya Line", "日比谷線"),
      e("m16-ginza", "way", "Ginza Line", "銀座線"),
      e("m16-lift", "elevator", "Ticket gates (step-free)", "改札（段差なし）"),
      e("m16-chuo", "way", "Exits towards Ginza 4-chome / Sukiyabashi", "銀座四丁目・数寄屋橋方面出口"),
    ],
  },
  {
    line: "M", station: "M17",
    egress: [
      e("m17-jr", "way", "JR lines & Shinkansen", "JR線・新幹線"),
      e("m17-lift", "elevator", "Ticket gates (step-free)", "改札（段差なし）"),
      e("m17-maru", "way", "Marunouchi side exits", "丸の内方面出口"),
    ],
  },
  {
    line: "M", station: "M18",
    egress: [
      e("m18-tozai", "way", "Tozai Line", "東西線"),
      e("m18-chiyoda", "way", "Chiyoda Line", "千代田線"),
      e("m18-lift", "elevator", "Ticket gates (step-free)", "改札（段差なし）"),
      e("m18-hanzomon", "way", "Hanzomon & Toei Mita lines", "半蔵門線・都営三田線"),
      e("m18-tokyo", "way", "Walkway to Tokyo Station", "東京駅方面連絡通路"),
    ],
  },
  {
    line: "M", station: "M25",
    egress: [
      e("m25-seibu", "way", "Seibu Line & East Exit", "西武線・東口"),
      e("m25-jr", "way", "JR lines (central gates)", "JR線（中央改札）"),
      e("m25-lift", "elevator", "Ticket gates (step-free)", "改札（段差なし）"),
      e("m25-tobu", "way", "Tobu Line, Yurakucho & Fukutoshin lines", "東武線・有楽町線・副都心線"),
    ],
  },
  {
    line: "G", station: "G01",
    egress: [
      e("g01-jr", "way", "JR lines", "JR線"),
      e("g01-lift", "elevator", "Ticket gates (step-free)", "改札（段差なし）"),
      e("g01-inokashira", "way", "Keio Inokashira Line", "京王井の頭線"),
      e("g01-hanzomon", "way", "Hanzomon, Fukutoshin & Tokyu lines", "半蔵門線・副都心線・東急線"),
    ],
  },
  {
    line: "G", station: "G02",
    egress: [
      e("g02-hanzomon", "way", "Hanzomon Line", "半蔵門線"),
      e("g02-chiyoda", "way", "Chiyoda Line", "千代田線"),
      e("g02-lift", "elevator", "Ticket gates (step-free)", "改札（段差なし）"),
      e("g02-exit", "way", "Exits towards Omotesando / Aoyama-dori", "表参道・青山通り方面出口"),
    ],
  },
  {
    line: "G", station: "G08",
    egress: [
      e("g08-jr", "way", "JR lines", "JR線"),
      e("g08-lift", "elevator", "Ticket gates (step-free)", "改札（段差なし）"),
      e("g08-asakusa", "way", "Toei Asakusa Line", "都営浅草線"),
      e("g08-yurikamome", "way", "Yurikamome Line", "ゆりかもめ"),
    ],
  },
  {
    line: "G", station: "G09",
    egress: [
      e("g09-marunouchi", "way", "Marunouchi Line", "丸ノ内線"),
      e("g09-lift", "elevator", "Ticket gates (step-free)", "改札（段差なし）"),
      e("g09-hibiya", "way", "Hibiya Line", "日比谷線"),
      e("g09-chuo", "way", "Exits towards Ginza 4-chome crossing", "銀座四丁目交差点方面出口"),
    ],
  },
  {
    line: "G", station: "G16",
    egress: [
      e("g16-jr", "way", "JR lines & Shinkansen", "JR線・新幹線"),
      e("g16-hibiya", "way", "Hibiya Line", "日比谷線"),
      e("g16-lift", "elevator", "Ticket gates (step-free)", "改札（段差なし）"),
      e("g16-keisei", "way", "Keisei Line", "京成線"),
    ],
  },
  {
    line: "G", station: "G19",
    egress: [
      e("g19-kaminarimon", "way", "Kaminarimon & Senso-ji", "雷門・浅草寺方面"),
      e("g19-lift", "elevator", "Ticket gates (step-free)", "改札（段差なし）"),
      e("g19-toei", "way", "Toei Asakusa Line", "都営浅草線"),
      e("g19-tobu", "way", "Tobu Skytree Line", "東武スカイツリーライン"),
    ],
  },
];

/** ILLUSTRATIVE ONLY — invented positions (metres from the car-1 end) for demo mode. Not real data. */
export const DEMO_POSITIONS: Record<string, number> = {
  "m08-west": 14,
  "m08-lift": 47,
  "m08-east": 63,
  "m08-toei": 98,
  "m15-hibiya": 20,
  "m15-chiyoda": 58,
  "m15-lift": 74,
  "m15-gov": 102,
  "m16-hibiya": 12,
  "m16-ginza": 50,
  "m16-lift": 66,
  "m16-chuo": 95,
  "m17-jr": 52,
  "m17-lift": 60,
  "m17-maru": 92,
  "m18-tozai": 10,
  "m18-chiyoda": 38,
  "m18-lift": 55,
  "m18-hanzomon": 82,
  "m18-tokyo": 104,
  "m25-seibu": 16,
  "m25-jr": 54,
  "m25-lift": 63,
  "m25-tobu": 96,
  "g01-jr": 14,
  "g01-lift": 42,
  "g01-inokashira": 70,
  "g01-hanzomon": 88,
  "g02-hanzomon": 10,
  "g02-chiyoda": 46,
  "g02-lift": 58,
  "g02-exit": 90,
  "g08-jr": 18,
  "g08-lift": 50,
  "g08-asakusa": 64,
  "g08-yurikamome": 92,
  "g09-marunouchi": 16,
  "g09-lift": 44,
  "g09-hibiya": 58,
  "g09-chuo": 86,
  "g16-jr": 12,
  "g16-hibiya": 40,
  "g16-lift": 52,
  "g16-keisei": 88,
  "g19-kaminarimon": 10,
  "g19-lift": 36,
  "g19-toei": 62,
  "g19-tobu": 90,
};

export function stationEgress(line: string, station: string): StationEgress | undefined {
  return STATION_EGRESS.find((l) => l.line === line && l.station === station);
}

export function findEgress(line: string, station: string, id: string): EgressDef | undefined {
  return stationEgress(line, station)?.egress.find((g) => g.id === id);
}
