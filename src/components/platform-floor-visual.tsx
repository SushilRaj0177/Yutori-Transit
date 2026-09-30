"use client";

import { motion } from "framer-motion";
import { Eye, ArrowUp, Footprints, Info } from "lucide-react";

interface PlatformFloorVisualProps {
  carNumber: number;
  doorNumber: number;
  lineColor?: string;
  lang?: "en" | "ja";
}

export function PlatformFloorVisual({
  carNumber,
  doorNumber,
  lineColor = "#00BB85",
  lang = "en",
}: PlatformFloorVisualProps) {
  return (
    <div className="rounded-2xl p-4 bg-slate-50 border border-slate-200/80 space-y-3">
      {/* Header explanation */}
      <div className="flex items-center justify-between text-xs text-slate-700">
        <div className="flex items-center gap-1.5 font-bold">
          <Eye className="w-4 h-4 text-amber-500" />
          <span>
            {lang === "ja"
              ? "ホーム床面（足元）の表示"
              : "What to look for on the platform floor"}
          </span>
        </div>
        <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
          {lang === "ja" ? "床ステッカー" : "Floor Marking"}
        </span>
      </div>

      {/* The Physical Platform Graphic Simulation */}
      <div className="bg-slate-100/90 rounded-xl p-4 border border-slate-200 relative flex flex-col items-center justify-center space-y-2.5">
        {/* Train platform edge line */}
        <div className="w-full flex items-center justify-between border-b-2 border-dashed border-slate-300 pb-1.5 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
          <span>Platform Gate / ホームドア</span>
          <span>Train Side 🚃</span>
        </div>

        {/* Yellow tactile paving (点字ブロック) */}
        <div className="w-full h-2 rounded-full tactile-strip shadow-inner" />

        {/* The Exact Japanese Floor Sticker */}
        <div className="flex items-center justify-center gap-4 py-1.5">
          {/* Queue Line Left */}
          <div className="flex flex-col items-center gap-0.5 text-slate-400">
            <ArrowUp className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[9px] font-bold">Line 1</span>
          </div>

          {/* The Badge (Clean Japanese Platform Sticker replica) */}
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="flex items-center rounded-xl bg-white border-2 shadow-sm px-4 py-2 gap-3.5"
            style={{ borderColor: lineColor }}
          >
            {/* Car Box */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                {lang === "ja" ? "号車" : "CAR"}
              </span>
              <span className="text-2xl font-black text-slate-900 font-mono leading-none">
                {carNumber}
              </span>
            </div>

            {/* Divider */}
            <div className="w-[1px] h-8 bg-slate-200" />

            {/* Door Box */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                {lang === "ja" ? "ドア" : "DOOR"}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-amber-500">▲</span>
                <span className="text-2xl font-black text-slate-900 font-mono leading-none">
                  {doorNumber}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Queue Line Right */}
          <div className="flex flex-col items-center gap-0.5 text-slate-400">
            <ArrowUp className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[9px] font-bold">Line 2</span>
          </div>
        </div>

        {/* Helpful Tip Caption */}
        <div className="text-[11px] text-slate-600 text-center flex items-center justify-center gap-1.5 pt-0.5">
          <Footprints className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>
            {lang === "ja"
              ? `足元に「${carNumber}号車 ▲ ${doorNumber}」と書かれた枠の前に並びます`
              : `Line up behind the floor tile marked "Car ${carNumber} ▲ ${doorNumber}"`}
          </span>
        </div>
      </div>
    </div>
  );
}
