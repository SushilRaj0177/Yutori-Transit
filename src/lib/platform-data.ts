// Platform Layout Data & Discrete Spatial Coordinates
// Maps station + platform → car and door positions relative to exits/stairs/elevators
// Implements 1D linear platform coordinates [0, L_plat] in meters as per Yutori Car specification.

export interface TransferPoint {
  /** Unique ID */
  id: string;
  /** What kind of transfer point */
  type: "stairs" | "escalator" | "elevator" | "exit";
  /** Display name */
  name: string;
  nameJa?: string;
  /** Which connecting line this leads to (if transfer), or exit name */
  connectsTo?: string;
  /** Nearest car number (1-indexed) */
  nearestCar: number;
  /** Nearest door of that car (1 = front door, 2 = back door, etc.) */
  nearestDoor: number;
  /** Approximate walking distance from that door in meters */
  distanceFromDoor: number;
  /** Accessible for wheelchairs/strollers/luggage */
  isAccessible?: boolean;
}

export interface PlatformLayout {
  /** Station ODPT ID */
  stationId: string;
  /** Railway line ODPT ID */
  railwayId: string;
  /** Direction of travel (optional) */
  railDirection?: string;
  /** Total number of cars on trains stopping here */
  carCount: number;
  /** Platform length in meters */
  lengthMeters: number;
  /** Transfer points on this platform */
  transferPoints: TransferPoint[];
}

