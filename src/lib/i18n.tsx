"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "ja";

export const translations = {
  en: {
    // Nav
    brandName: "Yutori Car",
    brandSubtitle: "Tokyo Subway Optimizer",
    navOverview: "Overview",
    navStations: "Key Stations",
    navAlgorithm: "Pareto Algorithm",
    navLaunchApp: "Launch App",
    navBackHome: "Home",

    // Hero
    heroBadge: "Tokyo Metropolitan Transit Optimization",
    heroTitle: "Find your ideal train car in real-time.",
    heroSubtitle:
      "Avoid 200% rush-hour crush without adding 6 minutes of platform walking. Yutori Car balances crowding telemetry against transfer coordinates across Tokyo's subway corridors.",
    heroCtaPrimary: "Launch Transit Advisor",
    heroCtaSecondary: "Explore Supported Hubs",
    liveTelemetryBadge: "Live ODPT Ingestion",

    // Interactive Preview
    previewStation: "Marunouchi Line • Otemachi",
    previewCar: "Car 4 · Door 2",
    previewEgress: "Direct alignment with Tozai Line Escalator",
    previewSpace: "45% Load (Comfortable)",
    previewWalk: "12m (~10s walk)",

    // Dilemma Section
    dilemmaTitle: "The Tokyo Commuter Dilemma",
    dilemmaSubtitle:
      "On an 8 or 10-car Tokyo subway, passenger density is profoundly uneven.",
    speedTrapTitle: "The Speed Trap",
    speedTrapDesc:
      "Boarding directly at stairs saves walking distance at your transfer, but traps you in 180%–200% crush load and boarding bottleneck delays.",
    walkingPenaltyTitle: "The Walking Penalty",
    walkingPenaltyDesc:
      "Boarding a quiet end car offers physical space, but forces a 200-meter dash through crowded corridors, risking missed connections.",
    yutoriSolutionTitle: "The Yutori Balance",
    yutoriSolutionDesc:
      "Multi-objective Pareto optimization models 1D platform coordinates to compute the exact door matching your personal comfort curve.",

    // Core Pillars
    pillar1Title: "1D Platform Spatial Graph",
    pillar1Desc:
      "Modeled coordinates for escalators, stairs, and elevators across major interchange hubs like Tokyo, Otemachi, Shibuya, and Shinjuku.",
    pillar2Title: "Real-Time ODPT Telemetry",
    pillar2Desc:
      "Ingests live train positions, train composition sizes, delay indicators, and load factors directly from the Open Data for Public Transportation API.",
    pillar3Title: "Groq-Powered AI Concierge",
    pillar3Desc:
      "Sub-200ms explainable AI briefings explaining why each door was chosen, barrier-free accessibility advice, and interactive commuter Q&A.",

    // Hubs Section
    hubsTitle: "Pre-Mapped Major Interchange Hubs",
    hubsSubtitle: "Accurate physical platform coordinates for complex transfer stations.",
    hubOtemachi: "Otemachi",
    hubTokyo: "Tokyo",
    hubShibuya: "Shibuya",
    hubShinjuku: "Shinjuku",
    hubGinza: "Ginza",

    // CTA Banner
    ctaBannerTitle: "Upgrade your Tokyo commute today.",
    ctaBannerSubtitle:
      "Zero registration required. Instant car and door recommendations powered by live subway data.",
    ctaBannerButton: "Open Yutori Car Now",

    // Tool / App Interface Strings
    toolTitle: "Yutori Car",
    toolSubtitle: "Optimal Door Finder",
    quickHubs: "Major Interchange Hubs",
    selectLine: "Select Line",
    selectStation: "Select Station",
    targetEgress: "Target Exit / Transfer Point",
    pickDestination: "Pick destination",
    nearestCar: "Nearest Car",
    priorityTitle: "Boarding Priority",
    priorityFastExit: "Fast Exit",
    priorityBalanced: "Balanced",
    priorityRelaxed: "Relaxed",
    prioritySpeedDesc: "Speed First (Shortest walk)",
    priorityComfortDesc: "Space First (Least crowded)",
    priorityBalancedDesc: "Balanced (Optimal mix)",
    stairsAlignment: "Stairs Alignment",
    openSeating: "Open Seating",
    recommendedTitle: "Optimal Boarding Spot",
    directAlignmentWith: "Directly aligns with",
    balancedForGeneral: "Balanced for minimum platform walking and seating availability",
    passengerSpace: "Passenger Space",
    loadCapacity: "load capacity",
    transferEgress: "Transfer Egress",
    corridorTransit: "corridor transit",
    immediateExit: "Immediate exit",
    liveTelemetry: "Live Telemetry",
    estimatedFlow: "Estimated Flow",
    destinationDirection: "Heading towards front of train",
    tapCarForDetails: "Tap a car for details",
    trainComposition: "Train Composition",
    carsCount: "Cars",
    delayText: "m delay",
    telemetryBreakdown: "Specifics",
    rankOf: "Rank #{rank} of {total}",
    crowding: "Crowding",
    walkDistance: "Walk Distance",
    matchScore: "Match Score",
    atGate: "At gate",

    // AI Concierge
    conciergeTitle: "Transit Concierge",
    conciergeSubtitle: "Door advice & platform guidance",
    proTip: "Pro Tip: ",
    quickInquiries: "Quick Inquiries",
    askPlaceholder: "Ask about this train, doors, or transfers...",
    conciergeResponse: "Concierge Response",

    // Footer
    footerTitle: "Yutori Car (ゆとり車両)",
    footerSubtitle: "Real-Time Tokyo Transit Optimization & Spatial Intelligence",
    footerResearch:
      "Waseda University Research Alignment · ODPT Open Data · Groq AI Engine",
  },
  ja: {
    // Nav
    brandName: "ゆとり車両",
    brandSubtitle: "東京地下鉄 最適ドア案内",
    navOverview: "概要",
    navStations: "主要駅",
    navAlgorithm: "パレート最適化",
    navLaunchApp: "アプリ起動",
    navBackHome: "ホーム",

    // Hero
    heroBadge: "東京都心 リアルタイム地下鉄乗車最適化",
    heroTitle: "今乗るべき「理想の号車・ドア」がすぐわかる",
    heroSubtitle:
      "乗り換え階段前のすし詰め混雑を避けつつ、無駄なホーム徒歩時間をゼロに。ODPTのリアルタイム混雑データと駅構内1D座標グラフから、最適な号車とドア位置を瞬時に算出します。",
    heroCtaPrimary: "車両案内ツールを起動する",
    heroCtaSecondary: "対応主要駅を見る",
    liveTelemetryBadge: "ODPT公式データ連携",

    // Interactive Preview
    previewStation: "丸ノ内線 • 大手町駅",
    previewCar: "4号車 · 2番ドア",
    previewEgress: "東西線連絡エスカレーター直結",
    previewSpace: "混雑率 45% (座席・空間あり)",
    previewWalk: "徒歩12m (~約10秒)",

    // Dilemma Section
    dilemmaTitle: "東京通勤のジレンマ",
    dilemmaSubtitle:
      "8両・10両編成の地下鉄では、号車ごとの混雑率が著しく偏っています。",
    speedTrapTitle: "乗り換え最速の罠",
    speedTrapDesc:
      "階段直結の号車に乗ると到着後の徒歩は減りますが、乗車率は200%に達し、乗降遅延や激しい疲労に苛まれます。",
    walkingPenaltyTitle: "端っこ号車の徒歩負担",
    walkingPenaltyDesc:
      "空いている先頭や最後尾に乗ると快適ですが、目的地で200mもの混雑したホームを歩かされ、乗り換えに乗り遅れるリスクがあります。",
    yutoriSolutionTitle: "「ゆとり」パレート解",
    yutoriSolutionDesc:
      "多目的パレート最適化により、個人の「快適性」と「乗り換えスピード」の希望バランスに合わせた最善のドアを導き出します。",

    // Core Pillars
    pillar1Title: "駅ホーム1次元空間グラフ",
    pillar1Desc:
      "大手町、東京、渋谷、新宿など主要駅のエスカレーター・階段・エレベーターの位置を1m単位でモデル化。",
    pillar2Title: "ODPT公式リアルタイムデータ",
    pillar2Desc:
      "東京メトロ・都営地下鉄の列車位置、遅延状況、編成両数、号車別混雑度データをリアルタイムに取得。",
    pillar3Title: "Groq搭載 AI車両コンシェルジュ",
    pillar3Desc:
      "わずか200msの超低遅延推論で、なぜそのドアが最適なのかの戦術的アドバイスやバリアフリー案内を日英で提供。",

    // Hubs Section
    hubsTitle: "構内座標対応 主要ターミナル駅",
    hubsSubtitle: "複雑な乗り換え導線も、ピンポイントなドア位置指定で迷わず直結。",
    hubOtemachi: "大手町",
    hubTokyo: "東京",
    hubShibuya: "渋谷",
    hubShinjuku: "新宿",
    hubGinza: "銀座",

    // CTA Banner
    ctaBannerTitle: "いつもの通勤に、ゆとりを。",
    ctaBannerSubtitle:
      "会員登録不要。駅と路線を選ぶだけで、リアルタイムの最適号車をご案内します。",
    ctaBannerButton: "ゆとり車両を使ってみる",

    // Tool / App Interface Strings
    toolTitle: "ゆとり車両",
    toolSubtitle: "最適ドア探索エンジン",
    quickHubs: "主要ターミナル駅",
    selectLine: "路線を選択",
    selectStation: "乗車駅を選択",
    targetEgress: "降車後の目的地・乗り換え先",
    pickDestination: "目的地を選択",
    nearestCar: "最寄号車",
    priorityTitle: "乗車優先設定",
    priorityFastExit: "最速降車",
    priorityBalanced: "バランス",
    priorityRelaxed: "混雑回避",
    prioritySpeedDesc: "最速優先 (徒歩距離を最短化)",
    priorityComfortDesc: "快適優先 (空いている号車を重視)",
    priorityBalancedDesc: "バランス (パレート最適)",
    stairsAlignment: "階段直結",
    openSeating: "空間・着席",
    recommendedTitle: "最適な乗車位置",
    directAlignmentWith: "直結出口: ",
    balancedForGeneral: "構内徒歩時間と混雑度のバランスを考慮した最適位置",
    passengerSpace: "車内混雑状況",
    loadCapacity: "乗車率",
    transferEgress: "乗り換え・改札徒歩",
    corridorTransit: "移動所要時間",
    immediateExit: "目の前が改札・階段",
    liveTelemetry: "リアルタイム配信中",
    estimatedFlow: "標準運行予測",
    destinationDirection: "進行方向 (先頭)",
    tapCarForDetails: "号車をタップして詳細確認",
    trainComposition: "列車編成別混雑度",
    carsCount: "両編成",
    delayText: "分遅延",
    telemetryBreakdown: "号車詳細データ",
    rankOf: "全{total}両中 第{rank}位",
    crowding: "混雑度",
    walkDistance: "構内徒歩距離",
    matchScore: "適合スコア",
    atGate: "改札直結",

    // AI Concierge
    conciergeTitle: "AI車両コンシェルジュ",
    conciergeSubtitle: "ドア位置アドバイス & 構内案内",
    proTip: "アドバイス: ",
    quickInquiries: "よくある質問",
    askPlaceholder: "この列車や乗り換えについて質問...",
    conciergeResponse: "コンシェルジュの回答",

    // Footer
    footerTitle: "Yutori Car (ゆとり車両)",
    footerSubtitle: "東京都市交通 リアルタイム最適化システム",
    footerResearch:
      "早稲田大学研究志望テーマ · 公共交通オープンデータ協議会(ODPT) · Groq AI推論",
  },
};

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: typeof translations.en;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: translations.en,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>("en");

  // Load preferred language from localStorage or browser
  useEffect(() => {
    try {
      const saved = localStorage.getItem("yutori_lang") as Language;
      if (saved === "en" || saved === "ja") {
        setLang(saved);
      } else if (navigator.language.startsWith("ja")) {
        setLang("ja");
      }
    } catch {
      // Fallback
    }
  }, []);

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    try {
      localStorage.setItem("yutori_lang", newLang);
    } catch {
      // Ignore
    }
  };

  const t = translations[lang] || translations.en;

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
