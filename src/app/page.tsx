"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { TrainVisualization } from "@/components/train-visualization";
import { RecommendationCard } from "@/components/recommendation-card";
import { ComfortSlider } from "@/components/comfort-slider";
import { AIAdvisorPanel } from "@/components/ai-advisor-panel";
import { getCongestionLabel, type ScoredCarOption } from "@/lib/optimizer";
import type { TransferPoint } from "@/lib/platform-data";
import type { CommuterContext } from "@/lib/ai-advisor";
import {
  MapPin,
  Train,
  ArrowRight,
  RefreshCw,
  ChevronDown,
  AlertTriangle,
  Info,
  Footprints,
  Compass,
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

const POPULAR_HUBS = [
  {
    name: "Otemachi",
    nameJa: "大手町",
    railwayId: "odpt.Railway:TokyoMetro.Marunouchi",
    stationId: "odpt.Station:TokyoMetro.Marunouchi.Otemachi",
    color: "#E60012",
  },
  {
    name: "Tokyo",
    nameJa: "東京",
    railwayId: "odpt.Railway:TokyoMetro.Marunouchi",
    stationId: "odpt.Station:TokyoMetro.Marunouchi.Tokyo",
    color: "#E60012",
  },
  {
    name: "Shibuya",
    nameJa: "渋谷",
    railwayId: "odpt.Railway:TokyoMetro.Ginza",
    stationId: "odpt.Station:TokyoMetro.Ginza.Shibuya",
    color: "#F39700",
  },
  {
    name: "Shinjuku",
    nameJa: "新宿",
    railwayId: "odpt.Railway:TokyoMetro.Marunouchi",
    stationId: "odpt.Station:TokyoMetro.Marunouchi.Shinjuku",
    color: "#E60012",
  },
  {
    name: "Ginza",
    nameJa: "銀座",
    railwayId: "odpt.Railway:TokyoMetro.Ginza",
    stationId: "odpt.Station:TokyoMetro.Ginza.Ginza",
    color: "#F39700",
  },
];

export default function HomePage() {
  // State
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

  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [selectedCar, setSelectedCar] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [showPicker, setShowPicker] = useState(false);

  // Fetch operators & lines on load
  useEffect(() => {
    fetch("/api/lines")
      .then((res) => res.json())
      .then((data) => {
        if (data.operators) setOperators(data.operators);
      })
      .catch(() => setError("Could not load line catalog"));
  }, []);

  // Fetch stations when railway changes
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

  // Fetch optimization
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

  // Auto-refresh every 30s
  useEffect(() => {
    if (!result) return;
    const interval = setInterval(fetchOptimization, 30000);
    return () => clearInterval(interval);
  }, [result, fetchOptimization]);

  // Selected railway and station info
  const selectedRailwayInfo = useMemo(() => {
    return operators
      .flatMap((o) => o.railways)
      .find((r) => r.id === selectedRailway);
  }, [operators, selectedRailway]);

  const selectedStationInfo = useMemo(() => {
    return stations.find((s) => s.id === selectedStation);
  }, [stations, selectedStation]);

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
      recommendedDoor: result.selectedTransfer?.nearestDoor || 2,
      crowdingPercentage: result.recommendation.congestion,
      walkingDistanceMeters: result.recommendation.walkDistance,
      walkingTimeSeconds: result.recommendation.walkTime,
      transferTarget: result.selectedTransfer
        ? {
            name: result.selectedTransfer.name,
            nameJa: result.selectedTransfer.nameJa,
            type: result.selectedTransfer.type,
            connectsTo: result.selectedTransfer.connectsTo,
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
  }, [result, comfortWeight]);

  return (
    <div className="min-h-dvh flex flex-col bg-[#090a0f] text-slate-100">
      {/* Human iOS-Style Solid Blurred Header */}
      <header className="sticky top-0 z-50 human-glass-header">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-slate-950 text-sm shadow-md shadow-emerald-500/20">
              ゆ
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-white">Yutori</span>
                <span className="text-[10px] text-slate-400 font-medium px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700/60">
                  Tokyo
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Optimal Door Finder</p>
            </div>
          </div>

          {/* Station / Line Indicator & Refresh */}
          <div className="flex items-center gap-1.5">
            {lastUpdated && (
              <button
                type="button"
                onClick={fetchOptimization}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 px-2.5 py-1 rounded-full border border-slate-700/50 transition-colors"
                title="Refresh live data"
              >
                <RefreshCw
                  className={cn("w-3 h-3 text-slate-400", loading && "animate-spin text-emerald-400")}
                />
                <span className="text-[11px] font-medium">30s</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-4 space-y-4">
        {/* Clean Station Search / Selector Card */}
        <div className="human-card rounded-3xl p-4 space-y-3">
          {/* Quick Hub Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {POPULAR_HUBS.map((hub) => {
              const isActive = selectedStation === hub.stationId;
              return (
                <button
                  key={hub.stationId}
                  type="button"
                  onClick={() => {
                    setSelectedRailway(hub.railwayId);
                    setSelectedStation(hub.stationId);
                    setSelectedTransfer("");
                    setShowPicker(false);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 cursor-pointer",
                    isActive
                      ? "bg-white text-slate-950 shadow-md shadow-white/10"
                      : "bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 border border-slate-700/50"
                  )}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: hub.color }}
                  />
                  <span>{hub.name}</span>
                  <span className="text-[10px] opacity-60 font-normal">{hub.nameJa}</span>
                </button>
              );
            })}
          </div>

          {/* Active Station Display & Change Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowPicker(!showPicker)}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#161a26] hover:bg-[#1c2130] border border-slate-800 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3.5 h-3.5 rounded-full shadow-sm"
                  style={{ backgroundColor: selectedRailwayInfo?.color || "#E60012" }}
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    {selectedStationInfo?.code && (
                      <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                        {selectedStationInfo.code}
                      </span>
                    )}
                    <span className="text-sm font-bold text-white">
                      {selectedStationInfo?.name || "Select Station"}
                    </span>
                    <span className="text-xs text-slate-400">
                      {selectedStationInfo?.nameJa}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {selectedRailwayInfo?.name || "Tokyo Subway"} · {selectedRailwayInfo?.nameJa}
                  </p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-slate-400 transition-transform",
                  showPicker && "rotate-180"
                )}
              />
            </button>
          </div>

          {/* Expandable Line/Station Selector */}
          <AnimatePresence>
            {showPicker && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-3 pt-2 border-t border-slate-800"
              >
                {/* Operator Lines */}
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Select Line
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto no-scrollbar pr-1">
                    {operators.flatMap((o) => o.railways).map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedRailway(r.id)}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-xl text-left transition-colors border",
                          selectedRailway === r.id
                            ? "bg-slate-800 border-slate-600 text-white"
                            : "bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200"
                        )}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: r.color }}
                        />
                        <span className="text-xs font-medium truncate">{r.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stations for this line */}
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Select Station
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto no-scrollbar pr-1">
                    {stations.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSelectedStation(s.id);
                          setShowPicker(false);
                          setSelectedTransfer("");
                        }}
                        className={cn(
                          "flex items-center gap-1.5 p-2 rounded-xl text-left transition-colors border",
                          selectedStation === s.id
                            ? "bg-slate-800 border-slate-600 text-white"
                            : "bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200"
                        )}
                      >
                        {s.code && (
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-1 py-0.2 rounded shrink-0">
                            {s.code}
                          </span>
                        )}
                        <span className="text-xs font-medium truncate">{s.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Destination Egress / Transfer Point Selector */}
        {result && result.transferPoints.length > 0 && (
          <div className="human-card rounded-3xl p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                <span>Target Exit / Transfer Point</span>
              </span>
              <span className="text-[11px] text-slate-500">Pick destination</span>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
              {result.transferPoints.map((tp) => {
                const isSelected =
                  result.selectedTransfer?.id === tp.id || selectedTransfer === tp.id;
                return (
                  <button
                    key={tp.id}
                    type="button"
                    onClick={() => setSelectedTransfer(tp.id)}
                    className={cn(
                      "flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border transition-all text-left flex-shrink-0 cursor-pointer",
                      isSelected
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm"
                        : "bg-[#161a26] border-slate-800 hover:border-slate-700 text-slate-400"
                    )}
                  >
                    <span className="text-sm">
                      {tp.type === "stairs"
                        ? "🪜"
                        : tp.type === "escalator"
                        ? "↗️"
                        : tp.type === "elevator"
                        ? "🛗"
                        : "🚪"}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        {tp.name}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Nearest Car {tp.nearestCar}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Live Service Disruption Alert (Subtle, Clean) */}
        {result?.serviceInfo &&
          result.serviceInfo.status !== "Normal service" &&
          result.serviceInfo.status !== "Normal" && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 flex items-start gap-2.5"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-amber-300">
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

        {/* Hero: The Recommended Boarding Door Card */}
        {result?.recommendation && (
          <RecommendationCard
            car={result.recommendation}
            transfer={result.selectedTransfer}
            hasLiveData={result.train?.hasLiveCongestion || false}
            stationName={result.station.name}
          />
        )}

        {/* Train Composition Heatmap (Smooth Horizontal Rail View) */}
        {result?.cars && result.cars.length > 0 && (
          <div className="human-card rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Train className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-300">
                  Train Composition ({result.cars.length} Cars)
                </span>
              </div>
              {result.train && (
                <div className="text-[11px] text-slate-400 font-medium">
                  Train #{result.train.number}
                  {result.train.delay > 0 && (
                    <span className="text-amber-400 font-semibold ml-1">
                      +{Math.round(result.train.delay / 60)}m delay
                    </span>
                  )}
                </div>
              )}
            </div>

            <TrainVisualization
              cars={result.cars}
              selectedCar={selectedCar}
              onSelectCar={setSelectedCar}
              recommendation={result.recommendation}
            />
          </div>
        )}

        {/* Selected Car Details Drawer (When User Taps Any Car) */}
        <AnimatePresence>
          {selectedCar && result?.cars && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              {(() => {
                const car = result.cars.find((c) => c.carNumber === selectedCar);
                if (!car) return null;
                const congestion = getCongestionLabel(car.congestion);
                return (
                  <div className="human-card rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">
                        Car {car.carNumber} Specifics
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Rank #{car.rank} of {result.cars.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-[#181d2a] rounded-xl p-2.5 border border-slate-800">
                        <div
                          className="text-base font-bold"
                          style={{ color: congestion.color }}
                        >
                          {car.congestion}%
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Crowding</div>
                      </div>

                      <div className="bg-[#181d2a] rounded-xl p-2.5 border border-slate-800">
                        <div className="text-base font-bold text-cyan-400">
                          {car.walkDistance > 0 ? `${car.walkDistance}m` : "At gate"}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Walk Distance</div>
                      </div>

                      <div className="bg-[#181d2a] rounded-xl p-2.5 border border-slate-800">
                        <div className="text-base font-bold text-emerald-400">
                          {Math.round(car.overallScore * 100)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Match Score</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Boarding Priority Slider (Tactile Presets) */}
        {result && (
          <ComfortSlider value={comfortWeight} onChange={setComfortWeight} />
        )}

        {/* AI Transit Concierge */}
        {commuterContext && <AIAdvisorPanel context={commuterContext} />}

        {/* Error Notification */}
        {error && (
          <div className="human-card rounded-2xl p-3.5 flex items-start gap-2.5 text-xs border-red-500/30 text-red-300">
            <Info className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <span>{error}</span>
              <button
                type="button"
                onClick={fetchOptimization}
                className="underline ml-2 text-white font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Human Footer */}
      <footer className="max-w-md mx-auto w-full px-4 py-5 text-center text-xs text-slate-500 border-t border-slate-800/80">
        <p className="font-medium text-slate-400">Yutori Car · ゆとり車両</p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Real-Time Tokyo Transit Optimization & Spatial Intelligence
        </p>
      </footer>
    </div>
  );
}
