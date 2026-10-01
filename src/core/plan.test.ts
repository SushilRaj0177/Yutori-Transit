import { describe, expect, it } from "vitest";
import { doorPositionM, trainLengthM } from "@/engine/geometry";
import { DEMO_POSITIONS, STATION_EGRESS } from "@/data/layouts";
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

  it("keeps every demo position inside the stopped train and every egress id unique", () => {
    const ids = STATION_EGRESS.flatMap((s) => s.egress.map((e) => e.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of STATION_EGRESS) {
      const len = trainLengthM(getLine(s.line)!.geometry);
      for (const e of s.egress) {
        expect(DEMO_POSITIONS[e.id]).toBeGreaterThanOrEqual(0);
        expect(DEMO_POSITIONS[e.id]).toBeLessThanOrEqual(len);
      }
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

describe("plan", () => {
  const M = getLine("M")!;
  const q: PlanQuery = { line: "M", from: "M08", to: "M18", egressId: "m18-tozai", speedWeight: 0.5, hour: 8.3, dayType: "weekday", community: null, demo: false };
  const verified = (car: number, door: number): CommunityBook => ({
    M18: { "m18-tozai": consensus(M.geometry, [{ car, door }, { car, door }, { car, door }]) },
  });

  it("recommends NO door when the target's position is unknown", () => {
    const r = plan(q);
    expect(r.ok && r.plan.door).toBeNull();
    expect(r.ok && r.plan.target.source).toBeNull();
  });

  it("does not use pending or disputed rider reports", () => {
    const pending: CommunityBook = { M18: { "m18-tozai": consensus(M.geometry, [{ car: 2, door: 1 }]) } };
    expect((plan({ ...q, community: pending }) as { plan: { door: unknown } }).plan.door).toBeNull();
    const disputed: CommunityBook = { M18: { "m18-tozai": consensus(M.geometry, [{ car: 1, door: 1 }, { car: 1, door: 1 }, { car: 6, door: 3 }, { car: 6, door: 3 }]) } };
    expect((plan({ ...q, community: disputed }) as { plan: { door: unknown } }).plan.door).toBeNull();
  });

  it("recommends a door once riders have verified the position", () => {
    const r = plan({ ...q, community: verified(2, 1), speedWeight: 1 });
    if (!r.ok || !r.plan.door) throw new Error("expected a door plan");
    expect(r.plan.door.positionSource).toBe("community");
    expect(r.plan.door.target.positionM).toBe(doorPositionM(M.geometry, 2, 1));
    // Fastest possible: the door riders reported.
    expect(r.plan.door.solution.best).toMatchObject({ car: 2, door: 1 });
  });

  it("uses demo positions only when demo mode is explicitly on", () => {
    const r = plan({ ...q, demo: true });
    expect(r.ok && r.plan.door?.positionSource).toBe("demo");
    const real = plan({ ...q, demo: true, community: verified(3, 2) });
    expect(real.ok && real.plan.door?.positionSource).toBe("community");
  });

  it("uses live per-car loads when they are supplied", () => {
    const r = plan({ ...q, liveLoadsPct: [50, 60, 70, 80, 90, 100] });
    expect(r.ok && r.plan.loadSource).toBe("odpt-live");
    expect(r.ok && r.plan.loadsPct).toEqual([50, 60, 70, 80, 90, 100]);
  });

  it("refuses stations that have no egress data at all", () => {
    expect(plan({ ...q, to: "M19" })).toMatchObject({ ok: false, error: { kind: "no-layout" } });
    expect(plan({ ...q, to: "M08" })).toMatchObject({ ok: false, error: { kind: "same-station" } });
    expect(plan({ ...q, line: "Z" })).toMatchObject({ ok: false, error: { kind: "unknown-line" } });
  });

  it("describes crowding relative to the train, with an 'average' band", () => {
    expect(crowdLevels([90, 100, 110, 100])).toEqual(["quieter", "average", "busier", "average"]);
  });
});