export const PLATFORM_LAYOUTS: PlatformLayout[] = [
  // ── Tokyo Station (Marunouchi Line) ──
  {
    stationId: "odpt.Station:TokyoMetro.Marunouchi.Tokyo",
    railwayId: "odpt.Railway:TokyoMetro.Marunouchi",
    carCount: 6,
    lengthMeters: 140,
    transferPoints: [
      {
        id: "tokyo-marunouchi-jr-central",
        type: "escalator",
        name: "JR Shinkansen & Central Transfer",
        nameJa: "JR新幹線・JR線中央連絡口",
        connectsTo: "odpt.Railway:JR-East.Yamanote",
        nearestCar: 3,
        nearestDoor: 2,
        distanceFromDoor: 12,
        isAccessible: true,
      },
      {
        id: "tokyo-marunouchi-marunouchi-exit",
        type: "stairs",
        name: "Marunouchi Underground Central Exit",
        nameJa: "丸の内地下中央口",
        nearestCar: 1,
        nearestDoor: 1,
        distanceFromDoor: 18,
      },
      {
        id: "tokyo-marunouchi-elevator",
        type: "elevator",
        name: "Barrier-Free Elevator to Concourse",
        nameJa: "コンコース直通エレベーター",
        nearestCar: 4,
        nearestDoor: 1,
        distanceFromDoor: 8,
        isAccessible: true,
      },
    ],
  },

  // ── Otemachi Station (Marunouchi Line) ──
  {
    stationId: "odpt.Station:TokyoMetro.Marunouchi.Otemachi",
    railwayId: "odpt.Railway:TokyoMetro.Marunouchi",
    carCount: 6,
    lengthMeters: 140,
    transferPoints: [
      {
        id: "otemachi-marunouchi-tozai",
        type: "escalator",
        name: "Direct Escalator to Tozai Line",
        nameJa: "東西線連絡エスカレーター",
        connectsTo: "odpt.Railway:TokyoMetro.Tozai",
        nearestCar: 4,
        nearestDoor: 2,
        distanceFromDoor: 4,
        isAccessible: true,
      },
      {
        id: "otemachi-marunouchi-chiyoda",
        type: "stairs",
        name: "Transfer to Chiyoda Line",
        nameJa: "千代田線乗り換え通路",
        connectsTo: "odpt.Railway:TokyoMetro.Chiyoda",
        nearestCar: 2,
        nearestDoor: 1,
        distanceFromDoor: 28,
      },
      {
        id: "otemachi-marunouchi-hanzomon-mita",
        type: "stairs",
        name: "Transfer to Hanzomon & Mita Lines",
        nameJa: "半蔵門線・都営三田線乗り換え",
        connectsTo: "odpt.Railway:TokyoMetro.Hanzomon",
        nearestCar: 6,
        nearestDoor: 2,
        distanceFromDoor: 32,
      },
    ],
  },

  // ── Ginza Station (Ginza Line) ──
  {
    stationId: "odpt.Station:TokyoMetro.Ginza.Ginza",
    railwayId: "odpt.Railway:TokyoMetro.Ginza",
    carCount: 6,
    lengthMeters: 130,
    transferPoints: [
      {
        id: "ginza-marunouchi-transfer",
        type: "stairs",
        name: "Transfer to Marunouchi Line",
        nameJa: "丸ノ内線乗り換え通路",
        connectsTo: "odpt.Railway:TokyoMetro.Marunouchi",
        nearestCar: 3,
        nearestDoor: 1,
        distanceFromDoor: 15,
      },
      {
        id: "ginza-hibiya-transfer",
        type: "escalator",
        name: "Transfer to Hibiya Line",
        nameJa: "日比谷線乗り換えエスカレーター",
        connectsTo: "odpt.Railway:TokyoMetro.Hibiya",
        nearestCar: 5,
        nearestDoor: 2,
        distanceFromDoor: 10,
        isAccessible: true,
      },
      {
        id: "ginza-exit-a1",
        type: "stairs",
        name: "Ginza 4-Chome Crossing Exit",
        nameJa: "銀座四丁目交差点・和光方面改札",
        nearestCar: 1,
        nearestDoor: 1,
        distanceFromDoor: 22,
      },
    ],
  },

  // ── Shinjuku Station (Marunouchi Line) ──
  {
    stationId: "odpt.Station:TokyoMetro.Marunouchi.Shinjuku",
    railwayId: "odpt.Railway:TokyoMetro.Marunouchi",
    carCount: 6,
    lengthMeters: 140,
    transferPoints: [
      {
        id: "shinjuku-marunouchi-jr-west",
        type: "stairs",
        name: "JR West Exit & Odakyu/Keio Gate",
        nameJa: "JR西口・小田急・京王連絡通路",
        connectsTo: "odpt.Railway:JR-East.Yamanote",
        nearestCar: 2,
        nearestDoor: 1,
        distanceFromDoor: 18,
      },
      {
        id: "shinjuku-marunouchi-toei-transfer",
        type: "escalator",
        name: "Transfer to Toei Shinjuku & Oedo Lines",
        nameJa: "都営新宿線・大江戸線連絡",
        connectsTo: "odpt.Railway:Toei.Shinjuku",
        nearestCar: 4,
        nearestDoor: 2,
        distanceFromDoor: 15,
        isAccessible: true,
      },
      {
        id: "shinjuku-marunouchi-east-exit",
        type: "stairs",
        name: "East Exit / Kabukicho Corridor",
        nameJa: "東口・歌舞伎町・アルタ方面",
        nearestCar: 6,
        nearestDoor: 2,
        distanceFromDoor: 25,
      },
    ],
  },

  // ── Shibuya Station (Ginza Line) ──
  {
    stationId: "odpt.Station:TokyoMetro.Ginza.Shibuya",
    railwayId: "odpt.Railway:TokyoMetro.Ginza",
    carCount: 6,
    lengthMeters: 130,
    transferPoints: [
      {
        id: "shibuya-ginza-scramble",
        type: "stairs",
        name: "Hachiko & Scramble Crossing Exit",
        nameJa: "ハチ公改札・スクランブル交差点",
        connectsTo: "odpt.Railway:JR-East.Yamanote",
        nearestCar: 1,
        nearestDoor: 1,
        distanceFromDoor: 14,
      },
      {
        id: "shibuya-ginza-fukutoshin",
        type: "escalator",
        name: "Transfer to Hanzomon / Fukutoshin Line",
        nameJa: "半蔵門線・副都心線地下連絡",
        connectsTo: "odpt.Railway:TokyoMetro.Fukutoshin",
        nearestCar: 3,
        nearestDoor: 2,
        distanceFromDoor: 20,
        isAccessible: true,
      },
      {
        id: "shibuya-ginza-hikarie",
        type: "escalator",
        name: "Shibuya Hikarie Skyway Direct",
        nameJa: "渋谷ヒカリエ直結連絡通路",
        nearestCar: 6,
        nearestDoor: 1,
        distanceFromDoor: 8,
        isAccessible: true,
      },
    ],
  },

  // ── Shinjuku (Toei Shinjuku Line) ──
  {
    stationId: "odpt.Station:Toei.Shinjuku.Shinjuku",
    railwayId: "odpt.Railway:Toei.Shinjuku",
    carCount: 10,
    lengthMeters: 210,
    transferPoints: [
      {
        id: "toei-shinjuku-keio-new",
        type: "escalator",
        name: "Keio New Line Through Platform",
        nameJa: "京王新線直通ホーム連絡",
        connectsTo: "odpt.Railway:Keio.KeioNew",
        nearestCar: 5,
        nearestDoor: 2,
        distanceFromDoor: 10,
        isAccessible: true,
      },
      {
        id: "toei-shinjuku-oedo",
        type: "stairs",
        name: "Transfer to Toei Oedo Line",
        nameJa: "都営大江戸線乗り換え",
        connectsTo: "odpt.Railway:Toei.Oedo",
        nearestCar: 8,
        nearestDoor: 1,
        distanceFromDoor: 35,
      },
      {
        id: "toei-shinjuku-jr-south",
        type: "stairs",
        name: "JR South Exit / Koshu Kaido Gate",
        nameJa: "JR南口・甲州街道改札",
        connectsTo: "odpt.Railway:JR-East.Yamanote",
        nearestCar: 2,
        nearestDoor: 1,
        distanceFromDoor: 45,
      },
    ],
  },
];

