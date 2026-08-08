import type { BaseRewardGrant, RewardEvaluationInput, RewardFacts } from '../types'
import { isProgressionEligibleSession } from '../../../utils/sessionEligibility'

export function evaluateBaseRewards(input: RewardEvaluationInput, facts: RewardFacts): BaseRewardGrant[] {
  if (!isProgressionEligibleSession(input.currentSession)) {
    return []
  }

  if (input.rewardState.processedSessions[input.currentSession.id]) {
    return []
  }

  const rewards: BaseRewardGrant[] = [
    {
      id: `${input.currentSession.id}:completion`,
      reason: 'completion',
      title: 'Session abgeschlossen',
      description: 'Grundreward fuer einen abgeschlossenen Drill-Block.',
      amountPux: 10,
      visualTier: 'silver',
      variant: 'small',
    },
  ]

  if (facts.currentStreakDays >= 3) {
    rewards.push({
      id: `${input.currentSession.id}:streak`,
      reason: 'streak_bonus',
      title: 'Streak-Bonus',
      description: `${facts.currentStreakDays} aktive Tage in Folge.`,
      amountPux: 5,
      visualTier: 'gold',
      variant: 'small',
    })
  }

  const accuracy = input.context.performance?.accuracy
  if (typeof accuracy === 'number' && accuracy >= 0.85) {
    rewards.push({
      id: `${input.currentSession.id}:performance`,
      reason: 'performance_bonus',
      title: 'Performance-Bonus',
      description: 'Vorbereitete Bonuslogik fuer starke Accuracy.',
      amountPux: 5,
      visualTier: 'gold',
      variant: 'small',
    })
  }

  if (input.context.performance?.perfect) {
    rewards.push({
      id: `${input.currentSession.id}:perfect`,
      reason: 'perfect_bonus',
      title: 'Perfect Drill Bonus',
      description: 'Vorbereiteter Bonus fuer perfekte Runs.',
      amountPux: 20,
      visualTier: 'mastery',
      variant: 'popup',
    })
  }

  return rewards
}
