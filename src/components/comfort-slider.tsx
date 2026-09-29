"use client";

import { cn } from "@/lib/utils";
import { Zap, Scale, Sofa } from "lucide-react";

interface ComfortSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function ComfortSlider({ value, onChange }: ComfortSliderProps) {
  const currentMode =
    value <= 0.3 ? "speed" : value >= 0.7 ? "comfort" : "balanced";

  return (
    <div className="human-card rounded-2xl p-4 space-y-3">
      {/* Top Header */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-300">Boarding Priority</span>
        <span className="text-slate-400 font-medium">
          {currentMode === "speed"
            ? "Speed First (Shortest walk)"
            : currentMode === "comfort"
            ? "Space First (Least crowded)"
            : "Balanced (Optimal mix)"}
        </span>
      </div>

      {/* Preset Buttons for Quick 1-Tap Switching */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900/80 rounded-xl border border-slate-800">
        <button
          type="button"
          onClick={() => onChange(0.15)}
          className={cn(
            "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all",
            currentMode === "speed"
              ? "bg-slate-800 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Fast Exit</span>
        </button>

        <button
          type="button"
          onClick={() => onChange(0.5)}
          className={cn(
            "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all",
            currentMode === "balanced"
              ? "bg-slate-800 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <Scale className="w-3.5 h-3.5 text-cyan-400" />
          <span>Balanced</span>
        </button>

        <button
          type="button"
          onClick={() => onChange(0.85)}
          className={cn(
            "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all",
            currentMode === "comfort"
              ? "bg-slate-800 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <Sofa className="w-3.5 h-3.5 text-emerald-400" />
          <span>Relaxed</span>
        </button>
      </div>

      {/* Fine-grain Slider */}
      <div className="pt-1">
        <input
          type="range"
          min="0"
          max="100"
          value={value * 100}
          onChange={(e) => onChange(parseInt(e.target.value) / 100)}
          className="ios-slider cursor-pointer"
        />
        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5 px-1 font-medium">
          <span>Stairs Alignment</span>
          <span>Open Seating</span>
        </div>
      </div>
    </div>
  );
}
