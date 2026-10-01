import { clientIp } from "@/server/client-ip";
import { consensus, isValidReport } from "@/core/consensus";
import { findEgress } from "@/data/layouts";
import { getLine } from "@/data/network";
import { communityBook } from "@/server/community";
import { hashId, recentReportsFromIp, saveLayoutReport } from "@/server/store";

const MAX_REPORTS_PER_IP_PER_HOUR = 20;
const DEVICE_ID = /^[0-9a-f-]{16,64}$/i;

/** A rider reports which car and door an egress point is nearest to. */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }
  const line = getLine(String(body.line ?? ""));
  const station = String(body.station ?? "");
  const egressId = String(body.egressId ?? "");
  const car = Number(body.car);
  const door = Number(body.door);
  const deviceId = String(body.deviceId ?? "");

  if (!line || !findEgress(line.id, station, egressId)) return Response.json({ error: "unknown egress point" }, { status: 400 });
  if (!isValidReport(line.geometry, { car, door })) return Response.json({ error: "car or door out of range" }, { status: 400 });
  if (!DEVICE_ID.test(deviceId)) return Response.json({ error: "invalid device id" }, { status: 400 });

  const ip = clientIp(req);
  const ipHash = hashId(`ip:${ip}`);
  try {
    if ((await recentReportsFromIp(ipHash)) >= MAX_REPORTS_PER_IP_PER_HOUR) return Response.json({ error: "too many reports, try again later" }, { status: 429 });
    const saved = await saveLayoutReport({ line: line.id, station, egressId, car, door, deviceHash: hashId(`device:${deviceId}`), ipHash });
    if (!saved) return Response.json({ error: "contributions are not enabled on this deployment" }, { status: 503 });
  } catch (err) {
    console.error("saving report failed:", err);
    return Response.json({ error: "could not save the report" }, { status: 500 });
  }
  const { book } = await communityBook(line);
  return Response.json({ consensus: book[station]?.[egressId] ?? consensus(line.geometry, []) });
}
