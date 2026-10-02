"use client";

import { useEffect, useMemo, useState } from "react";
import { explain, factsOf } from "@/core/explain";
import { plan as makePlan, type DoorPlan, type Plan } from "@/core/plan";
import { jstClock, type JstClock } from "@/core/time";
import type { DayType } from "@/engine/crowding";
import type { Bilingual } from "@/engine/types";
import { destinationLabel, SURVEY } from "@/data/survey";
import { getLine, LINES } from "@/data/network";
import { loadColor, loadWord } from "./colors";
import { tr, type Lang } from "./i18n";
import { EgressIcon, SwapIcon } from "./icons";
import { LivePanel } from "./LivePanel";
import { ParetoChart } from "./ParetoChart";
import { ReportDoor } from "./ReportDoor";
import { StationSelect } from "./StationSelect";
import { TrainDiagram } from "./TrainDiagram";
import { useCommunity } from "./useCommunity";
import { useLive } from "./useLive";

interface Prefs {
  lang: Lang;
  line: "M" | "G";
  from: string;
  to: string;
  egress: Record<string, string>; // chosen egress per destination
  weight: number;
  /** Only routes with an elevator or a gate on the platform level. */
  stepFree: boolean;
}

const DEFAULTS: Prefs = { lang: "en", line: "M", from: "M08", to: "M18", egress: {}, weight: 0.5, stepFree: false };
const STORE = "yutori:prefs:v1";
const LINE_DEFAULTS = { M: { from: "M08", to: "M18" }, G: { from: "G01", to: "G16" } } as const;

function usePrefs(): [Prefs, (p: Partial<Prefs>) => void, boolean] {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) ?? "null");
      const lang: Lang = saved?.lang ?? (navigator.language.startsWith("ja") ? "ja" : "en");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage
      setPrefs({ ...DEFAULTS, ...saved, lang });
    } catch {
      /* private mode or corrupt value: keep defaults */
    }
    setReady(true);
  }, []);
  const update = (p: Partial<Prefs>) =>
    setPrefs((cur) => {
      const next = { ...cur, ...p };
      try {
        localStorage.setItem(STORE, JSON.stringify(next));
      } catch {}
      return next;
    });
  return [prefs, update, ready];
}

function useClock(): JstClock | null {
  const [clock, setClock] = useState<JstClock | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the clock only exists on the client
    setClock(jstClock());
    const id = setInterval(() => setClock(jstClock()), 30_000);
    return () => clearInterval(id);
  }, []);
  return clock;
}

type Override = { hour: number; dayType: DayType } | null;

