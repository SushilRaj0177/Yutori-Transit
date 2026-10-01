import { describe, expect, it } from "vitest";
import { evenDoorOffsets } from "@/engine/geometry";
import type { TrainGeometry } from "@/engine/types";
import { consensus, isValidReport, MIN_REPORTS, nearestDoor } from "./consensus";

const G: TrainGeometry = { carCount: 6, carLengthM: 18, couplerGapM: 0.6, doorOffsetsM: evenDoorOffsets(18, 3) };
const r = (car: number, door: number) => ({ car, door });

describe("consensus", () => {
  it("has nothing to say without reports", () => {
    expect(consensus(G, [])).toMatchObject({ status: "none", reports: 0 });
  });

  it("stays pending below the minimum number of reports, even if they agree", () => {
    const c = consensus(G, [r(4, 2), r(4, 2)]);
    expect(MIN_REPORTS).toBe(3);
    expect(c).toMatchObject({ status: "pending", reports: 2, car: 4, door: 2 });
  });

  it("verifies when enough riders agree, tolerating a neighbouring door", () => {
    const c = consensus(G, [r(4, 2), r(4, 2), r(4, 3)]);
    expect(c).toMatchObject({ status: "verified", car: 4, door: 2 });
    expect(c.agreement).toBe(1);
  });

  it("is not moved by a single troll report", () => {
    const c = consensus(G, [r(4, 2), r(4, 2), r(4, 2), r(1, 1)]);
    expect(c).toMatchObject({ status: "verified", car: 4, door: 2 });
    expect(c.agreement).toBe(0.75);
  });

  it("marks split opinions as disputed instead of picking one", () => {
    const c = consensus(G, [r(1, 1), r(1, 1), r(6, 3), r(6, 3)]);
    expect(c.status).toBe("disputed");
  });

  it("ignores reports outside the train", () => {
    expect(isValidReport(G, r(7, 1))).toBe(false);
    expect(isValidReport(G, r(1, 4))).toBe(false);
    expect(isValidReport(G, r(1.5, 1))).toBe(false);
    expect(consensus(G, [r(9, 9), r(0, 1)]).status).toBe("none");
  });

  it("snaps positions to the nearest real door", () => {
    expect(nearestDoor(G, 0)).toMatchObject({ car: 1, door: 1 });
    expect(nearestDoor(G, 18.6 + 9.2)).toMatchObject({ car: 2, door: 2 });
  });
});
