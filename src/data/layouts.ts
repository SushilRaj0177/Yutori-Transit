import type { Egress, EgressKind, Provenance } from "@/engine/types";

/**
 * Platform egress layouts.
 *
 * IMPORTANT: every layout below is a DEMO layout. The connections (which lines
 * and exits a station leads to) are real, but the positions along the platform
 * have NOT been surveyed yet. The UI labels them as such, and docs/DATA.md
 * describes how to survey a station and flip it to `surveyed`.
 *
 * positionM is measured from the car-1 end of the stopped train
 * (0 … ~111 m on the Marunouchi Line, 0 … ~99 m on the Ginza Line).
 */

export interface PlatformLayout {
  line: "M" | "G";
  station: string; // station code
  source: Extract<Provenance, "demo-layout" | "surveyed">;
  egress: Egress[];
}

const e = (id: string, kind: EgressKind, positionM: number, en: string, ja: string, stepFree = kind === "elevator"): Egress => ({
  id,
  kind,
  positionM,
  leadsTo: { en, ja },
  stepFree,
});

export const LAYOUTS: PlatformLayout[] = [
  // ── Marunouchi Line ──────────────────────────────────────────────
  {
    line: "M", station: "M08", source: "demo-layout",
    egress: [
      e("m08-west", "escalator", 14, "JR, Odakyu & Keio (West Gate side)", "JR・小田急・京王（西口方面）"),
      e("m08-lift", "elevator", 47, "Ticket gates (step-free)", "改札（段差なし）"),
      e("m08-east", "stairs", 63, "East Exit & Shinjuku Subnade", "東口・サブナード方面"),
      e("m08-toei", "stairs", 98, "Toei Shinjuku & Oedo lines", "都営新宿線・大江戸線"),
    ],
  },
  {
    line: "M", station: "M15", source: "demo-layout",
    egress: [
      e("m15-hibiya", "stairs", 20, "Hibiya Line", "日比谷線"),
      e("m15-chiyoda", "escalator", 58, "Chiyoda Line", "千代田線"),
      e("m15-lift", "elevator", 74, "Ticket gates (step-free)", "改札（段差なし）"),
      e("m15-gov", "stairs", 102, "Government offices exits", "官庁街方面出口"),
    ],
  },
  {
    line: "M", station: "M16", source: "demo-layout",
    egress: [
      e("m16-hibiya", "stairs", 12, "Hibiya Line", "日比谷線"),
      e("m16-ginza", "escalator", 50, "Ginza Line", "銀座線"),
      e("m16-lift", "elevator", 66, "Ticket gates (step-free)", "改札（段差なし）"),
      e("m16-chuo", "stairs", 95, "Chuo-dori & Sukiyabashi exits", "中央通り・数寄屋橋方面"),
    ],
  },
  {
    line: "M", station: "M17", source: "demo-layout",
    egress: [
      e("m17-yaesu", "stairs", 18, "Underground passage to Yaesu side", "八重洲方面地下通路"),
      e("m17-jr", "escalator", 52, "JR lines & Shinkansen", "JR線・新幹線"),
      e("m17-lift", "elevator", 60, "Ticket gates (step-free)", "改札（段差なし）"),
      e("m17-maru", "stairs", 92, "Marunouchi exits & KITTE", "丸の内方面・KITTE"),
    ],
  },
  {
    line: "M", station: "M18", source: "demo-layout",
    egress: [
      e("m18-tozai", "escalator", 10, "Tozai Line", "東西線"),
      e("m18-chiyoda", "stairs", 38, "Chiyoda Line", "千代田線"),
      e("m18-lift", "elevator", 55, "Ticket gates (step-free)", "改札（段差なし）"),
      e("m18-hanzomon", "stairs", 82, "Hanzomon & Toei Mita lines", "半蔵門線・都営三田線"),
      e("m18-tokyo", "stairs", 104, "Walkway to Tokyo Station", "東京駅方面連絡通路"),
    ],
  },
  {
    line: "M", station: "M25", source: "demo-layout",
    egress: [
      e("m25-seibu", "stairs", 16, "Seibu Line & East Exit", "西武線・東口"),
      e("m25-jr", "escalator", 54, "JR lines (central gates)", "JR線（中央改札）"),
      e("m25-lift", "elevator", 63, "Ticket gates (step-free)", "改札（段差なし）"),
      e("m25-tobu", "stairs", 96, "Tobu Line, Yurakucho & Fukutoshin lines", "東武線・有楽町線・副都心線"),
    ],
  },
  // ── Ginza Line ───────────────────────────────────────────────────
  {
    line: "G", station: "G01", source: "demo-layout",
    egress: [
      e("g01-jr", "stairs", 14, "JR lines & Hachiko side", "JR線・ハチ公方面"),
      e("g01-lift", "elevator", 42, "Shibuya Hikarie & ticket gates (step-free)", "渋谷ヒカリエ・改札（段差なし）"),
      e("g01-inokashira", "stairs", 70, "Keio Inokashira Line", "京王井の頭線"),
      e("g01-hanzomon", "escalator", 88, "Hanzomon, Fukutoshin & Tokyu lines", "半蔵門線・副都心線・東急線"),
    ],
  },
  {
    line: "G", station: "G02", source: "demo-layout",
    egress: [
      e("g02-hanzomon", "stairs", 10, "Hanzomon Line (same platform direction)", "半蔵門線（同一方向ホーム）"),
      e("g02-chiyoda", "escalator", 46, "Chiyoda Line", "千代田線"),
      e("g02-lift", "elevator", 58, "Ticket gates (step-free)", "改札（段差なし）"),
      e("g02-exit", "stairs", 90, "Omotesando & Aoyama-dori exits", "表参道・青山通り方面"),
    ],
  },
  {
    line: "G", station: "G08", source: "demo-layout",
    egress: [
      e("g08-jr", "stairs", 18, "JR lines", "JR線"),
      e("g08-lift", "elevator", 50, "Ticket gates (step-free)", "改札（段差なし）"),
      e("g08-asakusa", "escalator", 64, "Toei Asakusa Line", "都営浅草線"),
      e("g08-yurikamome", "stairs", 92, "Yurikamome & Shiodome", "ゆりかもめ・汐留方面"),
    ],
  },
  {
    line: "G", station: "G09", source: "demo-layout",
    egress: [
      e("g09-marunouchi", "stairs", 16, "Marunouchi Line", "丸ノ内線"),
      e("g09-lift", "elevator", 44, "Ticket gates (step-free)", "改札（段差なし）"),
      e("g09-hibiya", "escalator", 58, "Hibiya Line", "日比谷線"),
      e("g09-chuo", "stairs", 86, "Ginza 4-chome crossing exits", "銀座四丁目交差点方面"),
    ],
  },
  {
    line: "G", station: "G16", source: "demo-layout",
    egress: [
      e("g16-jr", "escalator", 12, "JR lines & Shinkansen", "JR線・新幹線"),
      e("g16-hibiya", "stairs", 40, "Hibiya Line", "日比谷線"),
      e("g16-lift", "elevator", 52, "Ticket gates (step-free)", "改札（段差なし）"),
      e("g16-keisei", "stairs", 88, "Keisei Line & Ueno Park", "京成線・上野公園方面"),
    ],
  },
  {
    line: "G", station: "G19", source: "demo-layout",
    egress: [
      e("g19-kaminarimon", "stairs", 10, "Kaminarimon & Senso-ji", "雷門・浅草寺方面"),
      e("g19-lift", "elevator", 36, "Ticket gates (step-free)", "改札（段差なし）"),
      e("g19-toei", "stairs", 62, "Toei Asakusa Line", "都営浅草線"),
      e("g19-tobu", "escalator", 90, "Tobu Skytree Line", "東武スカイツリーライン"),
    ],
  },
];

export function getLayout(line: string, station: string): PlatformLayout | undefined {
  return LAYOUTS.find((l) => l.line === line && l.station === station);
}
