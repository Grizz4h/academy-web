import type { MasteryThreshold } from '../types'

export const MASTERY_THRESHOLDS: MasteryThreshold[] = [
  { tier: 'bronze', minRuns: 1, rewardPux: 10 },
  { tier: 'silver', minRuns: 3, minAccuracy: 0.7, rewardPux: 15 },
  { tier: 'gold', minRuns: 5, minAccuracy: 0.85, rewardPux: 25 },
  { tier: 'mastery', minRuns: 8, minAccuracy: 0.95, rewardPux: 40 },
]

export const MASTERY_LABELS = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  mastery: 'Mastery',
} as const
