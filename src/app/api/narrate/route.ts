import { factsOf } from "@/core/explain";
import { plan } from "@/core/plan";
import { allow } from "@/server/rate-limit";
import { narrate } from "@/server/narrate";

/**
 * The client sends the query, never the numbers: the plan is recomputed here so
 * the narration can only describe what the engine actually decided.
 */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!allow(ip)) return Response.json({ error: "slow down" }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }
  const num = (v: unknown, lo: number, hi: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : null);
  const speedWeight = num(body.speedWeight, 0, 1);
  const hour = num(body.hour, 0, 24);
  if (speedWeight === null || hour === null) return Response.json({ error: "speedWeight and hour are required" }, { status: 400 });

  const result = plan({
    line: String(body.line ?? ""),
    from: String(body.from ?? ""),
    to: String(body.to ?? ""),
    egressId: typeof body.egressId === "string" ? body.egressId : undefined,
    speedWeight,
    hour,
    dayType: body.dayType === "holiday" ? "holiday" : "weekday",
    delayS: num(body.delayS, 0, 3600) ?? undefined,
  });
  if (!result.ok) return Response.json({ error: result.error.kind }, { status: 422 });
  return Response.json(await narrate(factsOf(result.plan)));
}
