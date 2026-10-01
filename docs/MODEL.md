# Model

Yutori picks a boarding position (car, door) for a trip on one Tokyo Metro line.
It trades off two things the rider feels: how long it takes to get from the
train door to the stairs/escalator/elevator they need at the destination, and how
crowded the car is on the way.

All of the code below is in `src/engine/` and is pure TypeScript with no framework
dependencies. It runs in the browser, so moving the slider re-solves instantly
with no server round trip.

## 1. Platform coordinates — `geometry.ts`

The stopped train is a 1-D axis in metres, starting at the car-1 end.

```
X_door(c, d) = (c − 1)(L_car + L_gap) + DoorOffset(d)
walk(c, d)   = | X_door(c, d) − X_egress |
egress(c, d) = walk / v_walk + alight(load_c) + penalty(kind)
alight(l)    = max(0, l − 100) / 100 · 15 s
```

| Symbol | Value | Status |
|---|---|---|
| `L_car` | 18 m (Marunouchi), 16 m (Ginza) | public rolling-stock spec, to re-check |
| doors per car | 3 (both lines) | public rolling-stock spec, to re-check |
| `DoorOffset` | evenly spaced: `L·(2d−1)/(2M)` | approximation |
| `L_gap` | 0.6 m | assumption |
| `v_walk` | 1.25 m/s | assumption (unhurried adult on a platform) |
| alighting delay | +15 s per 100 points above 100 % load | assumption |
| penalty | stairs 0 s, escalator 4 s, elevator 30 s | assumption |

`egress` is what the slider's "faster exit" side minimises. The time penalty for
elevators means the engine will not send someone to a lift unless they choose
that exit, in which case it is the only target anyway.

## 2. Crowding — `crowding.ts`

**No per-car load is fetched from ODPT today**, because this project has not
found a public per-car load field (see `docs/DATA.md`). When none is available,
the app uses this model and labels every number it produces as an estimate.

```
load(c) = mean · (1 + A · (k̂(c) − mean_c k̂))
mean    = peak_line · τ(hour, day) · (1 + δ(delay))
k(c)    = Σ_h  w_h · exp(−(dist(centre_c, h) / σ)²),   k̂ = k / max k
```

* **Hotspots `h`**: stairs/escalators at the boarding station (weight 1, where
  people get on) and at every station ahead that has a layout (weight 0.6, where
  people position themselves to get off). With no layout on the stretch, a single
  central staircase is assumed.
* **`τ`**: a time-of-day curve with a sharp weekday 08:10 peak, a broader 18:20
  peak and a quiet late night. Weekends are flatter. Japanese public holidays are
  not modelled yet and count as weekdays.
* **`δ`**: up to +20 % for a 10-minute delay of the next train (passengers build
  up on the platform). This is the main way live data feeds into the estimate.
* `σ = 22 m`, `A = 0.55`, `peak_line` = 140 % (Marunouchi), 135 % (Ginza). These
  are **assumptions**, not published congestion rates. They are kept in one
  place so they can be calibrated.

What the model is good for: ranking cars within one train (middle vs. ends,
near stairs vs. far). What it is not: an absolute crowding measurement. The UI
avoids presenting it as one.

## 3. Optimisation — `pareto.ts`

Objectives (both minimised): `egress(c, d)` and `load(c)`.

**Pareto frontier.** `a` dominates `b` if `a` is no worse on both objectives and
strictly better on one. The frontier is computed in O(n log n): sort by time,
group exact ties, and sweep while keeping the lowest load seen among strictly
faster candidates. A property test checks it against the O(n²) definition on
300 random inputs with many ties.

**Scalarisation.** The slider weight `w ∈ [0, 1]` picks one frontier point:

```
J(c, d) = w · min(1, egress/90 s) + (1 − w) · clamp((load − 50) / 150)
```

The first version of this project min–max normalised both objectives over the
candidates, as in the original specification. That was dropped: at midday every
car had seats (42–54 %), but min–max stretched that 12-point spread to the full
[0, 1] range, and the solver started trading real walking time for crowding
differences nobody could feel. Fixed scales mean "no discomfort while seats are
free, worst case at 200 %", and the slider means the same thing at every station
and time of day.

With `0 < w < 1` the minimiser of a positively weighted sum is always on the
frontier. At the endpoints, ties are broken by the other objective, so the pick
stays non-dominated there as well (this is tested).

**Breakpoints.** The engine sweeps `w` across 101 steps and reports the ranges
where the answer does not change. The UI draws these on the slider track, so the
user can see when a trip has no trade-off at all.

**Cost.** For a 10-car, 4-door train (40 candidates) one solve takes well under
2 ms (asserted in the tests).

## 4. How much to trust the answer — `stability.ts`

Because the loads are usually estimates, the engine checks how sensitive the
answer is to them. It runs 200 trials in which each car's load is multiplied by
`exp(N(0, 0.2²))` (0.1 when the loads are live), re-solves each one, and counts
how often the same car wins. A seeded PRNG keeps the result reproducible. At 70 %
or more the UI shows "Solid pick"; below that it shows "Close call", and the
explanation says so.

## 5. Explanation — `src/core/explain.ts`, `src/server/narrate.ts`

1. A deterministic template turns the solution into one or two sentences in English
   and Japanese. This is always shown first.
2. If `GROQ_API_KEY` is set, an LLM may rephrase those facts. The server
   recomputes the plan itself (the client sends only the query), so the model
   only ever sees engine output.
3. `checkNarration` rejects any output that cites a number not derivable from
   the facts, skips the recommended car, misses a language, or runs too long. On
   rejection the template stays. The template passes the same check in the tests.

The LLM never chooses anything.

## 6. Calibration plan (open)

* Survey real egress positions for the demo stations (`docs/DATA.md`).
* Replace `peak_line` with a published figure, with its source cited.
* Fit `σ` and `A` against per-car observations (manual counts on a few trains,
  or a per-car feed if one becomes available) and report the error.
* Model Japanese public holidays.
