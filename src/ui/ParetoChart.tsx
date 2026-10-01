"use client";

import type { ScoredCandidate } from "@/engine/types";
import { loadColor } from "./colors";

interface Props {
  ranked: ScoredCandidate[];
  frontier: ScoredCandidate[];
  best: ScoredCandidate;
  lineColor: string;
  xLabel: string;
  yLabel: string;
}

const W = 360;
const H = 220;
const M = { l: 40, r: 12, t: 12, b: 40 };

export function ParetoChart({ ranked, frontier, best, lineColor, xLabel, yLabel }: Props) {
  const xs = ranked.map((c) => c.egressS);
  const ys = ranked.map((c) => c.loadPct);
  const [x0, x1] = pad(Math.min(...xs), Math.max(...xs), true);
  const [y0, y1] = pad(Math.min(...ys), Math.max(...ys));
  const X = (v: number) => M.l + ((v - x0) / (x1 - x0)) * (W - M.l - M.r);
  const Y = (v: number) => H - M.b - ((v - y0) / (y1 - y0)) * (H - M.t - M.b);
  const ticks = (a: number, b: number) => [a, (a + b) / 2, b].map((v) => Math.round(v));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Trade-off between exit time and crowding for every door">
      {ticks(y0, y1).map((v) => (
        <g key={`y${v}`}>
          <line x1={M.l} x2={W - M.r} y1={Y(v)} y2={Y(v)} stroke="var(--line)" strokeDasharray="2 4" />
          <text x={M.l - 6} y={Y(v) + 4} textAnchor="end" className="fill-[var(--muted)] text-[10px] tabular-nums">{v}</text>
        </g>
      ))}
      {ticks(x0, x1).map((v) => (
        <text key={`x${v}`} x={X(v)} y={H - M.b + 16} textAnchor="middle" className="fill-[var(--muted)] text-[10px] tabular-nums">{v}s</text>
      ))}
      <text x={(M.l + W - M.r) / 2} y={H - 6} textAnchor="middle" className="fill-[var(--muted)] text-[10px]">{xLabel}</text>
      <text transform={`translate(11 ${(H - M.b + M.t) / 2}) rotate(-90)`} textAnchor="middle" className="fill-[var(--muted)] text-[10px]">{yLabel}</text>

      <polyline points={frontier.map((c) => `${X(c.egressS)},${Y(c.loadPct)}`).join(" ")} fill="none" stroke={lineColor} strokeWidth={2} strokeOpacity={0.7} />
      {ranked.map((c) => (
        <circle key={`${c.car}-${c.door}`} cx={X(c.egressS)} cy={Y(c.loadPct)} r={c.pareto ? 4.5 : 3} fill={loadColor(c.loadPct)} fillOpacity={c.pareto ? 1 : 0.45} stroke={c.pareto ? "var(--bg)" : "none"}>
          <title>{`Car ${c.car} door ${c.door}: ${Math.round(c.egressS)}s, ${c.loadPct}%`}</title>
        </circle>
      ))}
      <circle cx={X(best.egressS)} cy={Y(best.loadPct)} r={9} fill="none" stroke="var(--fg)" strokeWidth={2} />
      <text x={X(best.egressS) + 12} y={Y(best.loadPct) - 8} className="fill-[var(--fg)] text-[11px] font-semibold">{`${best.car}-${best.door}`}</text>
    </svg>
  );
}

function pad(a: number, b: number, nonNegative = false): [number, number] {
  const span = Math.max(b - a, 1);
  const lo = Math.floor(a - span * 0.08);
  return [nonNegative ? Math.max(0, lo) : lo, Math.ceil(b + span * 0.08)];
}
