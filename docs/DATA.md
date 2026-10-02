# Data and provenance

Every number on screen comes from one of these sources, and the UI says which.

| Data | Source | Status |
|---|---|---|
| Station lists, order, numbering, names (EN/JA) | Tokyo Metro official numbering, hard-coded in `src/data/network.ts` | real |
| Service status (delays, suspensions) | ODPT `odpt:TrainInformation` | live, every 60 s |
| Train positions and delay | ODPT `odpt:Train` | live, every 20 s, where published (not for Tokyo Metro; see below) |
| Next departures | ODPT `odpt:StationTimetable` | static timetable, cached 6 h |
| Per-car load | ODPT, **only** if a field is configured via `ODPT_CAR_LOAD_FIELD` | not published by ODPT (verified); falls back to the estimate |
| Car load estimate | `src/engine/crowding.ts` | model, labelled "estimate" |
| Exits per station, and which car and door each staircase, escalator and elevator is next to | 「電車の停車位置」 (wadattsu261.com), on-site survey by わだっつ; extracted by `scripts/survey/` into `src/data/survey.json` | **261 positions across all 44 stations**, each with its source URL and the page's update date. 2 self-contradictory entries dropped and disclosed in the app |
| Rider "changed?" reports | `/api/reports` → `src/core/consensus.ts` | flag a possible change; never override the survey |

## Verified against live ODPT (2026-10-01, ~13:30 JST weekday)

Raw output: [`docs/odpt-probe.md`](odpt-probe.md). Re-run with `npm run odpt:probe`.

| Check | Result |
|---|---|
| Station order, station ids, line colours (`odpt:Railway`) | ✅ match `network.ts` for both lines |
| Rail direction ids | ✅ `TokyoMetro.{Ogikubo,Ikebukuro,Shibuya,Asakusa}` |
| `odpt:TrainInformation`: status field absent in normal service | ✅ ("現在、平常どおり運転しています。", no `odpt:trainInformationStatus`) |
| `odpt:StationTimetable` calendars and fields | ✅ `odpt.Calendar:Weekday` / `SaturdayHoliday`, `odpt:departureTime`, `odpt:destinationStation`, `odpt:trainType` |
| Live train positions for **Tokyo Metro** (`odpt:Train`) | ❌ **not published**: 0 records on both the standard and Challenge endpoints. Standard has Toei (90 trains) and Yokohama Municipal; Challenge has JR East, Tobu, Keio and Keikyu. The app now says so instead of showing an empty list |
| Per-car load on any `odpt:Train` record | ❌ none. No numeric per-car arrays, and no `odpt:carComposition` on Toei trains either |
| `odpt:StationFacility` | ❌ HTTP 404 from the query API; the bulk dump (`odpt:StationFacility.json`) redirects to a file that does not exist (404) |
| ODPT catalogue (ckan.odpt.org), Tokyo Metro datasets | Fare, station, route, timetables, passenger survey, static GTFS, icons, and a GTFS-RT feed that carries **Alerts only**. No platform positions, no car-level data |
| `odpt:PassengerSurvey` (Tokyo Metro) | ✅ 147 records: annual station ridership, usable for weighting crowding hotspots |

Still open:

- [x] Car numbering: car 1 is at the Ogikubo end (Marunouchi) and the Shibuya end (Ginza),
      as stated on every survey page.
- [x] Door numbering: door 1 is at the car-1 end, confirmed by 261 consistent order/label pairs.
- [ ] Rolling-stock lengths and door counts (see MODEL.md §1).

**Implication.** On Tokyo Metro, live data can only adjust the plan through service
status and the timetable. Lines that do publish positions (Toei, and JR East etc.
via the Challenge endpoint) would let real per-train delay feed the crowding
estimate.

**Note for sandboxed development:** Node's built-in `fetch` ignores `HTTPS_PROXY`. Behind a proxy, run
the server or the probe with `NODE_USE_ENV_PROXY=1` (Node ≥ 22.21). On Vercel this is not needed.

## Platform survey extraction

Source: one page per station on wadattsu261.com (index: `scripts/survey/sources.mts`).

1. `scripts/survey/fetch.mts` downloads the pages with one request every 4 s and an
   identifying User-Agent. Raw pages stay in `.cache/` and are not committed or redistributed.
2. `scripts/survey/parse.mts` reads each page's detail section line by line. It tracks
   the current platform, gate and kind of access (stairs, escalator, elevator, gate on
   the platform), and emits one record per door sentence
   (「○号車の進行方向○番目のドア(『○号車○番ドア』)付近にあります」).
3. **Direction.** Each platform's direction comes from the page's own sentences ("1番線ホームには荻窪・方南町方面…"),
   by comparing the named station's position on the line with this station. Terminals use their arrival direction.
4. **Cross-check.** Each door is given both as an order in the direction of travel and as a
   physical label. With door 1 at the car-1 end (car 1 is at the Ogikubo/Shibuya end, as every page states),
   order *k* travelling towards car 1 is label *k*, and towards car 6 it is label 4 − *k*. Entries
   where the two disagree are dropped. On shared stations, entries under the other line's
   platform headings are excluded explicitly.
5. Every record is written to `.cache/survey/review.md` next to the sentence it came from,
   for manual review. Results on 2026-10-02: 261 accepted, 2 rejected (source contradictions at
   Otemachi towards Ikebukuro and Omotesando towards Asakusa), 1 skipped (other line's platform).
   A manual spot check of 14 random records against their source sentences found 2 gate-name
   extraction faults, both fixed before release.

The app labels door positions with the platform's own car and door numbers, which riders can
check on the platform-door signs, so an answer never depends on internal coordinates.

## Rider reports

A rider reports the car and door (as marked on the platform) nearest to a destination.
Reports count one vote per network address, use the median position, and are **verified** at
≥ 3 votes with ≥ 75 % agreement. A verified report more than one door away from every
surveyed point shows "riders report this may have changed". It never replaces the survey.

## ODPT terms

The footer carries the attribution and disclaimer required for apps using ODPT
data. Keys live only in server environment variables and are never sent to the
browser.
