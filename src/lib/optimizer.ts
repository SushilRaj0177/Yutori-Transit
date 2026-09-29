// Pareto Optimization Engine
// Balances two objectives: comfort (low crowding) vs speed (proximity to transfer point)

export interface CarOption {
  carNumber: number;
  /** Congestion level 0-100 (0 = empty, 100 = packed) */
  congestion: number;
  /** Walking distance to transfer point in meters */
  walkDistance: number;
  /** Estimated walking time to transfer in seconds */
  walkTime: number;
}

export interface ScoredCarOption extends CarOption {
  /** Normalized comfort score 0-1 (1 = best) */
  comfortScore: number;
  /** Normalized speed score 0-1 (1 = best) */
  speedScore: number;
  /** Combined weighted score 0-1 */
  overallScore: number;
  /** Whether this option is on the Pareto frontier */
  isPareto: boolean;
  /** Rank among all options (1 = recommended) */
  rank: number;
}

export interface OptimizationConfig {
  /** Weight for comfort vs speed: 0 = pure speed, 1 = pure comfort, 0.5 = balanced */
  comfortWeight: number;
}

/**
 * Find the Pareto-optimal set of cars.
 * A car is Pareto-optimal if no other car is better in BOTH comfort AND speed.
 */
function findParetoFrontier(options: CarOption[]): Set<number> {
  const paretoSet = new Set<number>();

  for (let i = 0; i < options.length; i++) {
    let isDominated = false;

    for (let j = 0; j < options.length; j++) {
      if (i === j) continue;

      // j dominates i if j is at least as good in both objectives and strictly better in at least one
      const jBetterComfort = options[j].congestion <= options[i].congestion;
      const jBetterSpeed = options[j].walkDistance <= options[i].walkDistance;
      const jStrictlyBetter =
        options[j].congestion < options[i].congestion ||
        options[j].walkDistance < options[i].walkDistance;

      if (jBetterComfort && jBetterSpeed && jStrictlyBetter) {
        isDominated = true;
        break;
      }
    }

    if (!isDominated) {
      paretoSet.add(options[i].carNumber);
    }
  }

  return paretoSet;
}

/**
 * Score and rank all car options using weighted Pareto optimization.
 */
export function optimizeCars(
  options: CarOption[],
  config: OptimizationConfig = { comfortWeight: 0.5 }
): ScoredCarOption[] {
  if (options.length === 0) return [];

  const { comfortWeight } = config;
  const speedWeight = 1 - comfortWeight;

  // Find min/max for normalization
  const congestions = options.map((o) => o.congestion);
  const distances = options.map((o) => o.walkDistance);

  const minCongestion = Math.min(...congestions);
  const maxCongestion = Math.max(...congestions);
  const minDistance = Math.min(...distances);
  const maxDistance = Math.max(...distances);

  const congestionRange = maxCongestion - minCongestion || 1;
  const distanceRange = maxDistance - minDistance || 1;

  // Find Pareto frontier
  const paretoSet = findParetoFrontier(options);

  // Score each option
  const scored: ScoredCarOption[] = options.map((option) => {
    // Normalize: 1 = best, 0 = worst
    const comfortScore = 1 - (option.congestion - minCongestion) / congestionRange;
    const speedScore = 1 - (option.walkDistance - minDistance) / distanceRange;

    // Weighted combination
    const overallScore = comfortWeight * comfortScore + speedWeight * speedScore;

    return {
      ...option,
      comfortScore,
      speedScore,
      overallScore,
      isPareto: paretoSet.has(option.carNumber),
      rank: 0, // Will be set after sorting
    };
  });

  // Sort by overall score descending, then rank
  scored.sort((a, b) => b.overallScore - a.overallScore);
  scored.forEach((s, i) => {
    s.rank = i + 1;
  });

  return scored;
}

/**
 * Get a human-readable label for congestion level
 */
export function getCongestionLabel(congestion: number): {
  label: string;
  labelJa: string;
  color: string;
} {
  if (congestion <= 20) {
    return { label: "Empty", labelJa: "空いている", color: "#22c55e" };
  }
  if (congestion <= 40) {
    return { label: "Comfortable", labelJa: "余裕あり", color: "#84cc16" };
  }
  if (congestion <= 60) {
    return { label: "Moderate", labelJa: "普通", color: "#eab308" };
  }
  if (congestion <= 80) {
    return { label: "Crowded", labelJa: "混雑", color: "#f97316" };
  }
  return { label: "Packed", labelJa: "非常に混雑", color: "#ef4444" };
}

/**
 * Format walking time to a human-readable string
 */
export function formatWalkTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}
