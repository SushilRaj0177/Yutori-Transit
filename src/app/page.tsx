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
  ArrowDownUp,
  RefreshCw,
  ChevronDown,
  AlertTriangle,
  Info,
  Sparkles,
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
    lineName: "Marunouchi",
    color: "#F62E36",
  },
  {
    name: "Tokyo",
    nameJa: "東京",
    railwayId: "odpt.Railway:TokyoMetro.Marunouchi",
    stationId: "odpt.Station:TokyoMetro.Marunouchi.Tokyo",
    lineName: "Marunouchi",
    color: "#F62E36",
  },
  {
    name: "Shibuya",
    nameJa: "渋谷",
    railwayId: "odpt.Railway:TokyoMetro.Ginza",
    stationId: "odpt.Station:TokyoMetro.Ginza.Shibuya",
    lineName: "Ginza",
    color: "#FF9500",
  },
  {
    name: "Shinjuku",
    nameJa: "新宿",
    railwayId: "odpt.Railway:Toei.Shinjuku",
    stationId: "odpt.Station:Toei.Shinjuku.Shinjuku",
    lineName: "Toei Shinjuku",
    color: "#6CBB5A",
  },
];

export default function HomePage() {
  // Selection state
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

  // Result state
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [selectedCar, setSelectedCar] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // UI state
  const [showLineSelector, setShowLineSelector] = useState(false);
  const [showStationSelector, setShowStationSelector] = useState(false);

  // Fetch available lines on mount
  useEffect(() => {
    fetch("/api/lines")
      .then((res) => res.json())
      .then((data) => {
        if (data.operators) setOperators(data.operators);
      })
      .catch(() => setError("Failed to load railway lines"));
  }, []);

  // Fetch stations when railway changes
  useEffect(() => {
    if (!selectedRailway) return;

    fetch(`/api/stations?railway=${encodeURIComponent(selectedRailway)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.stations) {
          setStations(data.stations);
          // If current selected station isn't on this line, default to first station
          if (!data.stations.some((s: StationOption) => s.id === selectedStation)) {
            setSelectedStation(data.stations[0]?.id || "");
            setSelectedTransfer("");
          }
        }
      })
      .catch(() => setError("Failed to load stations"));
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
      setError(err instanceof Error ? err.message : "Transit data temporarily unavailable");
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

  // Selected railway & station info
  const selectedRailwayInfo = operators
    .flatMap((o) => o.railways)
    .find((r) => r.id === selectedRailway);

  const selectedStationInfo = stations.find((s) => s.id === selectedStation);

  // Commuter Context for AI Advisor
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
    <div className="min-h-dvh flex flex-col bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-strong border-b border-zinc-800/80">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center font-bold text-zinc-950 shadow-md shadow-emerald-500/10">
              ゆ
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">
                <span className="gradient-text">Yutori Car</span>
                <span className="text-zinc-500 text-xs font-normal ml-1.5">ゆとり車両</span>
              </h1>
              <p className="text-[10px] text-zinc-400">
                Pareto-Optimal Tokyo Subway Door Advisor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {lastUpdated && (
              <button
                onClick={fetchOptimization}
                className="flex items-center gap-1.5 text-[11px] bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 px-2.5 py-1 rounded-lg border border-zinc-800 transition-colors"
              >
                <RefreshCw
                  className={cn("w-3 h-3 text-zinc-400", loading && "animate-spin text-cyan-400")}
                />
                <span>{loading ? "Updating" : "Live 30s"}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 space-y-4">
        {/* Quick Hub Presets */}
        <div>
          <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-1">
            Major Interchange Hubs
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {POPULAR_HUBS.map((hub) => {
              const isSelected = selectedStation === hub.stationId;
              return (
                <button
                  key={hub.stationId}
                  onClick={() => {
                    setSelectedRailway(hub.railwayId);
                    setSelectedStation(hub.stationId);
                    setSelectedTransfer("");
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition-all",
                    isSelected
                      ? "bg-zinc-800/90 border-zinc-600 shadow-md shadow-zinc-900"
                      : "bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700 text-zinc-400"
                  )}
                >
                  <div
                    className="w-2 h-2 rounded-full mb-1"
                    style={{ backgroundColor: hub.color }}
                  />
                  <span className="text-xs font-medium text-zinc-200">{hub.name}</span>
                  <span className="text-[9px] text-zinc-500">{hub.nameJa}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Line & Station Selector Bar */}
        <div className="glass rounded-xl p-3.5 space-y-2.5">
          {/* Railway Selector */}
          <div>
            <button
              onClick={() => setShowLineSelector(!showLineSelector)}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-800/60 border border-zinc-800 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Train className="w-4 h-4 text-zinc-400" />
                {selectedRailwayInfo ? (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: selectedRailwayInfo.color }}
                    />
                    <span className="text-xs font-semibold text-zinc-200">
                      {selectedRailwayInfo.name}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      {selectedRailwayInfo.nameJa}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-zinc-500">Select Railway Line</span>
                )}
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-zinc-500 transition-transform",
                  showLineSelector && "rotate-180"
                )}
              />
            </button>

            <AnimatePresence>
              {showLineSelector && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-2"
                >
                  <div className="max-h-56 overflow-y-auto space-y-2.5 p-2 bg-zinc-950/80 rounded-xl border border-zinc-800">
                    {operators.map((op) => (
                      <div key={op.id}>
                        <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-2 mb-1">
                          {op.key.replace(/([A-Z])/g, " $1").trim()}
                        </div>
                        <div className="space-y-1">
                          {op.railways.map((r) => (
                            <button
                              key={r.id}
                              onClick={() => {
                                setSelectedRailway(r.id);
                                setShowLineSelector(false);
                              }}
                              className={cn(
                                "w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-colors text-left",
                                selectedRailway === r.id
                                  ? "bg-zinc-800 border border-zinc-700"
                                  : "hover:bg-zinc-900/60"
                              )}
                            >
                              <div
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: r.color }}
                              />
                              <span className="text-xs text-zinc-200">{r.name}</span>
                              <span className="text-[11px] text-zinc-500 ml-auto">
                                {r.nameJa}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Station Selector */}
          <div>
            <button
              onClick={() => setShowStationSelector(!showStationSelector)}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-800/60 border border-zinc-800 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-zinc-400" />
                {selectedStationInfo ? (
                  <div className="flex items-center gap-2">
                    {selectedStationInfo.code && (
                      <span className="text-[10px] font-bold bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">
                        {selectedStationInfo.code}
                      </span>
                    )}
                    <span className="text-xs font-semibold text-zinc-200">
                      {selectedStationInfo.name}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      {selectedStationInfo.nameJa}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-zinc-500">Select Station</span>
                )}
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-zinc-500 transition-transform",
                  showStationSelector && "rotate-180"
                )}
              />
            </button>

            <AnimatePresence>
              {showStationSelector && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-2"
                >
                  <div className="max-h-48 overflow-y-auto p-1.5 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-0.5">
                    {stations.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setSelectedStation(s.id);
                          setShowStationSelector(false);
                          setSelectedTransfer("");
                        }}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-colors text-left",
                          selectedStation === s.id
                            ? "bg-zinc-800 border border-zinc-700"
                            : "hover:bg-zinc-900/60"
                        )}
                      >
                        {s.code && (
                          <span className="text-[10px] font-bold bg-zinc-800 px-1.5 py-0.5 rounded min-w-[28px] text-center text-zinc-400">
                            {s.code}
                          </span>
                        )}
                        <span className="text-xs text-zinc-200">{s.name}</span>
                        <span className="text-[11px] text-zinc-500 ml-auto">
                          {s.nameJa}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Transfer Egress Point Selector */}
        {result && result.transferPoints.length > 0 && (
          <div className="glass rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <ArrowDownUp className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-300">
                  Destination Egress / Transfer Target
                </span>
              </div>
              <span className="text-[10px] text-zinc-500">1D Platform Coordinate</span>
            </div>
            <div className="space-y-1.5">
              {result.transferPoints.map((tp) => {
                const isSelected =
                  result.selectedTransfer?.id === tp.id || selectedTransfer === tp.id;
                return (
                  <button
                    key={tp.id}
                    onClick={() => setSelectedTransfer(tp.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all text-left",
                      isSelected
                        ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 shadow-sm"
                        : "bg-zinc-900/50 hover:bg-zinc-800/50 border border-zinc-800/80 text-zinc-400"
                    )}
                  >
                    <div className="text-base shrink-0">
                      {tp.type === "stairs"
                        ? "🪜"
                        : tp.type === "escalator"
                        ? "↗️"
                        : tp.type === "elevator"
                        ? "🛗"
                        : "🚪"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-zinc-200 truncate">
                        {tp.name}
                      </div>
                      {tp.nameJa && (
                        <div className="text-[10px] text-zinc-500 truncate">
                          {tp.nameJa}
                        </div>
                      )}
                    </div>
                    <div className="text-[11px] font-semibold text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-lg shrink-0">
                      Car {tp.nearestCar}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Pareto Comfort vs Speed Slider */}
        {result && (
          <ComfortSlider value={comfortWeight} onChange={setComfortWeight} />
        )}

        {/* Live Service Disruption Alert */}
        {result?.serviceInfo &&
          result.serviceInfo.status !== "Normal service" &&
          result.serviceInfo.status !== "Normal" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl p-3"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-amber-400">
                  {result.serviceInfo.status}
                </div>
                {result.serviceInfo.text && (
                  <div className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                    {result.serviceInfo.text}
                  </div>
                )}
              </div>
            </motion.div>
          )}

        {/* Recommendation Card */}
        {result?.recommendation && (
          <RecommendationCard
            car={result.recommendation}
            transfer={result.selectedTransfer}
            hasLiveData={result.train?.hasLiveCongestion || false}
          />
        )}

        {/* Explainable AI Transit Intelligence Copilot */}
        {commuterContext && (
          <AIAdvisorPanel
            context={commuterContext}
            onSetPriority={(mode) => {
              if (mode === "speed") setComfortWeight(0.1);
              else if (mode === "comfort") setComfortWeight(0.9);
              else setComfortWeight(0.5);
            }}
          />
        )}

        {/* Train Visualization */}
        {result?.cars && result.cars.length > 0 && (
          <div className="glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Train className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-200">
                  Train Composition Heatmap ({result.cars.length} Cars)
                </span>
              </div>
              {result.train && (
                <div className="flex items-center gap-2 text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-lg border border-zinc-800">
                  <span>Train #{result.train.number}</span>
                  {result.train.delay > 0 && (
                    <span className="text-amber-400 font-bold">
                      +{Math.round(result.train.delay / 60)}m
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

        {/* Selected Car Breakdown Drawer */}
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
                  <div className="glass-strong rounded-xl p-3.5 space-y-2.5 border border-zinc-700/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-100">
                        Car {car.carNumber} Telemetry Breakdown
                      </span>
                      <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">
                        Pareto Rank #{car.rank}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-zinc-900/70 rounded-lg p-2 border border-zinc-800">
                        <div
                          className="text-base font-bold"
                          style={{ color: congestion.color }}
                        >
                          {car.congestion}%
                        </div>
                        <div className="text-[10px] text-zinc-400">Crowding</div>
                      </div>
                      <div className="bg-zinc-900/70 rounded-lg p-2 border border-zinc-800">
                        <div className="text-base font-bold text-cyan-400">
                          {car.walkDistance > 0 ? `${car.walkDistance}m` : "—"}
                        </div>
                        <div className="text-[10px] text-zinc-400">Egress Walk</div>
                      </div>
                      <div className="bg-zinc-900/70 rounded-lg p-2 border border-zinc-800">
                        <div className="text-base font-bold gradient-text">
                          {Math.round(car.overallScore * 100)}
                        </div>
                        <div className="text-[10px] text-zinc-400">Score</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Initial Empty / Loading states */}
        {loading && !result && (
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-zinc-500 animate-spin mb-2" />
            <span className="text-xs text-zinc-400">
              Querying live ODPT Tokyo telemetry...
            </span>
          </div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl p-3.5"
          >
            <Info className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-red-400">Notice</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">{error}</div>
              <button
                onClick={fetchOptimization}
                className="text-[11px] text-red-400 underline mt-1"
              >
                Retry Query
              </button>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-lg mx-auto w-full px-4 py-4 text-center text-[10px] text-zinc-600 border-t border-zinc-900">
        <p>Yutori Car (ゆとり車両) · Pareto-Optimal Tokyo Transit Optimization</p>
        <p className="mt-0.5">
          Live ODPT Ingestion · Groq Real-Time Spatial Inference · Waseda Research Spec
        </p>
      </footer>
    </div>
  );
}
