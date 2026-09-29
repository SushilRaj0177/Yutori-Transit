"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  getCongestionLabel,
  formatWalkTime,
  type ScoredCarOption,
} from "@/lib/optimizer";
import type { TransferPoint } from "@/lib/platform-data";
import {
  Star,
  Footprints,
  Users,
  TrendingUp,
  Clock,
  Zap,
  MapPin,
} from "lucide-react";

interface RecommendationCardProps {
  car: ScoredCarOption;
  transfer: TransferPoint | null;
  hasLiveData: boolean;
}

export function RecommendationCard({
  car,
  transfer,
  hasLiveData,
}: RecommendationCardProps) {
  const congestion = getCongestionLabel(car.congestion);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="glass-strong rounded-2xl p-5 glow-green"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 text-green-400" fill="currentColor" />
            <span className="text-xs font-medium text-green-400 uppercase tracking-wider">
              Recommended
            </span>
          </div>
          <h2 className="text-2xl font-bold">
            Car {car.carNumber}
            <span className="text-zinc-500 text-lg font-normal ml-1">
              / Door {transfer?.nearestDoor || 1}
            </span>
          </h2>
        </div>

        {/* Overall score */}
        <div className="text-right">
          <div className="text-3xl font-bold gradient-text">
            {Math.round(car.overallScore * 100)}
          </div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
            Score
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Comfort */}
        <div className="bg-zinc-900/50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Users className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-xs text-zinc-400">Comfort</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-lg font-semibold"
              style={{ color: congestion.color }}
            >
              {congestion.label}
            </span>
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">
            {car.congestion}% full
          </div>

          {/* Comfort bar */}
          <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${car.comfortScore * 100}%` }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
            />
          </div>
        </div>

        {/* Speed */}
        <div className="bg-zinc-900/50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Footprints className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-xs text-zinc-400">Transfer</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-semibold text-cyan-400">
              {car.walkDistance > 0 ? `${car.walkDistance}m` : "—"}
            </span>
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">
            {car.walkTime > 0 ? formatWalkTime(car.walkTime) + " walk" : "Select transfer"}
          </div>

          {/* Speed bar */}
          <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${car.speedScore * 100}%` }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-400"
            />
          </div>
        </div>
      </div>

      {/* Transfer destination */}
      {transfer && (
        <div className="flex items-center gap-2 bg-zinc-900/30 rounded-lg px-3 py-2 mb-3">
          <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <div className="text-xs">
            <span className="text-zinc-400">Walk to: </span>
            <span className="text-zinc-200 font-medium">{transfer.name}</span>
            {transfer.nameJa && (
              <span className="text-zinc-500 ml-1.5">{transfer.nameJa}</span>
            )}
          </div>
        </div>
      )}

      {/* Live data badge */}
      <div className="flex items-center gap-2 text-[10px]">
        {hasLiveData ? (
          <div className="flex items-center gap-1 text-green-400">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 live-indicator" />
            <span>Live congestion data</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-amber-400">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Estimated congestion (no live data)</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
