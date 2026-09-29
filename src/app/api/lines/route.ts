import { NextResponse } from "next/server";
import { getRailwaysByOperator, getStations, SUPPORTED_OPERATORS } from "@/lib/odpt";

export async function GET() {
  try {
    // Fetch railways for all supported operators in parallel
    const operatorEntries = Object.entries(SUPPORTED_OPERATORS);
    const railwayResults = await Promise.all(
      operatorEntries.map(([, operatorId]) => getRailwaysByOperator(operatorId))
    );

    // Build a structured response
    const operators = operatorEntries.map(([key, operatorId], index) => ({
      id: operatorId,
      key,
      railways: railwayResults[index].map((r) => ({
        id: r["@id"],
        name: r["odpt:railwayTitle"]?.en || r["dc:title"],
        nameJa: r["odpt:railwayTitle"]?.ja || "",
        color: r["odpt:color"] || "#666",
      })),
    }));

    return NextResponse.json({ operators });
  } catch (error) {
    console.error("Lines API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch railway lines" },
      { status: 500 }
    );
  }
}
