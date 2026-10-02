import { describe, expect, it } from "vitest";
import { doorPositionM } from "@/engine/geometry";
import { destinationsFor, SURVEY } from "@/data/survey";
import { directionBetween, getLine, LINES, stationsAhead, stationsBehind } from "@/data/network";
import { consensus } from "./consensus";
import { crowdLevels, plan, type PlanQuery } from "./plan";
import type { CommunityBook } from "./positions";

describe("network data", () => {
  it("has unique, correctly prefixed station codes", () => {
    for (const line of LINES) {
      const codes = line.stations.map((s) => s.code);
      expect(new Set(codes).size).toBe(codes.length);
      codes.forEach((c, i) => expect(c).toBe(`${line.id}${String(i + 1).padStart(2, "0")}`));
    }
  });

  it("derives travel direction and the stations ahead and behind", () => {
    const m = getLine("M")!;
    expect(directionBetween(m, "M08", "M18")).toBe(m.towardsLast);
    expect(directionBetween(m, "M18", "M08")).toBe(m.towardsFirst);
    expect(stationsAhead(m, "M15", "M18").map((s) => s.code)).toEqual(["M16", "M17", "M18"]);
    expect(stationsAhead(m, "M18", "M16").map((s) => s.code)).toEqual(["M17", "M16"]);
    expect(stationsBehind(m, "M03", m.towardsLast).map((s) => s.code)).toEqual(["M02", "M01"]);
  });
});

describe("survey data", () => {
  it("covers every station on both lines, with a source page and date", () => {
    for (const line of LINES)
      for (const s of line.stations) {
        const st = SURVEY.stations.find((x) => x.station === s.code);
        expect(st, s.code).toBeDefined();
        expect(st!.points.length, s.code).toBeGreaterThan(0);
        expect(st!.source).toMatch(/^https:\/\/wadattsu261\.com\//);
        expect(st!.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
  });

  it("has data for every direction a train can arrive from", () => {
    for (const line of LINES)
      line.stations.forEach((s, i) => {
        if (i > 0) expect(destinationsFor(line.id, s.code, "towardsLast").length, `${s.code} towardsLast`).toBeGreaterThan(0);
        if (i < line.stations.length - 1) expect(destinationsFor(line.id, s.code, "towardsFirst").length, `${s.code} towardsFirst`).toBeGreaterThan(0);
      });
  });

  it("only contains doors that exist on a 6-car, 3-door train", () => {
    for (const st of SURVEY.stations)
      for (const p of st.points)
        for (const d of p.doors) {
          expect(d.car).toBeGreaterThanOrEqual(1);
          expect(d.car).toBeLessThanOrEqual(6);
          expect(d.door).toBeGreaterThanOrEqual(1);
          expect(d.door).toBeLessThanOrEqual(3);
        }
  });

  it("matches the published Otemachi survey (spot check against the source page)", () => {
    // Ikebukuro-bound, Otemachi: Tozai Line via 大手町二丁目方面改札 at car 1 door 1;
    // 鎌倉橋方面改札 (exits A1, A2) at car 6 door 3.
    const d = destinationsFor("M", "M18", "towardsLast");
    const tozai = d.find((x) => x.transfers.includes("tozai"))!;
    expect(tozai.points.flatMap((p) => p.doors)).toContainEqual({ car: 1, door: 1 });
    const a1 = d.find((x) => x.exits.includes("A1"))!;
    expect(a1.points.flatMap((p) => p.doors)).toEqual([{ car: 6, door: 3 }]);
  });
});

describe("plan", () => {
  const M = getLine("M")!;
  const q: PlanQuery = { line: "M", from: "M08", to: "M18", speedWeight: 1, hour: 8.3, dayType: "weekday", community: null, stepFree: false };
  const tozai = destinationsFor("M", "M18", "towardsLast").find((x) => x.transfers.includes("tozai"))!;

  it("sends a rider in a hurry to the door next to the surveyed staircase", () => {
    const r = plan({ ...q, destId: tozai.id });
    if (!r.ok || !r.plan.door) throw new Error("expected a door plan");
    expect(r.plan.door.solution.best).toMatchObject({ car: 1, door: 1 });
    expect(r.plan.door.solution.best.walkM).toBe(0);
    expect(r.plan.source.url).toContain("otemachi");
  });

  it("uses only elevator or level routes in step-free mode", () => {
    const r = plan({ ...q, destId: tozai.id, stepFree: true });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    if (r.plan.target.dest.hasStepFree) expect(r.plan.door).not.toBeNull();
    else expect(r.plan.door).toBeNull();
    for (const p of r.plan.target.points) expect(p.stepFree).toBe(true);
  });

  it("flags, but does not apply, rider reports that contradict the survey", () => {
    const far: CommunityBook = { M18: { [tozai.id]: consensus(M.geometry, [{ car: 6, door: 3 }, { car: 6, door: 3 }, { car: 6, door: 3 }]) } };
    const r = plan({ ...q, destId: tozai.id, community: far });
    if (!r.ok || !r.plan.door) throw new Error("expected a door plan");
    expect(r.plan.target.ridersDisagree).toBe(true);
    expect(r.plan.door.solution.best.xM).toBe(doorPositionM(M.geometry, 1, 1));
    const near: CommunityBook = { M18: { [tozai.id]: consensus(M.geometry, [{ car: 1, door: 1 }, { car: 1, door: 2 }, { car: 1, door: 1 }]) } };
    expect((plan({ ...q, destId: tozai.id, community: near }) as { plan: { target: { ridersDisagree: boolean } } }).plan.target.ridersDisagree).toBe(false);
  });

  it("uses live per-car loads when they are supplied", () => {
    const r = plan({ ...q, liveLoadsPct: [50, 60, 70, 80, 90, 100] });
    expect(r.ok && r.plan.loadSource).toBe("odpt-live");
    expect(r.ok && r.plan.loadsPct).toEqual([50, 60, 70, 80, 90, 100]);
  });

  it("rejects same-station and unknown queries", () => {
    expect(plan({ ...q, to: "M08" })).toMatchObject({ ok: false, error: { kind: "same-station" } });
    expect(plan({ ...q, line: "Z" })).toMatchObject({ ok: false, error: { kind: "unknown-line" } });
  });

  it("describes crowding relative to the train, with an 'average' band", () => {
    expect(crowdLevels([90, 100, 110, 100])).toEqual(["quieter", "average", "busier", "average"]);
  });
});
