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
  Sparkles,
  Footprints,
  Users,
  Compass,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface RecommendationCardProps {
  car: ScoredCarOption;
  transfer: TransferPoint | null;
  hasLiveData: boolean;
  stationName?: string;
}

export function RecommendationCard({
  car,
  transfer,
  hasLiveData,
  stationName,
}: RecommendationCardProps) {
  const congestion = getCongestionLabel(car.congestion);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="human-card-glow rounded-3xl p-5 md:p-6 relative overflow-hidden"
    >
      {/* Top Banner Tag */}
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex items-center gap-1.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Optimal Boarding Spot</span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              hasLiveData ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
            )}
          />
          <span>{hasLiveData ? "Live Telemetry" : "Estimated Flow"}</span>
        </div>
      </div>

      {/* Main Focus: Car and Door Callout */}
      <div className="mb-5">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Car {car.carNumber}
          </span>
          <span className="text-xl md:text-2xl font-semibold text-slate-400">
            · Door {transfer?.nearestDoor || 2}
          </span>
        </div>

        {transfer ? (
          <p className="text-sm text-slate-300 font-medium flex items-center gap-1.5 mt-1.5">
            <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Directly aligns with {transfer.name}</span>
          </p>
        ) : (
          <p className="text-sm text-slate-400">
            Balanced for minimum platform walking and seating availability
          </p>
        )}
      </div>

      {/* Key Metrics in Human Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Crowding Card */}
        <div className="bg-[#181d2a]/80 rounded-2xl p-3.5 border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>Passenger Space</span>
          </div>
          <div className="text-base font-bold text-white flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: congestion.color }}
            />
            <span>{congestion.label}</span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {car.congestion}% load capacity
          </div>
        </div>

        {/* Transfer Walking Distance Card */}
        <div className="bg-[#181d2a]/80 rounded-2xl p-3.5 border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1.5">
            <Footprints className="w-3.5 h-3.5 text-slate-400" />
            <span>Transfer Egress</span>
          </div>
          <div className="text-base font-bold text-white">
            {car.walkDistance > 0 ? `${car.walkDistance}m walk` : "At Gate"}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {car.walkTime > 0 ? `~${formatWalkTime(car.walkTime)} corridor transit` : "Immediate exit"}
          </div>
        </div>
      </div>

      {/* Quick Egress Landmark Indicator */}
      {transfer?.nameJa && (
        <div className="text-[11px] text-slate-400 bg-slate-900/60 rounded-xl px-3 py-2 flex items-center justify-between border border-slate-800/50">
          <span className="text-slate-400 truncate">案内先: {transfer.nameJa}</span>
          <span className="text-emerald-400 font-medium shrink-0 ml-2">降車後すぐ</span>
        </div>
      )}
    </motion.div>
  );
}
