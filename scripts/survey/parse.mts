/**
 * Turns cached survey pages into structured platform data.
 *
 *   npx tsx scripts/survey/parse.mts
 *
 * Output:
 *   src/data/survey.json          facts only (car, door, kind, gate, exits, transfers) + source URL
 *   .cache/survey/review.md       every extracted record next to the sentence it came from,
 *                                 plus everything that was skipped or failed a check (not committed)
 *
 * Nothing is guessed: a record that fails a consistency check is dropped and listed for review.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { SURVEY_ORIGIN, SURVEY_PAGES } from "./sources.mts";
import { GINZA, MARUNOUCHI, type Line } from "../../src/data/network.ts";

type Dir = "towardsFirst" | "towardsLast";

export interface SurveyPoint {
  platform: number;
  direction: Dir;
  gate: string; // Japanese gate / route heading as published
  exits: string[]; // exit codes named in the gate heading
  transfers: string[]; // transfer line keys, see TRANSFER_KEYS
  kind: string; // Japanese kind text, e.g. 上り階段・上りエスカレーター
  stepFree: boolean;
  doors: { car: number; door: number }[]; // physical door labels (○号車○番ドア)
}

export interface SurveyStation {
  line: "M" | "G";
  station: string;
  source: string;
  updated: string | null;
  /** Platforms whose arriving trains alternate (e.g. Asakusa): riders must check which one. */
  alternatingPlatforms: boolean;
  points: SurveyPoint[];
  /** Entries left out because the source contradicts itself, per arrival direction. */
  omitted: { direction: Dir; gate: string }[];
}

const nfkc = (s: string) => s.normalize("NFKC");

export function pageLines(html: string): string[] {
  let s = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>/gi, "");
  s = s.replace(/<\/?(p|div|h[1-6]|li|br|tr|td|th|ul|ol|section|table|figure|figcaption|dt|dd)\b[^>]*>/gi, "\n");
  s = s.replace(/<[^>]+>/g, "");
  s = s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
  return nfkc(s).split("\n").map((l) => l.trim()).filter(Boolean);
}

/** Line names → stable keys. Order matters: longer, more specific names first. */
export const TRANSFER_KEYS: [RegExp, string][] = [
  [/新幹線/, "shinkansen"],
  [/JR|山手線|京浜東北線|中央線|総武|埼京線|湘南新宿|東海道線|上野東京ライン|横須賀線|常磐線|京葉線/, "jr"],
  [/都営浅草線|浅草線/, "toei-asakusa"],
  [/都営三田線|三田線/, "toei-mita"],
  [/都営新宿線/, "toei-shinjuku"],
  [/大江戸線/, "toei-oedo"],
  [/東西線/, "tozai"],
  [/千代田線/, "chiyoda"],
  [/半蔵門線/, "hanzomon"],
  [/日比谷線/, "hibiya"],
  [/有楽町線/, "yurakucho"],
  [/副都心線/, "fukutoshin"],
  [/南北線/, "namboku"],
  [/銀座線/, "ginza"],
  [/丸ノ内線/, "marunouchi"],
  [/東武/, "tobu"],
  [/西武/, "seibu"],
  [/京王|井の頭線/, "keio"],
  [/小田急/, "odakyu"],
  [/京成/, "keisei"],
  [/東急/, "tokyu"],
  [/ゆりかもめ/, "yurikamome"],
];

function transfersIn(text: string, own: string): string[] {
  const out: string[] = [];
  for (const [re, key] of TRANSFER_KEYS) if (re.test(text) && key !== own && !out.includes(key)) out.push(key);
  return out;
}

/** Exit codes from a gate heading: "(A4-A7・B3-B7出口方面)", "(出口1-4方面)", "(出口4a・4b方面)". */
export function exitsIn(gate: string): string[] {
  const out: string[] = [];
  for (const [, body] of gate.matchAll(/\(([^()]*出口[^()]*)\)/g)) {
    const cleaned = body.replace(/出口|方面|番|各/g, "").replace(/[-ー―−–~〜～]/g, "–");
    for (const t of cleaned.split(/[・、,\s]+/).map((x) => x.trim())) {
      if (/^[A-Z]?\d+[a-z]?(–[A-Z]?\d+[a-z]?)?$/.test(t) && !out.includes(t)) out.push(t);
    }
  }
  return out;
}

const DOOR_LINE = /(\d+)号車の進行方向(\d+)番目/;
const LABEL = /『(\d+)号車(\d+)番ドア』/g;
const KIND_WORDS = /階段|エスカレーター|エレベーター|改札口|通路/;

/** Station order index of a Japanese station name mentioned in text, nearest to the end. */
function lastStationIndex(line: Line, text: string): number {
  let best = -1;
  let bestPos = -1;
  line.stations.forEach((s, i) => {
    const name = nfkc(s.name.ja).replace(/ケ/g, "[ケヶ]");
    const re = new RegExp(name, "g");
    let m;
    while ((m = re.exec(text))) {
      if (m.index > bestPos) {
        bestPos = m.index;
        best = i;
      }
    }
  });
  // Branch terminus is beyond the Ogikubo side for direction purposes.
  const h = text.lastIndexOf("方南町");
  if (h > bestPos) best = 0;
  return best;
}

