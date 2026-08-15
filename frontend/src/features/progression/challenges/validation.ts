import { COLLECTIONS } from '../collections/collectionCatalog'
import { COSMETIC_CATALOG, getCosmetic, isStarterCosmetic } from '../cosmetics/cosmeticCatalog'
import { SHOP_LISTINGS } from '../shop/shopCatalog'
import { TANK_ACHIEVEMENTS } from '../achievements/achievementCatalog'
import { CHALLENGE_EVENT_TYPES } from '../types'
import type { CampaignDefinition, ChallengeDefinition, ChallengePool, ContentIssue, RewardReachability } from './types'

const KNOWN_EVENTS = new Set<string>(CHALLENGE_EVENT_TYPES)

export function validateContent(input: {
  challenges: ChallengeDefinition[]
  campaigns?: CampaignDefinition[]
  pools?: ChallengePool[]
}): ContentIssue[] {
  const issues: ContentIssue[] = []
  const challengeIds = new Set<string>()

  for (const challenge of input.challenges) {
    if (challengeIds.has(challenge.id)) {
      issues.push({
        severity: 'error',
        code: 'duplicate_id',
        message: `Doppelte Challenge-ID ${challenge.id}`,
        entityType: 'challenge',
        entityId: challenge.id,
      })
    }
    challengeIds.add(challenge.id)

    if (!challenge.title || !challenge.requirements?.length) {
      issues.push({
        severity: 'error',
        code: 'invalid_challenge',
        message: `Challenge ${challenge.id} braucht Titel und mindestens ein Requirement`,
        entityType: 'challenge',
        entityId: challenge.id,
      })
    }

    for (const requirement of challenge.requirements || []) {
      if (!requirement.id || !requirement.target || requirement.target < 1) {
        issues.push({
          severity: 'error',
          code: 'invalid_requirement',
          message: `Ungültiges Requirement in ${challenge.id}`,
          entityType: 'challenge',
          entityId: challenge.id,
        })
      }
      if (!KNOWN_EVENTS.has(requirement.eventType)) {
        issues.push({
          severity: 'error',
          code: 'unknown_event_type',
          message: `Unbekannter Event-Type ${requirement.eventType} in ${challenge.id}`,
          entityType: 'event',
          entityId: challenge.id,
        })
      }
    }

    if (!challenge.rewards?.length) {
      issues.push({
        severity: 'warning',
        code: 'no_rewards',
        message: `Challenge ${challenge.id} hat keine Rewards`,
        entityType: 'challenge',
        entityId: challenge.id,
      })
    }

    for (const reward of challenge.rewards || []) {
      if (reward.type === 'cosmetic' && !getCosmetic(reward.cosmeticId)) {
        issues.push({
          severity: 'error',
          code: 'unknown_reward',
          message: `Challenge ${challenge.id} referenziert unbekanntes Cosmetic ${reward.cosmeticId}`,
          entityType: 'reward',
          entityId: reward.cosmeticId,
        })
      }
    }

    if (challenge.collectionId && !COLLECTIONS.some((item) => item.id === challenge.collectionId)) {
      issues.push({
        severity: 'error',
        code: 'unknown_collection',
        message: `Challenge ${challenge.id} referenziert unbekannte Collection ${challenge.collectionId}`,
        entityType: 'collection',
        entityId: challenge.collectionId,
      })
    }
  }

  for (const pool of input.pools || []) {
    for (const id of pool.challengeIds) {
      if (!challengeIds.has(id)) {
        issues.push({
          severity: 'error',
          code: 'unknown_challenge',
          message: `Pool ${pool.id} referenziert unbekannte Challenge ${id}`,
          entityType: 'pool',
          entityId: pool.id,
        })
      }
    }
  }

  for (const campaign of input.campaigns || []) {
    if (!campaign.startsAt || !campaign.endsAt) {
      issues.push({
        severity: 'error',
        code: 'invalid_availability',
        message: `Campaign ${campaign.id} braucht startsAt und endsAt`,
        entityType: 'campaign',
        entityId: campaign.id,
      })
    }
    for (const id of campaign.challengeIds) {
      if (!challengeIds.has(id)) {
        issues.push({
          severity: 'error',
          code: 'unknown_challenge',
          message: `Campaign ${campaign.id} referenziert unbekannte Challenge ${id}`,
          entityType: 'campaign',
          entityId: campaign.id,
        })
      }
    }
    if (campaign.collectionId && !COLLECTIONS.some((item) => item.id === campaign.collectionId)) {
      issues.push({
        severity: 'error',
        code: 'unknown_collection',
        message: `Campaign ${campaign.id} referenziert unbekannte Collection ${campaign.collectionId}`,
        entityType: 'collection',
        entityId: campaign.collectionId,
      })
    }
  }

  for (const collection of COLLECTIONS) {
    for (const itemId of collection.itemIds) {
      if (!getCosmetic(itemId) && !isStarterCosmetic(itemId)) {
        issues.push({
          severity: 'error',
          code: 'unknown_item',
          message: `Collection ${collection.id} referenziert unbekanntes Item ${itemId}`,
          entityType: 'collection',
          entityId: collection.id,
        })
      }
    }
  }

  return issues
}

