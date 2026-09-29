// ODPT API Configuration & Client
// Docs: https://developer.odpt.org/

const ODPT_BASE_URL = "https://api.odpt.org/api/v4";

// We use the consumer key for standard data access
// and the challenge key for experimental/extended endpoints
const ODPT_CONSUMER_KEY = process.env.ODPT_CONSUMER_KEY!;
const ODPT_CHALLENGE_KEY = process.env.ODPT_CHALLENGE_KEY!;

interface ODPTRequestOptions {
  useChallenge?: boolean;
  params?: Record<string, string>;
}

async function odptFetch<T>(
  endpoint: string,
  options: ODPTRequestOptions = {}
): Promise<T> {
  const { useChallenge = false, params = {} } = options;
  const key = useChallenge ? ODPT_CHALLENGE_KEY : ODPT_CONSUMER_KEY;

  const url = new URL(`${ODPT_BASE_URL}/${endpoint}`);
  url.searchParams.set("acl:consumerKey", key);

  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    next: { revalidate: 30 }, // Cache for 30s — crowding data updates frequently
  });

  if (!res.ok) {
    throw new Error(`ODPT API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// ─── Types ──────────────────────────────────────────────────────────────

export interface TrainInformation {
  "@id": string;
  "@type": string;
  "dc:date": string;
  "odpt:operator": string;
  "odpt:railway": string;
  "odpt:trainInformationText"?: { ja?: string; en?: string };
  "odpt:trainInformationStatus"?: { ja?: string; en?: string };
}

export interface Train {
  "@id": string;
  "@type": string;
  "dc:date": string;
  "odpt:operator": string;
  "odpt:railway": string;
  "odpt:trainNumber": string;
  "odpt:trainType"?: string;
  "odpt:railDirection"?: string;
  "odpt:fromStation"?: string;
  "odpt:toStation"?: string;
  "odpt:originStation"?: string[];
  "odpt:destinationStation"?: string[];
  "odpt:delay"?: number;
  "odpt:carComposition"?: number;
  "odpt:congestionDegrees"?: number[]; // Per-car congestion if available
}

export interface Station {
  "@id": string;
  "@type": string;
  "dc:title": string;
  "odpt:operator": string;
  "odpt:railway": string;
  "odpt:stationCode"?: string;
  "odpt:stationTitle"?: { ja?: string; en?: string };
  "odpt:connectingRailway"?: string[];
  "geo:lat"?: number;
  "geo:long"?: number;
}

export interface Railway {
  "@id": string;
  "@type": string;
  "dc:title": string;
  "odpt:operator": string;
  "odpt:railwayTitle"?: { ja?: string; en?: string };
  "odpt:stationOrder"?: Array<{
    "odpt:station": string;
    "odpt:index": number;
  }>;
  "odpt:color"?: string;
}

export interface StationTimetable {
  "@id": string;
  "@type": string;
  "odpt:operator": string;
  "odpt:railway": string;
  "odpt:station": string;
  "odpt:railDirection": string;
  "odpt:stationTimetableObject"?: Array<{
    "odpt:departureTime"?: string;
    "odpt:arrivalTime"?: string;
    "odpt:trainType"?: string;
    "odpt:destinationStation"?: string[];
    "odpt:trainNumber"?: string;
    "odpt:isLast"?: boolean;
  }>;
}

// ─── API Methods ────────────────────────────────────────────────────────

/** Get real-time train positions & congestion for a railway line */
export async function getTrains(railwayId: string): Promise<Train[]> {
  return odptFetch<Train[]>("odpt:Train", {
    params: { "odpt:railway": railwayId },
  });
}

/** Get all trains for an operator */
export async function getTrainsByOperator(operatorId: string): Promise<Train[]> {
  return odptFetch<Train[]>("odpt:Train", {
    params: { "odpt:operator": operatorId },
  });
}

/** Get train service information (delays, suspensions) */
export async function getTrainInformation(
  railwayId?: string
): Promise<TrainInformation[]> {
  const params: Record<string, string> = {};
  if (railwayId) params["odpt:railway"] = railwayId;
  return odptFetch<TrainInformation[]>("odpt:TrainInformation", { params });
}

/** Get all stations for a railway line */
export async function getStations(railwayId: string): Promise<Station[]> {
  return odptFetch<Station[]>("odpt:Station", {
    params: { "odpt:railway": railwayId },
  });
}

/** Get a specific station by ID */
export async function getStation(stationId: string): Promise<Station[]> {
  return odptFetch<Station[]>("odpt:Station", {
    params: { "@id": stationId },
  });
}

/** Get railway line details */
export async function getRailway(railwayId: string): Promise<Railway[]> {
  return odptFetch<Railway[]>("odpt:Railway", {
    params: { "@id": railwayId },
  });
}

/** Get all railway lines for an operator */
export async function getRailwaysByOperator(
  operatorId: string
): Promise<Railway[]> {
  return odptFetch<Railway[]>("odpt:Railway", {
    params: { "odpt:operator": operatorId },
  });
}

/** Get station timetable */
export async function getStationTimetable(
  stationId: string,
  railDirectionId?: string
): Promise<StationTimetable[]> {
  const params: Record<string, string> = { "odpt:station": stationId };
  if (railDirectionId) params["odpt:railDirection"] = railDirectionId;
  return odptFetch<StationTimetable[]>("odpt:StationTimetable", { params });
}

// ─── Operators we support ───────────────────────────────────────────────

export const SUPPORTED_OPERATORS = {
  tokyoMetro: "odpt.Operator:TokyoMetro",
  toei: "odpt.Operator:Toei",
  jrEast: "odpt.Operator:JR-East",
} as const;

export const OPERATOR_DISPLAY = {
  [SUPPORTED_OPERATORS.tokyoMetro]: {
    name: "Tokyo Metro",
    nameJa: "東京メトロ",
    color: "#00A0DE",
  },
  [SUPPORTED_OPERATORS.toei]: {
    name: "Toei Subway",
    nameJa: "都営地下鉄",
    color: "#008E4A",
  },
  [SUPPORTED_OPERATORS.jrEast]: {
    name: "JR East",
    nameJa: "JR東日本",
    color: "#378B29",
  },
} as const;
