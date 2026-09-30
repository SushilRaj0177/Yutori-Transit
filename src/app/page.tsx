"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import { TOKYO_LANDMARK_HUBS, TRAVELER_SITUATIONS } from "@/lib/tourist-data";
import {
  Sparkles,
  ArrowRight,
  Train,
  Compass,
  Footprints,
  Users,
  ShieldCheck,
  Scale,
  Zap,
  Languages,
  CheckCircle2,
  Luggage,
  Eye,
  BookOpen,
} from "lucide-react";

export default function LandingPage() {
  const { lang, setLang, t } = useTranslation();

  return (
    <div className="min-h-dvh flex flex-col bg-[#090a0f] text-slate-100 selection:bg-emerald-500/30">
      {/* 1. Sleek Navigation */}
      <header className="sticky top-0 z-50 bg-[#090a0f]/90 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 flex items-center justify-center font-black text-slate-950 text-sm shadow-md shadow-emerald-500/20">
              ゆ
            </div>
            <div>
              <span className="text-sm font-extrabold tracking-tight text-white block">
                {t.brandName}
              </span>
              <span className="text-[10px] text-slate-400 block -mt-0.5 font-medium">
                {t.brandSubtitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Language Switch */}
            <button
              type="button"
              onClick={() => setLang(lang === "en" ? "ja" : "en")}
              className="flex items-center gap-1.5 text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 px-3 py-1.5 rounded-full border border-white/10 transition-colors"
            >
              <Languages className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === "en" ? "日本語" : "English"}</span>
            </button>

            {/* Launch App Button */}
            <Link
              href="/app"
              className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs md:text-sm font-bold px-4 py-2 rounded-full shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <span>{t.navLaunchApp}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section: Editorial & Human-First */}
      <section className="relative overflow-hidden pt-12 md:pt-20 pb-16 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/10 text-slate-300 px-3.5 py-1.5 rounded-full text-xs font-semibold"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{t.heroBadge}</span>
          </motion.div>

          {/* Large Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-6xl font-black text-white tracking-tight leading-tight md:leading-tight"
          >
            {t.heroTitle}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed"
          >
            {t.heroSubtitle}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
          >
            <Link
              href="/app"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-base font-extrabold px-8 py-4 rounded-2xl shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-5 h-5" />
              <span>{t.heroCtaPrimary}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <a
              href="#landmarks"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#12141c] hover:bg-[#181b26] text-slate-200 text-sm font-semibold px-6 py-4 rounded-2xl border border-white/10 transition-colors"
            >
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>{t.heroCtaSecondary}</span>
            </a>
          </motion.div>

          {/* Trust points */}
          <div className="flex items-center justify-center gap-5 pt-3 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{t.liveTelemetryBadge}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>Physical Platform Floor Sync</span>
            </span>
          </div>
        </div>
      </section>

      {/* 3. The Physical Boarding Pass Preview (Visual Hook) */}
      <section className="px-4 md:px-6 pb-20">
        <div className="max-w-xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="zen-ticket rounded-3xl p-6 md:p-8 relative shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#E60012]" />
                <span className="text-xs font-bold text-slate-300 font-mono">
                  [M18] {t.previewStation}
                </span>
              </div>
              <span className="text-[11px] bg-emerald-500/15 text-emerald-300 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/25">
                {t.recommendedTitle}
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-4xl md:text-5xl font-black text-white tracking-tight font-mono">
                {t.previewCar}
              </div>
              <p className="text-sm font-medium text-emerald-400 flex items-center gap-1.5">
                <Compass className="w-4 h-4" />
                <span>{t.previewEgress}</span>
              </p>
            </div>

            {/* Graphic simulation of the floor sticker */}
            <div className="bg-[#0b0c10] rounded-2xl p-4 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Platform Floor Marking</span>
                </span>
                <span>Wait behind yellow line</span>
              </div>
              <div className="w-full h-1.5 rounded-full tactile-strip opacity-80" />
              <div className="flex items-center justify-center gap-3 py-1">
                <div className="bg-slate-950 border border-emerald-500/60 rounded-xl px-4 py-1.5 flex items-center gap-3 font-mono">
                  <div className="text-center">
                    <span className="text-[8px] text-slate-400 block font-bold">CAR</span>
                    <span className="text-xl font-black text-white">4</span>
                  </div>
                  <div className="w-[1px] h-6 bg-slate-800" />
                  <div className="text-center">
                    <span className="text-[8px] text-slate-400 block font-bold">DOOR</span>
                    <span className="text-xl font-black text-white flex items-center gap-0.5">
                      <span className="text-xs text-amber-400">▲</span>2
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-[#0b0c10] rounded-xl p-3 border border-white/[0.08]">
                <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-0.5">
                  <Users className="w-3 h-3 text-slate-400" />
                  <span>{t.passengerSpace}</span>
                </div>
                <div className="text-sm font-bold text-white">{t.previewSpace}</div>
              </div>

              <div className="bg-[#0b0c10] rounded-xl p-3 border border-white/[0.08]">
                <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-0.5">
                  <Footprints className="w-3 h-3 text-slate-400" />
                  <span>{t.transferEgress}</span>
                </div>
                <div className="text-sm font-bold text-white">{t.previewWalk}</div>
              </div>
            </div>

            <div className="pt-1">
              <Link
                href="/app"
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold py-3.5 rounded-xl transition-all shadow-md shadow-emerald-500/20"
              >
                <span>{lang === "ja" ? "今すぐ自分の駅で試す" : "Find door for your train now"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 4. The Real-World Dilemma Explained */}
      <section className="py-16 px-4 md:px-6 bg-[#0b0c12] border-y border-white/[0.08]">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
              {t.dilemmaTitle}
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              {t.dilemmaSubtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <div className="zen-paper rounded-3xl p-6 space-y-3 border-red-500/25">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center font-bold">
                ⚡
              </div>
              <h3 className="text-base font-bold text-white">{t.speedTrapTitle}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.speedTrapDesc}
              </p>
            </div>

            <div className="zen-paper rounded-3xl p-6 space-y-3 border-amber-500/25">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                🚶
              </div>
              <h3 className="text-base font-bold text-white">{t.walkingPenaltyTitle}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.walkingPenaltyDesc}
              </p>
            </div>

            <div className="zen-paper rounded-3xl p-6 space-y-3 border-emerald-500/40 shadow-lg shadow-emerald-950/20">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                ⚖️
              </div>
              <h3 className="text-base font-bold text-white">{t.yutoriSolutionTitle}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {t.yutoriSolutionDesc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Key Landmarks & Sightseeing Hubs */}
      <section id="landmarks" className="py-20 px-4 md:px-6">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              {lang === "ja" ? "主要エリア案内" : "Tokyo Sightseeing"}
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">
              {t.hubsTitle}
            </h2>
            <p className="text-xs md:text-sm text-slate-400">
              {t.hubsSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {TOKYO_LANDMARK_HUBS.map((hub) => (
              <Link
                key={hub.id}
                href="/app"
                className="zen-paper rounded-2xl p-4 text-left hover:border-white/20 transition-all group block relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{hub.icon}</span>
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: hub.lineColor }}
                  />
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                  {lang === "ja" ? hub.nameJa : hub.name}
                </h4>
                <p className="text-[11px] text-slate-400 font-medium">
                  {lang === "ja" ? hub.landmarkJa : hub.landmark}
                </p>
                <p className="text-[10px] text-slate-500 mt-2 line-clamp-2">
                  {lang === "ja" ? hub.taglineJa : hub.tagline}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Call To Action Footer Banner */}
      <section className="py-20 px-4 md:px-6 bg-[#0b0c12] border-t border-white/[0.08] relative overflow-hidden">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            {t.ctaBannerTitle}
          </h2>
          <p className="text-sm md:text-base text-slate-300 max-w-lg mx-auto leading-relaxed">
            {t.ctaBannerSubtitle}
          </p>
          <div className="pt-2">
            <Link
              href="/app"
              className="inline-flex items-center gap-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-base md:text-lg font-extrabold px-8 py-4 rounded-2xl shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-5 h-5" />
              <span>{t.ctaBannerButton}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="py-8 px-4 md:px-6 bg-[#07080c] text-slate-500 text-xs text-center space-y-2 border-t border-white/[0.06]">
        <div className="flex items-center justify-center gap-2 font-bold text-slate-300">
          <span>Yutori Car</span>
          <span>·</span>
          <span>ゆとり車両</span>
        </div>
        <p className="text-[11px] text-slate-500">{t.footerSubtitle}</p>
        <p className="text-[10px] text-slate-600 max-w-md mx-auto">{t.footerResearch}</p>
      </footer>
    </div>
  );
}
