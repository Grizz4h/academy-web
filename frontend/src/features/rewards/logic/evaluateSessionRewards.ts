import { buildRewardEvents } from './buildRewardEvents'
import { deriveRewardFacts } from './deriveRewardFacts'
import { evaluateAchievements } from './evaluateAchievements'
import { evaluateBaseRewards } from './evaluateBaseRewards'
import { evaluateMastery } from './evaluateMastery'
import type { RewardEvaluationInput, RewardEvaluationResult } from '../types'
import { getRealSessions, isProgressionEligibleSession } from '../../../utils/sessionEligibility'

export function evaluateSessionRewards(input: RewardEvaluationInput): RewardEvaluationResult {
  if (!isProgressionEligibleSession(input.currentSession)) {
    return {
      sessionId: input.currentSession.id,
      grantedPux: 0,
      currencyGrants: [],
      unlockedAchievements: [],
      unlockedMasteries: [],
      rewardEvents: [],
      evaluatedAt: input.context.completedAt,
    }
  }

  const eligibleInput: RewardEvaluationInput = {
    ...input,
    sessions: getRealSessions(input.sessions),
  }

  const facts = deriveRewardFacts(eligibleInput)
  const currencyGrants = evaluateBaseRewards(eligibleInput, facts)
  const unlockedAchievements = evaluateAchievements(eligibleInput, facts)
  const unlockedMasteries = evaluateMastery(eligibleInput, facts)

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
