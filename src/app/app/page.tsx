"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { TrainVisualization } from "@/components/train-visualization";
import { PlatformFloorVisual } from "@/components/platform-floor-visual";
import { TokyoCheatSheet } from "@/components/tokyo-cheat-sheet";
import { AIAdvisorPanel } from "@/components/ai-advisor-panel";
import { getCongestionLabel, type ScoredCarOption } from "@/lib/optimizer";
import type { TransferPoint } from "@/lib/platform-data";
import type { CommuterContext } from "@/lib/ai-advisor";
import { useTranslation } from "@/lib/i18n";
import {
  TOKYO_LANDMARK_HUBS,
  TRAVELER_SITUATIONS,
  type LandmarkHub,
  type TravelerSituation,
} from "@/lib/tourist-data";
import {
  Search,
  ArrowLeft,
  RefreshCw,
  ChevronDown,
  AlertTriangle,
  Compass,
  Languages,
  Sparkles,
  Footprints,
  Users,
  Check,
  X,
  Bot,
  Loader2,
  MapPin,
  CheckCircle2,
} from "lucide-react";

interface StationOption {
  id: string;
  name: string;
  nameJa: string;
  code: string;
  connectingLines: string[];
}

interface RailwayOption {
  id: string;
  name: string;
  nameJa: string;
  color: string;
}

interface OperatorOption {
  id: string;
  key: string;
  railways: RailwayOption[];
}

interface OptimizeResult {
  station: { id: string; name: string; nameJa: string };
  railway: { id: string; name: string; nameJa: string; color: string };
  train: {
    number: string;
    carCount: number;
    delay: number;
    hasLiveCongestion: boolean;
  } | null;
  serviceInfo: { status: string; text: string };
  transferPoints: TransferPoint[];
  selectedTransfer: TransferPoint | null;
  cars: ScoredCarOption[];
  recommendation: ScoredCarOption | null;
  timestamp: string;
}

