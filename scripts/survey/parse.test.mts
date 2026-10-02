import { describe, expect, it } from "vitest";
import { MARUNOUCHI } from "../../src/data/network.ts";
import { exitsIn, parseStation } from "./parse.mts";

// Synthetic pages in the two layouts the source site uses (not copies of real pages).
const toc = "<p>このページの目次</p><p>『電車の停車位置』概要</p><p>対応エリア</p>";
const perPlatform = `${toc}
<p>停車位置(号車とドアの位置)詳細</p>
<p>1番線ホームには荻窪・方南町方面への列車が到着します。</p>
<p>A方面改札(A1・A2出口方面)</p><p>東西線乗り換え方面です。</p>
<p>上り階段・上りエスカレーター(1号車前方)</p>
<p>1号車の進行方向1番目のドア(『1号車1番ドア』)付近にあります。</p>
<p>2番線ホームには池袋方面への列車が到着します。</p>
<p>B方面改札(出口3-5方面)</p>
<p>エレベーター(4号車後方)</p>
<p>4号車の進行方向3番目のドア(『4号車1番ドア』)付近にあります。</p>
<p>上り階段(2号車前方)</p>
<p>2号車の進行方向2番目のドア(『2号車3番ドア』)付近にあります。</p>
<p>その他(乗り換え・駅周辺地図など)</p>`;

const perGate = `${toc}
<p>1番線ホームには荻窪方面への列車が到着します。</p><p>2番線ホームには池袋方面への列車が到着します。</p>
<p>中央改札(M1ーM7出口方面)</p><p>JR線・新幹線乗り換え方面です。</p>
<p>上り階段(1番線ホーム:2号車後方、2番線ホーム:2号車前方) ※こちらが便利です。</p>
<p>1番線ホーム(荻窪方面行き)</p><p>2号車の進行方向3番目のドア(『2号車3番ドア』)付近にあります。</p>
<p>2番線ホーム(池袋方面行き)</p><p>2号車の進行方向1番目、または2番目のドア(『2号車3番ドア』・『2号車2番ドア』)付近にあります。</p>
<p>その他(乗り換え)</p>`;

describe("survey parser", () => {
  it("reads per-platform pages and rejects entries whose door label contradicts the travel order", () => {
    const review: string[] = [];
    const st = parseStation(perPlatform, MARUNOUCHI, "M18", review);
    expect(st.points).toHaveLength(2);
    expect(st.points[0]).toMatchObject({ platform: 1, direction: "towardsFirst", exits: ["A1", "A2"], transfers: ["tozai"], doors: [{ car: 1, door: 1 }] });
    expect(st.points[1]).toMatchObject({ platform: 2, direction: "towardsLast", exits: ["3–5"], stepFree: true, doors: [{ car: 4, door: 1 }] });
    // Towards Ikebukuro the 2nd door of a car is labelled 2, not 3: the third entry is dropped.
    expect(review.filter((r) => r.startsWith("- REJECT"))).toHaveLength(1);
  });

  it("reads per-gate pages with both platforms in one section", () => {
    const st = parseStation(perGate, MARUNOUCHI, "M17", []);
    expect(st.points.map((p) => [p.platform, p.direction, p.doors])).toEqual([
      [1, "towardsFirst", [{ car: 2, door: 3 }]],
      [2, "towardsLast", [{ car: 2, door: 3 }, { car: 2, door: 2 }]],
    ]);
    expect(st.points[0]).toMatchObject({ kind: "上り階段", exits: ["M1–M7"], transfers: ["shinkansen", "jr"] });
  });

  it("extracts exit codes in the formats the site uses", () => {
    expect(exitsIn("西改札(A10ー18・B14ーB18出口方面)")).toEqual(["A10–18", "B14–B18"]);
    expect(exitsIn("国会議事堂方面改札(出口1-4方面)")).toEqual(["1–4"]);
    expect(exitsIn("外苑いちょう並木方面改札(出口4a・4b方面)")).toEqual(["4a", "4b"]);
    expect(exitsIn("西改札(西口方面)")).toEqual([]);
  });
});
