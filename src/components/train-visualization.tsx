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
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          <span>{destinationDirection}</span>
        </div>
        <span className="text-[11px] text-slate-400">Tap car to preview</span>
      </div>

      {/* Train Track & Cars Container */}
      <div className="relative pt-3 pb-2">
        {/* Track Line */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-200 rounded-full z-0" />

        {/* Scrollable Cars Row */}
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-2 px-1 relative z-10 snap-x">
          {cars.map((car) => {
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
                  "relative flex-shrink-0 w-20 rounded-2xl p-2.5 text-left transition-all duration-200 snap-center cursor-pointer",
                  "border bg-white shadow-xs",
                  isRecommended
                    ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                    : isSelected
                    ? "border-slate-800 ring-2 ring-slate-800/10 shadow-sm"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                {/* Recommended Badge on Top */}
                {isRecommended && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-emerald-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>BEST</span>
                  </div>
                )}

                {/* Car Header */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={cn(
                      "text-xs font-bold font-mono",
                      isRecommended ? "text-emerald-700" : "text-slate-800"
                    )}
                  >
                    Car {car.carNumber}
                  </span>
                  {car.isPareto && !isRecommended && (
                    <span
                      className="w-2 h-2 rounded-full bg-cyan-500"
                      title="Good alternative"
                    />
                  )}
                </div>

                {/* Simulated Train Windows */}
                <div className="flex justify-between items-center gap-1 mb-2.5">
                  <div className="h-1.5 flex-1 bg-slate-100 rounded-full border border-slate-200" />
                  <div className="h-1.5 flex-1 bg-slate-100 rounded-full border border-slate-200" />
                </div>

                {/* Crowding Gauge */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 font-medium">Load</span>
                    <span
                      className="font-bold text-[11px]"
                      style={{ color: congestion.color }}
                    >
                      {car.congestion}%
                    </span>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
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
                  <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                    <Footprints className="w-3 h-3 text-slate-400" />
                    <span className="font-semibold text-slate-700">
                      {car.walkDistance}m
                    </span>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Clean Legend */}
      <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-0.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
          <span className="font-medium">Recommended Door</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
          <span>Alternative Option</span>
        </div>
      </div>
    </div>
  );
}
