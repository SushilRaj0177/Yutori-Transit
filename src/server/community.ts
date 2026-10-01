import "server-only";
import { consensus, type Report } from "@/core/consensus";
import type { CommunityBook } from "@/core/positions";
import type { Line } from "@/data/network";
import { layoutReports } from "./store";

/** Rider consensus for every egress point on a line. `enabled` is false when no store is configured. */
export async function communityBook(line: Line): Promise<{ enabled: boolean; book: CommunityBook }> {
  let rows;
  try {
    rows = await layoutReports(line.id);
  } catch (err) {
    console.error("layout reports unavailable:", err);
    return { enabled: false, book: {} };
  }
  if (rows === null) return { enabled: false, book: {} };
  const grouped: Record<string, Record<string, Report[]>> = {};
  for (const r of rows) ((grouped[r.station] ??= {})[r.egress_id] ??= []).push({ car: Number(r.car), door: Number(r.door) });
  const book: CommunityBook = {};
  for (const [station, byEgress] of Object.entries(grouped))
    for (const [egressId, reports] of Object.entries(byEgress)) (book[station] ??= {})[egressId] = consensus(line.geometry, reports);
  return { enabled: true, book };
}
