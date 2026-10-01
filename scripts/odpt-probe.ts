/**
 * ODPT capability probe.
 *
 *   npm run odpt:probe            (reads keys from .env.local)
 *
 * Asks ODPT what it really returns for the lines this app supports and prints a
 * field inventory. Run it before trusting any assumption in docs/DATA.md, and
 * whenever ODPT announces new datasets. In particular it flags any numeric
 * array on a Train record whose length equals the car count: that is what a
 * per-car load field would look like, and its key can be set as
 * ODPT_CAR_LOAD_FIELD.
 */

const BASES = [
  ["standard", "https://api.odpt.org/api/v4", process.env.ODPT_CONSUMER_KEY],
  ["challenge", "https://api-challenge.odpt.org/api/v4", process.env.ODPT_CHALLENGE_KEY],
] as const;

const QUERIES: [string, Record<string, string>][] = [
  ["odpt:Train", { "odpt:railway": "odpt.Railway:TokyoMetro.Marunouchi" }],
  ["odpt:Train", { "odpt:railway": "odpt.Railway:TokyoMetro.Ginza" }],
  ["odpt:TrainInformation", { "odpt:operator": "odpt.Operator:TokyoMetro" }],
  ["odpt:StationTimetable", { "odpt:station": "odpt.Station:TokyoMetro.Marunouchi.Shinjuku" }],
  ["odpt:StationFacility", { "owl:sameAs": "odpt.StationFacility:TokyoMetro.Otemachi" }],
  ["odpt:PassengerSurvey", { "odpt:operator": "odpt.Operator:TokyoMetro" }],
  ["odpt:Railway", { "odpt:operator": "odpt.Operator:TokyoMetro" }],
];

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

function inventory(records: Json[]): Map<string, { count: number; sample: string }> {
  const out = new Map<string, { count: number; sample: string }>();
  for (const r of records) {
    if (!r || typeof r !== "object" || Array.isArray(r)) continue;
    for (const [k, v] of Object.entries(r)) {
      const e = out.get(k) ?? { count: 0, sample: JSON.stringify(v).slice(0, 90) };
      e.count++;
      out.set(k, e);
    }
  }
  return out;
}

function perCarCandidates(trains: Json[]): string[] {
  const hits = new Set<string>();
  for (const t of trains) {
    if (!t || typeof t !== "object" || Array.isArray(t)) continue;
    const cars = typeof t["odpt:carComposition"] === "number" ? (t["odpt:carComposition"] as number) : null;
    for (const [k, v] of Object.entries(t)) {
      if (Array.isArray(v) && v.length > 1 && v.every((x) => typeof x === "number") && (cars === null || v.length === cars)) hits.add(k);
    }
  }
  return [...hits];
}

async function main() {
  const usable = BASES.filter(([, , key]) => key);
  if (usable.length === 0) {
    console.error("No ODPT keys. Put ODPT_CONSUMER_KEY and/or ODPT_CHALLENGE_KEY in .env.local");
    process.exit(1);
  }
  console.log(`# ODPT probe — ${new Date().toISOString()}\n`);
  for (const [name, base, key] of usable) {
    console.log(`## ${name} (${base})\n`);
    for (const [type, params] of QUERIES) {
      const url = new URL(`${base}/${type}`);
      for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
      url.searchParams.set("acl:consumerKey", key!);
      const label = `${type} ${Object.values(params).join(" ")}`;
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) {
          console.log(`### ${label}\nHTTP ${res.status}\n`);
          continue;
        }
        const data = (await res.json()) as Json[];
        console.log(`### ${label}\n${data.length} records`);
        for (const [k, { count, sample }] of inventory(data)) console.log(`- \`${k}\` (${count}): ${sample}`);
        if (type === "odpt:Train") {
          const c = perCarCandidates(data);
          console.log(c.length ? `\n**Possible per-car fields:** ${c.join(", ")}` : "\nNo per-car numeric arrays found.");
        }
        console.log("");
      } catch (err) {
        console.log(`### ${label}\nfailed: ${(err as Error).message}\n`);
      }
    }
  }
}

main();
