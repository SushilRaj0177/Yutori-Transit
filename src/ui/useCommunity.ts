"use client";

import { useCallback, useEffect, useState } from "react";
import type { CommunityBook } from "@/core/positions";

export interface CommunityState {
  /** null until loaded, or when the request failed. */
  book: CommunityBook | null;
  enabled: boolean;
  reload: () => void;
}

/** Rider-verified platform positions for a line. */
export function useCommunity(line: string): CommunityState {
  const [state, setState] = useState<{ line: string; book: CommunityBook; enabled: boolean } | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/layouts?line=${line}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: { enabled: boolean; book: CommunityBook }) => setState({ line, book: d.book, enabled: d.enabled }))
      .catch(() => {
        /* keep the last known state; unknown positions simply stay unknown */
      });
    return () => ctrl.abort();
  }, [line, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const current = state?.line === line ? state : null;
  return { book: current?.book ?? null, enabled: current?.enabled ?? false, reload };
}

/** A random per-browser id, so a rider can change their own report. Never linked to an identity. */
export function deviceId(): string {
  const KEY = "yutori:device";
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}
