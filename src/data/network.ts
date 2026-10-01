import { evenDoorOffsets } from "@/engine/geometry";
import type { Bilingual, TrainGeometry } from "@/engine/types";

export interface Station {
  code: string; // official station number, e.g. "M18"
  odpt: string; // ODPT station id
  name: Bilingual;
}

export interface Direction {
  odpt: string; // ODPT rail direction id
  terminus: Bilingual;
}

export interface Line {
  id: "M" | "G";
  odptRailway: string;
  name: Bilingual;
  color: string;
  geometry: TrainGeometry;
  /**
   * Assumed typical peak-hour load (%) used by the crowding estimate when no live
   * per-car data exists. Not a measurement; see docs/MODEL.md.
   */
  peakLoadPct: number;
  /** Travel towards stations[0] vs towards stations[last]. */
  towardsFirst: Direction;
  towardsLast: Direction;
  /** Ordered as the official station numbering. */
  stations: Station[];
}

const st = (line: string, code: string, id: string, en: string, ja: string): Station => ({
  code,
  odpt: `odpt.Station:TokyoMetro.${line}.${id}`,
  name: { en, ja },
});

/*
 * Rolling-stock geometry: Marunouchi Line trains are 6 cars of ~18 m with 3 doors
 * per side; Ginza Line trains are 6 cars of ~16 m with 3 doors per side. Door
 * positions are approximated as evenly spaced. Car 1 is taken to be the car at
 * the stations[0] end of the train (Ogikubo / Shibuya side); this is listed as an
 * open verification item in docs/DATA.md.
 */

export const MARUNOUCHI: Line = {
  id: "M",
  odptRailway: "odpt.Railway:TokyoMetro.Marunouchi",
  name: { en: "Marunouchi Line", ja: "丸ノ内線" },
  color: "#F62E36",
  geometry: { carCount: 6, carLengthM: 18, couplerGapM: 0.6, doorOffsetsM: evenDoorOffsets(18, 3) },
  peakLoadPct: 140,
  towardsFirst: { odpt: "odpt.RailDirection:TokyoMetro.Ogikubo", terminus: { en: "Ogikubo", ja: "荻窪" } },
  towardsLast: { odpt: "odpt.RailDirection:TokyoMetro.Ikebukuro", terminus: { en: "Ikebukuro", ja: "池袋" } },
  stations: [
    st("Marunouchi", "M01", "Ogikubo", "Ogikubo", "荻窪"),
    st("Marunouchi", "M02", "MinamiAsagaya", "Minami-asagaya", "南阿佐ケ谷"),
    st("Marunouchi", "M03", "ShinKoenji", "Shin-koenji", "新高円寺"),
    st("Marunouchi", "M04", "HigashiKoenji", "Higashi-koenji", "東高円寺"),
    st("Marunouchi", "M05", "ShinNakano", "Shin-nakano", "新中野"),
    st("Marunouchi", "M06", "NakanoSakaue", "Nakano-sakaue", "中野坂上"),
    st("Marunouchi", "M07", "NishiShinjuku", "Nishi-shinjuku", "西新宿"),
    st("Marunouchi", "M08", "Shinjuku", "Shinjuku", "新宿"),
    st("Marunouchi", "M09", "ShinjukuSanchome", "Shinjuku-sanchome", "新宿三丁目"),
    st("Marunouchi", "M10", "ShinjukuGyoemmae", "Shinjuku-gyoemmae", "新宿御苑前"),
    st("Marunouchi", "M11", "YotsuyaSanchome", "Yotsuya-sanchome", "四谷三丁目"),
    st("Marunouchi", "M12", "Yotsuya", "Yotsuya", "四ツ谷"),
    st("Marunouchi", "M13", "AkasakaMitsuke", "Akasaka-mitsuke", "赤坂見附"),
    st("Marunouchi", "M14", "KokkaiGijidomae", "Kokkai-gijidomae", "国会議事堂前"),
    st("Marunouchi", "M15", "Kasumigaseki", "Kasumigaseki", "霞ケ関"),
    st("Marunouchi", "M16", "Ginza", "Ginza", "銀座"),
    st("Marunouchi", "M17", "Tokyo", "Tokyo", "東京"),
    st("Marunouchi", "M18", "Otemachi", "Otemachi", "大手町"),
    st("Marunouchi", "M19", "Awajicho", "Awajicho", "淡路町"),
    st("Marunouchi", "M20", "Ochanomizu", "Ochanomizu", "御茶ノ水"),
    st("Marunouchi", "M21", "HongoSanchome", "Hongo-sanchome", "本郷三丁目"),
    st("Marunouchi", "M22", "Korakuen", "Korakuen", "後楽園"),
    st("Marunouchi", "M23", "Myogadani", "Myogadani", "茗荷谷"),
    st("Marunouchi", "M24", "ShinOtsuka", "Shin-otsuka", "新大塚"),
    st("Marunouchi", "M25", "Ikebukuro", "Ikebukuro", "池袋"),
  ],
};

