import "server-only";
import { directionBetween, type Line } from "@/data/network";
import { extractCarLoads, parseApproaching, parseDepartures, parseService, type LiveSnapshot } from "@/core/live";
import { jstClock } from "@/core/time";
import { odptConfigured, odptGet, type OdptStationTimetable, type OdptTrain, type OdptTrainInformation } from "./odpt";

const settle = async <T>(p: Promise<T>, label: string, errors: string[]): Promise<T | null> => {
  try {
    return await p;
  } catch (err) {
    errors.push(`${label}: ${(err as Error).message}`);
    return null;
  }
};

export async function liveSnapshot(line: Line, fromCode: string, toCode: string): Promise<LiveSnapshot> {
  const errors: string[] = [];
  const from = line.stations.find((s) => s.code === fromCode);
  const direction = directionBetween(line, fromCode, toCode);
  const base: LiveSnapshot = {
    fetchedAt: new Date().toISOString(),
    odptConfigured: odptConfigured(),
    service: null,
    approaching: null,
    departures: null,
    carLoadsPct: null,
    positionsPublished: false,
    errors,
  };
  if (!from || !direction) return { ...base, errors: ["invalid route"] };
  if (!base.odptConfigured) return { ...base, errors: ["ODPT keys are not configured on the server"] };

  const clock = jstClock();
  const calendar = clock.dayType === "weekday" ? "odpt.Calendar:Weekday" : "odpt.Calendar:SaturdayHoliday";

  const [info, trains, timetables] = await Promise.all([
    settle(odptGet<OdptTrainInformation[]>("odpt:TrainInformation", { "odpt:railway": line.odptRailway }, 60), "service", errors),
    settle(odptGet<OdptTrain[]>("odpt:Train", { "odpt:railway": line.odptRailway }, 20), "trains", errors),
    settle(
      odptGet<OdptStationTimetable[]>("odpt:StationTimetable", { "odpt:station": from.odpt, "odpt:railDirection": direction.odpt }, 6 * 3600),
      "timetable",
      errors,
    ),
  ]);

  // ODPT has no Tokyo Metro train positions (verified 2026-10-01): an empty list means
  // "not published", which is different from "no train approaching right now".
  const positionsPublished = Boolean(trains && trains.length > 0);
  const approaching = trains && positionsPublished ? parseApproaching(line, from.odpt, from.code, direction, trains) : null;
  const nextTrain = trains?.find((t) => t["odpt:trainNumber"] === approaching?.[0]?.trainNumber);

  return {
    ...base,
    positionsPublished,
    service: info ? parseService(info) : null,
    approaching,
    departures: timetables ? parseDepartures(line, timetables, calendar, clock.minuteOfServiceDay) : null,
    carLoadsPct: extractCarLoads(nextTrain, process.env.ODPT_CAR_LOAD_FIELD, line.geometry.carCount),
  };
}
