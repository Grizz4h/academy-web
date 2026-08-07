import { MASTERY_LABELS } from '../data/mastery'
import type { AchievementDefinition, DrillMasteryProgress, RewardEvent } from '../types'

function variantFromTier(tier: RewardEvent['visualTier']): RewardEvent['variant'] {
  if (tier === 'mastery') return 'hero'
  if (tier === 'gold') return 'popup'
  return 'small'
}

export function buildRewardEvents(params: {
  sessionId: string
  grantedPuxFromBase: number
  currencyDescriptions: string[]
  achievements: AchievementDefinition[]
  masteries: DrillMasteryProgress[]
}): RewardEvent[] {
  const events: RewardEvent[] = []

  if (params.grantedPuxFromBase > 0) {
    events.push({
      id: `${params.sessionId}:pux`,
      kind: 'currency',
      title: 'PUX! erhalten',
      description: params.currencyDescriptions.join(' · '),
      amountPux: params.grantedPuxFromBase,
      visualTier: 'silver',
      icon: 'PUX',
      autoCloseMs: 2600,
      variant: 'small',
    })
  }

  for (const achievement of params.achievements) {
    const amountPux = achievement.reward.PUX || 0
    events.push({
      id: `achievement:${achievement.id}`,
      kind: 'achievement',
      title: achievement.hidden ? 'Geheimer Erfolg' : achievement.title,
      description: achievement.hidden ? 'Neuer versteckter Unlock.' : achievement.description,
      amountPux: amountPux > 0 ? amountPux : undefined,
      visualTier: achievement.reward.visualTier || achievement.tier,
      icon: achievement.reward.icon,
      autoCloseMs: achievement.tier === 'mastery' ? 4200 : 3400,
      achievementId: achievement.id,
      variant: variantFromTier(achievement.reward.visualTier || achievement.tier),
      meta: { category: achievement.category, hidden: achievement.hidden },
    })
  }

  for (const mastery of params.masteries) {
    events.push({
      id: `mastery:${mastery.key}`,
      kind: 'mastery',
      title: `${MASTERY_LABELS[mastery.tier]} Mastery`,
      description: `Drill ${mastery.drillId} erreicht ${MASTERY_LABELS[mastery.tier]}.`,
      amountPux: mastery.rewardPux,
      visualTier: mastery.tier,
      icon: MASTERY_LABELS[mastery.tier].slice(0, 1),
      autoCloseMs: mastery.tier === 'mastery' ? 4200 : 3200,
      mastery: mastery.tier,
      variant: variantFromTier(mastery.tier),
      meta: { drillId: mastery.drillId },
    })
  }

  return events
}
