import { describe, expect, it } from "vitest";
import { getLine } from "@/data/network";
import { explain, factsOf, narrationFacts } from "./explain";
import { extractCarLoads, parseApproaching, parseDepartures, parseService } from "./live";
import { checkNarration } from "./narration-check";
import { plan } from "./plan";
import { jstClock, timetableMinute } from "./time";

// Synthetic records shaped like ODPT v4 responses (only the fields we read).
const M = getLine("M")!;
const id = (s: string) => `odpt.Station:TokyoMetro.Marunouchi.${s}`;
const toIkebukuro = M.towardsLast;

describe("time", () => {
  it("counts after-midnight departures as the end of the service day", () => {
    expect(timetableMinute("05:10")).toBe(310);
    expect(timetableMinute("00:20")).toBe(1460);
    expect(timetableMinute("bad")).toBeNull();
  });

  it("converts to Japan time and treats 02:00 Saturday JST as Friday's service day", () => {
    // 2026-10-02 is a Friday. 17:00 UTC Friday = 02:00 JST Saturday.
    const c = jstClock(new Date("2026-10-02T17:00:00Z"));
    expect(Math.floor(c.hour)).toBe(2);
    expect(c.dayType).toBe("weekday");
    expect(c.minuteOfServiceDay).toBe(26 * 60);
  });
});

describe("live parsing", () => {
  it("reads service status: no status field means normal", () => {
    expect(parseService([{ "odpt:trainInformationText": { ja: "平常どおり運転しています。", en: "Service on schedule." } }])).toMatchObject({ disrupted: false });
    expect(parseService([{ "odpt:trainInformationStatus": { ja: "遅延" }, "odpt:trainInformationText": { ja: "信号確認のため遅れ" } }])).toMatchObject({ disrupted: true, text: { ja: "信号確認のため遅れ" } });
    expect(parseService([])).toBeNull();
  });

  it("finds trains approaching the origin in the travel direction only", () => {
    const trains = [
      { "odpt:railDirection": toIkebukuro.odpt, "odpt:trainNumber": "A", "odpt:fromStation": id("Yotsuya"), "odpt:toStation": id("AkasakaMitsuke"), "odpt:delay": 120 },
      { "odpt:railDirection": toIkebukuro.odpt, "odpt:trainNumber": "B", "odpt:fromStation": id("Kasumigaseki"), "odpt:toStation": null },
      { "odpt:railDirection": toIkebukuro.odpt, "odpt:trainNumber": "past", "odpt:fromStation": id("Ginza"), "odpt:toStation": null },
      { "odpt:railDirection": M.towardsFirst.odpt, "odpt:trainNumber": "wrong-way", "odpt:fromStation": id("Kasumigaseki"), "odpt:toStation": null },
    ];
    const r = parseApproaching(M, id("Kasumigaseki"), "M15", toIkebukuro, trains);
    expect(r.map((t) => [t.trainNumber, t.stationsAway])).toEqual([["B", 0], ["A", 2.5]]);
    expect(r[1].delayS).toBe(120);
  });

  it("only accepts per-car loads with one numeric value per car", () => {
    const t = { loads: [0.8, 1.2, 1.5, 1.4, 1.1, 0.7], short: [1, 2], text: ["a", "b", "c", "d", "e", "f"] };
    expect(extractCarLoads(t, "loads", 6)).toEqual([80, 120, 150, 140, 110, 70]);
    expect(extractCarLoads(t, "short", 6)).toBeNull();
    expect(extractCarLoads(t, "text", 6)).toBeNull();
    expect(extractCarLoads(t, undefined, 6)).toBeNull();
  });

  it("returns the next departures for today's calendar", () => {
    const tt = [
      { "odpt:calendar": "odpt.Calendar:SaturdayHoliday", "odpt:stationTimetableObject": [{ "odpt:departureTime": "08:01" }] },
      {
        "odpt:calendar": "odpt.Calendar:Weekday",
        "odpt:stationTimetableObject": [
          { "odpt:departureTime": "07:58" },
          { "odpt:departureTime": "08:02", "odpt:destinationStation": [id("Ikebukuro")] },
          { "odpt:departureTime": "08:05" },
          { "odpt:departureTime": "00:10" },
        ],
      },
    ];
    const d = parseDepartures(M, tt, "odpt.Calendar:Weekday", 8 * 60, 3)!;
    expect(d.map((x) => x.minutesFromNow)).toEqual([2, 5, 970]);
    expect(d[0].destination?.en).toBe("Ikebukuro");
    expect(parseDepartures(M, tt, "odpt.Calendar:Unknown", 0)).toBeNull();
  });
});

