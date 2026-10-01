import type { Bilingual } from "@/engine/types";
import type { Facts } from "./explain";

/** Every number the narration is allowed to mention, derived from the facts. */
export function allowedNumbers(f: Facts): Set<number> {
  const nums = new Set<number>();
  const add = (...xs: number[]) => xs.forEach((x) => nums.add(Math.round(x)));
  for (const c of [f.best, f.fastest, f.roomiest]) add(c.car, c.door, c.egressS, c.loadPct);
  add(f.best.walkM, f.trainMeanLoadPct, f.sameCarShare);
  add(f.best.egressS - f.fastest.egressS, f.roomiest.egressS - f.best.egressS);
  add(f.best.loadPct - f.trainMeanLoadPct, f.trainMeanLoadPct - f.best.loadPct);
  // Numbers that are part of names (e.g. "Hongo-sanchome 3", exit "A2") are allowed too.
  for (const s of [f.destination.en, f.destination.ja, f.egress.en, f.egress.ja]) for (const m of s.match(/\d+/g) ?? []) add(Number(m));
  return nums;
}

/**
 * Returns null when the narration is acceptable, or the reason it was rejected.
 * Checks: both languages present, short, no numbers absent from the facts,
 * and the recommended car is actually named.
 */
export function checkNarration(text: Bilingual, f: Facts): string | null {
  if (!text.en.trim() || !text.ja.trim()) return "missing language";
  if (text.en.length > 400 || text.ja.length > 250) return "too long";
  const ok = allowedNumbers(f);
  for (const lang of [text.en, text.ja]) {
    // Normalise full-width digits that Japanese output sometimes uses.
    const ascii = lang.replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xfee0));
    for (const m of ascii.match(/\d+(?:\.\d+)?/g) ?? []) {
      if (!ok.has(Math.round(Number(m)))) return `unsupported number ${m}`;
    }
    if (!ascii.includes(String(f.best.car))) return "recommended car not mentioned";
  }
  return null;
}
