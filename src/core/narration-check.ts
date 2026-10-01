import type { Bilingual } from "@/engine/types";
import type { Facts } from "./explain";

type Kind = "pct" | "seconds" | "metres" | "bare";

/** Numbers the narration may cite, by the unit they have to carry. */
export function allowedNumbers(f: Facts): Record<Kind, Set<number>> {
  const set = (...xs: (number | undefined)[]) => new Set(xs.filter((x): x is number => x !== undefined).map(Math.round));
  const picks = [f.best, f.fastest, f.roomiest];
  const nameNumbers = [f.destination.en, f.destination.ja, f.egress.en, f.egress.ja].flatMap((s) => (s.match(/\d+/g) ?? []).map(Number));
  return {
    pct: set(...picks.map((c) => c.loadPct), f.trainMeanLoadPct, f.best.loadPct - f.trainMeanLoadPct, f.trainMeanLoadPct - f.best.loadPct, f.sameCarShare),
    seconds: set(...picks.map((c) => c.egressS), f.best.egressS - f.fastest.egressS, f.roomiest.egressS - f.best.egressS),
    metres: set(f.best.walkM),
    bare: set(...picks.flatMap((c) => [c.car, c.door]), ...nameNumbers),
  };
}

// A number, then (optionally) the unit that says what it measures.
const NUMBER = /(\d+(?:\.\d+)?)\s*-?\s*(%|％|percent|パーセント|seconds?|secs?|s\b|秒|metres?|meters?|m\b|メートル)?/gi;

function kindOf(unit: string | undefined): Kind {
  if (!unit) return "bare";
  const u = unit.toLowerCase();
  if (u === "%" || u === "％" || u === "percent" || u === "パーセント") return "pct";
  if (u.startsWith("s") || u === "秒") return "seconds";
  return "metres";
}

/**
 * Returns null when the narration is acceptable, or the reason it was rejected.
 * Every number must be one the engine produced, with the unit it was produced
 * in: a robustness share written as a passenger percentage, or a car number
 * written as seconds, is rejected. The recommended car must be named, both
 * languages present, and the text short. The pick may only be called the
 * fastest/roomiest option when it actually is.
 */
export function checkNarration(text: Bilingual, f: Facts): string | null {
  if (!text.en.trim() || !text.ja.trim()) return "missing language";
  if (text.en.length > 400 || text.ja.length > 250) return "too long";
  const ok = allowedNumbers(f);
  const same = (a: { car: number; door: number }) => a.car === f.best.car && a.door === f.best.door;
  if (!same(f.fastest) && /fastest|quickest|最速|最も早/i.test(text.en + text.ja)) return "calls a non-fastest door fastest";
  if (f.roomiest.car !== f.best.car && /roomiest|most room|emptiest|least crowded|最も空|一番空/i.test(text.en + text.ja) && !text.en.includes(`ar ${f.roomiest.car}`))
    return "calls a non-roomiest car roomiest";
  for (const lang of [text.en, text.ja]) {
    // Normalise full-width digits that Japanese output sometimes uses.
    const ascii = lang.replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xfee0));
    for (const m of ascii.matchAll(NUMBER)) {
      const n = Math.round(Number(m[1]));
      const kind = kindOf(m[2]);
      if (!ok[kind].has(n)) return `unsupported ${kind === "bare" ? "number" : kind} ${m[0].trim()}`;
    }
    if (!ascii.includes(String(f.best.car))) return "recommended car not mentioned";
  }
  return null;
}
