import { NextRequest, NextResponse } from "next/server";
import {
  getTrains,
  getStations,
  getRailway,
  getTrainInformation,
} from "@/lib/odpt";
import { getPlatformLayout, getWalkDistance } from "@/lib/platform-data";
import { optimizeCars, type CarOption } from "@/lib/optimizer";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const stationId = searchParams.get("station");
  const railwayId = searchParams.get("railway");
  const railDirection = searchParams.get("direction");
  const transferTo = searchParams.get("transferTo"); // Target transfer point ID
  const comfortWeight = parseFloat(searchParams.get("comfort") || "0.5");

  if (!stationId || !railwayId) {
    return NextResponse.json(
      { error: "Missing required params: station, railway" },
      { status: 400 }
    );
  }

  try {
    // Fetch real-time train data and platform layout in parallel
    const [trains, stationInfo, railwayInfo, serviceInfo] = await Promise.all([
      getTrains(railwayId).catch(() => []),
      getStations(railwayId).catch(() => []),
      getRailway(railwayId).catch(() => []),
      getTrainInformation(railwayId).catch(() => []),
    ]);

    // Get platform layout data for this station (with spatial graph fallback)
    const platform = getPlatformLayout(
      stationId,
      railwayId,
      railDirection || undefined
    );

    // Find the next train approaching or stopping at this station
    const nextTrain = trains.find(
      (t) =>
        t["odpt:toStation"] === stationId ||
        t["odpt:fromStation"] === stationId
    );

    // Build car options
    const carCount =
      nextTrain?.["odpt:carComposition"] || platform?.carCount || 10;
    const congestionDegrees = nextTrain?.["odpt:congestionDegrees"];

    // Determine target transfer point: use specified or default to primary egress
    const targetTransfer =
      platform?.transferPoints.find((tp) => tp.id === transferTo) ||
      (platform?.transferPoints.length > 0 ? platform.transferPoints[0] : null);

    const carOptions: CarOption[] = Array.from(
      { length: carCount },
      (_, i) => {
        const carNumber = i + 1;

        // Use real telemetry if available, otherwise realistic distribution
        const congestion = congestionDegrees
          ? Math.round(congestionDegrees[i] * 100)
          : simulateCongestion(carNumber, carCount);

        // Calculate walking distance to transfer point
        let walkDistance = 0;
        let walkTime = 0;
        if (targetTransfer) {
          const walk = getWalkDistance(carNumber, targetTransfer, carCount);
          walkDistance = walk.distance;
          walkTime = walk.time;
        }

        return { carNumber, congestion, walkDistance, walkTime };
      }
    );

    // Run Pareto multi-objective optimization
    const optimized = optimizeCars(carOptions, { comfortWeight });

    // Current station metadata
    const currentStation = stationInfo.find((s) => s["@id"] === stationId);

    // Parse service disruption/status information safely
    let statusText = "Normal service";
    let alertDetails = "";

    if (serviceInfo && serviceInfo.length > 0) {
      const info = serviceInfo[0];
      const statusObj = info["odpt:trainInformationStatus"];
      const textObj = info["odpt:trainInformationText"];

      if (statusObj) {
        statusText = typeof statusObj === "string" ? statusObj : statusObj.en || statusObj.ja || "Normal service";
      }

      if (textObj) {
        alertDetails = typeof textObj === "string" ? textObj : textObj.en || textObj.ja || "";
      }
    }

    return NextResponse.json({
      station: {
        id: stationId,
        name: currentStation?.["odpt:stationTitle"]?.en || currentStation?.["dc:title"] || stationId,
        nameJa: currentStation?.["odpt:stationTitle"]?.ja || "",
      },
      railway: {
        id: railwayId,
        name: railwayInfo[0]?.["odpt:railwayTitle"]?.en || railwayInfo[0]?.["dc:title"] || railwayId,
        nameJa: railwayInfo[0]?.["odpt:railwayTitle"]?.ja || "",
        color: railwayInfo[0]?.["odpt:color"] || "#666",
      },
      train: nextTrain
        ? {
            number: nextTrain["odpt:trainNumber"] || "LIVE",
            carCount,
            delay: nextTrain["odpt:delay"] || 0,
            hasLiveCongestion: !!congestionDegrees,
          }
        : null,
      serviceInfo: {
        status: statusText,
        text: alertDetails,
      },
      transferPoints: platform?.transferPoints || [],
      selectedTransfer: targetTransfer,
      cars: optimized,
      recommendation: optimized[0] || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Optimize API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transit data" },
      { status: 500 }
    );
  }
}

/**
 * Simulate congestion when live data isn't exposed for this operator.
 * Real-world Tokyo distribution: end cars (1 & N) are significantly less crowded than middle cars.
 */
function simulateCongestion(carNumber: number, totalCars: number): number {
  const midpoint = (totalCars + 1) / 2;
  const distFromCenter = Math.abs(carNumber - midpoint) / midpoint;

  // Base congestion: ~60-80% for middle cars near stairs, ~25-45% for end cars
  const baseCongestion = 68 - distFromCenter * 35;
  const variation = Math.sin(carNumber * 2.8) * 8;

  return Math.max(15, Math.min(100, Math.round(baseCongestion + variation)));
}