export function auditRewardReachability(input: {
  challenges: ChallengeDefinition[]
}): RewardReachability[] {
  const sourcesByReward = new Map<string, RewardReachability['sources']>()

  const add = (rewardId: string, source: RewardReachability['sources'][number]) => {
    const list = sourcesByReward.get(rewardId) || []
    list.push(source)
    sourcesByReward.set(rewardId, list)
  }

  for (const cosmetic of COSMETIC_CATALOG) {
    const origin = cosmetic.origin
    if (origin.type === 'starter') add(cosmetic.id, { type: 'starter', id: 'starter', label: 'Starter' })
    if (origin.type === 'pux_shop') add(cosmetic.id, { type: 'shop', id: cosmetic.id, label: 'Pux Shop' })
    if (origin.type === 'achievement') add(cosmetic.id, { type: 'achievement', id: origin.achievementId, label: `Achievement · ${origin.achievementId}` })
    if (origin.type === 'collection') add(cosmetic.id, { type: 'collection', id: origin.collectionId, label: `Collection · ${origin.collectionId}` })
    if (origin.type === 'challenge') add(cosmetic.id, { type: 'challenge', id: origin.challengeId, label: `Challenge · ${origin.challengeId}` })
    if (origin.type === 'level') add(cosmetic.id, { type: 'level', id: `level_${origin.level}`, label: `Level ${origin.level}` })
    if (origin.type === 'track_mastery') add(cosmetic.id, { type: 'mastery', id: origin.trackId, label: `Mastery · ${origin.trackId}` })
    if (origin.type === 'event') add(cosmetic.id, { type: 'event', id: origin.eventId, label: `Event · ${origin.eventId}` })
  }

  for (const listing of SHOP_LISTINGS) {
    add(listing.cosmeticId, { type: 'shop', id: listing.id, label: `Shop · ${listing.id}` })
  }

  for (const achievement of TANK_ACHIEVEMENTS) {
    for (const reward of achievement.rewards) {
      if (reward.type === 'cosmetic') {
        add(reward.cosmeticId, { type: 'achievement', id: achievement.id, label: achievement.name })
      }
    }
  }

  for (const collection of COLLECTIONS) {
    for (const reward of collection.completionRewards || []) {
      if (reward.type === 'cosmetic') {
        add(reward.cosmeticId, { type: 'collection', id: collection.id, label: collection.name })
      }
    }
  }

  for (const challenge of input.challenges) {
    if (!challenge.enabled) continue
    for (const reward of challenge.rewards) {
      if (reward.type === 'cosmetic') {
        add(reward.cosmeticId, { type: 'challenge', id: challenge.id, label: challenge.title })
      }
      if (reward.type === 'pux') add('PUX', { type: 'challenge', id: challenge.id, label: challenge.title })
      if (reward.type === 'xp') add('XP', { type: 'challenge', id: challenge.id, label: challenge.title })
    }
  }

  const rewardIds = new Set<string>([
    ...COSMETIC_CATALOG.map((item) => item.id),
    ...Array.from(sourcesByReward.keys()),
  ])

  return Array.from(rewardIds).sort().map((rewardId) => {
    const sources = sourcesByReward.get(rewardId) || []
    return {
      rewardId,
      reachable: sources.length > 0,
      sources,
    }
  })
}