describe("explanations", () => {
  // Demo positions are fine for testing the wording; real use never sees them unlabelled.
  const fixture = { community: null, demo: true, dayType: "weekday" as const };
  const p = plan({ ...fixture, line: "M", from: "M08", to: "M18", egressId: "m18-hanzomon", speedWeight: 0.5, hour: 8.3 });
  if (!p.ok || !p.plan.door) throw new Error("fixture plan failed");
  const facts = factsOf(p.plan, p.plan.door);

  it("template explanations pass the same check applied to LLM output", () => {
    expect(checkNarration(explain(facts), facts)).toBeNull();
  });

  it("rejects a real model output that misread the robustness share (2026-10-01)", () => {
    const g = plan({ ...fixture, line: "G", from: "G19", to: "G01", egressId: "g01-hanzomon", speedWeight: 0.3, hour: 18.5 });
    if (!g.ok || !g.plan.door) throw new Error("fixture plan failed");
    const f = factsOf(g.plan, g.plan.door);
    const share = f.sameCarShare!;
    const bad = {
      en: `Board car ${f.best.car}, door ${f.best.door}. ${share}% of passengers share this car.`,
      ja: `${f.best.car}号車${f.best.door}番ドアが最適です。`,
    };
    expect(checkNarration(bad, narrationFacts(f))).toMatch(/unsupported pct/);
    expect(narrationFacts(f)).not.toHaveProperty("sameCarShare");
  });

  it("checks units: a car number may not be cited as seconds", () => {
    const n = facts.best.car;
    expect(checkNarration({ en: `Board car ${n}, about ${facts.best.egressS} s to the exit.`, ja: `${n}号車、出口まで約${facts.best.egressS}秒。` }, facts)).toBeNull();
    if (!new Set([facts.best.egressS, facts.fastest.egressS, facts.roomiest.egressS]).has(n))
      expect(checkNarration({ en: `Board car ${n}, about ${n} s to the exit.`, ja: `${n}号車です。` }, facts)).toMatch(/unsupported seconds/);
  });

  it("accepts hyphenated units and rejects false 'fastest' claims", () => {
    const b = facts.best;
    expect(checkNarration({ en: `Board car ${b.car}, a ${b.walkM}-metre walk.`, ja: `${b.car}号車、約${b.walkM}mです。` }, facts)).toBeNull();
    const notFastest = { ...facts, fastest: { ...facts.fastest, car: b.car === 1 ? 2 : 1 } };
    expect(checkNarration({ en: `Car ${b.car} is the fastest exit.`, ja: `${b.car}号車が最速です。` }, notFastest)).toMatch(/fastest/);
  });

  it("never lets estimated crowding be quoted as a percentage", () => {
    const car = facts.best.car;
    expect(facts.loadSource).toBe("estimate");
    expect(facts.best.loadPct).toBeUndefined();
    expect(checkNarration({ en: `Board car ${car}; it is about 142% full.`, ja: `${car}号車、混雑率142%です。` }, narrationFacts(facts))).toMatch(/unsupported pct/);
  });

  it("rejects narration that invents numbers or skips the recommended car", () => {
    const car = facts.best.car;
    expect(checkNarration({ en: `Board car ${car}; it is 999% full.`, ja: `${car}号車です。` }, facts)).toMatch(/unsupported/);
    expect(checkNarration({ en: "Board near the middle.", ja: "中央付近にどうぞ。" }, facts)).toBeTruthy();
    expect(checkNarration({ en: `Board car ${car}.`, ja: `${car}号車にご乗車ください。` }, facts)).toBeNull();
  });
});
