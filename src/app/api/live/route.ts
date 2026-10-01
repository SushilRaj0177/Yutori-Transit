import type { NextRequest } from "next/server";
import { getLine } from "@/data/network";
import { liveSnapshot } from "@/server/live";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const line = getLine(p.get("line") ?? "");
  const from = p.get("from") ?? "";
  const to = p.get("to") ?? "";
  if (!line || !line.stations.some((s) => s.code === from) || !line.stations.some((s) => s.code === to) || from === to) {
    return Response.json({ error: "expected ?line=M|G&from=<code>&to=<code>" }, { status: 400 });
  }
  const snapshot = await liveSnapshot(line, from, to);
  return Response.json(snapshot, { headers: { "Cache-Control": "no-store" } });
}
