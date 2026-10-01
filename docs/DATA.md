# Data and provenance

Every number on screen comes from one of these sources, and the UI says which.

| Data | Source | Status |
|---|---|---|
| Station lists, order, numbering, names (EN/JA) | Tokyo Metro official numbering, hard-coded in `src/data/network.ts` | real |
| Service status (delays, suspensions) | ODPT `odpt:TrainInformation` | live, every 60 s |
| Train positions and delay | ODPT `odpt:Train` | live, every 20 s |
| Next departures | ODPT `odpt:StationTimetable` | static timetable, cached 6 h |
| Per-car load | ODPT, **only** if a field is configured via `ODPT_CAR_LOAD_FIELD` | not found yet; falls back to the estimate |
| Car load estimate | `src/engine/crowding.ts` | model, labelled "estimate" |
| Egress positions on platforms | `src/data/layouts.ts` | **demo**: connections are real, positions are not surveyed |

## What has been verified, and what has not

The code was written against the published ODPT v4 schema, but the development
environment could not reach `api.odpt.org`. Before treating the live layer as
verified, run:

```bash
npm run odpt:probe > docs/odpt-probe.md
```

and check the output for the following:

- [ ] `odpt:Train` for both lines returns `odpt:fromStation`, `odpt:toStation`,
      `odpt:railDirection`, `odpt:delay` and `odpt:destinationStation`.
- [ ] Rail direction ids are `odpt.RailDirection:TokyoMetro.{Ogikubo,Ikebukuro,Shibuya,Asakusa}`.
- [ ] `odpt:TrainInformation` omits `odpt:trainInformationStatus` during normal
      service (the parser treats its presence as a disruption).
- [ ] `odpt:StationTimetable` objects carry `odpt:calendar` values
      `odpt.Calendar:Weekday` / `odpt.Calendar:SaturdayHoliday`.
- [ ] Whether any `odpt:Train` field is a per-car numeric array (the probe flags
      candidates). If one exists, set `ODPT_CAR_LOAD_FIELD` and the app switches to
      "live" loads for the next train.
- [ ] Whether `odpt:StationFacility` publishes nearest-car information for
      transfers and exits. If it does, it can replace hand-surveyed layouts.
- [ ] Car numbering: which end car 1 is on for each line. `network.ts` assumes
      the Ogikubo end (Marunouchi) and the Shibuya end (Ginza).

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
