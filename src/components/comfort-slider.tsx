"use client";

import { cn } from "@/lib/utils";
import { SlidersHorizontal, Sofa, Zap } from "lucide-react";

interface ComfortSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function ComfortSlider({ value, onChange }: ComfortSliderProps) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-zinc-400" />
          <span className="text-sm font-medium text-zinc-300">Priority</span>
        </div>
        <span className="text-xs text-zinc-500">
          {value < 0.3
            ? "Speed focused"
            : value > 0.7
            ? "Comfort focused"
            : "Balanced"}
        </span>
      </div>

      <div className="relative">
        <input
          type="range"
          min="0"
          max="100"
          value={value * 100}
          onChange={(e) => onChange(parseInt(e.target.value) / 100)}
          className="w-full cursor-pointer"
        />
      </div>

      <div className="flex items-center justify-between mt-2 text-[10px] text-zinc-500">
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3" />
          <span>Faster transfer</span>
        </div>
        <div className="flex items-center gap-1">
          <Sofa className="w-3 h-3" />
          <span>More comfort</span>
        </div>
      </div>
    </div>
  );
}
