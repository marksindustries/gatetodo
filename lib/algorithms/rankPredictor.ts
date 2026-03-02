/**
 * GATE CS rank estimation based on normalized score.
 * Uses historical GATE CS cutoffs lookup table.
 */

interface RankBand {
  minScore: number;
  maxScore: number;
  minRank: number;
  maxRank: number;
}

const RANK_TABLE: RankBand[] = [
  { minScore: 80, maxScore: 100, minRank: 100, maxRank: 300 },
  { minScore: 70, maxScore: 80, minRank: 300, maxRank: 800 },
  { minScore: 60, maxScore: 70, minRank: 800, maxRank: 2000 },
  { minScore: 50, maxScore: 60, minRank: 2000, maxRank: 5000 },
  { minScore: 40, maxScore: 50, minRank: 5000, maxRank: 10000 },
  { minScore: 0, maxScore: 40, minRank: 10000, maxRank: 50000 },
];

export function predictRank(normalizedScore: number): number {
  for (const band of RANK_TABLE) {
    if (normalizedScore >= band.minScore) {
      // Interpolate within the band
      const ratio = (normalizedScore - band.minScore) / (band.maxScore - band.minScore);
      const rank = Math.round(band.maxRank - ratio * (band.maxRank - band.minRank));
      return rank;
    }
  }
  return 50000;
}

export function predictPercentile(normalizedScore: number): number {
  // Approximate percentile from score (GATE CS ~200k candidates)
  if (normalizedScore >= 80) return 99.9;
  if (normalizedScore >= 70) return 99.5;
  if (normalizedScore >= 60) return 98;
  if (normalizedScore >= 50) return 95;
  if (normalizedScore >= 40) return 85;
  if (normalizedScore >= 30) return 70;
  return 50;
}
