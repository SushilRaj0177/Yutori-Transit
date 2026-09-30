"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "ja";

export const translations = {
  en: {
    // Nav
    brandName: "Yutori",
    brandSubtitle: "Tokyo Train Door Guide",
    navOverview: "Overview",
    navStations: "Popular Stops",
    navAlgorithm: "How it works",
    navLaunchApp: "Find Train Door",
    navBackHome: "Home",

    // Hero
    heroBadge: "Tokyo Subway • Made Easy for Visitors",
    heroTitle: "Know exactly which train door to board in Tokyo.",
    heroSubtitle:
      "Tokyo trains are huge, and the stairs get crushed. We show you the exact yellow floor marker to wait at so you step off right by the escalator without getting squeezed.",
    heroCtaPrimary: "Find My Train Door",
    heroCtaSecondary: "View 12 Popular Landmarks",
    liveTelemetryBadge: "Official Tokyo Train Data",

    // Interactive Preview
    previewStation: "Ginza Line • Shibuya",
    previewCar: "Car 1 · Door 1",
    previewEgress: "Steps off directly at Hachiko & Scramble Crossing Exit",
    previewSpace: "Lots of room (Green)",
    previewWalk: "14m (~12s walk)",

    // Dilemma Section
    dilemmaTitle: "Why Tokyo train platforms can feel confusing",
    dilemmaSubtitle:
      "A single Tokyo train has 6 to 10 cars and hundreds of doors. Where you stand changes your entire day.",
    speedTrapTitle: "The Rush-Hour Squeeze",
    speedTrapDesc:
      "Cars right in front of the stairs are packed shoulder-to-shoulder with zero room for suitcases or backpacks.",
    walkingPenaltyTitle: "The 200-Meter Dash",
    walkingPenaltyDesc:
      "End cars are spacious, but when you arrive, you might have to walk the entire length of a packed platform to find an exit.",
    yutoriSolutionTitle: "The Yutori Sweet Spot",
    yutoriSolutionDesc:
      "We find the relaxed car: plenty of breathing room, just a short easy stroll to the escalator or elevator.",

    // Core Pillars
    pillar1Title: "Floor Sticker Precision",
    pillar1Desc:
      "Look at the ground! We show you the exact numbers printed on the platform tiles (e.g. Car 4 ▲ Door 2).",
    pillar2Title: "Live Real-Time Updates",
    pillar2Desc:
      "Connected directly to Tokyo Metro & Toei Subway feeds for real-time car lengths, delays, and crowding.",
    pillar3Title: "Helpful AI Assistant",
    pillar3Desc:
      "Ask anything in plain English or Japanese — like 'which exit has an elevator for my big suitcase?'",

    // Hubs Section
    hubsTitle: "Top 12 Tokyo Destinations",
    hubsSubtitle: "One tap to find your boarding door for temples, shopping, bullet trains, and nightlife.",

    // CTA Banner
    ctaBannerTitle: "Board Tokyo trains with confidence.",
    ctaBannerSubtitle:
      "Free forever. No account needed. Designed for first-time visitors and everyday travelers.",
    ctaBannerButton: "Find My Train Door Now",

    // Tool / App Interface Strings
    toolTitle: "Yutori",
    toolSubtitle: "Tokyo Door Guide",
    touristPromptTitle: "Where are you heading in Tokyo?",
    touristPromptDesc: "Tap any popular sightseeing spot below, or search any station by name.",
    searchPlaceholder: "Search any station (e.g. Shibuya, Shinjuku, Asakusa, Tokyo)...",
    searchNoResults: "No stations found. Try typing in English or Japanese.",
    popularLandmarks: "Popular Sightseeing Spots",
    yourSituation: "Your situation today",
    selectLine: "Choose Train Line",
    selectStation: "Choose Station",
    targetEgress: "Where do you want to exit?",
    pickDestination: "Select your destination exit",
    nearestCar: "Closest Car",
    priorityTitle: "Your Priority",
    priorityFastExit: "Fastest Exit",
    priorityBalanced: "Balanced",
    priorityRelaxed: "More Space",
    prioritySpeedDesc: "Speed first (shortest walk)",
    priorityComfortDesc: "Space first (least crowded)",
    priorityBalancedDesc: "Balanced (best of both)",
    stairsAlignment: "Stairs direct",
    openSeating: "Plenty of room",
    recommendedTitle: "Best Door to Stand At",
    directAlignmentWith: "Arrives in front of: ",
    balancedForGeneral: "Plenty of personal space + quick walk to exit",
    passengerSpace: "Car Crowding",
    loadCapacity: "crowd level",
    transferEgress: "Walk to Exit / Transfer",
    corridorTransit: "walking time",
    immediateExit: "Right in front of exit",
    liveTelemetry: "Live Data Connected",
    estimatedFlow: "Standard Schedule Flow",
    destinationDirection: "Train heading direction (Front)",
    tapCarForDetails: "Tap any car along the train to inspect",
    trainComposition: "All cars on this train",
    carsCount: "cars",
    delayText: "m delay",
    telemetryBreakdown: "Car Breakdown",
    rankOf: "Rank #{rank} of {total}",
    crowding: "Crowding",
    walkDistance: "Walk distance",
    matchScore: "Match score",
    atGate: "Steps from gate",
    floorGuideTitle: "What to look for on the platform floor",
    floorGuideHint: "Tokyo platform floors have painted boxes. Look for the car number and triangle door mark:",
    greenExplanation: "🟢 Green = Plenty of room & seats",
    yellowExplanation: "🟡 Yellow = Normal passenger load",
    redExplanation: "🔴 Red = Very crowded",

    // AI Concierge
    conciergeTitle: "Ask the Tokyo Subway Assistant",
    conciergeSubtitle: "Got luggage, a stroller, or need an elevator?",
    proTip: "Tip: ",
    quickInquiries: "Tap a quick question:",
    askPlaceholder: "Ask about suitcases, elevators, ticket gates, or etiquette...",
    conciergeResponse: "Assistant Advice",

    // Footer
    footerTitle: "Yutori · ゆとり車両",
    footerSubtitle: "Human-Centered Tokyo Transit Guide for Travelers",
    footerResearch:
      "Powered by Tokyo Open Data for Public Transportation (ODPT) and Groq low-latency AI.",
  },
  ja: {
    // Nav
    brandName: "ゆとり",
    brandSubtitle: "東京地下鉄 ドア案内",
    navOverview: "概要",
    navStations: "主要スポット",
    navAlgorithm: "仕組み",
    navLaunchApp: "乗車ドアを調べる",
    navBackHome: "ホーム",

    // Hero
    heroBadge: "東京地下鉄 • 初心者・観光にも安心",
    heroTitle: "乗るべき「号車とドア」が迷わずわかる。",
    heroSubtitle:
      "階段前のすし詰め混雑を避けつつ、200mの無駄歩きも解消。ホームの足元ステッカー番号に合わせて、スーツケースやベビーカーでも快適な乗車位置をご案内します。",
    heroCtaPrimary: "乗るべきドアを調べる",
    heroCtaSecondary: "人気観光地12選を見る",
    liveTelemetryBadge: "公式運行データ連携",

    // Interactive Preview
    previewStation: "銀座線 • 渋谷駅",
    previewCar: "1号車 · 1番ドア",
    previewEgress: "ハチ公改札・スクランブル交差点直結",
    previewSpace: "ゆとりあり (緑)",
    previewWalk: "徒歩14m (~約12秒)",

    // Dilemma Section
    dilemmaTitle: "なぜ東京の駅は迷いやすいのか？",
    dilemmaSubtitle:
      "1編成あたり6〜10両、数十箇所のドアがあります。どこに並ぶかで快適さが劇的に変わります。",
    speedTrapTitle: "乗り換え最速の罠",
    speedTrapDesc:
      "階段直前の号車は乗客が集中し、すし詰め状態。大きなスーツケースや荷物を持つと身動きが取れません。",
    walkingPenaltyTitle: "端っこ号車の徒歩負担",
    walkingPenaltyDesc:
      "空いている端の号車に乗ると車内は快適ですが、到着後に混雑した長いホームを何百メートルも歩くことに。",
    yutoriSolutionTitle: "「ゆとり」のバランス解",
    yutoriSolutionDesc:
      "車内のほどよいゆとりを確保しつつ、階段やエスカレーターへもサッと歩けるベストなドアを見つけます。",

    // Core Pillars
    pillar1Title: "足元ステッカーと完全一致",
    pillar1Desc:
      "ホーム床面を見てください！「4号車 ▲ 2番ドア」など、実際の表示に合わせて並べます。",
    pillar2Title: "リアルタイム運行・混雑情報",
    pillar2Desc:
      "東京メトロ・都営地下鉄の公式データから、編成両数、遅延、混雑傾向を即座に反映します。",
    pillar3Title: "親切なAIアシスタント",
    pillar3Desc:
      "「大きなスーツケースがある」「エレベーターはどこ？」など、自然な日本語・英語で相談できます。",

    // Hubs Section
    hubsTitle: "東京の人気観光エリア 12選",
    hubsSubtitle: "浅草、渋谷、新宿、秋葉原など、ワンタップで最適な乗車ドアがわかります。",

    // CTA Banner
    ctaBannerTitle: "東京の地下鉄を、もっと安心・快適に。",
    ctaBannerSubtitle:
      "会員登録不要・無料。旅行者も毎日の通勤者も、迷わずスムーズに移動できます。",
    ctaBannerButton: "今すぐ乗車ドアを調べる",

    // Tool / App Interface Strings
    toolTitle: "ゆとり",
    toolSubtitle: "東京地下鉄 ドア案内",
    touristPromptTitle: "どこへ行きますか？",
    touristPromptDesc: "行きたい観光地をタップするか、駅名を入力して検索してください。",
    searchPlaceholder: "駅名で検索（例：渋谷、新宿、浅草、秋葉原、東京）...",
    searchNoResults: "該当する駅が見つかりませんでした。別の駅名をお試しください。",
    popularLandmarks: "人気の主要エリア・観光地",
    yourSituation: "今の移動スタイル・荷物",
    selectLine: "路線を選択",
    selectStation: "乗車駅を選択",
    targetEgress: "降車後の目的地・出口",
    pickDestination: "降車口を選択してください",
    nearestCar: "最寄号車",
    priorityTitle: "優先スタイル",
    priorityFastExit: "最速降車",
    priorityBalanced: "バランス",
    priorityRelaxed: "ゆとり重視",
    prioritySpeedDesc: "階段・出口最寄りを重視",
    priorityComfortDesc: "車内の空き具合を重視",
    priorityBalancedDesc: "混雑と徒歩のベストバランス",
    stairsAlignment: "階段直結",
    openSeating: "空席・空間あり",
    recommendedTitle: "おすすめの乗車ドア",
    directAlignmentWith: "直結出口: ",
    balancedForGeneral: "車内のゆとりと構内徒歩のバランスが最適な位置",
    passengerSpace: "車内混雑状況",
    loadCapacity: "混雑度",
    transferEgress: "出口・乗り換え徒歩",
    corridorTransit: "徒歩所要時間",
    immediateExit: "目の前が階段・改札",
    liveTelemetry: "リアルタイム運行中",
    estimatedFlow: "標準予測",
    destinationDirection: "進行方向（先頭方面）",
    tapCarForDetails: "気になる号車をタップして詳細確認",
    trainComposition: "この列車の全号車",
    carsCount: "両編成",
    delayText: "分遅延",
    telemetryBreakdown: "号車詳細",
    rankOf: "全{total}両中 第{rank}位",
    crowding: "混雑度",
    walkDistance: "出口までの徒歩",
    matchScore: "おすすめ度",
    atGate: "改札目の前",
    floorGuideTitle: "ホーム足元（床面）の見方",
    floorGuideHint: "東京の地下鉄ホーム床には号車番号と三角マークが印刷されています：",
    greenExplanation: "🟢 緑 = ゆったり空間・座れる可能性あり",
    yellowExplanation: "🟡 黄 = 普通の乗車率",
    redExplanation: "🔴 赤 = 混雑・すし詰め",

    // AI Concierge
    conciergeTitle: "AIアシスタントに質問する",
    conciergeSubtitle: "スーツケース、ベビーカー、エレベーターのご案内",
    proTip: "アドバイス: ",
    quickInquiries: "よくある質問をタップ:",
    askPlaceholder: "エレベーター、荷物、乗り換えについて何でも質問...",
    conciergeResponse: "アシスタントの回答",

    // Footer
    footerTitle: "Yutori (ゆとり車両)",
    footerSubtitle: "東京都市交通 スマート乗車ガイド",
    footerResearch:
      "公共交通オープンデータ協議会 (ODPT) 公式API & Groq AI推論エンジン",
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
      } else if (typeof navigator !== "undefined" && navigator.language?.startsWith("ja")) {
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
