"use client";

import type { Line } from "@/data/network";
import { directionBetween } from "@/data/network";
import { tr, type Lang } from "./i18n";
import type { LiveState } from "./useLive";

interface Props {
  state: LiveState;
  lang: Lang;
  line: Line;
  from: string;
  to: string;
}

/**
 * Everything here comes straight from ODPT. When a block is missing it says
 * so; it never shows placeholder trains or times.
 */
export function LivePanel({ state, lang, line, from, to }: Props) {
  const dir = directionBetween(line, from, to);
  const fromName = line.stations.find((s) => s.code === from)?.name[lang];

  return (
    <section className="card p-4" aria-live="polite">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wider text-[var(--muted)]">
          <span className={`size-2 rounded-full ${state.status === "ok" && hasAny(state.data) ? "live-dot bg-emerald-500" : "bg-[var(--line)]"}`} />
          {tr("live", lang)}
        </h2>
        {dir && <span className="text-[12px] text-[var(--muted)]">{fromName} · {tr("bound", lang, { x: dir.terminus[lang] })}</span>}
      </div>

      {state.status === "loading" && <p className="mt-3 text-[14px] text-[var(--muted)]">{tr("loading", lang)}</p>}
      {(state.status === "error" || (state.status === "ok" && !hasAny(state.data))) && (
        <p className="mt-3 text-[13px] leading-relaxed text-[var(--muted)]">{tr("liveUnavailable", lang)}</p>
      )}

      {state.status === "ok" && hasAny(state.data) && (
        <div className="mt-3 space-y-4">
          {state.data.service && (
            <div className={`rounded-xl px-3 py-2.5 text-[13px] leading-relaxed ${state.data.service.disrupted ? "bg-red-500/10 text-red-700 dark:text-red-300" : "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"}`}>
              <div className="font-semibold">{state.data.service.disrupted ? tr("disrupted", lang) : tr("normalService", lang)}</div>
              {state.data.service.disrupted && state.data.service.text && <div className="mt-0.5">{state.data.service.text[lang]}</div>}
            </div>
          )}

          {state.data.departures && state.data.departures.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-[12px] font-semibold">{tr("nextDepartures", lang)}</h3>
              <ul className="divide-y divide-[var(--line)]">
                {state.data.departures.map((d) => (
                  <li key={d.time} className="flex items-baseline justify-between py-1.5 text-[14px]">
                    <span className="font-semibold tabular-nums">{d.time}</span>
                    <span className="mx-3 flex-1 truncate text-[var(--muted)]">{d.destination?.[lang] ?? ""}</span>
                    <span className="tabular-nums">{d.minutesFromNow === 0 ? tr("now", lang) : tr("inMin", lang, { n: d.minutesFromNow })}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!state.data.positionsPublished && (
            <p className="text-[12px] leading-relaxed text-[var(--muted)]">{tr("noPositions", lang)}</p>
          )}

          {state.data.approaching && state.data.approaching.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-[12px] font-semibold">{tr("approaching", lang)}</h3>
              <ul className="space-y-1.5">
                {state.data.approaching.map((t) => (
                  <li key={t.trainNumber} className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="min-w-0">
                      <span className="font-medium">
                        {t.stationsAway === 0 ? tr("atPlatform", lang) : tr("stationsAway", lang, { n: Math.ceil(t.stationsAway) })}
                      </span>
                      <span className="block truncate text-[12px] text-[var(--muted)]">{t.position[lang]}{t.destination ? ` · ${tr("bound", lang, { x: t.destination[lang] })}` : ""}</span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[12px] font-medium tabular-nums ${t.delayS >= 60 ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" : "bg-[var(--surface-2)] text-[var(--muted)]"}`}>
                      {t.delayS >= 60 ? tr("late", lang, { n: Math.round(t.delayS / 60) }) : tr("onTime", lang)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function hasAny(d: { service: unknown; departures: unknown[] | null; approaching: unknown[] | null }): boolean {
  return Boolean(d.service || d.departures?.length || d.approaching?.length);
}
