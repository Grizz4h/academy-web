import { buildRewardEvents } from './buildRewardEvents'
import { deriveRewardFacts } from './deriveRewardFacts'
import { evaluateAchievements } from './evaluateAchievements'
import { evaluateBaseRewards } from './evaluateBaseRewards'
import { evaluateMastery } from './evaluateMastery'
import type { RewardEvaluationInput, RewardEvaluationResult } from '../types'

export function evaluateSessionRewards(input: RewardEvaluationInput): RewardEvaluationResult {
  const facts = deriveRewardFacts(input)
  const currencyGrants = evaluateBaseRewards(input, facts)
  const unlockedAchievements = evaluateAchievements(input, facts)
  const unlockedMasteries = evaluateMastery(input, facts)

  const basePux = currencyGrants.reduce((sum, reward) => sum + reward.amountPux, 0)
  const achievementPux = unlockedAchievements.reduce((sum, achievement) => sum + (achievement.reward.PUX || 0), 0)
  const masteryPux = unlockedMasteries.reduce((sum, mastery) => sum + mastery.rewardPux, 0)
  const grantedPux = basePux + achievementPux + masteryPux

  const rewardEvents = buildRewardEvents({
    sessionId: input.currentSession.id,
    grantedPuxFromBase: basePux,
    currencyDescriptions: currencyGrants.map((reward) => reward.title),
    achievements: unlockedAchievements,
    masteries: unlockedMasteries,
  })

  return {
    sessionId: input.currentSession.id,
    grantedPux,
    currencyGrants,
    unlockedAchievements,
    unlockedMasteries,
    rewardEvents,
    evaluatedAt: input.context.completedAt,
  }
}
