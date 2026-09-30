"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ChevronDown, ChevronUp, Sparkles, HelpCircle } from "lucide-react";
import { TOKYO_TRANSIT_TIPS } from "@/lib/tourist-data";

interface TokyoCheatSheetProps {
  lang?: "en" | "ja";
}

export function TokyoCheatSheet({ lang = "en" }: TokyoCheatSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#12141c] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center text-xs">
            💡
          </div>
          <div>
            <span className="text-xs font-bold text-white block">
              {lang === "ja" ? "初心者向け：東京地下鉄の基本ルール" : "Tokyo Subway 101 for Beginners"}
            </span>
            <span className="text-[10px] text-slate-400 block">
              {lang === "ja"
                ? "足元のステッカー、弱冷房車、乗車マナーのミニ解説"
                : "Floor stickers, mild A/C cars & boarding etiquette"}
            </span>
          </div>
        </div>

        <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
          <span className="text-[11px]">{open ? (lang === "ja" ? "閉じる" : "Hide") : (lang === "ja" ? "見る" : "Guide")}</span>
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-800/80 p-4 space-y-3 bg-[#0d0f16]"
          >
            {TOKYO_TRANSIT_TIPS.map((tip, idx) => (
              <div key={idx} className="rounded-xl p-3 bg-slate-900/70 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <span>{tip.icon}</span>
                  <span>{lang === "ja" ? tip.qJa : tip.q}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed pl-5">
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
