"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
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
  MapPin,
  Bot,
  ExternalLink,
} from "lucide-react";

export default function LandingPage() {
  const { lang, setLang, t } = useTranslation();

  return (
    <div className="min-h-dvh flex flex-col bg-[#090a0f] text-slate-100 selection:bg-emerald-500/30">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 human-glass-header">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 flex items-center justify-center font-bold text-slate-950 text-base shadow-md shadow-emerald-500/20">
              ゆ
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-white block">
                {t.brandName}
              </span>
              <span className="text-[10px] text-slate-400 block -mt-0.5">
                {t.brandSubtitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <button
              type="button"
              onClick={() => setLang(lang === "en" ? "ja" : "en")}
              className="flex items-center gap-1.5 text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 px-3 py-1.5 rounded-full border border-slate-700/60 transition-colors"
            >
              <Languages className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === "en" ? "日本語" : "English"}</span>
            </button>

            {/* Launch CTA */}
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

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-20 pb-16 px-4 md:px-6">
        {/* Glow ambient background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 md:w-[600px] h-96 md:h-[600px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-72 h-72 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 text-slate-300 px-3.5 py-1.5 rounded-full text-xs font-medium shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{t.heroBadge}</span>
          </motion.div>

          {/* Main Headline */}
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

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3"
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
              href="#hubs"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-sm font-semibold px-6 py-4 rounded-2xl border border-slate-700/60 transition-colors"
            >
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>{t.heroCtaSecondary}</span>
            </a>
          </motion.div>

          {/* Social Proof / Live Counter Pill */}
          <div className="flex items-center justify-center gap-6 pt-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{t.liveTelemetryBadge}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>Sub-200ms Groq Inference</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Mockup / Product Preview Card */}
      <section className="px-4 md:px-6 pb-20">
        <div className="max-w-xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="human-card-glow rounded-3xl p-6 md:p-8 relative shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#E60012]" />
                <span className="text-xs font-bold text-slate-300">
                  {t.previewStation}
                </span>
              </div>
              <span className="text-[11px] bg-emerald-500/20 text-emerald-300 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                {t.recommendedTitle}
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-4xl font-extrabold text-white tracking-tight">
                {t.previewCar}
              </div>
              <p className="text-sm font-medium text-emerald-400 flex items-center gap-1.5">
                <Compass className="w-4 h-4" />
                <span>{t.previewEgress}</span>
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-[#181d2a] rounded-2xl p-3.5 border border-slate-800">
                <div className="text-[11px] text-slate-400 flex items-center gap-1 mb-1">
                  <Users className="w-3 h-3 text-slate-400" />
                  <span>{t.passengerSpace}</span>
                </div>
                <div className="text-sm font-bold text-white">{t.previewSpace}</div>
              </div>

              <div className="bg-[#181d2a] rounded-2xl p-3.5 border border-slate-800">
                <div className="text-[11px] text-slate-400 flex items-center gap-1 mb-1">
                  <Footprints className="w-3 h-3 text-slate-400" />
                  <span>{t.transferEgress}</span>
                </div>
                <div className="text-sm font-bold text-white">{t.previewWalk}</div>
              </div>
            </div>

            {/* Mini CTA inside card */}
            <div className="pt-2">
              <Link
                href="/app"
                className="w-full inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-3 rounded-xl transition-all"
              >
                <span>{lang === "ja" ? "今すぐこの駅で試す" : "Try live on your commute"}</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Tokyo Commuter Dilemma (Problem vs Solution) */}
      <section className="py-16 px-4 md:px-6 bg-[#0c0e15] border-y border-slate-800/80">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
              {t.dilemmaTitle}
            </h2>
            <p className="text-sm md:text-base text-slate-400">
              {t.dilemmaSubtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {/* Speed Trap */}
            <div className="human-card rounded-3xl p-6 space-y-3 border-red-500/20">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">{t.speedTrapTitle}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.speedTrapDesc}
              </p>
            </div>

            {/* Walking Penalty */}
            <div className="human-card rounded-3xl p-6 space-y-3 border-amber-500/20">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Footprints className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                {t.walkingPenaltyTitle}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.walkingPenaltyDesc}
              </p>
            </div>

            {/* Yutori Solution */}
            <div className="human-card-glow rounded-3xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                {t.yutoriSolutionTitle}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {t.yutoriSolutionDesc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Engineering Pillars */}
      <section className="py-20 px-4 md:px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Under The Hood
            </span>
            <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
              {lang === "ja" ? "技術的アプローチと仕組み" : "Built on Rigorous Transit Engineering"}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="human-card rounded-3xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">{t.pillar1Title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.pillar1Desc}
              </p>
            </div>

            <div className="human-card rounded-3xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Train className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">{t.pillar2Title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.pillar2Desc}
              </p>
            </div>

            <div className="human-card rounded-3xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">{t.pillar3Title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.pillar3Desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pre-Mapped Major Hubs */}
      <section id="hubs" className="py-16 px-4 md:px-6 bg-[#0c0e15] border-t border-slate-800/80">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">
              {t.hubsTitle}
            </h2>
            <p className="text-xs md:text-sm text-slate-400">
              {t.hubsSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { name: "Otemachi", nameJa: "大手町", lines: "Marunouchi, Tozai, Chiyoda, Hanzomon", color: "#E60012" },
              { name: "Tokyo", nameJa: "東京", lines: "Marunouchi & JR Shinkansen", color: "#E60012" },
              { name: "Shibuya", nameJa: "渋谷", lines: "Ginza, Hanzomon, Fukutoshin, JR", color: "#F39700" },
              { name: "Shinjuku", nameJa: "新宿", lines: "Marunouchi, Toei Shinjuku & Oedo", color: "#E60012" },
              { name: "Ginza", nameJa: "銀座", lines: "Ginza, Marunouchi, Hibiya", color: "#F39700" },
            ].map((hub) => (
              <Link
                key={hub.name}
                href="/app"
                className="human-card rounded-2xl p-4 text-left hover:border-slate-600 transition-all group block"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full mb-2"
                  style={{ backgroundColor: hub.color }}
                />
                <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                  {lang === "ja" ? hub.nameJa : hub.name}
                </h4>
                <p className="text-[10px] text-slate-500 font-medium">
                  {lang === "ja" ? hub.name : hub.nameJa}
                </p>
                <span className="text-[10px] text-slate-400 mt-2 block leading-tight truncate">
                  {hub.lines}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="py-20 px-4 md:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/20 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative z-10 space-y-6">
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

      {/* Footer */}
      <footer className="py-8 px-4 md:px-6 border-t border-slate-800/80 bg-[#07080c] text-slate-500 text-xs text-center space-y-2">
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
