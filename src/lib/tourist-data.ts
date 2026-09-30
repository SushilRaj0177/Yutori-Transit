// Tokyo Tourist & First-Timer Helper Data
// Bridges recognizable landmarks, sightseeing hubs, and travel situations into stations and lines.

export interface LandmarkHub {
  id: string;
  name: string;
  nameJa: string;
  landmark: string;
  landmarkJa: string;
  tagline: string;
  taglineJa: string;
  icon: string;
  stationId: string;
  railwayId: string;
  lineCode: string;
  lineName: string;
  lineNameJa: string;
  lineColor: string;
  suggestedEgress: string; // ID of primary transfer or exit
}

export const TOKYO_LANDMARK_HUBS: LandmarkHub[] = [
  {
    id: "hub-shibuya",
    name: "Shibuya",
    nameJa: "渋谷",
    landmark: "Scramble Crossing & Hachiko",
    landmarkJa: "スクランブル交差点・ハチ公",
    tagline: "Youth culture, shopping & dining",
    taglineJa: "若者カルチャー・ショッピング",
    icon: "🐕",
    stationId: "odpt.Station:TokyoMetro.Ginza.Shibuya",
    railwayId: "odpt.Railway:TokyoMetro.Ginza",
    lineCode: "G01",
    lineName: "Ginza Line",
    lineNameJa: "銀座線",
    lineColor: "#F39700",
    suggestedEgress: "shibuya-ginza-scramble",
  },
  {
    id: "hub-tokyo",
    name: "Tokyo Station",
    nameJa: "東京駅",
    landmark: "Shinkansen & Central Red Brick",
    landmarkJa: "新幹線・赤レンガ駅舎",
    tagline: "Bullet trains & airport express",
    taglineJa: "新幹線乗り換え・空港アクセス",
    icon: "🚄",
    stationId: "odpt.Station:TokyoMetro.Marunouchi.Tokyo",
    railwayId: "odpt.Railway:TokyoMetro.Marunouchi",
    lineCode: "M17",
    lineName: "Marunouchi Line",
    lineNameJa: "丸ノ内線",
    lineColor: "#E60012",
    suggestedEgress: "tokyo-marunouchi-jr-central",
  },
  {
    id: "hub-otemachi",
    name: "Otemachi",
    nameJa: "大手町",
    landmark: "Mega Transfer Hub (5 Lines)",
    landmarkJa: "都内最大級の5路線連絡駅",
    tagline: "Direct connection to Tozai & Chiyoda",
    taglineJa: "東西線・千代田線への乗り換え",
    icon: "🏢",
    stationId: "odpt.Station:TokyoMetro.Marunouchi.Otemachi",
    railwayId: "odpt.Railway:TokyoMetro.Marunouchi",
    lineCode: "M18",
    lineName: "Marunouchi Line",
    lineNameJa: "丸ノ内線",
    lineColor: "#E60012",
    suggestedEgress: "otemachi-marunouchi-tozai",
  },
  {
    id: "hub-shinjuku",
    name: "Shinjuku",
    nameJa: "新宿",
    landmark: "Kabukicho & Busiest Station",
    landmarkJa: "歌舞伎町・世界最多乗降客数",
    tagline: "Entertainment, nightlife & JR lines",
    taglineJa: "エンタメ・JR線乗り換え",
    icon: "🌆",
    stationId: "odpt.Station:TokyoMetro.Marunouchi.Shinjuku",
    railwayId: "odpt.Railway:TokyoMetro.Marunouchi",
    lineCode: "M08",
    lineName: "Marunouchi Line",
    lineNameJa: "丸ノ内線",
    lineColor: "#E60012",
    suggestedEgress: "shinjuku-marunouchi-toei-transfer",
  },
  {
    id: "hub-ginza",
    name: "Ginza",
    nameJa: "銀座",
    landmark: "Wako Clock & Luxury Boutiques",
    landmarkJa: "和光時計塔・百貨店街",
    tagline: "High-end shopping & fine dining",
    taglineJa: "ショッピング・グルメの街",
    icon: "🛍️",
    stationId: "odpt.Station:TokyoMetro.Ginza.Ginza",
    railwayId: "odpt.Railway:TokyoMetro.Ginza",
    lineCode: "G09",
    lineName: "Ginza Line",
    lineNameJa: "銀座線",
    lineColor: "#F39700",
    suggestedEgress: "ginza-marunouchi-transfer",
  },
];

export interface TravelerSituation {
  id: "luggage" | "hurry" | "calm" | "stroller";
  icon: string;
  title: string;
  titleJa: string;
  desc: string;
  descJa: string;
  comfortWeight: number; // 0 (speed) to 1 (comfort)
}

export const TRAVELER_SITUATIONS: TravelerSituation[] = [
  {
    id: "luggage",
    icon: "🧳",
    title: "Heavy Luggage",
    titleJa: "大きなスーツケース",
    desc: "Wider doors & elevator path",
    descJa: "エレベーター寄り・広いドア",
    comfortWeight: 0.75,
  },
  {
    id: "hurry",
    icon: "⚡",
    title: "Tight Transfer",
    titleJa: "乗り換え急ぎ",
    desc: "Direct escalator alignment",
    descJa: "階段・エスカレーター直結",
    comfortWeight: 0.1,
  },
  {
    id: "calm",
    icon: "😌",
    title: "Avoid Crush",
    titleJa: "混雑を避けたい",
    desc: "Room to breathe & sit",
    descJa: "空いている号車でゆったり",
    comfortWeight: 0.9,
  },
  {
    id: "stroller",
    icon: "👶",
    title: "Stroller / Wheelchair",
    titleJa: "ベビーカー・車椅子",
    desc: "Barrier-free elevator direct",
    descJa: "段差なしエレベーター直結",
    comfortWeight: 0.7,
  },
];

export interface TransitFaq {
  q: string;
  qJa: string;
  a: string;
  aJa: string;
  icon: string;
}

export const TOKYO_TRANSIT_TIPS: TransitFaq[] = [
  {
    icon: "👟",
    q: "How do I find my car on the physical platform?",
    qJa: "実際のホームでどうやって号車を探すの？",
    a: "Look down at the floor! Tokyo platforms have printed stickers and yellow tactile paving with car numbers (e.g. 4号車) and door triangles (▲ 1, ▲ 2) showing exactly where the train doors will stop.",
    aJa: "ホームの足元（床）を見てください！「4号車」や「▲ 1」「▲ 2」といったドア位置ステッカーが印刷されており、電車のドアが止まる位置を示しています。",
  },
  {
    icon: "❄️",
    q: "What does 'Mild Air Conditioned Car' (弱冷房車) mean?",
    qJa: "「弱冷房車」ってなに？",
    a: "In summer, Tokyo trains have 1 or 2 specific cars set to ~28°C (82°F) instead of the chilly ~25°C. Great if you catch a cold easily!",
    aJa: "夏場、冷房が苦手な人のために設定温度を通常より少し高め（約28度）にしている号車です。冷えすぎず快適に過ごせます。",
  },
  {
    icon: "🎒",
    q: "Tokyo Train Etiquette basics for tourists?",
    qJa: "東京の電車で気をつけたいマナーは？",
    a: "Wear your backpack in front of your chest so you don't bump people. Keep phone on silent mode (Manner Mode / マナーモード), and avoid talking on phone calls.",
    aJa: "混雑時はリュックサックを前に抱え、携帯電話はマナーモードに設定して通話は控えましょう。",
  },
];
