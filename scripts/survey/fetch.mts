/**
 * Polite crawler: one request every few seconds, identifies itself, and skips
 * pages already cached. Raw pages are cached locally (.cache/, git-ignored)
 * and are not redistributed; only extracted facts with source links are committed.
 *
 *   npx tsx scripts/survey/fetch.ts [--refresh]
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { SURVEY_ORIGIN, SURVEY_PAGES } from "./sources.mts";

const CACHE = ".cache/survey";
const DELAY_MS = 4000;
const UA = "YutoriResearch/0.1 (student project; contact sushilraj0177@gmail.com)";

const refresh = process.argv.includes("--refresh");
mkdirSync(CACHE, { recursive: true });
const paths = [...new Set(Object.values(SURVEY_PAGES))];

for (const path of paths) {
  const file = `${CACHE}/${path.split("/").filter(Boolean).pop()}.html`;
  if (!refresh && existsSync(file)) continue;
  const res = await fetch(SURVEY_ORIGIN + path, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) {
    console.error(`HTTP ${res.status} ${path}`);
  } else {
    writeFileSync(file, await res.text());
    console.log(`saved ${file}`);
  }
  await new Promise((r) => setTimeout(r, DELAY_MS));
}
