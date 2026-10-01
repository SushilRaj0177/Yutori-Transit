/** Load % → colour. Stops chosen so that "full but seated-ish" (≈100%) reads amber, not red. */
const STOPS: [number, [number, number, number]][] = [
  [40, [47, 179, 128]],
  [80, [142, 196, 72]],
  [110, [240, 190, 50]],
  [145, [240, 133, 45]],
  [185, [226, 72, 77]],
];

export function loadColor(pct: number): string {
  if (pct <= STOPS[0][0]) return rgb(STOPS[0][1]);
  for (let i = 1; i < STOPS.length; i++) {
    const [p1, c1] = STOPS[i];
    const [p0, c0] = STOPS[i - 1];
    if (pct <= p1) {
      const k = (pct - p0) / (p1 - p0);
      return rgb([0, 1, 2].map((j) => c0[j] + (c1[j] - c0[j]) * k) as [number, number, number]);
    }
  }
  return rgb(STOPS[STOPS.length - 1][1]);
}

const rgb = ([r, g, b]: [number, number, number]) => `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)})`;

export function loadWord(pct: number, lang: "en" | "ja"): string {
  const words: [number, string, string][] = [
    [60, "Seats free", "座れる"],
    [100, "Standing room", "立っても余裕"],
    [140, "Crowded", "混雑"],
    [180, "Packed", "かなり混雑"],
    [Infinity, "Crush", "満員"],
  ];
  const w = words.find(([lim]) => pct <= lim)!;
  return lang === "en" ? w[1] : w[2];
}

/** Relative crowding (estimates): three calm steps, not a fake-precise gradient. */
export function crowdColor(level: "quieter" | "average" | "busier"): string {
  return level === "quieter" ? "rgb(110 196 140)" : level === "average" ? "rgb(240 200 90)" : "rgb(240 140 80)";
}
