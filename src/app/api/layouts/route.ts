import type { NextRequest } from "next/server";
import { getLine } from "@/data/network";
import { communityBook } from "@/server/community";

/** Rider-reported platform positions for a line, with consensus status per egress point. */
export async function GET(req: NextRequest) {
  const line = getLine(req.nextUrl.searchParams.get("line") ?? "");
  if (!line) return Response.json({ error: "expected ?line=M|G" }, { status: 400 });
  return Response.json(await communityBook(line), { headers: { "Cache-Control": "no-store" } });
}