export function Planner() {
  const [prefs, set, ready] = usePrefs();
  const clock = useClock();
  const [override, setOverride] = useState<Override>(null);
  const { lang } = prefs;
  const line = getLine(prefs.line)!;
  const covered = useMemo(() => new Set(SURVEY.stations.filter((s) => s.line === line.id && s.points.length > 0).map((s) => s.station)), [line.id]);
  const community = useCommunity(line.id);

  const routeOk = prefs.from !== prefs.to;
  const live = useLive(line.id, prefs.from, prefs.to, ready && routeOk);
  const liveData = live.status === "ok" ? live.data : null;
  const usingNow = override === null;

  const hour = override?.hour ?? clock?.hour ?? 8.5;
  const dayType = override?.dayType ?? clock?.dayType ?? "weekday";
  const delayS = usingNow ? liveData?.approaching?.[0]?.delayS : undefined;

  const result = useMemo(
    () =>
      makePlan({
        line: line.id,
        from: prefs.from,
        to: prefs.to,
        destId: prefs.egress[`${line.id}:${prefs.to}`],
        speedWeight: prefs.weight,
        hour,
        dayType,
        delayS,
        liveLoadsPct: usingNow ? liveData?.carLoadsPct : null,
        community: community.book,
        stepFree: prefs.stepFree,
      }),
    [line.id, prefs.from, prefs.to, prefs.egress, prefs.weight, prefs.stepFree, hour, dayType, delayS, usingNow, liveData?.carLoadsPct, community.book],
  );

  const switchLine = (id: "M" | "G") => set({ line: id, ...LINE_DEFAULTS[id] });
  const setEgress = (id: string) => set({ egress: { ...prefs.egress, [`${line.id}:${prefs.to}`]: id } });

  if (!ready || !clock) return <Skeleton />;

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 pb-16 pt-4 sm:px-6 sm:pt-8">
      <header className="mb-5 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-[22px] font-bold tracking-tight">ゆとり</span>
          <span className="text-[15px] font-medium text-[var(--muted)]">Yutori</span>
        </div>
        <div className="flex rounded-full bg-[var(--surface-2)] p-1 text-[13px] font-medium" role="group" aria-label="Language">
          {(["en", "ja"] as const).map((l) => (
            <button key={l} onClick={() => set({ lang: l })} aria-pressed={lang === l} className={`rounded-full px-3 py-1 transition-colors ${lang === l ? "bg-[var(--bg)] shadow-sm" : "text-[var(--muted)]"}`}>
              {l === "en" ? "EN" : "日本語"}
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <main className="flex min-w-0 flex-col gap-5">
          <section className="card p-3 sm:p-4" aria-label="Route">
            <div className="mb-3 flex gap-2" role="tablist">
              {LINES.map((l) => (
                <button
                  key={l.id}
                  role="tab"
                  aria-selected={l.id === line.id}
                  onClick={() => l.id !== line.id && switchLine(l.id)}
                  className={`flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 text-[14px] font-semibold transition-all ${l.id === line.id ? "bg-[var(--fg)] text-[var(--bg)]" : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--fg)]"}`}
                >
                  <span className="grid size-6 place-items-center rounded-full text-[12px] font-bold text-white" style={{ background: l.color }}>{l.id}</span>
                  {l.name[lang]}
                </button>
              ))}
            </div>
            <div className="relative flex flex-col gap-2">
              <StationSelect label={tr("from", lang)} line={line} value={prefs.from} onChange={(from) => set({ from })} lang={lang} />
              <StationSelect label={tr("to", lang)} line={line} value={prefs.to} onChange={(to) => set({ to })} lang={lang} marked={covered} markedSuffix={tr("noLayout", lang)} />
              <button
                onClick={() => set({ from: prefs.to, to: prefs.from })}
                aria-label={tr("swap", lang)}
                className="absolute right-12 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-[var(--line)] bg-[var(--bg)] text-[var(--muted)] shadow-sm transition hover:rotate-180 hover:text-[var(--fg)]"
              >
                <SwapIcon />
              </button>
            </div>
          </section>

          {result.ok ? (
            <>
              <DestinationChips p={result.plan} lang={lang} setDest={setEgress} stepFree={prefs.stepFree} setStepFree={(stepFree) => set({ stepFree })} />
              {result.plan.door ? (
                <Answer p={result.plan} d={result.plan.door} lang={lang} weight={prefs.weight} setWeight={(weight) => set({ weight })} setDest={setEgress} reportsEnabled={community.enabled} onReported={community.reload} />
              ) : (
                <NoStepFree p={result.plan} lang={lang} />
              )}
            </>
          ) : (
            <section className="card p-6 text-[15px] leading-relaxed text-[var(--muted)]">
              {result.error.kind === "no-data" ? tr("missingLayout", lang, { s: result.error.to.name[lang] }) : tr("sameStation", lang)}
            </section>
          )}
        </main>

        <aside className="flex min-w-0 flex-col gap-5">
          {routeOk && <LivePanel state={live} lang={lang} line={line} from={prefs.from} to={prefs.to} />}
          <TimeCard lang={lang} clock={clock} override={override} setOverride={setOverride} />
          {result.ok && result.plan.door && (
            <Why p={result.plan} d={result.plan.door} lang={lang} live={liveData?.fetchedAt ?? null} hour={hour} dayType={dayType} delayS={delayS} />
          )}
        </aside>
      </div>

      <footer className="mt-10 border-t border-[var(--line)] pt-5 text-[12px] leading-relaxed text-[var(--muted)]">
        <p>{tr("surveyCredit", lang)}</p>
        <p className="mt-1">{tr("odptCredit", lang)}</p>
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          <a className="underline underline-offset-2 hover:text-[var(--fg)]" href="https://github.com/SushilRaj0177/Yutori-Transit">Source &amp; method</a>
        </p>
      </footer>
    </div>
  );
}

// ── where you are going at the destination ────────────────────────────────

function DestinationChips({ p, lang, setDest, stepFree, setStepFree }: { p: Plan; lang: Lang; setDest: (id: string) => void; stepFree: boolean; setStepFree: (v: boolean) => void }) {
  return (
    <section aria-label={tr("headingFor", lang)}>
      <div className="mb-2 flex items-center justify-between gap-3 px-1">
        <h2 className="text-[12px] font-medium uppercase tracking-wider text-[var(--muted)]">
          {tr("headingFor", lang)} · {p.to.name[lang]}
        </h2>
        <button
          onClick={() => setStepFree(!stepFree)}
          aria-pressed={stepFree}
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold transition-colors ${stepFree ? "bg-[var(--fg)] text-[var(--bg)]" : "bg-[var(--surface-2)] text-[var(--muted)]"}`}
        >
          <EgressIcon kind="elevator" size={13} />
          {tr("stepFreeToggle", lang)}
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {p.destinations.map((d) => {
          const on = d.dest.id === p.target.dest.id;
          const label = destinationLabel(d.dest);
          const unusable = d.points.length === 0;
          return (
            <button
              key={d.dest.id}
              onClick={() => setDest(d.dest.id)}
              aria-pressed={on}
              className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 text-left transition-all ${on ? "border-transparent text-white shadow-md" : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--muted)]"} ${unusable && !on ? "opacity-50" : ""}`}
              style={on ? { background: p.line.color } : undefined}
            >
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold leading-snug">{label[lang]}</span>
                {d.dest.gate && (
                  <span className={`block truncate text-[12px] ${on ? "text-white/80" : "text-[var(--muted)]"}`}>
                    {d.dest.gateName}
                    {d.dest.platform !== null && ` · ${tr("platformArrival", lang, { n: d.dest.platform })}`}
                  </span>
                )}
              </span>
              {d.dest.hasStepFree && <EgressIcon kind="elevator" size={16} className={on ? "text-white/90" : "text-[var(--muted)]"} />}
            </button>
          );
        })}
      </div>
      {p.alternatingPlatforms && <p className="mt-2 px-1 text-[12px] text-[var(--muted)]">{tr("alternating", lang)}</p>}
      {p.omitted.length > 0 && (
        <p className="mt-2 px-1 text-[12px] leading-relaxed text-[var(--muted)]">
          {tr("omitted", lang, { g: [...new Set(p.omitted)].join(" / ") })}{" "}
          <a className="underline underline-offset-2" href={p.source.url} target="_blank" rel="noreferrer">
            {tr("viewSource", lang)}
          </a>
        </p>
      )}
    </section>
  );
}

