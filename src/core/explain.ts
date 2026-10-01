import type { Bilingual, ScoredCandidate } from "@/engine/types";
import type { Plan } from "./plan";

/**
 * Deterministic explanation of a plan. This is the source of truth: the
 * optional LLM layer may only rephrase these facts, and its output is checked
 * against them (see src/server/narrate.ts).
 */

export interface Facts {
  destination: Bilingual;
  egress: Bilingual;
  egressKind: string;
  best: { car: number; door: number; walkM: number; egressS: number; loadPct: number };
  trainMeanLoadPct: number;
  loadSource: "odpt-live" | "estimate";
  fastest: { car: number; door: number; egressS: number; loadPct: number };
  roomiest: { car: number; door: number; egressS: number; loadPct: number };
  sameCarShare: number;
}

const pick = (c: ScoredCandidate) => ({ car: c.car, door: c.door, egressS: Math.round(c.egressS), loadPct: c.loadPct });

export function factsOf(p: Plan): Facts {
  const b = p.solution.best;
  return {
    destination: p.to.name,
    egress: p.target.leadsTo,
    egressKind: p.target.kind,
    best: { car: b.car, door: b.door, walkM: Math.round(b.walkM), egressS: Math.round(b.egressS), loadPct: b.loadPct },
    trainMeanLoadPct: p.meanLoadPct,
    loadSource: p.loadSource,
    fastest: pick(p.solution.fastest),
    roomiest: pick(p.solution.roomiest),
    sameCarShare: Math.round(p.stability.sameCar * 100),
  };
}

export function explain(f: Facts): Bilingual {
  const b = f.best;
  const en: string[] = [];
  const ja: string[] = [];
  const estEn = f.loadSource === "estimate" ? "estimated " : "";
  const estJa = f.loadSource === "estimate" ? "推定" : "";

  en.push(`Door ${b.door} of car ${b.car} puts you ${b.walkM} m from the ${f.egressKind} to ${f.egress.en} (about ${b.egressS} s to reach it).`);
  ja.push(`${b.car}号車${b.door}番ドアから${f.egress.ja}まで約${b.walkM}m、到達まで約${b.egressS}秒です。`);

  if (b.loadPct < f.trainMeanLoadPct - 5) {
    en.push(`Car ${b.car} is ${estEn}${b.loadPct}% full against a ${f.trainMeanLoadPct}% train average.`);
    ja.push(`${b.car}号車の${estJa}混雑率は${b.loadPct}%で、編成平均${f.trainMeanLoadPct}%より空いています。`);
  } else if (b.loadPct > f.trainMeanLoadPct + 5) {
    en.push(`Car ${b.car} is busier than average (${estEn}${b.loadPct}% vs ${f.trainMeanLoadPct}%), the price of the short walk.`);
    ja.push(`${b.car}号車は${estJa}混雑率${b.loadPct}%と平均${f.trainMeanLoadPct}%より混みますが、移動距離が短くなります。`);
  }

  const fa = f.fastest;
  const ro = f.roomiest;
  if (fa.car !== b.car || fa.door !== b.door) {
    en.push(`Car ${fa.car} door ${fa.door} is ${b.egressS - fa.egressS} s quicker at ${fa.loadPct}% load.`);
    ja.push(`最速は${fa.car}号車${fa.door}番ドア（${b.egressS - fa.egressS}秒短縮、混雑率${fa.loadPct}%）です。`);
  }
  if (ro.car !== b.car) {
    en.push(`Car ${ro.car} has the most room (${ro.loadPct}%) but adds ${ro.egressS - b.egressS} s.`);
    ja.push(`最も空いているのは${ro.car}号車（${ro.loadPct}%）ですが、${ro.egressS - b.egressS}秒余分にかかります。`);
  }
  if (f.loadSource === "estimate" && f.sameCarShare < 70) {
    en.push(`This is a close call: with crowding uncertainty the same car wins only ${f.sameCarShare}% of the time.`);
    ja.push(`混雑の不確かさを考慮すると、同じ号車が選ばれるのは${f.sameCarShare}%のみで、僅差の判断です。`);
  }
  return { en: en.join(" "), ja: ja.join("") };
}
