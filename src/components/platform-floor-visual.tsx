"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Eye, ArrowUp, Footprints } from "lucide-react";

interface PlatformFloorVisualProps {
  carNumber: number;
  doorNumber: number;
  lineColor?: string;
  lang?: "en" | "ja";
}

export function PlatformFloorVisual({
  carNumber,
  doorNumber,
  lineColor = "#e60012",
  lang = "en",
}: PlatformFloorVisualProps) {
  return (
    <div className="rounded-2xl p-4 bg-[#141722] border border-white/10 relative overflow-hidden space-y-3">
      {/* Header explanation */}
      <div className="flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-1.5 font-bold">
          <Eye className="w-3.5 h-3.5 text-amber-400" />
          <span>
            {lang === "ja"
              ? "実際のホーム足元（床）の目印"
              : "What to look for on the platform floor"}
          </span>
        </div>
        <span className="text-[10px] text-amber-400/90 font-medium bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
          {lang === "ja" ? "床面ステッカー" : "Floor Marking"}
        </span>
      </div>

      {/* The Physical Platform Graphic Simulation */}
      <div className="bg-[#0b0c10] rounded-xl p-4 border border-slate-800 relative flex flex-col items-center justify-center space-y-2">
        {/* Train platform edge line */}
        <div className="w-full flex items-center justify-between border-b-2 border-dashed border-slate-700 pb-1 text-[9px] text-slate-500 uppercase tracking-widest font-mono">
          <span>Platform Edge / ホーム柵</span>
          <span>Train Side 🚃</span>
        </div>

        {/* Yellow tactile paving (点字ブロック) */}
        <div className="w-full h-2 rounded-full tactile-strip opacity-80" />

        {/* The Exact Japanese Floor Sticker */}
        <div className="flex items-center justify-center gap-3 py-2">
          {/* Queue Line Left */}
          <div className="flex flex-col items-center gap-0.5 text-slate-600">
            <ArrowUp className="w-3 h-3 text-slate-500 animate-bounce" />
            <span className="text-[8px] font-mono">Line 1</span>
          </div>

          {/* The Badge */}
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="flex items-center rounded-xl bg-slate-950 border-2 shadow-lg px-4 py-2 gap-3"
            style={{ borderColor: lineColor }}
          >
            {/* Car Box */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                {lang === "ja" ? "号車" : "Car"}
              </span>
              <span className="text-2xl font-black text-white font-mono leading-none">
                {carNumber}
              </span>
            </div>

            {/* Divider */}
            <div className="w-[1px] h-8 bg-slate-800" />

            {/* Door Box */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                {lang === "ja" ? "ドア" : "Door"}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-amber-400">▲</span>
                <span className="text-2xl font-black text-white font-mono leading-none">
                  {doorNumber}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Queue Line Right */}
          <div className="flex flex-col items-center gap-0.5 text-slate-600">
            <ArrowUp className="w-3 h-3 text-slate-500 animate-bounce" />
            <span className="text-[8px] font-mono">Line 2</span>
          </div>
        </div>

        {/* Helpful Tip Caption */}
        <div className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5 pt-1">
          <Footprints className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>
            {lang === "ja"
              ? `ホームドアの足元で「${carNumber}号車 ▲ ${doorNumber}」の印を探して並びます`
              : `Stand behind the floor marking reading "Car ${carNumber} ▲ ${doorNumber}"`}
          </span>
        </div>
      </div>
    </div>
  );
}
