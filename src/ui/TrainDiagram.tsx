"use client";

import type { CrowdLevel } from "@/core/plan";
import { carCentreM, doorPositionM, trainLengthM } from "@/engine/geometry";
import type { Egress, TrainGeometry } from "@/engine/types";
import { crowdColor, loadColor } from "./colors";
import { EgressIcon } from "./icons";
import type { Lang } from "./i18n";

interface Props {
  geometry: TrainGeometry;
  crowd: CrowdLevel[];
  /** Present only for live measurements; estimates are shown as relative levels. */
  liveLoadsPct?: number[] | null;
  /** Egress points whose position is known. Unknown ones are not drawn. */
  egress: Egress[];
  targetId?: string;
  pick?: { car: number; door: number } | null;
  /** True when car 1 is at the front in the direction of travel. */
  car1Front: boolean;
  lineColor: string;
  frontLabel: string;
  lang: Lang;
  onPickEgress?: (id: string) => void;
  /** Report mode: every door becomes a tap target. */
  onPickDoor?: (car: number, door: number) => void;
}

const S = 6; // svg units per metre
const PAD = 30;
const CAR_Y = 132;
const CAR_H = 64;
const ICON_Y = 40;

const WORD: Record<CrowdLevel, { en: string; ja: string }> = {
  quieter: { en: "quiet", ja: "空き" },
  average: { en: "avg", ja: "普通" },
  busier: { en: "busy", ja: "混雑" },
};

/**
 * Platform view: travel direction always points right, so riders see the
 * train the way they will stand next to it. Car numbers are drawn large because
 * they are what riders match against the platform signs.
 */
export function TrainDiagram(p: Props) {
  const g = p.geometry;
  const L = trainLengthM(g);
  const W = L * S + PAD * 2;
  const X = (m: number) => PAD + (p.car1Front ? L - m : m) * S;
  const target = p.egress.find((e) => e.id === p.targetId);
  const pick = p.pick ?? null;
  const reportMode = Boolean(p.onPickDoor);

  return (
    <svg viewBox={`0 0 ${W} 262`} className="w-full h-auto select-none" role="img" aria-label="Train and platform diagram">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0 0 10 5 0 10z" fill="currentColor" />
        </marker>
      </defs>

      <rect x={PAD - 10} y={CAR_Y - 30} width={L * S + 20} height={8} rx={4} className="fill-[var(--line-soft)]" />
      <rect x={PAD - 10} y={CAR_Y - 22} width={L * S + 20} height={3} className="fill-[var(--tactile)]" />

      {target && pick && (
        <path
          d={`M${X(doorPositionM(g, pick.car, pick.door))} ${CAR_Y - 4} C ${X(doorPositionM(g, pick.car, pick.door))} ${CAR_Y - 40}, ${X(target.positionM)} ${ICON_Y + 56}, ${X(target.positionM)} ${ICON_Y + 28}`}
          fill="none"
          stroke={p.lineColor}
          strokeWidth={3.5}
          strokeDasharray="2 8"
          strokeLinecap="round"
          className="walk-path"
        />
      )}

      {p.egress.map((e) => {
        const on = e.id === p.targetId;
        return (
          <g key={e.id} transform={`translate(${X(e.positionM)} ${ICON_Y})`} className={p.onPickEgress ? "cursor-pointer" : ""} onClick={() => p.onPickEgress?.(e.id)} aria-label={e.leadsTo[p.lang]}>
            <circle r={on ? 27 : 22} fill={on ? p.lineColor : "var(--surface-2)"} stroke={on ? "none" : "var(--line)"} strokeWidth={1.5} className="transition-all duration-300" />
            <foreignObject x={-14} y={-14} width={28} height={28} style={{ color: on ? "white" : "var(--muted)" }}>
              <EgressIcon kind={e.kind} size={28} />
            </foreignObject>
          </g>
        );
      })}

      {p.crowd.map((level, i) => {
        const car = i + 1;
        const start = (car - 1) * (g.carLengthM + g.couplerGapM);
        const left = Math.min(X(start), X(start + g.carLengthM));
        const w = g.carLengthM * S;
        const isPick = pick?.car === car;
        const isFront = p.car1Front ? car === 1 : car === g.carCount;
        const live = p.liveLoadsPct?.[i];
        return (
          <g key={car}>
            <rect
              x={left}
              y={CAR_Y}
              width={w}
              height={CAR_H}
              rx={isFront ? 14 : 6}
              fill={live !== undefined ? loadColor(live) : crowdColor(level)}
              fillOpacity={isPick || reportMode ? 1 : 0.8}
              stroke={isPick ? "var(--fg)" : "none"}
              strokeWidth={isPick ? 3 : 0}
              className="transition-[fill] duration-500"
            />
            {!reportMode && (
              <text x={left + w / 2} y={CAR_Y + CAR_H / 2 + 8} textAnchor="middle" className="fill-[#1b1b1b] text-[22px] font-bold">
                {live !== undefined ? `${live}%` : WORD[level][p.lang]}
              </text>
            )}
            <text x={X(carCentreM(g, car))} y={CAR_Y + CAR_H + 30} textAnchor="middle" className={`text-[24px] tabular-nums ${isPick ? "fill-[var(--fg)] font-bold" : "fill-[var(--muted)] font-semibold"}`}>
              {car}
            </text>
          </g>
        );
      })}

      {Array.from({ length: g.carCount }, (_, i) =>
        g.doorOffsetsM.map((_, j) => {
          const car = i + 1;
          const door = j + 1;
          const on = pick?.car === car && pick?.door === door;
          const x = X(doorPositionM(g, car, door));
          if (reportMode) {
            return (
              <g key={`${car}-${door}`} className="cursor-pointer" onClick={() => p.onPickDoor!(car, door)} role="button" aria-label={`${car}-${door}`} aria-pressed={on}>
                <rect x={x - 16} y={CAR_Y + 6} width={32} height={CAR_H - 12} rx={6} fill={on ? p.lineColor : "var(--bg)"} stroke={on ? "var(--fg)" : "var(--line)"} strokeWidth={on ? 3 : 1.5} />
                <text x={x} y={CAR_Y + CAR_H / 2 + 7} textAnchor="middle" className={`text-[17px] font-bold ${on ? "fill-white" : "fill-[var(--muted)]"}`}>
                  {door}
                </text>
              </g>
            );
          }
          return on ? (
            <g key={`${car}-${door}`}>
              <circle cx={x} cy={CAR_Y - 2} r={14} fill={p.lineColor} className="door-pulse" />
              <rect x={x - 10} y={CAR_Y - 6} width={20} height={9} rx={2} fill="var(--fg)" />
            </g>
          ) : (
            <rect key={`${car}-${door}`} x={x - 7} y={CAR_Y - 3} width={14} height={5} rx={1.5} fill="var(--bg)" opacity={0.85} />
          );
        }),
      )}

      <g className="text-[var(--muted)]">
        <line x1={W - PAD - 70} y1={250} x2={W - PAD + 6} y2={250} stroke="currentColor" strokeWidth={2} markerEnd="url(#arrow)" />
        <text x={W - PAD - 80} y={256} textAnchor="end" className="fill-current text-[19px] font-medium">
          {p.frontLabel}
        </text>
      </g>
    </svg>
  );
}
