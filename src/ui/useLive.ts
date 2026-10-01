"use client";

import { useEffect, useState } from "react";
import type { LiveSnapshot } from "@/core/live";

const REFRESH_MS = 30_000;

export type LiveState = { status: "loading" } | { status: "ok"; data: LiveSnapshot } | { status: "error"; message: string };

/** Polls /api/live every 30 s while the tab is visible. */
export function useLive(line: string, from: string, to: string, enabled: boolean): LiveState {
  const key = `${line}:${from}:${to}`;
  // Results are tagged with the route they belong to, so a route change reads as "loading" without a reset.
  const [state, setState] = useState<{ key: string; value: LiveState } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const ctrl = new AbortController();

    const load = async () => {
      if (document.visibilityState === "visible") {
        try {
          const res = await fetch(`/api/live?line=${line}&from=${from}&to=${to}`, { signal: ctrl.signal });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = (await res.json()) as LiveSnapshot;
          if (!cancelled) setState({ key, value: { status: "ok", data } });
        } catch (err) {
          if (!cancelled && (err as Error).name !== "AbortError") setState({ key, value: { status: "error", message: (err as Error).message } });
        }
      }
      if (!cancelled) timer = setTimeout(load, REFRESH_MS);
    };
    load();
    const onVisible = () => document.visibilityState === "visible" && (clearTimeout(timer), load());
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      ctrl.abort();
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [key, line, from, to, enabled]);

  return state?.key === key ? state.value : { status: "loading" };
}
