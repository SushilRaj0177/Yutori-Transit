import { describe, expect, it } from "vitest";
import { trainLengthM } from "@/engine/geometry";
import { LAYOUTS } from "@/data/layouts";
import { directionBetween, getLine, LINES, stationsAhead, stationsBehind } from "@/data/network";
import { plan } from "./plan";

describe("network data", () => {
  it("has unique, correctly prefixed station codes", () => {
    for (const line of LINES) {
      const codes = line.stations.map((s) => s.code);
      expect(new Set(codes).size).toBe(codes.length);
      codes.forEach((c, i) => expect(c).toBe(`${line.id}${String(i + 1).padStart(2, "0")}`));
    }
  });

  it("keeps every egress inside the stopped train's footprint", () => {
    for (const layout of LAYOUTS) {
      const len = trainLengthM(getLine(layout.line)!.geometry);
      for (const g of layout.egress) {
        expect(g.positionM).toBeGreaterThanOrEqual(0);
        expect(g.positionM).toBeLessThanOrEqual(len);
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
  const q = { line: "M", from: "M08", to: "M18", speedWeight: 0.5, hour: 8.3, dayType: "weekday" as const };

  it("recommends a door when the destination has a layout", () => {
    const r = plan({ ...q, egressId: "m18-tozai" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.plan.target.id).toBe("m18-tozai");
    expect(r.plan.loadSource).toBe("estimate");
    expect(r.plan.candidates).toHaveLength(18);
    // Fastest exit to an egress at 10 m must be in car 1.
    const fastest = plan({ ...q, egressId: "m18-tozai", speedWeight: 1 });
    expect(fastest.ok && fastest.plan.solution.best.car).toBe(1);
  });

  it("uses live per-car loads when they are supplied", () => {
    const r = plan({ ...q, liveLoadsPct: [50, 60, 70, 80, 90, 100] });
    expect(r.ok && r.plan.loadSource).toBe("odpt-live");
    expect(r.ok && r.plan.loadsPct).toEqual([50, 60, 70, 80, 90, 100]);
  });

  it("refuses destinations without a platform layout instead of inventing one", () => {
    const r = plan({ ...q, to: "M19" });
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error.kind).toBe("no-layout");
  });

  it("rejects same-station and unknown queries", () => {
    expect(plan({ ...q, to: "M08" })).toMatchObject({ ok: false, error: { kind: "same-station" } });
    expect(plan({ ...q, line: "Z" })).toMatchObject({ ok: false, error: { kind: "unknown-line" } });
  });
});
