"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getCongestionLabel, type ScoredCarOption } from "@/lib/optimizer";
import { Sparkles, ArrowLeft, Footprints, Users } from "lucide-react";

interface TrainVisualizationProps {
  cars: ScoredCarOption[];
  selectedCar: number | null;
  onSelectCar: (carNumber: number) => void;
  recommendation: ScoredCarOption | null;
  destinationDirection?: string;
}

export function TrainVisualization({
  cars,
  selectedCar,
  onSelectCar,
  recommendation,
  destinationDirection = "Front of train",
}: TrainVisualizationProps) {
  if (cars.length === 0) return null;

  return (
    <div className="w-full space-y-3">
      {/* Direction Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div className="flex items-center gap-1.5 font-medium text-slate-300">
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>{destinationDirection}</span>
        </div>
        <span className="text-[11px] text-slate-500">Tap a car for details</span>
      </div>

      {/* Train Container with Track */}
      <div className="relative pt-3 pb-2">
        {/* Rail Track Graphic */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-800/80 rounded-full z-0" />

        {/* Scrollable Train Car Row */}
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-2 px-1 relative z-10 snap-x">
          {cars.map((car, index) => {
            const congestion = getCongestionLabel(car.congestion);
            const isRecommended = recommendation?.carNumber === car.carNumber;
            const isSelected = selectedCar === car.carNumber;

            return (
              <motion.button
                key={car.carNumber}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => onSelectCar(car.carNumber)}
                className={cn(
                  "relative flex-shrink-0 w-20 rounded-2xl p-3 text-left transition-all duration-200 snap-center cursor-pointer",
                  "border",
                  isRecommended
                    ? "bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-900/20 ring-2 ring-emerald-500/30"
                    : isSelected
                    ? "bg-slate-800/90 border-slate-500 shadow-md"
                    : "bg-[#161a26] border-slate-800 hover:border-slate-700"
                )}
              >
                {/* Recommended Badge on Top */}
                {isRecommended && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-emerald-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>BEST</span>
                  </div>
                )}

                {/* Car Header */}
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "text-xs font-bold",
                    isRecommended ? "text-emerald-400" : "text-slate-300"
                  )}>
                    Car {car.carNumber}
                  </span>
                  {car.isPareto && !isRecommended && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" title="Pareto choice" />
                  )}
                </div>

                {/* Window Graphic / Cutout */}
                <div className="flex justify-between items-center gap-1 mb-3">
                  <div className="h-1.5 flex-1 bg-slate-700/60 rounded-full" />
                  <div className="h-1.5 flex-1 bg-slate-700/60 rounded-full" />
                </div>

                {/* Crowding Gauge */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Load</span>
                    <span
                      className="font-bold text-xs"
                      style={{ color: congestion.color }}
                    >
                      {car.congestion}%
                    </span>
                  </div>
                  
                  {/* Visual Bar */}
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${car.congestion}%`,
                        backgroundColor: congestion.color,
                      }}
                    />
                  </div>
                </div>

                {/* Walk Footprint */}
                {car.walkDistance > 0 && (
                  <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                    <Footprints className="w-3 h-3 text-slate-500" />
                    <span className="font-medium text-slate-300">{car.walkDistance}m</span>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Clean Legend */}
      <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 pt-0.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Optimal Door</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>Alternative Option</span>
        </div>
      </div>
    </div>
  );
}
