# Yutori (ゆとり) — which door should you board?

On a Tokyo Metro train, the car next to the transfer stairs is the most crowded,
and the empty end car can leave you a long walk down the platform at your
destination. Yutori tells you which car and door to board for your trip, and lets
you slide between **getting out fast** and **having room**.

It is built to be relied on, so **every door it recommends comes from an on-site
survey**, and every number on screen says where it came from.

<p align="center">
  <img src="docs/img/mobile-en.png" width="30%" alt="Shinjuku to Otemachi: board car 5 door 3 for exits A1 and A2, from the on-site survey, with a live ODPT disruption notice" />
  <img src="docs/img/mobile-ja-dark.png" width="30%" alt="The same trip in Japanese, dark mode, including the note about an entry left out" />
</p>

## Where the data comes from

| What | Source | How it gets into the app |
|---|---|---|
| Which car and door is next to each staircase, escalator and elevator, and which gate, exit numbers and transfers it leads to | 「[電車の停車位置](https://wadattsu261.com/stationhome-info/)」, an on-site survey of every platform by わだっつ (wadattsu261.com) | `scripts/survey/` crawls the 43 station pages politely, parses them and validates every entry (below). 261 positions across all 44 stations of both lines. Each answer links to its source page and shows its update date |
| Service status (delays, suspensions) | ODPT `odpt:TrainInformation` | live, verified against real responses |
| Next departures | ODPT `odpt:StationTimetable` | scheduled times, verified |
| Crowding per car | **no public source exists** (ODPT checked thoroughly) | a rule-of-thumb estimate, shown only as "usually quieter / busier", never as a percentage, and weighted at half the importance of walking time |

**Validation.** The survey states each door twice: by its order in the direction
of travel ("3rd door of car 1") and by its physical label (『1号車1番ドア』, car 1 door 1).
The parser converts one into the other with the train's numbering and **drops any entry where they
disagree**. Of 263 entries, 2 contradict themselves at the source (Otemachi and
Omotesando). They are left out, and the app tells riders so, instead of guessing.
The same check catches the other line's platforms on shared stations (Akasaka-mitsuke,
Omotesando), which the parser excludes.

ODPT itself publishes **no** platform positions, Tokyo Metro train positions or
per-car crowding. `docs/DATA.md` has the evidence.

## What a rider sees

- **The gate they want at the destination:** transfer lines and exit numbers
  ("Tozai Line · Exits A4, A5, B1–B10").
- **"Board car 5, door 3"**, the walk to the stairs, and whether that car is
  usually quieter or busier.
- **A slider between faster exit and more room,** with bands showing where the answer changes.
- **Step-free mode:** only elevator or level routes; says so plainly when none is listed.
- **Live service status** and the next departures.
- **A note when a route was left out** for inconsistent data, plus a link to the source page.
- **"Changed? Report it":** rider reports that disagree with the survey raise a visible
  warning but never silently override it.

## How it works

```
             browser                                      server (Next.js route handlers)
┌──────────────────────────────────┐  /api/layouts  ┌──────────────────────────────────┐
│ Planner UI (React)               │ ─────────────▶ │ rider reports → consensus        │──▶ Postgres
│  · route, exit, slider, time     │  /api/reports  │  (one vote per network, median,  │    (Neon / PGlite)
│  · "changed?" reports            │ ─────────────▶ │   ≥3 agreeing → flag a change)   │
│                                  │                ├──────────────────────────────────┤
│ engine (pure TS, runs in browser)│   /api/live    │ ODPT client                      │
│  · geometry  → door positions    │ ─────────────▶ │  · TrainInformation  (60 s cache)│──▶ ODPT v4
│  · crowding  → relative estimate │                │  · StationTimetable  (6 h cache) │
│  · pareto    → frontier + pick   │  /api/narrate  ├──────────────────────────────────┤
│  · stability → robustness        │ ─────────────▶ │ recompute plan server-side       │
│  · explain   → EN/JA template    │   query only   │ → LLM rephrase, unit-checked     │──▶ Groq (optional)
└──────────────────────────────────┘                └──────────────────────────────────┘
```

