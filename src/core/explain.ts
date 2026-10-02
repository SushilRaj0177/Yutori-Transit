import type { Bilingual, EgressKind, ScoredCandidate } from "@/engine/types";
import { destinationLabel } from "@/data/survey";
import type { CrowdLevel, DoorPlan, Plan } from "./plan";

/**
 * Deterministic explanation of a plan. This is the source of truth: the
 * optional LLM layer may only rephrase these facts, and its output is checked
 * against them (see narration-check.ts).
 *
 * Crowding is described relative to the rest of the train ("usually quieter")
 * unless it comes from a live measurement. The model's absolute percentages are
 * not calibrated, so quoting them would be false precision.
 */

interface Pick {
  car: number;
  door: number;
  egressS: number;
  crowd: CrowdLevel;
  /** Only present when the load is a live measurement. */
  loadPct?: number;
}

export interface Facts {
  destination: Bilingual;
  egress: Bilingual;
  egressKind: EgressKind;
  best: Pick & { walkM: number };
  fastest: Pick;
  roomiest: Pick;
  loadSource: "odpt-live" | "estimate";
  /** Share of perturbed re-solves that keep the same car. Omitted from LLM input. */
  sameCarShare?: number;
}

/**
 * What the LLM sees. The robustness share is left out: in testing the model
 * reported it as "64% of passengers share this car". The UI shows robustness
 * in its own badge, so the narration does not need it.
 */
export function narrationFacts(f: Facts): Facts {
  const { sameCarShare: _omit, ...rest } = f;
  void _omit;
  return rest;
}

export function factsOf(p: Plan, d: DoorPlan): Facts {
  const live = p.loadSource === "odpt-live";
  const pick = (c: ScoredCandidate): Pick => ({
    car: c.car,
    door: c.door,
    egressS: Math.round(c.egressS),
    crowd: p.crowd[c.car - 1],
    ...(live ? { loadPct: c.loadPct } : {}),
  });
  const b = d.solution.best;
  return {
    destination: p.to.name,
    egress: destinationLabel(p.target.dest),
    egressKind: b.via?.kind ?? "way",
    best: { ...pick(b), walkM: Math.round(b.walkM) },
    fastest: pick(d.solution.fastest),
    roomiest: pick(d.solution.roomiest),
    loadSource: p.loadSource,
    sameCarShare: Math.round(d.stability.sameCar * 100),
  };
}

const KIND: Record<EgressKind, Bilingual> = {
  stairs: { en: "stairs", ja: "階段" },
  escalator: { en: "escalator", ja: "エスカレーター" },
  way: { en: "gate", ja: "改札" },
  elevator: { en: "elevator", ja: "エレベーター" },
};

export function explain(f: Facts): Bilingual {
  const b = f.best;
  const en: string[] = [];
  const ja: string[] = [];
  const est = f.loadSource === "estimate";
  const usually = est ? "usually " : "";
  const usuallyJa = est ? "普段は" : "";

  if (b.walkM <= 2) {
    en.push(`Door ${b.door} of car ${b.car} opens right by the ${KIND[f.egressKind].en} for ${f.egress.en}.`);
    ja.push(`${b.car}号車${b.door}番ドアのすぐ近くに${f.egress.ja}方面の${KIND[f.egressKind].ja}があります。`);
  } else {
    en.push(`Door ${b.door} of car ${b.car} is ${b.walkM} m from the ${KIND[f.egressKind].en} for ${f.egress.en} (about ${b.egressS} s).`);
    ja.push(`${b.car}号車${b.door}番ドアから${f.egress.ja}方面の${KIND[f.egressKind].ja}まで約${b.walkM}m（約${b.egressS}秒）です。`);
  }

  const pct = (c: Pick) => (c.loadPct !== undefined ? ` (${c.loadPct}%)` : "");
  if (b.crowd === "quieter") {
    en.push(`Car ${b.car} is ${usually}quieter than the rest of the train${pct(b)}.`);
    ja.push(`${b.car}号車は${usuallyJa}編成の中でも空いている車両です${pct(b)}。`);
  } else if (b.crowd === "busier") {
    en.push(`Car ${b.car} is ${usually}busier than average${pct(b)}: the price of the short walk.`);
    ja.push(`${b.car}号車は${usuallyJa}平均より混みますが${pct(b)}、移動は短くなります。`);
  }

  const fa = f.fastest;
  const ro = f.roomiest;
  if (fa.car !== b.car || fa.door !== b.door) {
    en.push(`Car ${fa.car} door ${fa.door} is ${b.egressS - fa.egressS} s quicker${fa.crowd === "busier" ? ` but ${usually}more crowded` : ""}.`);
    ja.push(`${fa.car}号車${fa.door}番ドアなら${b.egressS - fa.egressS}秒早く出られます${fa.crowd === "busier" ? "が、混雑しがちです" : ""}。`);
  }
  if (ro.car !== b.car) {
    en.push(`Car ${ro.car} has the most room${pct(ro)} but adds ${ro.egressS - b.egressS} s.`);
    ja.push(`最も空いているのは${ro.car}号車${pct(ro)}ですが、${ro.egressS - b.egressS}秒余分にかかります。`);
  }
  if (est && f.sameCarShare !== undefined && f.sameCarShare < 70) {
    en.push(`It is a close call: crowding is estimated, and the same car wins in only ${f.sameCarShare}% of simulations.`);
    ja.push(`混雑は推定のため、シミュレーションで同じ号車が選ばれたのは${f.sameCarShare}%のみの僅差です。`);
  }
  return { en: en.join(" "), ja: ja.join("") };
}
