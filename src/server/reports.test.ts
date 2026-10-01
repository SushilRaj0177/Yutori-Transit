import { describe, expect, it } from "vitest";
import { getLine } from "@/data/network";
import { POST } from "@/app/api/reports/route";
import { communityBook } from "./community";

const M = getLine("M")!;
const report = (body: Record<string, unknown>, ip: string) =>
  POST(new Request("http://test/api/reports", { method: "POST", headers: { "x-forwarded-for": ip }, body: JSON.stringify(body) }));
const valid = { line: "M", station: "M18", egressId: "m18-tozai", car: 2, door: 1 };
const device = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

describe("rider reports (embedded Postgres)", () => {
  it("rejects malformed reports", async () => {
    expect((await report({ ...valid, egressId: "nope", deviceId: device(1) }, "10.0.0.1")).status).toBe(400);
    expect((await report({ ...valid, car: 9, deviceId: device(1) }, "10.0.0.1")).status).toBe(400);
    expect((await report({ ...valid, deviceId: "x" }, "10.0.0.1")).status).toBe(400);
  });

  it("counts one person with many devices on one connection as one vote", async () => {
    for (let i = 0; i < 3; i++) expect((await report({ ...valid, deviceId: device(100 + i) }, "10.0.0.9")).status).toBe(200);
    const c = (await communityBook(M)).book.M18["m18-tozai"];
    expect(c).toMatchObject({ status: "pending", reports: 1 });
  });

  it("verifies once riders on different connections agree", async () => {
    await report({ ...valid, deviceId: device(200) }, "10.0.1.1");
    const res = await report({ ...valid, door: 2, deviceId: device(201) }, "10.0.1.2");
    const body = await res.json();
    expect(body.consensus).toMatchObject({ status: "verified", car: 2, door: 1, reports: 3 });
  });

  it("lets a device change its own vote instead of adding another", async () => {
    await report({ ...valid, egressId: "m18-lift", car: 5, door: 1, deviceId: device(300) }, "10.0.2.1");
    await report({ ...valid, egressId: "m18-lift", car: 3, door: 3, deviceId: device(300) }, "10.0.2.1");
    expect((await communityBook(M)).book.M18["m18-lift"]).toMatchObject({ reports: 1, car: 3, door: 3 });
  });

  it("rate-limits a single connection", async () => {
    let last = 0;
    for (let i = 0; i < 25; i++) last = (await report({ ...valid, egressId: "m18-chiyoda", deviceId: device(400 + i) }, "10.0.3.1")).status;
    expect(last).toBe(429);
  });
});