* `src/engine/`: the optimisation model, with no framework code. [docs/MODEL.md](docs/MODEL.md)
  has the equations and every assumption.
* `scripts/survey/`: crawler, parser and cross-check for the platform survey; `src/data/survey.json` is its output.
* `src/data/survey.ts`: survey data grouped into destinations (gate, exits, transfers, access points).
* `src/core/consensus.ts`: rider "changed?" reports → verified / pending / disputed.
* `src/server/`: ODPT client, report store, rate limiting, LLM narration (`server-only`).
* `src/ui/`: the interface.

### Design decisions

* **Sourced positions only.** Every recommended door comes from the survey and links to it. Contradictory
  entries are dropped and disclosed, not repaired by guessing.
* **The LLM never decides.** The server recomputes the plan from the query, and output is rejected
  if it cites any number the engine didn't produce, uses the wrong unit, or calls a door
  "fastest" when it isn't.
* **Estimated crowding is discounted** (×0.5) against walking time from a
  verified position. A rule of thumb shouldn't overrule a measurement at equal
  weight.
* **The solver runs on the client**, so moving the slider involves no round trip.

## Run it

```bash
npm install
cp .env.example .env.local   # ODPT keys; optional Groq key, DATABASE_URL, REPORT_SALT
npm run dev                  # http://localhost:3000
```

Locally, rider "changed?" reports go to an embedded Postgres (PGlite) in `.data/`. In
production, set `DATABASE_URL` (see below). Without it, a Vercel deployment turns
reporting off instead of silently losing reports.

```bash
npm run check        # eslint + tsc + vitest (57 tests)
npm run build
npm run odpt:probe   # print what ODPT actually returns for these lines
```

The tests cover:

* the engine: geometry, a Pareto sweep checked against brute force, solver
  endpoints, the crowding discount, and the model;
* consensus: troll reports, disputes, invalid input;
* the survey parser on synthetic pages in both of the site's layouts, and the label/order cross-check;
* the survey data itself: every station covered in every arrival direction, doors within a 6-car, 3-door train,
  and a spot check against the published Otemachi page;
* the report API on a real embedded Postgres: one vote per network, vote
  changes, rate limits;
* ODPT parsing and JST service-day handling;
* the narration checker, including a real model output it caught misusing a number.

### Deploying for real users (Vercel + free Postgres)

1. Import the repo into Vercel.
2. Add a Postgres database from Vercel's storage marketplace (Neon has a free
   tier). This sets `DATABASE_URL`; the table is created on first use.
3. Set `ODPT_CONSUMER_KEY`, `REPORT_SALT` (a long random string) and optionally
   `GROQ_API_KEY` in Project Settings → Environment Variables.

## Privacy

Reports store the station, exit, car and door, plus **salted SHA-256 hashes** of
a random per-browser id and of the IP address (to stop ballot stuffing). There
are no accounts, no location tracking, and no raw IPs.

## Updating the survey data

```bash
npx tsx scripts/survey/fetch.mts --refresh   # polite crawl into .cache/ (not committed)
npx tsx scripts/survey/parse.mts             # writes src/data/survey.json and .cache/survey/review.md
```

`review.md` lists every extracted entry next to the sentence it came from, plus everything
rejected or skipped. Read it before committing a data update.

## Roadmap

1. Ask the survey's author for permission to use the data publicly, and report the two
   inconsistencies found.
2. Add more lines: the survey covers all Tokyo Metro, Toei and JR lines, and the engine handles any car and door count.
3. Rider-reported **crowding** ("car 3 is packed right now") with time decay.
4. Calibrate the crowding estimate with ODPT `PassengerSurvey` ridership and report its error.

## Data credit

Platform positions: 「電車の停車位置」 by わだっつ (wadattsu261.com), on-site survey. Used with attribution
and a link on every answer; the raw pages are not redistributed.

This app uses data from the Public Transportation Open Data Center (公共交通オープンデータセンター,
ODPT). The accuracy and completeness of the data are not guaranteed. Please do
not contact rail operators about this app.
