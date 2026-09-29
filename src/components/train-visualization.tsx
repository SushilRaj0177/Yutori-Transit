"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getCongestionLabel, type ScoredCarOption } from "@/lib/optimizer";
import { Star, ArrowRight } from "lucide-react";

interface TrainVisualizationProps {
  cars: ScoredCarOption[];
  selectedCar: number | null;
  onSelectCar: (carNumber: number) => void;
  recommendation: ScoredCarOption | null;
}

export function TrainVisualization({
  cars,
  selectedCar,
  onSelectCar,
  recommendation,
}: TrainVisualizationProps) {
  if (cars.length === 0) return null;

  return (
    <div className="w-full space-y-4">
      {/* Direction indicator */}
      <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
        <span>← Front</span>
        <div className="flex items-center gap-1">
          <ArrowRight className="w-3 h-3" />
          <span>Direction of travel</span>
        </div>
        <span>Rear →</span>
      </div>

      {/* Train body */}
      <div className="relative">
        {/* Track line */}
        <div className="absolute left-0 right-0 bottom-0 h-1 bg-zinc-800 rounded-full" />

        {/* Cars */}
        <div className="flex gap-1.5 pb-3 overflow-x-auto scrollbar-hide">
          {cars.map((car, index) => {
            const congestion = getCongestionLabel(car.congestion);
            const isRecommended = recommendation?.carNumber === car.carNumber;
            const isSelected = selectedCar === car.carNumber;
            const isPareto = car.isPareto;

            return (
              <motion.button
                key={car.carNumber}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                onClick={() => onSelectCar(car.carNumber)}
                className={cn(
                  "car-segment relative flex-1 min-w-[52px] rounded-xl p-2.5 pt-3 cursor-pointer transition-all",
                  "border border-zinc-800/50 hover:border-zinc-700",
                  isRecommended && "recommended border-green-500/30 bg-green-500/5",
                  isSelected && !isRecommended && "border-cyan-500/30 bg-cyan-500/5",
                  !isRecommended && !isSelected && "bg-zinc-900/50"
                )}
              >
                {/* Recommended badge */}
                {isRecommended && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 left-1/2 -translate-x-1/2"
                  >
                    <div className="bg-green-500 text-zinc-950 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5" fill="currentColor" />
                      BEST
                    </div>
                  </motion.div>
                )}

                {/* Pareto indicator */}
                {isPareto && !isRecommended && (
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400/60" />
                  </div>
                )}

                {/* Car number */}
                <div className="text-[10px] text-zinc-500 font-medium mb-1.5">
                  {car.carNumber}
                </div>

                {/* Congestion bar */}
                <div className="w-full h-16 bg-zinc-800/50 rounded-lg overflow-hidden relative">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${car.congestion}%` }}
                    transition={{ delay: index * 0.05 + 0.2, duration: 0.5, ease: "easeOut" }}
                    className="absolute bottom-0 left-0 right-0 rounded-lg"
                    style={{ backgroundColor: congestion.color + "40" }}
                  >
                    <div
                      className="absolute inset-0 rounded-lg opacity-60"
                      style={{
                        background: `linear-gradient(to top, ${congestion.color}60, transparent)`,
                      }}
                    />
                  </motion.div>

                  {/* Percentage */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: congestion.color }}
                    >
                      {car.congestion}%
                    </span>
                  </div>
                </div>

                {/* Door indicators */}
                <div className="flex justify-between mt-1.5 px-0.5">
                  <div className="w-2.5 h-1 rounded-full bg-zinc-700" />
                  <div className="w-2.5 h-1 rounded-full bg-zinc-700" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-[10px] text-zinc-500">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Best pick</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-cyan-400/60" />
          <span>Pareto optimal</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-1 rounded-full bg-zinc-700" />
          <span>Doors</span>
        </div>
      </div>
    </div>
  );
}
