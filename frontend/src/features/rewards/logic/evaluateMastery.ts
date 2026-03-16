import { MASTERY_THRESHOLDS } from '../data/mastery'
import type { DrillMasteryProgress, RewardEvaluationInput, RewardFacts } from '../types'

function meetsThreshold(runs: number, averageAccuracy: number | null | undefined, minRuns: number, minAccuracy?: number): boolean {
  if (runs < minRuns) return false
  if (typeof minAccuracy !== 'number') return true
  if (typeof averageAccuracy !== 'number') return true
  return averageAccuracy >= minAccuracy
}

export function evaluateMastery(input: RewardEvaluationInput, facts: RewardFacts): DrillMasteryProgress[] {
  const unlocked: DrillMasteryProgress[] = []
  const uniqueDrills = new Map((input.currentSession.drills || []).map((drill) => [drill.id, drill]))

  for (const [drillId] of uniqueDrills) {
    const stats = facts.drillStatsById[drillId]
    if (!stats) continue

    for (const threshold of MASTERY_THRESHOLDS) {
      const masteryKey = `${drillId}:${threshold.tier}`
      if (input.rewardState.unlockedMasteries[masteryKey]) continue
      if (!meetsThreshold(stats.runs, stats.averageAccuracy, threshold.minRuns, threshold.minAccuracy)) continue

      unlocked.push({
        key: masteryKey,
        drillId,
        tier: threshold.tier,
        unlockedAt: input.context.completedAt,
        rewardPux: threshold.rewardPux,
        statsSnapshot: stats,
      })
    }
  }

  return unlocked
}