function TransitAppContent() {
  const { lang, setLang, t } = useTranslation();
  const searchParams = useSearchParams();

  // Primary selection states — Default to Shibuya (world-famous tourist hub) instead of Otemachi
  const defaultHub = TOKYO_LANDMARK_HUBS[0]; // Shibuya
  const [selectedRailway, setSelectedRailway] = useState<string>(defaultHub.railwayId);
  const [selectedStation, setSelectedStation] = useState<string>(defaultHub.stationId);
  const [selectedTransfer, setSelectedTransfer] = useState<string>(defaultHub.suggestedEgress);
  const [comfortWeight, setComfortWeight] = useState(0.75); // Friendly default
  const [selectedSituation, setSelectedSituation] = useState<string | null>("calm");

  // Data states
  const [operators, setOperators] = useState<OperatorOption[]>([]);
  const [stations, setStations] = useState<StationOption[]>([]);
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [selectedCar, setSelectedCar] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Search & Navigation States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [stationModalOpen, setStationModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [showAiConcierge, setShowAiConcierge] = useState(false);

  // Check URL query param for hub on mount
  useEffect(() => {
    const hubId = searchParams?.get("hub");
    if (hubId) {
      const found = TOKYO_LANDMARK_HUBS.find((h) => h.id === hubId);
      if (found) {
        setSelectedRailway(found.railwayId);
        setSelectedStation(found.stationId);
        if (found.suggestedEgress) setSelectedTransfer(found.suggestedEgress);
      }
    }
  }, [searchParams]);

  // Load line catalog
  useEffect(() => {
    fetch("/api/lines")
      .then((res) => res.json())
      .then((data) => {
        if (data.operators) setOperators(data.operators);
      })
      .catch(() => setError("Could not load train lines"));
  }, []);

  // Load stations when selected line changes
  useEffect(() => {
    if (!selectedRailway) return;

    fetch(`/api/stations?railway=${encodeURIComponent(selectedRailway)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.stations) {
          setStations(data.stations);
          if (!data.stations.some((s: StationOption) => s.id === selectedStation)) {
            setSelectedStation(data.stations[0]?.id || "");
            setSelectedTransfer("");
          }
        }
      })
      .catch(() => setError("Could not load stations"));
  }, [selectedRailway]);

  // Optimization fetch
  const fetchOptimization = useCallback(async () => {
    if (!selectedStation || !selectedRailway) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        station: selectedStation,
        railway: selectedRailway,
        comfort: comfortWeight.toString(),
      });
      if (selectedTransfer) params.set("transferTo", selectedTransfer);

      const res = await fetch(`/api/optimize?${params}`);
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      setResult(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transit data unavailable");
    } finally {
      setLoading(false);
    }
  }, [selectedStation, selectedRailway, selectedTransfer, comfortWeight]);

  useEffect(() => {
    fetchOptimization();
  }, [fetchOptimization]);

  // 30s auto-refresh
  useEffect(() => {
    if (!result) return;
    const interval = setInterval(fetchOptimization, 30000);
    return () => clearInterval(interval);
  }, [result, fetchOptimization]);

  // Railway & Station display helpers
  const selectedRailwayInfo = useMemo(() => {
    return operators
      .flatMap((o) => o.railways)
      .find((r) => r.id === selectedRailway);
  }, [operators, selectedRailway]);

  const selectedStationInfo = useMemo(() => {
    return stations.find((s) => s.id === selectedStation);
  }, [stations, selectedStation]);

  // Active transfer item
  const currentTransfer = useMemo(() => {
    if (!result) return null;
    return (
      result.transferPoints.find((tp) => tp.id === selectedTransfer) ||
      result.selectedTransfer ||
      result.transferPoints[0] ||
      null
    );
  }, [result, selectedTransfer]);

  // Filtered search results for quick station search
  const filteredSearchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return {
        matchingHubs: [] as LandmarkHub[],
        matchingStations: [] as StationOption[],
      };
    }
    const q = searchQuery.toLowerCase().trim();

    // 1. Matches from popular landmark hubs
    const matchingHubs = TOKYO_LANDMARK_HUBS.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.nameJa.includes(q) ||
        h.landmark.toLowerCase().includes(q) ||
        h.landmarkJa.includes(q)
    );

    // 2. Matches from current line stations
    const matchingStations = stations.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.nameJa.includes(q) ||
        s.code.toLowerCase().includes(q)
    );

    return { matchingHubs, matchingStations };
  }, [searchQuery, stations]);

  // Commuter Context for AI
  const commuterContext: CommuterContext | null = useMemo(() => {
    if (!result || !result.recommendation) return null;

    const userPriority: "speed" | "comfort" | "balanced" =
      comfortWeight <= 0.3 ? "speed" : comfortWeight >= 0.7 ? "comfort" : "balanced";

    return {
      stationName: result.station.name,
      stationNameJa: result.station.nameJa,
      railwayName: result.railway.name,
      railwayNameJa: result.railway.nameJa,
      carCount: result.train?.carCount || result.cars.length,
      recommendedCar: result.recommendation.carNumber,
      recommendedDoor: currentTransfer?.nearestDoor || 2,
      crowdingPercentage: result.recommendation.congestion,
      walkingDistanceMeters: result.recommendation.walkDistance,
      walkingTimeSeconds: result.recommendation.walkTime,
      transferTarget: currentTransfer
        ? {
            name: currentTransfer.name,
            nameJa: currentTransfer.nameJa,
            type: currentTransfer.type,
            connectsTo: currentTransfer.connectsTo,
          }
        : null,
      serviceStatus: result.serviceInfo?.status || "Normal service",
      serviceAlertText: result.serviceInfo?.text || "",
      userPriority,
      alternativesSummary: result.cars.slice(1, 3).map((c) => ({
        carNumber: c.carNumber,
        crowding: c.congestion,
        walkDistance: c.walkDistance,
        profile: c.isPareto ? "Good alternative" : "Standard",
      })),
    };
  }, [result, comfortWeight, currentTransfer]);

  const recCongestion = result?.recommendation
    ? getCongestionLabel(result.recommendation.congestion)
    : null;

  // Handle situation preset click
  const handleSelectSituation = (sit: TravelerSituation) => {
    setSelectedSituation(sit.id);
    setComfortWeight(sit.comfortWeight);

    if (sit.id === "stroller" && result) {
      const elevator = result.transferPoints.find(
        (tp) => tp.type === "elevator" || tp.isAccessible
      );
      if (elevator) setSelectedTransfer(elevator.id);
    }
  };

  // Handle landmark hub quick selection
  const handleSelectHub = (hub: LandmarkHub) => {
    setSelectedRailway(hub.railwayId);
    setSelectedStation(hub.stationId);
    if (hub.suggestedEgress) {
      setSelectedTransfer(hub.suggestedEgress);
    } else {
      setSelectedTransfer("");
    }
    setSearchQuery("");
    setSearchFocused(false);
    setStationModalOpen(false);
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[#fafaf8] text-slate-800 selection:bg-emerald-500/20">
      {/* 1. Header */}
      <header className="sticky top-0 z-40 bg-[#fafaf8]/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200 shadow-2xs transition-colors"
              title={t.navBackHome}
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black text-slate-900 tracking-tight">Yutori</span>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                Tokyo 🚃
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <button
              type="button"
              onClick={() => setLang(lang === "en" ? "ja" : "en")}
              className="flex items-center gap-1 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            >
              <Languages className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === "en" ? "日本語" : "EN"}</span>
            </button>

            {/* Refresh */}
            {lastUpdated && (
              <button
                type="button"
                onClick={fetchOptimization}
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                title="Refresh live updates"
              >
                <RefreshCw
                  className={cn("w-3.5 h-3.5", loading && "animate-spin text-emerald-600")}
                />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-4 space-y-3.5">
        {/* 2. Instant Search Bar & Landmark Shortcuts */}
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder={t.searchPlaceholder}
              className="w-full bg-white border border-slate-200/90 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-xs transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 p-0.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Instant Search Results Dropdown */}
          <AnimatePresence>
            {searchFocused && searchQuery.trim() && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute left-0 right-0 top-12 z-50 bg-white border border-slate-200 rounded-2xl p-2 shadow-xl max-h-72 overflow-y-auto space-y-1"
              >
                {filteredSearchResults.matchingHubs.length === 0 &&
                  filteredSearchResults.matchingStations.length === 0 && (
                    <div className="p-3 text-center text-xs text-slate-500">
                      {t.searchNoResults}
                    </div>
                  )}

                {/* Popular spots matched */}
                {filteredSearchResults.matchingHubs.map((hub) => (
                  <button
                    key={hub.id}
                    type="button"
                    onClick={() => handleSelectHub(hub)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{hub.icon}</span>
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                          <span>{lang === "ja" ? hub.nameJa : hub.name}</span>
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: hub.lineColor }}
                          />
                          <span className="text-[10px] text-slate-400 font-mono">
                            {hub.lineCode}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          {lang === "ja" ? hub.landmarkJa : hub.landmark}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600">Select</span>
                  </button>
                ))}

                {/* Line stations matched */}
                {filteredSearchResults.matchingStations.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setSelectedStation(st.id);
                      setSelectedTransfer("");
                      setSearchQuery("");
                      setSearchFocused(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-800">
                        {lang === "ja" ? st.nameJa || st.name : st.name}
                      </span>
                      {st.code && (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1 rounded">
                          {st.code}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600">Select</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3. Quick Landmark Pills Carousel */}
        <div className="space-y-1">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {TOKYO_LANDMARK_HUBS.slice(0, 8).map((hub) => {
              const isSelected = selectedStation === hub.stationId;
              return (
                <button
                  key={hub.id}
                  type="button"
                  onClick={() => handleSelectHub(hub)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shadow-2xs border",
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                  )}
                >
                  <span>{hub.icon}</span>
                  <span>{lang === "ja" ? hub.nameJa : hub.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Active Station & Line Selector Button */}
        <div>
          <button
            type="button"
            onClick={() => setStationModalOpen(true)}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 transition-all text-left shadow-xs group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span
                className="w-4 h-4 rounded-full shadow-2xs shrink-0"
                style={{ backgroundColor: selectedRailwayInfo?.color || "#F39700" }}
              />
              <div className="leading-tight">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {lang === "ja"
                      ? selectedStationInfo?.nameJa || selectedStationInfo?.name
                      : selectedStationInfo?.name || "Select Station"}
                  </span>
                  {selectedStationInfo?.code && (
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                      {selectedStationInfo.code}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500">
                  {lang === "ja"
                    ? selectedRailwayInfo?.nameJa || selectedRailwayInfo?.name
                    : selectedRailwayInfo?.name || "Tokyo Subway"}
                </span>
              </div>
            </div>
            <span className="text-xs text-slate-500 flex items-center gap-1 group-hover:text-slate-800 font-semibold bg-slate-100 px-2.5 py-1 rounded-full">
              <span>{lang === "ja" ? "駅変更" : "Change"}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </span>
          </button>
        </div>

        {/* 5. Travel Situation Presets */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-slate-500 flex items-center justify-between px-1">
            <span>{t.yourSituation}</span>
            <span className="text-[10px] text-slate-400 font-normal">Tap to customize</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {TRAVELER_SITUATIONS.map((sit) => {
              const isSelected = selectedSituation === sit.id;
              return (
                <button
                  key={sit.id}
                  type="button"
                  onClick={() => handleSelectSituation(sit)}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-2xl border text-center transition-all cursor-pointer shadow-2xs",
                    isSelected
                      ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold"
                      : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300"
                  )}
                >
                  <span className="text-xl mb-0.5">{sit.icon}</span>
                  <span className="text-[10px] font-bold leading-tight">
                    {lang === "ja" ? sit.titleJa : sit.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Service Alert Warning if any */}
        {result?.serviceInfo &&
          result.serviceInfo.status !== "Normal service" &&
          result.serviceInfo.status !== "Normal" && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-800 block">
                  {result.serviceInfo.status}
                </span>
                {result.serviceInfo.text && (
                  <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                    {result.serviceInfo.text}
                  </p>
                )}
              </div>
            </div>
          )}

        {/* Loading State Skeleton */}
        {loading && !result && (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3 shadow-xs">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">
              {lang === "ja" ? "最適な乗車ドアを計算中..." : "Calculating best boarding door..."}
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center space-y-2 text-rose-800">
            <p className="text-xs font-bold">{error}</p>
            <button
              type="button"
              onClick={fetchOptimization}
              className="text-xs bg-white text-rose-700 font-bold px-3 py-1.5 rounded-full border border-rose-200 shadow-2xs"
            >
              Retry
            </button>
          </div>
        )}

        {/* 6. The Digital Boarding Pass (The Core Answer Card) */}
        {result?.recommendation && (
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            {/* Top Bar */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.recommendedTitle}</span>
              </span>

              {/* Destination Egress Pill */}
              {result.transferPoints.length > 0 && (
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full border border-slate-200/80 transition-colors cursor-pointer"
                >
                  <Compass className="w-3 h-3 text-emerald-600" />
                  <span className="truncate max-w-[130px]">
                    {lang === "ja" ? currentTransfer?.nameJa : currentTransfer?.name}
                  </span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
              )}
            </div>

            {/* Car & Door Big Typography */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-mono">
                  Car {result.recommendation.carNumber}
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-slate-500 font-mono">
                  · Door {currentTransfer?.nearestDoor || 2}
                </span>
              </div>

              {currentTransfer && (
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  {lang === "ja"
                    ? `${currentTransfer.nameJa || currentTransfer.name} の目の前に到着します`
                    : `Arrives directly in front of ${currentTransfer.name}`}
                </p>
              )}
            </div>

            {/* Platform Floor Graphic Simulation */}
            <PlatformFloorVisual
              carNumber={result.recommendation.carNumber}
              doorNumber={currentTransfer?.nearestDoor || 2}
              lineColor={selectedRailwayInfo?.color || "#00BB85"}
              lang={lang}
            />

            {/* Clean Metric Indicators */}
            <div className="grid grid-cols-2 gap-2.5 pt-0.5">
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/70">
                <div className="text-[11px] text-slate-500 flex items-center gap-1 mb-1">
                  <Users className="w-3 h-3 text-slate-400" />
                  <span>{t.passengerSpace}</span>
                </div>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: recCongestion?.color }}
                  />
                  <span>{recCongestion?.label}</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  {result.recommendation.congestion}% {t.loadCapacity}
                </span>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/70">
                <div className="text-[11px] text-slate-500 flex items-center gap-1 mb-1">
                  <Footprints className="w-3 h-3 text-slate-400" />
                  <span>{t.transferEgress}</span>
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {result.recommendation.walkDistance > 0
                    ? `${result.recommendation.walkDistance}m walk`
                    : t.atGate}
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  {result.recommendation.walkTime > 0
                    ? `~${result.recommendation.walkTime}s walk`
                    : t.immediateExit}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 7. Train Car Composition Visualization */}
        {result?.cars && result.cars.length > 0 && (
          <div className="rounded-3xl p-4 bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <div className="font-bold text-slate-800">
                <span>{t.trainComposition} ({result.cars.length} {t.carsCount})</span>
              </div>
              {result.train && result.train.delay > 0 && (
                <span className="text-amber-700 font-bold text-[11px] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  +{Math.round(result.train.delay / 60)}{t.delayText}
                </span>
              )}
            </div>

            <TrainVisualization
              cars={result.cars}
              selectedCar={selectedCar}
              onSelectCar={setSelectedCar}
              recommendation={result.recommendation}
              destinationDirection={t.destinationDirection}
            />
          </div>
        )}

        {/* 8. Tokyo Subway 101 Guide for First-Timers */}
        <TokyoCheatSheet lang={lang} />

        {/* 9. AI Assistant Panel */}
        {commuterContext && (
          <div>
            <button
              type="button"
              onClick={() => setShowAiConcierge(!showAiConcierge)}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-left shadow-xs transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 border border-violet-200/60 flex items-center justify-center shadow-2xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    {t.conciergeTitle}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {lang === "ja" ? "荷物・エレベーターの質問はこちら" : "Tap for questions on luggage & elevators"}
                  </span>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-slate-400 transition-transform",
                  showAiConcierge && "rotate-180"
                )}
              />
            </button>

            <AnimatePresence>
              {showAiConcierge && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-2"
                >
                  <AIAdvisorPanel context={commuterContext} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* ─── MODAL: Station & Landmark Hub Directory ───────────────────── */}
      <AnimatePresence>
        {stationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="w-full max-w-md bg-white border-t sm:border border-slate-200 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <span className="text-sm font-bold text-slate-900 block">{t.selectStation}</span>
                  <span className="text-[11px] text-slate-500 block">
                    {lang === "ja" ? "観光スポットまたは路線から選択" : "Pick a landmark or browse lines"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStationModalOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 12 Landmark Hubs */}
              <div>
                <span className="text-xs font-bold text-slate-800 block mb-2">
                  {t.popularLandmarks}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {TOKYO_LANDMARK_HUBS.map((hub) => (
                    <button
                      key={hub.id}
                      type="button"
                      onClick={() => handleSelectHub(hub)}
                      className={cn(
                        "flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                        selectedStation === hub.stationId
                          ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold"
                          : "bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-white"
                      )}
                    >
                      <span className="text-lg">{hub.icon}</span>
                      <div className="truncate">
                        <span className="text-xs font-bold block truncate">
                          {lang === "ja" ? hub.nameJa : hub.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {lang === "ja" ? hub.landmarkJa : hub.landmark}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Railway Lines */}
              <div>
                <span className="text-xs font-bold text-slate-800 block mb-2">
                  {t.selectLine}
                </span>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto no-scrollbar">
                  {operators.flatMap((o) => o.railways).map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRailway(r.id)}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-xl text-left transition-colors border cursor-pointer",
                        selectedRailway === r.id
                          ? "bg-slate-900 border-slate-900 text-white font-bold"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: r.color }}
                      />
                      <span className="text-xs font-medium truncate">
                        {lang === "ja" ? r.nameJa || r.name : r.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stations for this line */}
              <div>
                <span className="text-xs font-bold text-slate-800 block mb-2">
                  {lang === "ja" ? "路線内の全駅" : "All stations on this line"}
                </span>
                <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto no-scrollbar">
                  {stations.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSelectedStation(s.id);
                        setSelectedTransfer("");
                        setStationModalOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-1.5 p-2 rounded-xl text-left transition-colors border cursor-pointer",
                        selectedStation === s.id
                          ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      {s.code && (
                        <span className="text-[9px] font-mono font-bold text-slate-500 bg-white border border-slate-200 px-1 py-0.5 rounded shrink-0">
                          {s.code}
                        </span>
                      )}
                      <span className="text-xs font-medium truncate">
                        {lang === "ja" ? s.nameJa || s.name : s.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL: Destination Exit Picker ───────────────────────────── */}
      <AnimatePresence>
        {transferModalOpen && result && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="w-full max-w-md bg-white border-t sm:border border-slate-200 rounded-t-3xl sm:rounded-3xl p-5 space-y-3 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-sm font-bold text-slate-900">{t.targetEgress}</span>
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 pt-1 max-h-[60vh] overflow-y-auto no-scrollbar">
                {result.transferPoints.map((tp) => {
                  const isSelected = currentTransfer?.id === tp.id;
                  return (
                    <button
                      key={tp.id}
                      type="button"
                      onClick={() => {
                        setSelectedTransfer(tp.id);
                        setTransferModalOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer",
                        isSelected
                          ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">
                          {tp.type === "stairs"
                            ? "🪜"
                            : tp.type === "escalator"
                            ? "↗️"
                            : tp.type === "elevator"
                            ? "🛗"
                            : "🚪"}
                        </span>
                        <div>
                          <div className="text-xs font-semibold">
                            {lang === "ja" ? tp.nameJa || tp.name : tp.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-normal">
                            {t.nearestCar} {tp.nearestCar} · Door {tp.nearestDoor}
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="max-w-md mx-auto w-full px-4 py-4 text-center text-xs text-slate-400 border-t border-slate-200/80">
        <p className="font-semibold text-slate-500">{t.footerTitle}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">{t.footerSubtitle}</p>
      </footer>
    </div>
  );
}

export default function TransitAppPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center bg-[#fafaf8]">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      }
    >
      <TransitAppContent />
    </Suspense>
  );
}
