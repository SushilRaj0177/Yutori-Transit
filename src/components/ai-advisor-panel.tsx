"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Bot,
  Send,
  Zap,
  Luggage,
  ShieldCheck,
  Languages,
  ChevronRight,
  HelpCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import type { CommuterContext } from "@/lib/ai-advisor";

interface AIAdvisorPanelProps {
  context: CommuterContext | null;
  onSetPriority: (mode: "speed" | "comfort" | "balanced") => void;
}

interface RationaleData {
  headline: string;
  rationale: string;
  rationaleJa: string;
  tacticalTip: string;
}

const QUICK_QUESTIONS = [
  "Why is this car better than the end cars?",
  "Where is the nearest elevator for luggage?",
  "Is this car likely to have open seats?",
];

export function AIAdvisorPanel({ context, onSetPriority }: AIAdvisorPanelProps) {
  const [rationale, setRationale] = useState<RationaleData | null>(null);
  const [loadingRationale, setLoadingRationale] = useState(false);
  const [language, setLanguage] = useState<"en" | "ja">("en");

  // Interactive chat state
  const [customQuestion, setCustomQuestion] = useState("");
  const [chatAnswer, setChatAnswer] = useState<string | null>(null);
  const [askingQuestion, setAskingQuestion] = useState(false);

  // Fetch rationale when context changes
  useEffect(() => {
    if (!context || !context.recommendedCar) return;

    let isMounted = true;
    setLoadingRationale(true);

    fetch("/api/ai/advisor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "rationale",
        context,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setRationale(data);
          setLoadingRationale(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch AI rationale:", err);
        if (isMounted) setLoadingRationale(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    context?.stationName,
    context?.railwayName,
    context?.recommendedCar,
    context?.recommendedDoor,
    context?.userPriority,
    context?.transferTarget?.name,
  ]);

  const handleAskQuestion = async (q: string) => {
    if (!context || !q.trim()) return;
    setAskingQuestion(true);
    setChatAnswer(null);

    try {
      const res = await fetch("/api/ai/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "query",
          context,
          question: q,
        }),
      });
      const data = await res.json();
      if (data.answer) {
        setChatAnswer(data.answer);
      }
    } catch (err) {
      console.error("Failed to query AI copilot:", err);
      setChatAnswer("Temporary connection delay. Please try again.");
    } finally {
      setAskingQuestion(false);
    }
  };

  if (!context) return null;

  return (
    <div className="glass-strong rounded-2xl p-4 md:p-5 space-y-4 border border-violet-500/20 shadow-xl shadow-violet-950/10 relative overflow-hidden">
      {/* Background ambient gradient */}
      <div className="absolute -right-16 -top-16 w-40 h-40 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-40 h-40 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-400 flex items-center justify-center shadow-md shadow-violet-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-violet-300 uppercase tracking-wider">
                Yutori AI Copilot
              </span>
              <span className="text-[10px] bg-violet-500/20 text-violet-300 px-1.5 py-0.2 rounded border border-violet-500/30">
                Groq 200ms
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Pareto-grounded explainable transit intelligence
            </p>
          </div>
        </div>

        {/* Language switcher */}
        <button
          onClick={() => setLanguage(language === "en" ? "ja" : "en")}
          className="flex items-center gap-1 text-[11px] font-medium bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 px-2 py-1 rounded-lg border border-zinc-800 transition-colors"
          title="Toggle language"
        >
          <Languages className="w-3 h-3 text-violet-400" />
          <span>{language === "en" ? "日本語" : "EN"}</span>
        </button>
      </div>

      {/* Rationale Card */}
      <div className="bg-zinc-900/70 rounded-xl p-3.5 border border-zinc-800/80 space-y-2.5">
        {loadingRationale ? (
          <div className="flex items-center justify-center py-4 gap-2 text-xs text-zinc-400">
            <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
            <span>Analyzing spatial trade-offs...</span>
          </div>
        ) : rationale ? (
          <>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                <span className="text-emerald-400">●</span>
                {rationale.headline}
              </h3>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              {language === "en" ? rationale.rationale : rationale.rationaleJa}
            </p>

            {rationale.tacticalTip && (
              <div className="flex items-start gap-2 bg-violet-500/10 border border-violet-500/20 rounded-lg p-2.5 mt-2">
                <Zap className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-violet-200">
                  <span className="font-semibold text-violet-300">Tactical Tip: </span>
                  {rationale.tacticalTip}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-xs text-zinc-500 py-2">
            Select a station to generate AI boarding analysis.
          </div>
        )}
      </div>

      {/* Persona Presets */}
      <div>
        <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
          Smart Scenario Presets
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onSetPriority("speed")}
            className={cn(
              "flex flex-col items-center p-2 rounded-xl border text-center transition-all",
              context.userPriority === "speed"
                ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300"
                : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 text-zinc-400"
            )}
          >
            <Zap className="w-4 h-4 mb-1 text-cyan-400" />
            <span className="text-xs font-medium">Sprint Mode</span>
            <span className="text-[9px] text-zinc-500">Zero walk time</span>
          </button>

          <button
            onClick={() => onSetPriority("balanced")}
            className={cn(
              "flex flex-col items-center p-2 rounded-xl border text-center transition-all",
              context.userPriority === "balanced"
                ? "bg-violet-500/15 border-violet-500/40 text-violet-300"
                : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 text-zinc-400"
            )}
          >
            <ShieldCheck className="w-4 h-4 mb-1 text-violet-400" />
            <span className="text-xs font-medium">Optimal Mix</span>
            <span className="text-[9px] text-zinc-500">Pareto balance</span>
          </button>

          <button
            onClick={() => onSetPriority("comfort")}
            className={cn(
              "flex flex-col items-center p-2 rounded-xl border text-center transition-all",
              context.userPriority === "comfort"
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 text-zinc-400"
            )}
          >
            <Luggage className="w-4 h-4 mb-1 text-emerald-400" />
            <span className="text-xs font-medium">Yutori Zen</span>
            <span className="text-[9px] text-zinc-500">Max personal space</span>
          </button>
        </div>
      </div>

      {/* Interactive Commuter Copilot Q&A */}
      <div className="space-y-2 pt-1 border-t border-zinc-800/80">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5 text-violet-400" />
            <span>Ask Yutori Copilot</span>
          </div>
          <span className="text-[10px] text-zinc-500">Platform Context Aware</span>
        </div>

        {/* Quick prompt pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {QUICK_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleAskQuestion(q)}
              className="text-[11px] whitespace-nowrap bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 px-2.5 py-1 rounded-full transition-colors shrink-0"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Question input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskQuestion(customQuestion);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder="Ask about this train, doors, or transfers..."
            className="flex-1 bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50"
          />
          <button
            type="submit"
            disabled={askingQuestion || !customQuestion.trim()}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-center shrink-0"
          >
            {askingQuestion ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </form>

        {/* Answer display */}
        <AnimatePresence>
          {chatAnswer && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="bg-violet-950/20 border border-violet-500/20 rounded-xl p-3 text-xs text-zinc-200 space-y-1"
            >
              <div className="flex items-center gap-1.5 text-violet-400 font-semibold text-[11px]">
                <Sparkles className="w-3 h-3" />
                <span>Copilot Answer:</span>
              </div>
              <p className="leading-relaxed">{chatAnswer}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
