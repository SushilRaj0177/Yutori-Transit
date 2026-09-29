import { NextRequest, NextResponse } from "next/server";
import { getStations } from "@/lib/odpt";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const railwayId = searchParams.get("railway");

  if (!railwayId) {
    return NextResponse.json(
      { error: "Missing required param: railway" },
      { status: 400 }
    );
  }

  try {
    const stations = await getStations(railwayId);

    const result = stations.map((s) => ({
      id: s["@id"],
      name: s["odpt:stationTitle"]?.en || s["dc:title"],
      nameJa: s["odpt:stationTitle"]?.ja || "",
      code: s["odpt:stationCode"] || "",
      connectingLines: s["odpt:connectingRailway"] || [],
      lat: s["geo:lat"],
      lng: s["geo:long"],
    }));

    return NextResponse.json({ stations: result });
  } catch (error) {
    console.error("Stations API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stations" },
      { status: 500 }
    );
  }
}
