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
| Egress positions on platforms | `src/data/layouts.ts` | **demo**: connections are real, positions are not surveyed |

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
| `odpt:StationFacility` | ❌ HTTP 404, not served by the API. Platform positions must be surveyed |
| `odpt:PassengerSurvey` (Tokyo Metro) | ✅ 147 records: annual station ridership, usable for weighting crowding hotspots |

Still open:

- [ ] Car numbering: which end car 1 is on for each line. `network.ts` assumes the
      Ogikubo end (Marunouchi) and the Shibuya end (Ginza). ODPT does not publish this.
- [ ] Rolling-stock lengths and door counts (see MODEL.md §1).

**Implication.** On Tokyo Metro, live data can only adjust the plan through service
status and the timetable. Lines that do publish positions (Toei, and JR East etc.
via the Challenge endpoint) would let real per-train delay feed the crowding
estimate.

**Note for sandboxed development:** Node's built-in `fetch` ignores `HTTPS_PROXY`. Behind a proxy, run
the server or the probe with `NODE_USE_ENV_PROXY=1` (Node ≥ 22.21). On Vercel this is not needed.

## Surveying a station (turning a demo layout into a surveyed one)

A layout is a list of egress points, each with a position in metres from the
car-1 end of the stopped train. The goal is to record, for every staircase,
escalator and elevator, which car and door it is closest to.

1. On the platform, note the car-number signs or floor markings (号車表示 / 乗車位置) and the
   nearest car and door for each staircase, escalator and elevator. The in-station
   "のりかえ・出口案内" (transfer and exit guide) boards, where present, show the same thing.
2. Convert to metres: `position = X_door(car, door)` from `docs/MODEL.md`.
   This is exact enough, because the rider's choice is discrete anyway.
3. In `src/data/layouts.ts`, update the positions and set `source: "surveyed"`.
   Note the survey date and method in the commit message.
4. `npm test` checks that every position lies within the train's length.

No egress position should be added from guesswork and marked `surveyed`.

## ODPT terms

The footer carries the attribution and disclaimer required for apps using ODPT
data. Keys live only in server environment variables and are never sent to the
browser.
