"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Bot,
  Send,
  Languages,
  Loader2,
  Lightbulb,
} from "lucide-react";
import type { CommuterContext } from "@/lib/ai-advisor";

interface AIAdvisorPanelProps {
  context: CommuterContext | null;
}

interface RationaleData {
  headline: string;
  rationale: string;
  rationaleJa: string;
  tacticalTip: string;
}

const QUICK_QUESTIONS = [
  "Is there an elevator nearby for heavy luggage?",
  "Which end of the train is quietest?",
  "Are seats usually open at this time?",
];

export function AIAdvisorPanel({ context }: AIAdvisorPanelProps) {
  const [rationale, setRationale] = useState<RationaleData | null>(null);
  const [loadingRationale, setLoadingRationale] = useState(false);
  const [language, setLanguage] = useState<"en" | "ja">("en");

  // Interactive chat state
  const [customQuestion, setCustomQuestion] = useState("");
  const [chatAnswer, setChatAnswer] = useState<string | null>(null);
  const [askingQuestion, setAskingQuestion] = useState(false);

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
        console.error("AI Rationale error:", err);
        if (isMounted) setLoadingRationale(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    context?.stationName,
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
      console.error("AI query error:", err);
      setChatAnswer("Could not reach advisor right now. Please try again.");
    } finally {
      setAskingQuestion(false);
    }
  };

  if (!context) return null;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs p-4 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-violet-50 border border-violet-200/60 flex items-center justify-center text-violet-600 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800">Tokyo Transit Assistant</h3>
            <p className="text-[10px] text-slate-500">Fast AI advice for this station & line</p>
          </div>
        </div>

        {/* Language switch */}
        <button
          type="button"
          onClick={() => setLanguage(language === "en" ? "ja" : "en")}
          className="flex items-center gap-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 text-slate-700 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
        >
          <Languages className="w-3 h-3 text-violet-600" />
          <span>{language === "en" ? "日本語" : "English"}</span>
        </button>
      </div>

      {/* Rationale Bubble */}
      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/70 space-y-2">
        {loadingRationale ? (
          <div className="flex items-center justify-center py-3 gap-2 text-xs text-slate-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-600" />
            <span>Finding best boarding advice...</span>
          </div>
        ) : rationale ? (
          <>
            <h4 className="text-xs font-bold text-slate-900">
              {rationale.headline}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {language === "en" ? rationale.rationale : rationale.rationaleJa}
            </p>
            {rationale.tacticalTip && (
              <div className="flex items-start gap-2 bg-amber-50/80 border border-amber-200/60 rounded-xl p-2.5 mt-2">
                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-900 leading-snug">
                  <strong className="font-semibold text-amber-800">Pro Tip: </strong>
                  {rationale.tacticalTip}
                </p>
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Ask Concierge */}
      <div className="space-y-2 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
          <Bot className="w-3.5 h-3.5 text-violet-600" />
          <span>Tap a quick question:</span>
        </div>

        {/* Quick prompt pills */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {QUICK_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAskQuestion(q)}
              className="text-[11px] whitespace-nowrap bg-slate-100 hover:bg-slate-200/80 text-slate-700 px-3 py-1.5 rounded-full transition-colors flex-shrink-0 cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskQuestion(customQuestion);
          }}
          className="flex gap-2 pt-1"
        >
          <input
            type="text"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder="Ask about this train, doors, or transfers..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white"
          />
          <button
            type="submit"
            disabled={askingQuestion || !customQuestion.trim()}
            className="bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-xs"
          >
            {askingQuestion ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </form>

        {/* Q&A Output */}
        <AnimatePresence>
          {chatAnswer && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-violet-50/80 border border-violet-200/60 rounded-xl p-3 text-xs text-slate-800 space-y-1"
            >
              <div className="flex items-center gap-1.5 text-violet-700 font-bold text-[11px]">
                <Sparkles className="w-3 h-3" />
                <span>Assistant Response</span>
              </div>
              <p className="leading-relaxed text-slate-700">{chatAnswer}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
