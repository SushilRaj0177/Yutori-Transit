"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { TOKYO_TRANSIT_TIPS } from "@/lib/tourist-data";

interface TokyoCheatSheetProps {
  lang?: "en" | "ja";
}

export function TokyoCheatSheet({ lang = "en" }: TokyoCheatSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3.5 text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center text-sm shadow-xs">
            💡
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block">
              {lang === "ja" ? "東京地下鉄 101：初心者のための基本ルール" : "Tokyo Subway 101: Survival Guide"}
            </span>
            <span className="text-[11px] text-slate-500 block">
              {lang === "ja"
                ? "床面の三角マーク、弱冷房車、乗車マナーのミニ知識"
                : "Floor triangles, mild A/C cars & silent mode etiquette"}
            </span>
          </div>
        </div>

        <span className="text-xs text-slate-500 flex items-center gap-1 font-medium bg-slate-100 px-2.5 py-1 rounded-full">
          <span className="text-[11px]">{open ? (lang === "ja" ? "閉じる" : "Hide") : (lang === "ja" ? "読む" : "Read Tips")}</span>
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-100 p-4 space-y-2.5 bg-slate-50/50"
          >
            {TOKYO_TRANSIT_TIPS.map((tip, idx) => (
              <div key={idx} className="rounded-xl p-3 bg-white border border-slate-200/80 shadow-xs space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <span className="text-base">{tip.icon}</span>
                  <span>{lang === "ja" ? tip.qJa : tip.q}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed pl-6">
                  {lang === "ja" ? tip.aJa : tip.a}
                </p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