// ── confirmed position: the door answer ─────────────────────────────────────

function Answer(props: { p: Plan; d: DoorPlan; lang: Lang; weight: number; setWeight: (w: number) => void; setDest: (id: string) => void; reportsEnabled: boolean; onReported: () => void }) {
  const { p, d, lang } = props;
  const b = d.solution.best;
  const live = p.loadSource === "odpt-live";
  const solid = d.stability.sameCar >= 0.7;
  const car1Front = p.direction === p.line.towardsFirst;
  const frontLabel = tr("bound", lang, { x: p.direction.terminus[lang] });
  const [reporting, setReporting] = useState(false);
  // Every known access point on this platform, so riders see the whole picture.
  const known = p.destinations.flatMap((x) => x.points);

  return (
    <section className="card overflow-hidden" aria-live="polite">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 p-5 pb-3 sm:p-6 sm:pb-3">
        <div>
          <div className="text-[13px] font-medium text-[var(--muted)]">{tr("board", lang)}</div>
          <div className="mt-0.5 flex items-baseline gap-3 font-bold tracking-tight">
            {lang === "en" ? (
              <>
                <span className="text-[44px] leading-none sm:text-[52px]"><span className="text-[0.55em] font-semibold text-[var(--muted)]">Car </span>{b.car}</span>
                <span className="text-[44px] leading-none sm:text-[52px]"><span className="text-[0.55em] font-semibold text-[var(--muted)]">Door </span>{b.door}</span>
              </>
            ) : (
              <span className="text-[44px] leading-none sm:text-[52px]">{b.car}<span className="text-[0.5em] font-semibold text-[var(--muted)]">号車</span> {b.door}<span className="text-[0.5em] font-semibold text-[var(--muted)]">番ドア</span></span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-[13px]">
          <Pill>
            <EgressIcon kind={b.via?.kind ?? "way"} size={14} />
            {b.walkM < 2 ? tr("rightThere", lang) : `${Math.round(b.egressS)}s · ${Math.round(b.walkM)}m`}
          </Pill>
          {live ? (
            <Pill style={{ background: loadColor(b.loadPct), color: "#1b1b1b" }}>{b.loadPct}% · {loadWord(b.loadPct, lang)}</Pill>
          ) : (
            <Pill>{tr(p.crowd[b.car - 1], lang)}</Pill>
          )}
          <Pill title={tr("stableHint", lang, { n: Math.round(d.stability.sameCar * 100) })}>
            <span className={`size-2 rounded-full ${solid ? "bg-emerald-500" : "bg-amber-500"}`} />
            {solid ? tr("solid", lang) : tr("close", lang)}
          </Pill>
        </div>
      </div>

      <div className="px-2 pb-2 sm:px-4">
        {reporting ? (
          <div className="px-3 pb-3">
            <ReportDoor line={p.line} station={p.to.code} target={p.target} lang={lang} enabled={props.reportsEnabled} onDone={props.onReported} onCancel={() => setReporting(false)} />
          </div>
        ) : (
          <TrainDiagram
            geometry={p.line.geometry}
            crowd={p.crowd}
            liveLoadsPct={live ? p.loadsPct : null}
            egress={known}
            targetId={b.via?.id}
            pick={b}
            car1Front={car1Front}
            lineColor={p.line.color}
            frontLabel={frontLabel}
            lang={lang}
            onPickEgress={(pointId) => props.setDest(pointId.split("#")[0])}
          />
        )}
      </div>

      <div className="border-t border-[var(--line)] p-5 sm:p-6">
        <WeightSlider p={p} d={d} lang={lang} weight={props.weight} setWeight={props.setWeight} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 bg-[var(--surface-2)] px-5 py-2.5 text-[12px] text-[var(--muted)] sm:px-6">
        <span className="space-x-3">
          <span>
            ✓ {tr("surveySrc", lang, { d: p.source.updated ?? "?" })}{" "}
            <a className="underline underline-offset-2" href={p.source.url} target="_blank" rel="noreferrer">
              {tr("viewSource", lang)}
            </a>
          </span>
          {p.target.ridersDisagree && <strong className="text-amber-700 dark:text-amber-300">⚠ {tr("ridersDisagree", lang)}</strong>}
          {!live && <span>◇ {tr("estimateNote", lang)}</span>}
        </span>
        {!reporting && (
          <button className="underline underline-offset-2" onClick={() => setReporting(true)}>
            {tr("wrongPos", lang)}
          </button>
        )}
      </div>
    </section>
  );
}

// ── no usable route (e.g. step-free requested but none listed) ──────────────

function NoStepFree({ p, lang }: { p: Plan; lang: Lang }) {
  const alternatives = p.destinations.filter((x) => x.points.length > 0);
  return (
    <section className="card p-5 sm:p-6">
      <div className="text-[13px] font-medium text-[var(--muted)]">{tr("board", lang)}</div>
      <div className="mt-1 text-[22px] font-bold leading-tight">{tr("noStepFreeTitle", lang)}</div>
      <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
        {tr("noStepFreeBody", lang, { x: destinationLabel(p.target.dest)[lang] })}
        {alternatives.length > 0 && ` ${tr("noStepFreeAlt", lang, { list: alternatives.map((a) => destinationLabel(a.dest)[lang]).join(" / ") })}`}
      </p>
      <a className="mt-3 inline-block text-[13px] underline underline-offset-2" href={p.source.url} target="_blank" rel="noreferrer">
        {tr("viewSource", lang)}
      </a>
    </section>
  );
}

function WeightSlider({ p, d, lang, weight, setWeight }: { p: Plan; d: DoorPlan; lang: Lang; weight: number; setWeight: (w: number) => void }) {
  const presets: [string, number][] = [[tr("roomiest", lang), 0], [tr("balanced", lang), 0.5], [tr("fastest", lang), 1]];
  return (
    <div>
      <div className="mb-3 flex justify-between text-[13px] font-medium">
        <span>{tr("space", lang)}</span>
        <span>{tr("speed", lang)}</span>
      </div>
      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 flex h-2 -translate-y-1/2 gap-[3px] overflow-hidden rounded-full">
          {d.breakpoints.map((s, i) => {
            const next = d.breakpoints[i + 1];
            const width = ((next ? next.from : 1.01) - s.from) * 100;
            const active = s.car === d.solution.best.car && s.door === d.solution.best.door;
            return <div key={i} style={{ width: `${width}%`, background: active ? p.line.color : "var(--surface-3)" }} className="h-full transition-colors" />;
          })}
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={weight}
          onChange={(e) => setWeight(Number(e.target.value))}
          aria-label={`${tr("space", lang)} – ${tr("speed", lang)}`}
          className="slider relative w-full"
        />
      </div>
      <p className="mt-1 text-center text-[12px] text-[var(--muted)]">
        {d.breakpoints.length === 1 ? tr("oneAnswer", lang) : tr("segments", lang, { n: d.breakpoints.length })}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {presets.map(([label, w]) => (
          <button key={label} onClick={() => setWeight(w)} className={`rounded-xl py-2 text-[13px] font-medium transition-colors ${Math.abs(weight - w) < 0.01 ? "bg-[var(--fg)] text-[var(--bg)]" : "bg-[var(--surface-2)] hover:bg-[var(--surface-3)]"}`}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── side cards ──────────────────────────────────────────────────────────────

function TimeCard({ lang, clock, override, setOverride }: { lang: Lang; clock: JstClock; override: Override; setOverride: (o: Override) => void }) {
  const hour = override?.hour ?? clock.hour;
  const day = override?.dayType ?? clock.dayType;
  const hh = String(Math.floor(hour)).padStart(2, "0");
  const mm = String(Math.floor((hour % 1) * 60)).padStart(2, "0");
  return (
    <section className="card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[12px] font-medium uppercase tracking-wider text-[var(--muted)]">{tr("planFor", lang)}</div>
        {override && (
          <button onClick={() => setOverride(null)} className="text-[12px] font-medium underline underline-offset-2">
            {tr("resetNow", lang)}
          </button>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          type="time"
          value={`${hh}:${mm}`}
          onChange={(e) => {
            const [h, m] = e.target.value.split(":").map(Number);
            if (Number.isFinite(h) && Number.isFinite(m)) setOverride({ hour: h + m / 60, dayType: day });
          }}
          className="rounded-xl bg-[var(--surface-2)] px-3 py-2 text-[17px] font-semibold tabular-nums"
          aria-label="Time in Japan"
        />
        <span className="whitespace-nowrap text-[12px] text-[var(--muted)]">JST{!override && ` · ${tr("nowJst", lang)}`}</span>
        <div className="ml-auto flex rounded-xl bg-[var(--surface-2)] p-1 text-[13px]">
          {(["weekday", "holiday"] as const).map((dt) => (
            <button key={dt} onClick={() => setOverride({ hour, dayType: dt })} aria-pressed={day === dt} className={`rounded-lg px-2.5 py-1 ${day === dt ? "bg-[var(--bg)] font-semibold shadow-sm" : "text-[var(--muted)]"}`}>
              {tr(dt, lang)}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function Why({ p, d, lang, live, hour, dayType, delayS }: { p: Plan; d: DoorPlan; lang: Lang; live: string | null; hour: number; dayType: DayType; delayS?: number }) {
  const facts = useMemo(() => factsOf(p, d), [p, d]);
  const template = useMemo(() => explain(facts), [facts]);
  const [ai, setAi] = useState<{ key: string; text: Bilingual } | null>(null);
  const narratable = true;
  const key = `${p.line.id}|${p.from.code}|${p.to.code}|${p.target.dest.id}|${p.target.points.length}|${facts.best.car}-${facts.best.door}|${Math.round(hour * 4)}|${dayType}|${delayS ?? 0}`;

  useEffect(() => {
    if (!narratable) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/narrate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ctrl.signal,
          body: JSON.stringify({ line: p.line.id, from: p.from.code, to: p.to.code, destId: p.target.dest.id, stepFree: p.target.points.every((x) => x.stepFree), speedWeight: weightFor(d), hour, dayType, delayS }),
        });
        if (!res.ok) return;
        const n = await res.json();
        // Only accept narration describing the same door the screen shows.
        if (n.source === "llm" && String(n.text?.en ?? "").includes(String(facts.best.car))) setAi({ key, text: n.text });
      } catch {
        /* the template is already on screen */
      }
    }, 900);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` captures everything that changes the answer
  }, [key, narratable]);

  const narration = narratable && ai?.key === key ? ai.text : null;
  const [open, setOpen] = useState(false);
  const isLive = p.loadSource === "odpt-live";

  return (
    <section className="card p-4">
      <h2 className="text-[12px] font-medium uppercase tracking-wider text-[var(--muted)]">{tr("why", lang)}</h2>
      <p className="mt-2 text-[15px] leading-relaxed">{(narration ?? template)[lang]}</p>
      <p className="mt-2 text-[11px] text-[var(--muted)]">{narration ? tr("aiChecked", lang) : tr("engineSummary", lang)}</p>

      <button onClick={() => setOpen(!open)} aria-expanded={open} className="mt-4 flex w-full items-center justify-between rounded-xl bg-[var(--surface-2)] px-3 py-2.5 text-[13px] font-medium hover:bg-[var(--surface-3)]">
        {tr("details", lang)}
        <span className={`transition-transform ${open ? "rotate-180" : ""}`}>⌄</span>
      </button>
      {open && (
        <div className="mt-4 space-y-4">
          <ParetoChart ranked={d.solution.ranked} frontier={d.solution.frontier} best={d.solution.best} lineColor={p.line.color} xLabel={tr("chartX", lang)} yLabel={isLive ? tr("chartY", lang) : tr("chartYRel", lang)} relative={!isLive} />
          <p className="text-[12px] leading-relaxed text-[var(--muted)]">{tr("chartNote", lang)}</p>
          <div>
            <h3 className="mb-1.5 text-[12px] font-semibold">{tr("sources", lang)}</h3>
            <ul className="space-y-1.5 text-[12px] leading-relaxed text-[var(--muted)]">
              <li>• {isLive ? tr("srcCrowdLive", lang) : tr("srcCrowdEst", lang)}</li>
              <li>
                • {tr("srcSurvey", lang, { d: p.source.updated ?? "?" })}{" "}
                <a className="underline underline-offset-2" href={p.source.url} target="_blank" rel="noreferrer">
                  {tr("viewSource", lang)}
                </a>
              </li>
              <li>• {live ? tr("srcLive", lang, { t: new Date(live).toLocaleTimeString(lang === "ja" ? "ja-JP" : "en-GB", { timeZone: "Asia/Tokyo" }) }) : tr("srcNoLive", lang)}</li>
              <li>• {tr("stableHint", lang, { n: Math.round(d.stability.sameCar * 100) })}</li>
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}

/** Midpoint of the slider segment that produced the current answer, so the server reproduces it exactly. */
function weightFor(d: DoorPlan): number {
  const seg = d.breakpoints.find((s) => s.car === d.solution.best.car && s.door === d.solution.best.door);
  return seg ? (seg.from + seg.to) / 2 : 0.5;
}

function Pill({ children, style, title }: { children: React.ReactNode; style?: React.CSSProperties; title?: string }) {
  return (
    <span title={title} style={style} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-2)] px-3 py-1.5 font-medium tabular-nums">
      {children}
    </span>
  );
}

function Skeleton() {
  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 pt-4 sm:px-6 sm:pt-8">
      <div className="mb-5 h-8 w-32 animate-pulse rounded-lg bg-[var(--surface-2)]" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <div className="h-44 animate-pulse rounded-3xl bg-[var(--surface-2)]" />
          <div className="h-96 animate-pulse rounded-3xl bg-[var(--surface-2)]" />
        </div>
        <div className="h-64 animate-pulse rounded-3xl bg-[var(--surface-2)]" />
      </div>
    </div>
  );
}
