"use client";

import { useState } from "react";
import { MIN_REPORTS } from "@/core/consensus";
import type { DestinationState } from "@/core/positions";
import { destinationLabel } from "@/data/survey";
import type { Line } from "@/data/network";
import { tr, type Lang } from "./i18n";
import { deviceId } from "./useCommunity";

interface Props {
  line: Line;
  station: string;
  target: DestinationState;
  lang: Lang;
  enabled: boolean;
  onDone: () => void;
  onCancel?: () => void;
}

/** A rider on the platform taps the door nearest to the stairs/lift and sends it. */
export function ReportDoor(p: Props) {
  const [pick, setPick] = useState<{ car: number; door: number } | null>(null);
  const [state, setState] = useState<{ kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; message: string }>({ kind: "idle" });
  const c = p.target.consensus;
  const g = p.line.geometry;
  const complete = pick !== null && pick.door > 0;

  if (!p.enabled) return <p className="text-[13px] text-[var(--muted)]">{tr("reportOff", p.lang)}</p>;
  if (state.kind === "sent") return <p className="rounded-xl bg-emerald-500/10 px-3 py-2.5 text-[14px] font-medium text-emerald-800 dark:text-emerald-300">{tr("thanks", p.lang)}</p>;

  const send = async () => {
    if (!pick || !complete) return;
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ line: p.line.id, station: p.station, egressId: p.target.dest.id, car: pick.car, door: pick.door, deviceId: deviceId() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      setState({ kind: "sent" });
      p.onDone();
    } catch (err) {
      setState({ kind: "error", message: (err as Error).message });
    }
  };

  return (
    <div>
      <h3 className="text-[15px] font-semibold">{tr("helpTitle", p.lang)}</h3>
      <p className="mt-1 text-[13px] leading-relaxed text-[var(--muted)]">{tr("helpBody", p.lang, { x: destinationLabel(p.target.dest)[p.lang] })}</p>
      {c && c.status !== "none" && (
        <p className="mt-1 text-[12px] text-[var(--muted)]">
          {c.status === "disputed" ? tr("disputed", p.lang) : tr("pendingN", p.lang, { n: c.reports, m: MIN_REPORTS })}
        </p>
      )}
      {/* Big targets: riders are standing on a moving platform with one free hand. */}
      <div className="mt-3">
        <div className="mb-1.5 text-[12px] font-medium text-[var(--muted)]">{tr("car", p.lang)}</div>
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${g.carCount}, minmax(0, 1fr))` }}>
          {Array.from({ length: g.carCount }, (_, i) => i + 1).map((car) => (
            <button
              key={car}
              onClick={() => setPick({ car, door: pick?.car === car ? pick.door : 0 })}
              aria-pressed={pick?.car === car}
              className={`h-12 rounded-xl text-[18px] font-bold tabular-nums transition-colors ${pick?.car === car ? "text-white" : "bg-[var(--surface-2)] hover:bg-[var(--surface-3)]"}`}
              style={pick?.car === car ? { background: p.line.color } : undefined}
            >
              {car}
            </button>
          ))}
        </div>
        {pick && (
          <>
            <div className="mb-1.5 mt-3 text-[12px] font-medium text-[var(--muted)]">{tr("door", p.lang)}</div>
            <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${g.doorOffsetsM.length}, minmax(0, 1fr))` }}>
              {g.doorOffsetsM.map((_, j) => (
                <button
                  key={j}
                  onClick={() => setPick({ car: pick.car, door: j + 1 })}
                  aria-pressed={pick.door === j + 1}
                  className={`h-12 rounded-xl text-[17px] font-bold tabular-nums transition-colors ${pick.door === j + 1 ? "text-white" : "bg-[var(--surface-2)] hover:bg-[var(--surface-3)]"}`}
                  style={pick.door === j + 1 ? { background: p.line.color } : undefined}
                >
                  {pick.car}-{j + 1}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="mt-4 flex gap-2">
        <button
          onClick={send}
          disabled={!complete || state.kind === "sending"}
          className="flex-1 rounded-xl py-2.5 text-[14px] font-semibold text-white transition-opacity disabled:opacity-40"
          style={{ background: p.line.color }}
        >
          {complete ? tr("reportBtn", p.lang, { c: pick.car, d: pick.door }) : tr("pickDoorFirst", p.lang)}
        </button>
        {p.onCancel && (
          <button onClick={p.onCancel} className="rounded-xl bg-[var(--surface-2)] px-4 text-[14px] font-medium">
            {tr("cancel", p.lang)}
          </button>
        )}
      </div>
      {state.kind === "error" && <p className="mt-2 text-[13px] text-red-600 dark:text-red-400">{tr("reportFail", p.lang, { e: state.message })}</p>}
    </div>
  );
}
