"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
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
  MapPin,
  Train,
  ArrowRight,
  RefreshCw,
  ChevronDown,
  AlertTriangle,
  Info,
  Compass,
  ArrowLeft,
  Languages,
  Sparkles,
  Footprints,
  Users,
  Check,
  X,
  Bot,
  Luggage,
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

export default function TransitAppPage() {
  const { lang, setLang, t } = useTranslation();

  // Selection states
  const [operators, setOperators] = useState<OperatorOption[]>([]);
  const [selectedRailway, setSelectedRailway] = useState<string>(
    "odpt.Railway:TokyoMetro.Marunouchi"
  );
  const [stations, setStations] = useState<StationOption[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>(
    "odpt.Station:TokyoMetro.Marunouchi.Otemachi"
  );
  const [selectedTransfer, setSelectedTransfer] = useState<string>("");
  const [comfortWeight, setComfortWeight] = useState(0.5);
  const [selectedSituation, setSelectedSituation] = useState<string | null>("calm");

  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [selectedCar, setSelectedCar] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Modals for progressive disclosure
  const [stationModalOpen, setStationModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [showAiConcierge, setShowAiConcierge] = useState(false);

  // Load line catalog
  useEffect(() => {
    fetch("/api/lines")
      .then((res) => res.json())
      .then((data) => {
        if (data.operators) setOperators(data.operators);
      })
      .catch(() => setError("Could not load line catalog"));
  }, []);

  // Load stations on line change
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

  // Fetch optimization calculation
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

  // Selected railway and station display details
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
        profile: c.isPareto ? "Pareto Optimal" : "Alternative",
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

    // If stroller/elevator chosen, auto-select accessible egress if available
    if (sit.id === "stroller" && result) {
      const elevator = result.transferPoints.find((tp) => tp.type === "elevator" || tp.isAccessible);
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
    setStationModalOpen(false);
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[#090a0f] text-slate-100 selection:bg-emerald-500/30">
      {/* 1. Header */}
      <header className="sticky top-0 z-40 bg-[#090a0f]/95 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-slate-300 transition-colors"
              title={t.navBackHome}
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-white tracking-tight">Yutori</span>
              <span className="text-[10px] text-slate-400 font-mono bg-white/[0.06] px-1.5 py-0.5 rounded">
                Tokyo 🚃
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <button
              type="button"
              onClick={() => setLang(lang === "en" ? "ja" : "en")}
              className="flex items-center gap-1 text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 px-3 py-1.5 rounded-full border border-white/10 transition-colors"
            >
              <Languages className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === "en" ? "日本語" : "EN"}</span>
            </button>

            {/* Refresh */}
            {lastUpdated && (
              <button
                type="button"
                onClick={fetchOptimization}
                className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                title="Refresh live data"
              >
                <RefreshCw
                  className={cn("w-3 h-3", loading && "animate-spin text-emerald-400")}
                />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-4 space-y-4">
        {/* 2. Station & Landmark Bar */}
        <div>
          <button
            type="button"
            onClick={() => setStationModalOpen(true)}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#12141c] hover:bg-[#181b26] border border-white/10 transition-all text-left shadow-md group"
          >
            <div className="flex items-center gap-3">
              <span
                className="w-3.5 h-3.5 rounded-full shadow-sm shrink-0"
                style={{ backgroundColor: selectedRailwayInfo?.color || "#E60012" }}
              />
              <div className="leading-tight">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {lang === "ja"
                      ? selectedStationInfo?.nameJa || selectedStationInfo?.name
                      : selectedStationInfo?.name || "Select Station"}
                  </span>
                  {selectedStationInfo?.code && (
                    <span className="text-[10px] font-bold text-slate-400 bg-white/[0.08] px-1.5 py-0.5 rounded font-mono">
                      {selectedStationInfo.code}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400">
                  {lang === "ja"
                    ? selectedRailwayInfo?.nameJa || selectedRailwayInfo?.name
                    : selectedRailwayInfo?.name || "Tokyo Subway"}
                </span>
              </div>
            </div>
            <span className="text-xs text-slate-400 flex items-center gap-1 group-hover:text-slate-200 font-medium">
              <span>{lang === "ja" ? "駅を選ぶ" : "Change Station"}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </span>
          </button>
        </div>

        {/* 3. Traveler Situation Presets (Tourist / First-Timer Friendly) */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between px-1">
            <span>{t.yourSituation}</span>
            <span className="text-[10px] text-slate-500 font-normal">Tap to customize</span>
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
                    "flex flex-col items-center justify-center p-2 rounded-2xl border text-center transition-all cursor-pointer",
                    isSelected
                      ? "bg-emerald-500/15 border-emerald-500/50 text-white shadow-sm"
                      : "bg-[#12141c] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:border-white/10"
                  )}
                >
                  <span className="text-lg mb-0.5">{sit.icon}</span>
                  <span className="text-[10px] font-bold leading-tight">
                    {lang === "ja" ? sit.titleJa : sit.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Disruption Warning if any */}
        {result?.serviceInfo &&
          result.serviceInfo.status !== "Normal service" &&
          result.serviceInfo.status !== "Normal" && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-amber-200"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300 block">
                  {result.serviceInfo.status}
                </span>
                {result.serviceInfo.text && (
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    {result.serviceInfo.text}
                  </p>
                )}
              </div>
            </motion.div>
          )}

        {/* 4. The Digital Boarding Pass (The Core Answer) */}
        {result?.recommendation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="zen-ticket rounded-3xl p-5 md:p-6 shadow-xl space-y-4 relative overflow-hidden"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <Sparkles className="w-3 h-3" />
                <span>{t.recommendedTitle}</span>
              </span>

              {/* Destination Egress Pill */}
              {result.transferPoints.length > 0 && (
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-white/[0.06] hover:bg-white/[0.1] px-3 py-1 rounded-full border border-white/10 transition-colors"
                >
                  <Compass className="w-3 h-3 text-cyan-400" />
                  <span className="truncate max-w-[120px]">
                    {lang === "ja" ? currentTransfer?.nameJa : currentTransfer?.name}
                  </span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
              )}
            </div>

            {/* Car & Door Typography */}
            <div className="space-y-1 pt-1">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl font-black text-white tracking-tight font-mono">
                  Car {result.recommendation.carNumber}
                </span>
                <span className="text-2xl md:text-3xl font-bold text-slate-400 font-mono">
                  · Door {currentTransfer?.nearestDoor || 2}
                </span>
              </div>

              {currentTransfer && (
                <p className="text-sm text-slate-300 font-medium">
                  {lang === "ja"
                    ? `${currentTransfer.nameJa || currentTransfer.name}の目の前に到着します`
                    : `Directly in front of ${currentTransfer.name}`}
                </p>
              )}
            </div>

            {/* Physical Platform Floor Graphic (No More Confusion!) */}
            <PlatformFloorVisual
              carNumber={result.recommendation.carNumber}
              doorNumber={currentTransfer?.nearestDoor || 2}
              lineColor={selectedRailwayInfo?.color || "#E60012"}
              lang={lang}
            />

            {/* Metric Gauges */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-[#0b0c10] rounded-2xl p-3 border border-white/[0.08]">
                <div className="text-[11px] text-slate-400 flex items-center gap-1 mb-1">
                  <Users className="w-3 h-3 text-slate-400" />
                  <span>{t.passengerSpace}</span>
                </div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: recCongestion?.color }}
                  />
                  <span>{recCongestion?.label}</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  {result.recommendation.congestion}% {t.loadCapacity}
                </span>
              </div>

              <div className="bg-[#0b0c10] rounded-2xl p-3 border border-white/[0.08]">
                <div className="text-[11px] text-slate-400 flex items-center gap-1 mb-1">
                  <Footprints className="w-3 h-3 text-slate-400" />
                  <span>{t.transferEgress}</span>
                </div>
                <div className="text-sm font-bold text-white">
                  {result.recommendation.walkDistance > 0
                    ? `${result.recommendation.walkDistance}m walk`
                    : t.atGate}
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  {result.recommendation.walkTime > 0
                    ? `~${result.recommendation.walkTime}s walk`
                    : t.immediateExit}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* 5. Minimalist Train Car Visualization */}
        {result?.cars && result.cars.length > 0 && (
          <div className="rounded-3xl p-4 bg-[#12141c] border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5 font-medium text-slate-300">
                <Train className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.trainComposition} ({result.cars.length} {t.carsCount})</span>
              </div>
              {result.train && result.train.delay > 0 && (
                <span className="text-amber-400 font-semibold text-[11px]">
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

        {/* 6. Tokyo Subway 101 Cheat Sheet (Tourist Guide) */}
        <TokyoCheatSheet lang={lang} />

        {/* 7. AI Platform Concierge (Subtle Expandable) */}
        {commuterContext && (
          <div>
            <button
              type="button"
              onClick={() => setShowAiConcierge(!showAiConcierge)}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#12141c] hover:bg-[#181b26] border border-white/10 text-left transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    {t.conciergeTitle}
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    {lang === "ja" ? "タップして乗車アドバイスを確認" : "Tap for AI boarding advice & questions"}
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

      {/* ─── MODAL: Station & Landmark Hub Picker ──────────────────────── */}
      <AnimatePresence>
        {stationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="w-full max-w-md bg-[#12141c] border-t sm:border border-white/15 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[88vh] overflow-y-auto no-scrollbar shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div>
                  <span className="text-sm font-bold text-white block">{t.selectStation}</span>
                  <span className="text-[10px] text-slate-400 block">
                    {lang === "ja" ? "観光スポットまたは路線から選択" : "Pick a landmark or search by line"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStationModalOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Popular Tokyo Landmarks & Sightseeing Spots */}
              <div>
                <span className="text-[11px] font-bold text-slate-300 block mb-2">
                  {t.popularLandmarks}
                </span>
                <div className="space-y-1.5">
                  {TOKYO_LANDMARK_HUBS.map((hub) => (
                    <button
                      key={hub.id}
                      type="button"
                      onClick={() => handleSelectHub(hub)}
                      className={cn(
                        "w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all",
                        selectedStation === hub.stationId
                          ? "bg-slate-800 border-emerald-500/60 text-white"
                          : "bg-slate-900/60 border-white/[0.06] text-slate-300 hover:bg-slate-800/60"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{hub.icon}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">
                              {lang === "ja" ? hub.nameJa : hub.name}
                            </span>
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: hub.lineColor }}
                            />
                            <span className="text-[10px] font-mono text-slate-400">
                              {hub.lineCode}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            {lang === "ja" ? hub.landmarkJa : hub.landmark}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-medium">Select</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Railway Line Directory */}
              <div>
                <span className="text-[11px] font-bold text-slate-300 block mb-2">
                  {t.selectLine}
                </span>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto no-scrollbar">
                  {operators.flatMap((o) => o.railways).map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRailway(r.id)}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-xl text-left transition-colors border",
                        selectedRailway === r.id
                          ? "bg-slate-800 border-white/20 text-white"
                          : "bg-slate-900/40 border-white/[0.06] text-slate-400 hover:text-slate-200"
                      )}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
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
                <span className="text-[11px] font-bold text-slate-300 block mb-2">
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
                        "flex items-center gap-1.5 p-2 rounded-xl text-left transition-colors border",
                        selectedStation === s.id
                          ? "bg-slate-800 border-white/20 text-white"
                          : "bg-slate-900/40 border-white/[0.06] text-slate-400 hover:text-slate-200"
                      )}
                    >
                      {s.code && (
                        <span className="text-[9px] font-mono font-bold text-slate-400 bg-white/[0.08] px-1 py-0.2 rounded shrink-0">
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

      {/* ─── MODAL: Destination Egress Picker ────────────────────────── */}
      <AnimatePresence>
        {transferModalOpen && result && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="w-full max-w-md bg-[#12141c] border-t sm:border border-white/15 rounded-t-3xl sm:rounded-3xl p-5 space-y-3 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-sm font-bold text-white">{t.targetEgress}</span>
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 pt-1">
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
                        "w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left",
                        isSelected
                          ? "bg-emerald-500/15 border-emerald-500/50 text-white"
                          : "bg-slate-900/60 border-white/[0.06] text-slate-300 hover:bg-slate-800/60"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">
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
                          <div className="text-[10px] text-slate-400">
                            {t.nearestCar} {tp.nearestCar}
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="max-w-md mx-auto w-full px-4 py-4 text-center text-xs text-slate-600 border-t border-white/[0.06]">
        <p className="font-semibold text-slate-400">{t.footerTitle}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">{t.footerSubtitle}</p>
      </footer>
    </div>
  );
}
