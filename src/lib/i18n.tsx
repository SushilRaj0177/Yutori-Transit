"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "ja";

export const translations = {
  en: {
    // Nav
    brandName: "Yutori Car",
    brandSubtitle: "Tokyo Subway Door Guide",
    navOverview: "Overview",
    navStations: "Key Stations",
    navAlgorithm: "How It Works",
    navLaunchApp: "Open App",
    navBackHome: "Home",

    // Hero
    heroBadge: "Tokyo Transit • First-Timer Friendly",
    heroTitle: "Find the exact train door to stand at in Tokyo.",
    heroSubtitle:
      "Avoid 200% rush-hour crush without running 200m down the platform. Yutori Car calculates the ideal car and door matching your luggage, transfer escalator, and comfort preference.",
    heroCtaPrimary: "Find My Train Door",
    heroCtaSecondary: "Explore Sightseeing Hubs",
    liveTelemetryBadge: "Official ODPT Tokyo Data",

    // Interactive Preview
    previewStation: "Marunouchi Line • Otemachi",
    previewCar: "Car 4 · Door 2",
    previewEgress: "Steps off directly at Tozai Line Escalator",
    previewSpace: "45% Load (Comfortable)",
    previewWalk: "12m (~10s walk)",

    // Dilemma Section
    dilemmaTitle: "Why Tokyo Commutes Feel Overwhelming",
    dilemmaSubtitle:
      "On 10-car Tokyo trains, passenger crush is notoriously uneven.",
    speedTrapTitle: "The Transfer Trap",
    speedTrapDesc:
      "Boarding directly opposite the transfer stairs saves walk time, but subjects you to 200% crush load where you can barely breathe or move your suitcase.",
    walkingPenaltyTitle: "The Walking Penalty",
    walkingPenaltyDesc:
      "Escaping to an empty end car feels nice at first, but forces a 200-meter dash through a packed underground station to catch your connecting train.",
    yutoriSolutionTitle: "The 'Yutori' Balance",
    yutoriSolutionDesc:
      "Multi-objective Pareto optimization calculates the exact door that gives you maximum personal space while keeping your transfer effortless.",

    // Core Pillars
    pillar1Title: "Physical Platform Floor Coordinates",
    pillar1Desc:
      "Know exactly which floor sticker (e.g. Car 4 ▲ Door 2) to stand on before the train even pulls into the station.",
    pillar2Title: "Live Real-Time Telemetry",
    pillar2Desc:
      "Ingests live train positions, delays, train compositions, and car load factors directly from Tokyo's official transit data.",
    pillar3Title: "AI Commuter Concierge",
    pillar3Desc:
      "Sub-200ms Groq-powered advice in English and Japanese. Explains baggage navigation, elevator paths, and mild A/C cars.",

    // Hubs Section
    hubsTitle: "Popular Tokyo Stations & Landmarks",
    hubsSubtitle: "Pre-mapped physical platform egresses for Tokyo's busiest interchanges.",
    hubOtemachi: "Otemachi",
    hubTokyo: "Tokyo",
    hubShibuya: "Shibuya",
    hubShinjuku: "Shinjuku",
    hubGinza: "Ginza",

    // CTA Banner
    ctaBannerTitle: "Step onto Tokyo platforms with peace of mind.",
    ctaBannerSubtitle:
      "No registration required. Clear floor guides and real-time crowding advice for tourists and locals alike.",
    ctaBannerButton: "Launch Yutori Car Free",

    // Tool / App Interface Strings
    toolTitle: "Yutori Car",
    toolSubtitle: "Tokyo Door Guide",
    touristPromptTitle: "First time in Tokyo?",
    touristPromptDesc: "Pick your situation or destination landmark below to get an instant physical floor recommendation.",
    popularLandmarks: "Popular Landmarks & Stations",
    yourSituation: "Your Travel Situation",
    selectLine: "Select Line",
    selectStation: "Select Station",
    targetEgress: "Destination Exit / Transfer",
    pickDestination: "Choose where you want to go",
    nearestCar: "Nearest Car",
    priorityTitle: "Travel Priority",
    priorityFastExit: "Fast Exit",
    priorityBalanced: "Balanced",
    priorityRelaxed: "Relaxed",
    prioritySpeedDesc: "Speed First (Shortest walk)",
    priorityComfortDesc: "Space First (Least crowded)",
    priorityBalancedDesc: "Balanced (Optimal mix)",
    stairsAlignment: "Stairs Alignment",
    openSeating: "Open Seating",
    recommendedTitle: "Recommended Boarding Door",
    directAlignmentWith: "Steps off directly at: ",
    balancedForGeneral: "Balanced for easy platform walking and comfortable breathing room",
    passengerSpace: "Passenger Space",
    loadCapacity: "load capacity",
    transferEgress: "Walk to Escalator / Gate",
    corridorTransit: "corridor transit",
    immediateExit: "Steps away from exit",
    liveTelemetry: "Live Telemetry Active",
    estimatedFlow: "Standard Flow Estimate",
    destinationDirection: "Heading towards front of train",
    tapCarForDetails: "Tap any car for details",
    trainComposition: "Train Composition",
    carsCount: "Cars",
    delayText: "m delay",
    telemetryBreakdown: "Car Details",
    rankOf: "Rank #{rank} of {total}",
    crowding: "Crowding",
    walkDistance: "Walk Distance",
    matchScore: "Match Score",
    atGate: "At gate",

    // AI Concierge
    conciergeTitle: "AI Platform Concierge",
    conciergeSubtitle: "Door advice & platform guidance",
    proTip: "Pro Tip: ",
    quickInquiries: "Common Inquiries",
    askPlaceholder: "Ask about luggage, elevators, or transfers...",
    conciergeResponse: "Concierge Response",

    // Footer
    footerTitle: "Yutori Car · ゆとり車両",
    footerSubtitle: "Human-Centered Tokyo Transit & Spatial Intelligence",
    footerResearch:
      "Waseda University Academic Alignment · Open Data for Public Transportation (ODPT) · Groq Low-Latency AI",
  },
  ja: {
    // Nav
    brandName: "ゆとり車両",
    brandSubtitle: "東京地下鉄 最適ドア案内",
    navOverview: "概要",
    navStations: "主要駅",
    navAlgorithm: "仕組み",
    navLaunchApp: "アプリ起動",
    navBackHome: "ホーム",

    // Hero
    heroBadge: "東京地下鉄・観光・初心者にもやさしい案内",
    heroTitle: "乗るべき「号車とドア」がひと目でわかる。",
    heroSubtitle:
      "乗り換え階段前のすし詰め混雑を避けつつ、200mの無駄なホーム徒歩を解消。スーツケースの有無や乗り換えエスカレーター位置に合わせた最適な乗車ドアをご案内します。",
    heroCtaPrimary: "乗るべきドアを調べる",
    heroCtaSecondary: "対応観光地・主要駅を見る",
    liveTelemetryBadge: "ODPT公式データ連携",

    // Interactive Preview
    previewStation: "丸ノ内線 • 大手町駅",
    previewCar: "4号車 · 2番ドア",
    previewEgress: "東西線連絡エスカレーター直結",
    previewSpace: "混雑率 45% (座席・ゆとりあり)",
    previewWalk: "徒歩12m (~約10秒)",

    // Dilemma Section
    dilemmaTitle: "なぜ東京の通勤・移動は疲れるのか？",
    dilemmaSubtitle:
      "10両編成の地下鉄では、階段付近と端っこで混雑率が極端に偏っています。",
    speedTrapTitle: "乗り換え最速の罠",
    speedTrapDesc:
      "階段直結の号車に乗ると到着後の徒歩は減りますが、乗車率200%の圧迫感にさらされ、スーツケースの持ち込みも困難になります。",
    walkingPenaltyTitle: "端っこ号車の徒歩負担",
    walkingPenaltyDesc:
      "空いている端の号車に乗ると快適ですが、目的地で200mもの長い混雑ホームを歩かされ、乗り換えに遅れる危険があります。",
    yutoriSolutionTitle: "「ゆとり」パレート解",
    yutoriSolutionDesc:
      "多目的パレート最適化により、大きな荷物の有無や乗り換え時間の長短に応じた、最もバランスの良いドアを導き出します。",

    // Core Pillars
    pillar1Title: "実際のホーム足元ステッカーと完全連動",
    pillar1Desc:
      "電車が来る前に、ホーム床のどの番号（4号車 ▲ 2番ドア）に並べばいいのかが直感的にわかります。",
    pillar2Title: "リアルタイム運行・混雑データ",
    pillar2Desc:
      "東京メトロ・都営地下鉄の列車位置、遅延状況、編成両数、号車別混雑度データをリアルタイムに取得。",
    pillar3Title: "Groq搭載 AI車両コンシェルジュ",
    pillar3Desc:
      "わずか200msの超低遅延推論で、荷物があるときのルートや弱冷房車の位置、おすすめの並び方を日英で解説。",

    // Hubs Section
    hubsTitle: "対応主要駅・人気観光エリア",
    hubsSubtitle: "複雑な乗り換え駅も、迷わずスムーズに通り抜けられます。",
    hubOtemachi: "大手町",
    hubTokyo: "東京駅",
    hubShibuya: "渋谷",
    hubShinjuku: "新宿",
    hubGinza: "銀座",

    // CTA Banner
    ctaBannerTitle: "東京の地下鉄を、もっと心地よく、迷わずに。",
    ctaBannerSubtitle:
      "会員登録不要。足元ステッカーのガイドとリアルタイムの最適号車を今すぐ体験できます。",
    ctaBannerButton: "ゆとり車両を無料で使う",

    // Tool / App Interface Strings
    toolTitle: "ゆとり車両",
    toolSubtitle: "最適ドア案内",
    touristPromptTitle: "東京の電車が初めてですか？",
    touristPromptDesc: "状況や目的の観光地を選ぶだけで、ホームで迷わず並べるドア位置をご案内します。",
    popularLandmarks: "人気の主要エリア・観光地",
    yourSituation: "今の状況・持ち物は？",
    selectLine: "路線を選択",
    selectStation: "乗車駅を選択",
    targetEgress: "降車後の目的地・乗り換え先",
    pickDestination: "目的地を選択してください",
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
    recommendedTitle: "おすすめの乗車ドア",
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
    askPlaceholder: "荷物、エレベーター、乗り換えについて質問...",
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
