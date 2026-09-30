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
    tagline: "Youth fashion, dining & sky views",
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
    id: "hub-shinjuku",
    name: "Shinjuku",
    nameJa: "新宿",
    landmark: "Kabukicho & West Skyscraper Exit",
    landmarkJa: "歌舞伎町・世界最多乗降客数",
    tagline: "Nightlife, giant Godzilla & JR hub",
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
    id: "hub-asakusa",
    name: "Asakusa",
    nameJa: "浅草",
    landmark: "Senso-ji Temple & Kaminarimon Gate",
    landmarkJa: "浅草寺・雷門・仲見世通り",
    tagline: "Historic temple, street snacks & rickshaws",
    taglineJa: "伝統寺院・下町散策",
    icon: "🏮",
    stationId: "odpt.Station:TokyoMetro.Ginza.Asakusa",
    railwayId: "odpt.Railway:TokyoMetro.Ginza",
    lineCode: "G19",
    lineName: "Ginza Line",
    lineNameJa: "銀座線",
    lineColor: "#F39700",
    suggestedEgress: "asakusa-kaminarimon-exit",
  },
  {
    id: "hub-tokyo",
    name: "Tokyo Station",
    nameJa: "東京駅",
    landmark: "Shinkansen & Central Red Brick",
    landmarkJa: "新幹線・赤レンガ駅舎",
    tagline: "Bullet trains, ramen street & airport",
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
    id: "hub-akihabara",
    name: "Akihabara",
    nameJa: "秋葉原",
    landmark: "Electric Town & Anime Hub",
    landmarkJa: "電気街・アニメ・フィギュア",
    tagline: "Gaming, electronics, manga & maid cafes",
    taglineJa: "オタクカルチャー・電子街",
    icon: "⚡",
    stationId: "odpt.Station:TokyoMetro.Hibiya.Akihabara",
    railwayId: "odpt.Railway:TokyoMetro.Hibiya",
    lineCode: "H16",
    lineName: "Hibiya Line",
    lineNameJa: "日比谷線",
    lineColor: "#9CAEB7",
    suggestedEgress: "akihabara-electric-town",
  },
  {
    id: "hub-harajuku",
    name: "Harajuku / Meiji Jingu",
    nameJa: "原宿・明治神宮前",
    landmark: "Takeshita Street & Ancient Shrine",
    landmarkJa: "竹下通り・明治神宮・表参道",
    tagline: "Street fashion, crepes & peaceful forest",
    taglineJa: "流行発信地・代々木公園",
    icon: "⛩️",
    stationId: "odpt.Station:TokyoMetro.Chiyoda.MeijiJingumae",
    railwayId: "odpt.Railway:TokyoMetro.Chiyoda",
    lineCode: "C03",
    lineName: "Chiyoda Line",
    lineNameJa: "千代田線",
    lineColor: "#00BB85",
    suggestedEgress: "harajuku-takeshita-jr",
  },
  {
    id: "hub-ueno",
    name: "Ueno",
    nameJa: "上野",
    landmark: "Ueno Park, Zoo & Ameyoko",
    landmarkJa: "上野恩賜公園・動物園・アメ横",
    tagline: "Giant pandas, Tokyo National Museum & street stalls",
    taglineJa: "美術館・博物館・下町商店街",
    icon: "🐼",
    stationId: "odpt.Station:TokyoMetro.Ginza.Ueno",
    railwayId: "odpt.Railway:TokyoMetro.Ginza",
    lineCode: "G16",
    lineName: "Ginza Line",
    lineNameJa: "銀座線",
    lineColor: "#F39700",
    suggestedEgress: "ueno-jr-park-exit",
  },
  {
    id: "hub-ginza",
    name: "Ginza",
    nameJa: "銀座",
    landmark: "Wako Clock Tower & Luxury Boutiques",
    landmarkJa: "和光時計塔・百貨店街",
    tagline: "High-end shopping, art galleries & dining",
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
  {
    id: "hub-roppongi",
    name: "Roppongi",
    nameJa: "六本木",
    landmark: "Roppongi Hills & Tokyo Midtown",
    landmarkJa: "六本木ヒルズ・東京ミッドタウン",
    tagline: "Mori Art Museum, rooftop skyline & lounges",
    taglineJa: "夜景・アート・国際派タウン",
    icon: "🗼",
    stationId: "odpt.Station:TokyoMetro.Hibiya.Roppongi",
    railwayId: "odpt.Railway:TokyoMetro.Hibiya",
    lineCode: "H04",
    lineName: "Hibiya Line",
    lineNameJa: "日比谷線",
    lineColor: "#9CAEB7",
    suggestedEgress: "roppongi-hills-direct",
  },
  {
    id: "hub-ikebukuro",
    name: "Ikebukuro",
    nameJa: "池袋",
    landmark: "Sunshine City & Anime Town",
    landmarkJa: "サンシャインシティ・乙女ロード",
    tagline: "Aquarium, planetarium & major shopping",
    taglineJa: "大型複合施設・JR・西武・東武",
    icon: "🦉",
    stationId: "odpt.Station:TokyoMetro.Marunouchi.Ikebukuro",
    railwayId: "odpt.Railway:TokyoMetro.Marunouchi",
    lineCode: "M25",
    lineName: "Marunouchi Line",
    lineNameJa: "丸ノ内線",
    lineColor: "#E60012",
    suggestedEgress: "ikebukuro-tobu-sunshine",
  },
  {
    id: "hub-otemachi",
    name: "Otemachi",
    nameJa: "大手町",
    landmark: "Imperial Palace & 5-Line Superhub",
    landmarkJa: "皇居外苑・都内最大級5路線連絡",
    tagline: "East Gardens walk & seamless underground transfers",
    taglineJa: "東西線・千代田線・半蔵門線",
    icon: "🏢",
    stationId: "odpt.Station:TokyoMetro.Marunouchi.Otemachi",
    railwayId: "odpt.Railway:TokyoMetro.Marunouchi",
    lineCode: "M18",
    lineName: "Marunouchi Line",
    lineNameJa: "丸ノ内線",
    lineColor: "#E60012",
    suggestedEgress: "otemachi-marunouchi-tozai",
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