export const GINZA: Line = {
  id: "G",
  odptRailway: "odpt.Railway:TokyoMetro.Ginza",
  name: { en: "Ginza Line", ja: "銀座線" },
  color: "#FF9500",
  geometry: { carCount: 6, carLengthM: 16, couplerGapM: 0.6, doorOffsetsM: evenDoorOffsets(16, 3) },
  peakLoadPct: 135,
  towardsFirst: { odpt: "odpt.RailDirection:TokyoMetro.Shibuya", terminus: { en: "Shibuya", ja: "渋谷" } },
  towardsLast: { odpt: "odpt.RailDirection:TokyoMetro.Asakusa", terminus: { en: "Asakusa", ja: "浅草" } },
  stations: [
    st("Ginza", "G01", "Shibuya", "Shibuya", "渋谷"),
    st("Ginza", "G02", "OmoteSando", "Omote-sando", "表参道"),
    st("Ginza", "G03", "Gaiemmae", "Gaiemmae", "外苑前"),
    st("Ginza", "G04", "AoyamaItchome", "Aoyama-itchome", "青山一丁目"),
    st("Ginza", "G05", "AkasakaMitsuke", "Akasaka-mitsuke", "赤坂見附"),
    st("Ginza", "G06", "TameikeSanno", "Tameike-sanno", "溜池山王"),
    st("Ginza", "G07", "Toranomon", "Toranomon", "虎ノ門"),
    st("Ginza", "G08", "Shimbashi", "Shimbashi", "新橋"),
    st("Ginza", "G09", "Ginza", "Ginza", "銀座"),
    st("Ginza", "G10", "Kyobashi", "Kyobashi", "京橋"),
    st("Ginza", "G11", "Nihombashi", "Nihombashi", "日本橋"),
    st("Ginza", "G12", "Mitsukoshimae", "Mitsukoshimae", "三越前"),
    st("Ginza", "G13", "Kanda", "Kanda", "神田"),
    st("Ginza", "G14", "Suehirocho", "Suehirocho", "末広町"),
    st("Ginza", "G15", "UenoHirokoji", "Ueno-hirokoji", "上野広小路"),
    st("Ginza", "G16", "Ueno", "Ueno", "上野"),
    st("Ginza", "G17", "Inaricho", "Inaricho", "稲荷町"),
    st("Ginza", "G18", "Tawaramachi", "Tawaramachi", "田原町"),
    st("Ginza", "G19", "Asakusa", "Asakusa", "浅草"),
  ],
};

export const LINES: Line[] = [MARUNOUCHI, GINZA];

export function getLine(id: string): Line | undefined {
  return LINES.find((l) => l.id === id);
}

export function stationIndex(line: Line, code: string): number {
  return line.stations.findIndex((s) => s.code === code);
}

export function directionBetween(line: Line, fromCode: string, toCode: string): Direction | null {
  const a = stationIndex(line, fromCode);
  const b = stationIndex(line, toCode);
  if (a < 0 || b < 0 || a === b) return null;
  return b > a ? line.towardsLast : line.towardsFirst;
}

/** Station codes strictly between origin and destination, plus the destination. */
export function stationsAhead(line: Line, fromCode: string, toCode: string): Station[] {
  const a = stationIndex(line, fromCode);
  const b = stationIndex(line, toCode);
  if (a < 0 || b < 0 || a === b) return [];
  return a < b ? line.stations.slice(a + 1, b + 1) : line.stations.slice(b, a).reverse();
}

/** Stations behind the origin, nearest first — where an approaching train currently is. */
export function stationsBehind(line: Line, fromCode: string, direction: Direction): Station[] {
  const a = stationIndex(line, fromCode);
  if (a < 0) return [];
  return direction === line.towardsLast ? line.stations.slice(0, a).reverse() : line.stations.slice(a + 1);
}