export function parseStation(html: string, line: Line, code: string, review: string[]): SurveyStation {
  const L = pageLines(html);
  const idx = line.stations.findIndex((s) => s.code === code);
  const isFirst = idx === 0;
  const isLast = idx === line.stations.length - 1;
  const own = line.id === "M" ? "marunouchi" : "ginza";
  const doorsPerCar = line.geometry.doorOffsetsM.length;

  const updatedMatch = L.slice(0, 60).join(" ").match(/(\d{4}\.\d{2}\.\d{2})\s*(\d{4}\.\d{2}\.\d{2})?/);
  const updated = updatedMatch ? (updatedMatch[2] ?? updatedMatch[1]).replace(/\./g, "-") : null;

  // Platform number → direction, from sentences like "1番線ホーム(荻窪・方南町方面行き)" or
  // "渋谷方面への列車が1番線ホームに、荻窪方面が2番線ホームに到着します". Sentences naming
  // several platforms are split into one clause per platform first.
  const ownName = line.id === "M" ? "丸ノ内線" : "銀座線";
  const platformDir = new Map<number, Dir>();
  const terminalDir: Dir | null = isFirst ? "towardsFirst" : isLast ? "towardsLast" : null;
  for (const l of L) {
    const mentions = l.match(/\d+(?:・\d+)*番線/g) ?? [];
    const clauses = mentions.length > 1 ? l.split(/[、。]|(?<=[)])・/) : [l];
    for (const c of clauses) {
      const plats = c.match(/(\d+(?:・\d+)*)番線/);
      if (!plats || !/方面/.test(c)) continue;
      const named = c.match(/(銀座線|丸ノ内線|半蔵門線)/);
      if (named && named[1] !== ownName) continue;
      const head = c.includes("からの") ? c.slice(c.lastIndexOf("からの")) : c.slice(c.indexOf("番線"));
      const target = head.includes("方面") ? head.slice(0, head.lastIndexOf("方面")) : head;
      let ti = lastStationIndex(line, target);
      if (ti < 0) ti = lastStationIndex(line, c.slice(0, c.indexOf("方面")));
      if (ti < 0 || ti === idx) continue;
      for (const p of plats[1].split("・").map(Number)) if (!platformDir.has(p)) platformDir.set(p, ti < idx ? "towardsFirst" : "towardsLast");
    }
  }

  const points: SurveyPoint[] = [];
  const omitted: { direction: Dir; gate: string }[] = [];
  let platforms: number[] | null = null;
  let gate = "";
  let gateText = "";
  let kind = "";
  // Every page opens with a table of contents ending in 「対応エリア」; details follow it
  // and end at 「その他(乗り換え…)」.
  const start = L.indexOf("対応エリア");
  let end = L.findIndex((l, i) => i > start && /^その他\(/.test(l));
  if (end < 0) end = L.length;

  for (const l of start < 0 ? [] : L.slice(start + 1, end)) {
    if (/^(【|※【|▲)/.test(l) || /各駅ホームの|乗り換え先の|ルートはこちら/.test(l)) continue;

    // Platform context: "1番線ホーム(…方面行き)", "1番線ホームには…", "1番線到着時", "1・2番線ホーム".
    const pm =
      l.match(/^(銀座線|丸ノ内線|半蔵門線)?(\d+(?:・\d+)*)番線(ホーム)?(には|到着時|[(:]|$)/) ??
      l.match(/()(\d+(?:・\d+)*)番線(?:の各)?ホームに到着/);
    if (pm && !DOOR_LINE.test(l)) {
      // On shared platforms, entries under the other line's heading are not ours.
      platforms = pm[1] && pm[1] !== ownName ? [] : pm[2].split("・").map(Number);
      // A platform tab ("1番線ホームには…", "1番線到着時", "1番線ホーム:渋谷方面") starts a new
      // section; a bare sub-heading inside a gate section ("銀座線4番線ホーム") does not.
      if (/^(には|到着時|:)$/.test(pm[4] ?? "") || (!pm[4]?.length && /ホームに到着/.test(l))) {
        gate = "";
        gateText = "";
        kind = "";
      }
      continue;
    }

    if (DOOR_LINE.test(l)) {
      // "4号車の進行方向3番目、または3号車の進行方向1番目のドア" names several (car, order) pairs;
      // "2番目、または3番目" gives several orders for one car.
      const pairs: { car: number; ordinal: number }[] = [];
      for (const seg of l.split(/、または|または/)) {
        const m = seg.match(/(?:(\d+)号車の進行方向)?(\d+)番(?:目|前)/);
        if (!m) continue;
        const car = m[1] ? Number(m[1]) : pairs.at(-1)?.car;
        if (car) pairs.push({ car, ordinal: Number(m[2]) });
      }
      const labels = [...l.matchAll(LABEL)].map((m) => ({ car: Number(m[1]), door: Number(m[2]) }));
      const plats = platforms ?? (terminalDir ? [0] : null);
      if (!plats) {
        review.push(`- SKIP ${code}: no platform context for「${l}」`);
        continue;
      }
      for (const p of plats) {
        const dir = terminalDir ?? platformDir.get(p);
        if (!dir) {
          review.push(`- SKIP ${code}: platform ${p} has no known direction for「${l}」`);
          continue;
        }
        // Cross-check: every physical label must equal the travel-order door converted
        // with our numbering model (door 1 at the car-1 end), and stay inside the train.
        const toLabel = (o: number) => (dir === "towardsFirst" ? o : doorsPerCar - o + 1);
        const expected = new Set(pairs.map((q) => `${q.car}-${toLabel(q.ordinal)}`));
        const ok =
          labels.length > 0 &&
          labels.length === expected.size &&
          labels.every((d) => d.car >= 1 && d.car <= line.geometry.carCount && d.door >= 1 && d.door <= doorsPerCar && expected.has(`${d.car}-${d.door}`));
        if (!ok) {
          omitted.push({ direction: dir, gate: gate || "(改札名なし)" });
          review.push(`- REJECT ${code} p${p} ${dir}: labels ${labels.map((d) => `${d.car}-${d.door}`)} ≠ expected ${[...expected]} in「${l}」`);
          continue;
        }
        const k = kind || "(経路のみ)";
        points.push({
          platform: p,
          direction: dir,
          gate: gate || "(改札名なし)",
          exits: exitsIn(gate),
          transfers: transfersIn(`${gate} ${gateText} ${kind}`, own),
          kind: k,
          stepFree: /エレベーター/.test(k) || (/^改札口/.test(k) && !/階段|エスカレーター/.test(k)),
          doors: labels,
        });
        review.push(`- OK ${code} p${p} ${dir} | ${gate} | ${k} | ${labels.map((d) => `${d.car}-${d.door}`).join(",")}\n    「${l}」`);
      }
      continue;
    }

    // Kind line: "上り階段・上りエスカレーター(1号車前方)" / "(1番線ホーム:2号車後方、2番線ホーム:2号車前方)".
    const bare = l.replace(/\s*※.*$/, "");
    if (/\(.*\d+号車.*\)/.test(bare) && KIND_WORDS.test(bare) && !/。$/.test(bare) && bare.length < 160) {
      kind = bare.slice(0, bare.indexOf("(")).trim() || bare;
      continue;
    }

    // Gate heading: names a gate (改札) and is not a sentence.
    if (/改札/.test(bare) && !/。/.test(bare) && !/号車/.test(bare) && bare.length < 140 && !/^目的の改札/.test(bare)) {
      // "…改札(B1-B3出口方面 ※…)" loses its ")" when the note is cut off.
      gate = (bare.match(/\(/g)?.length ?? 0) > (bare.match(/\)/g)?.length ?? 0) ? `${bare})` : bare;
      gateText = "";
      kind = "";
      continue;
    }
    if (gate && !kind) gateText += ` ${l}`;
  }

  const alternatingPlatforms = isFirst || isLast ? L.some((l) => /交互に到着/.test(l)) : false;
  return { line: line.id, station: code, source: SURVEY_ORIGIN + SURVEY_PAGES[code], updated, alternatingPlatforms, points, omitted };
}

// ── CLI ─────────────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const review: string[] = ["# Survey extraction review", ""];
  const out: SurveyStation[] = [];
  for (const line of [MARUNOUCHI, GINZA]) {
    for (const s of line.stations) {
      const path = SURVEY_PAGES[s.code];
      const file = `.cache/survey/${path.split("/").filter(Boolean).pop()}.html`;
      review.push(`\n## ${s.code} ${s.name.ja} — ${SURVEY_ORIGIN + path}`);
      const st = parseStation(readFileSync(file, "utf8"), line, s.code, review);
      out.push(st);
      console.log(`${s.code} ${s.name.en.padEnd(18)} points=${st.points.length} updated=${st.updated}${st.alternatingPlatforms ? " (alternating)" : ""}`);
    }
  }
  writeFileSync("src/data/survey.json", JSON.stringify({ source: "電車の停車位置 (wadattsu261.com), on-site survey by わだっつ", retrieved: new Date().toISOString().slice(0, 10), stations: out }, null, 1) + "\n");
  writeFileSync(".cache/survey/review.md", review.join("\n") + "\n");
  const rejected = review.filter((r) => r.startsWith("- REJECT")).length;
  const skipped = review.filter((r) => r.startsWith("- SKIP")).length;
  console.log(`\npoints=${out.reduce((a, s) => a + s.points.length, 0)} rejected=${rejected} skipped=${skipped}`);
}
