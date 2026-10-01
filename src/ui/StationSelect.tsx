"use client";

import type { Line } from "@/data/network";
import { ChevronIcon } from "./icons";
import type { Lang } from "./i18n";

/** Tokyo Metro style station number roundel. */
export function StationBadge({ code, color, size = 34 }: { code: string; color: string; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 flex-col items-center justify-center rounded-full bg-white font-bold leading-none text-[#1b1b1b]"
      style={{ width: size, height: size, border: `${Math.max(3, size / 9)}px solid ${color}` }}
      aria-hidden
    >
      <span style={{ fontSize: size * 0.3 }}>{code[0]}</span>
      <span style={{ fontSize: size * 0.34 }}>{code.slice(1)}</span>
    </span>
  );
}

interface Props {
  label: string;
  line: Line;
  value: string;
  onChange: (code: string) => void;
  lang: Lang;
  /** Station codes that can be chosen as a destination (have platform data). */
  marked?: Set<string>;
  markedSuffix?: string;
}

/**
 * A native <select> under a custom face: phones get their own wheel/list picker
 * (fast, accessible, no custom scroll-trap), desktops get a normal dropdown.
 */
export function StationSelect({ label, line, value, onChange, lang, marked, markedSuffix }: Props) {
  const s = line.stations.find((x) => x.code === value) ?? line.stations[0];
  const other = lang === "en" ? "ja" : "en";
  return (
    <label className="relative flex min-w-0 flex-1 items-center gap-3 rounded-2xl bg-[var(--surface-2)] px-3 py-2.5 transition-colors focus-within:ring-2 focus-within:ring-[var(--fg)] hover:bg-[var(--surface-3)]">
      <StationBadge code={s.code} color={line.color} />
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-medium uppercase tracking-wider text-[var(--muted)]">{label}</span>
        <span className="block truncate text-[17px] font-semibold leading-tight">{s.name[lang]}</span>
        <span className="block truncate text-[12px] text-[var(--muted)]">{s.name[other]}</span>
      </span>
      <ChevronIcon className="text-[var(--muted)]" />
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {line.stations.map((x) => (
          <option key={x.code} value={x.code}>
            {`${x.code}  ${x.name[lang]}${marked ? (marked.has(x.code) ? "  ●" : `  (${markedSuffix})`) : ""}`}
          </option>
        ))}
      </select>
    </label>
  );
}