/**
 * Standard default egress generator for stations without custom architectural surveys.
 * Generates mathematically realistic Tokyo 1D spatial platform egress nodes:
 * - Front Egress (Car ~2): Stairs to North Gate
 * - Mid Egress (Car ~N/2): Escalator to Central Concourse & Transfers
 * - Rear Egress (Car ~N-1): Elevator & South Gate
 */
function createFallbackLayout(
  stationId: string,
  railwayId: string,
  totalCars: number = 10
): PlatformLayout {
  const midCar = Math.max(2, Math.round(totalCars / 2));
  const rearCar = Math.max(midCar + 1, totalCars - 1);

  return {
    stationId,
    railwayId,
    carCount: totalCars,
    lengthMeters: totalCars * 20.5,
    transferPoints: [
      {
        id: `${stationId}-mid-concourse`,
        type: "escalator",
        name: "Central Concourse & Transfer Escalator",
        nameJa: "中央改札・乗換連絡エスカレーター",
        nearestCar: midCar,
        nearestDoor: 2,
        distanceFromDoor: 12,
        isAccessible: true,
      },
      {
        id: `${stationId}-front-stairs`,
        type: "stairs",
        name: "Forward Gate / Main Exit",
        nameJa: "前側改札口・階段",
        nearestCar: 2,
        nearestDoor: 1,
        distanceFromDoor: 20,
      },
      {
        id: `${stationId}-elevator-accessible`,
        type: "elevator",
        name: "Accessible Elevator to Ticket Gates",
        nameJa: "バリアフリーエレベーター",
        nearestCar: rearCar,
        nearestDoor: 1,
        distanceFromDoor: 10,
        isAccessible: true,
      },
    ],
  };
}

/**
 * Look up the platform layout for a given station and line.
 * Automatically falls back to standard architectural projections if uncatalogued.
 */
export function getPlatformLayout(
  stationId: string,
  railwayId: string,
  railDirection?: string
): PlatformLayout {
  const match = PLATFORM_LAYOUTS.find(
    (layout) =>
      layout.stationId === stationId &&
      layout.railwayId === railwayId &&
      (!railDirection || layout.railDirection === railDirection)
  );

  if (match) return match;

  // Determine standard car count based on line
  let carCount = 10;
  if (railwayId.includes("Ginza") || railwayId.includes("Marunouchi")) {
    carCount = 6;
  } else if (railwayId.includes("Oedo")) {
    carCount = 8;
  }

  return createFallbackLayout(stationId, railwayId, carCount);
}

/**
 * Get walking distance from a car to a specific transfer point
 * 1D coordinate projection: d = |x_door - x_egress|
 */
export function getWalkDistance(
  carNumber: number,
  transferPoint: TransferPoint,
  totalCars: number
): { distance: number; time: number } {
  const CAR_LENGTH_M = 20.0; // Standard 20m car length
  const WALKING_SPEED_MPS = 1.25; // Tokyo commuter walking speed: 1.25 m/s (~4.5 km/h)

  const carDelta = Math.abs(carNumber - transferPoint.nearestCar);
  const interCarDistance = carDelta * CAR_LENGTH_M;
  const totalDistance = interCarDistance + transferPoint.distanceFromDoor;
  const time = totalDistance / WALKING_SPEED_MPS;

  return {
    distance: Math.round(totalDistance),
    time: Math.round(time),
  };
}
