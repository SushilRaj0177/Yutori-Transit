import "server-only";

/**
 * Minimal ODPT v4 client. Keys stay on the server; responses are cached in
 * memory so a burst of users costs one upstream request per TTL window.
 */

const BASES = {
  standard: "https://api.odpt.org/api/v4",
  challenge: "https://api-challenge.odpt.org/api/v4",
} as const;

type Base = keyof typeof BASES;

export class OdptUnavailable extends Error {}

function keys(): { base: Base; key: string }[] {
  const out: { base: Base; key: string }[] = [];
  if (process.env.ODPT_CONSUMER_KEY) out.push({ base: "standard", key: process.env.ODPT_CONSUMER_KEY });
  if (process.env.ODPT_CHALLENGE_KEY) out.push({ base: "challenge", key: process.env.ODPT_CHALLENGE_KEY });
  return out;
}

export function odptConfigured(): boolean {
  return keys().length > 0;
}

const cache = new Map<string, { at: number; value: Promise<unknown> }>();

/**
 * GET /{type}?params. Tries the standard endpoint first and the Challenge
 * endpoint second. Throws OdptUnavailable when no key works.
 */
export async function odptGet<T>(type: string, params: Record<string, string>, ttlS: number): Promise<T> {
  const cacheKey = `${type}?${new URLSearchParams(params)}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < ttlS * 1000) return hit.value as Promise<T>;

  const value = (async () => {
    const attempts = keys();
    if (attempts.length === 0) throw new OdptUnavailable("no ODPT key configured");
    const failures: string[] = [];
    for (const { base, key } of attempts) {
      const url = new URL(`${BASES[base]}/${type}`);
      for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
      url.searchParams.set("acl:consumerKey", key);
      try {
        const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(6000) });
        if (res.ok) return (await res.json()) as T;
        failures.push(`${base}: HTTP ${res.status}`);
      } catch (err) {
        failures.push(`${base}: ${(err as Error).name}`);
      }
    }
    throw new OdptUnavailable(failures.join("; "));
  })();

  cache.set(cacheKey, { at: Date.now(), value });
  // Do not keep failures around for the whole TTL; retry after a short pause.
  value.catch(() => setTimeout(() => cache.get(cacheKey)?.value === value && cache.delete(cacheKey), 10_000));
  return value;
}

// ── Response shapes (only the fields this app reads) ─────────────────────────

export type LangMap = { ja?: string; en?: string };

export interface OdptTrain {
  "odpt:railway"?: string;
  "odpt:railDirection"?: string;
  "odpt:trainNumber"?: string;
  "odpt:trainType"?: string;
  "odpt:fromStation"?: string | null;
  "odpt:toStation"?: string | null;
  "odpt:destinationStation"?: string[] | null;
  "odpt:delay"?: number;
  "dc:date"?: string;
  [key: string]: unknown;
}

export interface OdptTrainInformation {
  "odpt:railway"?: string;
  "odpt:trainInformationStatus"?: LangMap | string;
  "odpt:trainInformationText"?: LangMap | string;
  "dc:date"?: string;
}

export interface OdptStationTimetable {
  "odpt:calendar"?: string;
  "odpt:railDirection"?: string;
  "odpt:stationTimetableObject"?: {
    "odpt:departureTime"?: string;
    "odpt:destinationStation"?: string[];
    "odpt:trainType"?: string;
    "odpt:trainNumber"?: string;
  }[];
}
