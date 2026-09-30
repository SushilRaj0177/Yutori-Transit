"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import { TOKYO_LANDMARK_HUBS } from "@/lib/tourist-data";
import {
  Sparkles,
  ArrowRight,
  Compass,
  Footprints,
  Users,
  Languages,
  CheckCircle2,
  Eye,
  MapPin,
} from "lucide-react";

export default function LandingPage() {
  const { lang, setLang, t } = useTranslation();

  return (
    <div className="min-h-dvh flex flex-col bg-[#fafaf8] text-slate-800 selection:bg-emerald-500/20">
      {/* 1. Clean Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[#fafaf8]/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-600 flex items-center justify-center font-black text-white text-base shadow-sm">
              ゆ
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-slate-900 block leading-tight">
                {t.brandName}
              </span>
              <span className="text-[11px] text-slate-500 block font-medium">
                {t.brandSubtitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Language Switch */}
            <button
              type="button"
              onClick={() => setLang(lang === "en" ? "ja" : "en")}
              className="flex items-center gap-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200 shadow-xs transition-colors cursor-pointer"
            >
              <Languages className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === "en" ? "日本語" : "English"}</span>
            </button>

            {/* Launch App Button */}
            <Link
              href="/app"
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-full shadow-sm transition-all hover:shadow-md cursor-pointer"
            >
              <span>{t.navLaunchApp}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-12 sm:pt-16 pb-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 text-emerald-800 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{t.heroBadge}</span>
          </div>

          {/* Large Title */}
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight sm:leading-tight">
            {t.heroTitle}
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t.heroSubtitle}
          </p>

          {/* Main Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <Link
              href="/app"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold px-7 py-3.5 rounded-2xl shadow-sm transition-all hover:shadow-md cursor-pointer"
            >
              <Sparkles className="w-5 h-5" />
              <span>{t.heroCtaPrimary}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <a
              href="#destinations"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold px-6 py-3.5 rounded-2xl border border-slate-200 shadow-xs transition-colors cursor-pointer"
            >
              <Compass className="w-4 h-4 text-emerald-600" />
              <span>{t.heroCtaSecondary}</span>
            </a>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-3 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{t.liveTelemetryBadge}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-600" />
              <span>{lang === "ja" ? "ホーム足元の番号と完全連動" : "Floor Marking Sync"}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-600" />
              <span>{lang === "ja" ? "登録不要・完全無料" : "No Login Required"}</span>
            </span>
          </div>
        </div>
      </section>

      {/* 3. The Interactive Boarding Pass Preview */}
      <section className="px-4 sm:px-6 pb-16">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
            {/* Card Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#F39700]" />
                <span className="text-xs font-bold text-slate-700 font-mono">
                  [G01] {t.previewStation}
                </span>
              </div>
              <span className="text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                {t.recommendedTitle}
              </span>
            </div>

            {/* Car & Door Big Display */}
            <div className="space-y-1">
              <div className="text-4xl font-black text-slate-900 tracking-tight font-mono">
                {t.previewCar}
              </div>
              <p className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5">
                <Compass className="w-4 h-4 shrink-0" />
                <span>{t.previewEgress}</span>
              </p>
            </div>

            {/* Platform Floor Marker Graphic */}
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-600 font-bold">
                <span className="flex items-center gap-1 text-amber-600">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{t.floorGuideTitle}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Train Side 🚃</span>
              </div>
              <div className="w-full h-1.5 rounded-full tactile-strip" />
              <div className="flex items-center justify-center py-1">
                <div className="bg-white border-2 border-emerald-500 rounded-xl px-5 py-2 flex items-center gap-4 font-mono shadow-xs">
                  <div className="text-center">
                    <span className="text-[9px] text-slate-400 block font-bold">CAR</span>
                    <span className="text-xl font-black text-slate-900">1</span>
                  </div>
                  <div className="w-[1px] h-6 bg-slate-200" />
                  <div className="text-center">
                    <span className="text-[9px] text-slate-400 block font-bold">DOOR</span>
                    <span className="text-xl font-black text-slate-900 flex items-center gap-0.5">
                      <span className="text-xs text-amber-500">▲</span>1
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/70">
                <div className="text-[11px] text-slate-500 flex items-center gap-1 mb-0.5">
                  <Users className="w-3 h-3 text-slate-400" />
                  <span>{t.passengerSpace}</span>
                </div>
                <div className="text-sm font-bold text-emerald-700">{t.previewSpace}</div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/70">
                <div className="text-[11px] text-slate-500 flex items-center gap-1 mb-0.5">
                  <Footprints className="w-3 h-3 text-slate-400" />
                  <span>{t.transferEgress}</span>
                </div>
                <div className="text-sm font-bold text-slate-800">{t.previewWalk}</div>
              </div>
            </div>

            <div className="pt-1">
              <Link
                href="/app"
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <span>{lang === "ja" ? "今すぐ自分の駅で試す" : "Find door for your train now"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Real-World Commuting Explained */}
      <section className="py-16 px-4 sm:px-6 bg-white border-y border-slate-200/80">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {t.dilemmaTitle}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t.dilemmaSubtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-2xl p-5 bg-rose-50/50 border border-rose-200/60 space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center text-lg">
                ⚡
              </div>
              <h3 className="text-sm font-bold text-slate-900">{t.speedTrapTitle}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t.speedTrapDesc}
              </p>
            </div>

            <div className="rounded-2xl p-5 bg-amber-50/50 border border-amber-200/60 space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-lg">
                🚶
              </div>
              <h3 className="text-sm font-bold text-slate-900">{t.walkingPenaltyTitle}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t.walkingPenaltyDesc}
              </p>
            </div>

            <div className="rounded-2xl p-5 bg-emerald-50/50 border border-emerald-200/70 space-y-2.5 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg">
                ✨
              </div>
              <h3 className="text-sm font-bold text-slate-900">{t.yutoriSolutionTitle}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t.yutoriSolutionDesc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Popular Sightseeing Destinations (12 Hubs) */}
      <section id="destinations" className="py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-1.5">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              {lang === "ja" ? "人気エリア12選" : "Tokyo Destinations"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {t.hubsTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              {t.hubsSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {TOKYO_LANDMARK_HUBS.map((hub) => (
              <Link
                key={hub.id}
                href={`/app?hub=${hub.id}`}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-emerald-400 hover:shadow-sm transition-all group block text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{hub.icon}</span>
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: hub.lineColor }}
                    title={hub.lineName}
                  />
                </div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {lang === "ja" ? hub.nameJa : hub.name}
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  {lang === "ja" ? hub.landmarkJa : hub.landmark}
                </p>
                <p className="text-[10px] text-slate-400 mt-2 line-clamp-1">
                  {lang === "ja" ? hub.taglineJa : hub.tagline}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Call To Action Footer Banner */}
      <section className="py-16 px-4 sm:px-6 bg-slate-900 text-white text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            {t.ctaBannerTitle}
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto leading-relaxed">
            {t.ctaBannerSubtitle}
          </p>
          <div className="pt-2">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm sm:text-base font-extrabold px-7 py-3.5 rounded-2xl shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t.ctaBannerButton}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="py-8 px-4 sm:px-6 bg-slate-950 text-slate-500 text-xs text-center space-y-2">
        <div className="flex items-center justify-center gap-2 font-bold text-slate-400">
          <span>Yutori</span>
          <span>·</span>
          <span>ゆとり車両</span>
        </div>
        <p className="text-[11px] text-slate-500">{t.footerSubtitle}</p>
        <p className="text-[10px] text-slate-600 max-w-md mx-auto">{t.footerResearch}</p>
      </footer>
    </div>
  );
}
