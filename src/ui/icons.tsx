import type { EgressKind } from "@/engine/types";

type P = { size?: number; className?: string };

export function StairsIcon({ size = 16, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M3 20h5v-5h5v-5h5V5h3" />
    </svg>
  );
}

export function EscalatorIcon({ size = 16, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M3 20h4.5L16 9h5" />
      <circle cx="9" cy="6" r="1.6" />
      <path d="M9 9.5v3" />
    </svg>
  );
}

export function ElevatorIcon({ size = 16, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="m9 10 3-3 3 3M9 14l3 3 3-3" />
    </svg>
  );
}

export function WayUpIcon({ size = 16, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  );
}

export function EgressIcon({ kind, ...p }: P & { kind: EgressKind }) {
  if (kind === "way") return <WayUpIcon {...p} />;
  if (kind === "stairs") return <StairsIcon {...p} />;
  if (kind === "escalator") return <EscalatorIcon {...p} />;
  return <ElevatorIcon {...p} />;
}

export function SwapIcon({ size = 18 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 4v16M3 8l4-4 4 4M17 20V4M21 16l-4 4-4-4" />
    </svg>
  );
}

export function ChevronIcon({ size = 16, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
