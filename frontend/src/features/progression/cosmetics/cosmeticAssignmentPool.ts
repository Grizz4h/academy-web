import { COLLECTIONS } from '../collections/collectionCatalog'
import { TANK_ACHIEVEMENTS } from '../achievements/achievementCatalog'
import { LEVEL_REWARDS } from '../levelSystem'
import { TRACK_MASTERY_DEFINITIONS } from '../mastery/masteryCatalog'
import { SHOP_LISTINGS } from '../shop/shopCatalog'
import type { CosmeticDefinition, RewardGrant } from '../types'
import { COSMETIC_CATALOG, isStarterCosmetic } from './cosmeticCatalog'

export type CosmeticAssignmentSource = {
  type: 'starter' | 'achievement' | 'collection' | 'challenge' | 'level' | 'mastery' | 'event' | 'shop_listing'
  id: string
  label: string
}

export type CosmeticPoolEntry = {
  definition: CosmeticDefinition
  /** Why it sits in the unassigned / parked pool. */
  poolReason: 'shop_parked' | 'secret' | 'no_grant'
  hardSources: CosmeticAssignmentSource[]
}

function collectCosmeticGrants(rewards: RewardGrant[] | undefined, into: Map<string, CosmeticAssignmentSource[]>, source: CosmeticAssignmentSource) {
  for (const reward of rewards || []) {
    if (reward.type !== 'cosmetic') continue
    const list = into.get(reward.cosmeticId) || []
    list.push(source)
    into.set(reward.cosmeticId, list)
  }
}

/** Cosmetics that already have a concrete progression/shop grant path. */
export function buildHardCosmeticSources(): Map<string, CosmeticAssignmentSource[]> {
  const sources = new Map<string, CosmeticAssignmentSource[]>()

  for (const cosmetic of COSMETIC_CATALOG) {
    if (isStarterCosmetic(cosmetic.id) || cosmetic.origin.type === 'starter') {
      const list = sources.get(cosmetic.id) || []
      list.push({ type: 'starter', id: 'starter', label: 'Starter' })
      sources.set(cosmetic.id, list)
    }
    const origin = cosmetic.origin
    if (origin.type === 'achievement') {
      const list = sources.get(cosmetic.id) || []
      list.push({ type: 'achievement', id: origin.achievementId, label: `Origin · ${origin.achievementId}` })
      sources.set(cosmetic.id, list)
    }
    if (origin.type === 'collection') {
      const list = sources.get(cosmetic.id) || []
      list.push({ type: 'collection', id: origin.collectionId, label: `Origin · ${origin.collectionId}` })
      sources.set(cosmetic.id, list)
    }
    if (origin.type === 'challenge') {
      const list = sources.get(cosmetic.id) || []
      list.push({ type: 'challenge', id: origin.challengeId, label: `Origin · ${origin.challengeId}` })
      sources.set(cosmetic.id, list)
    }
    if (origin.type === 'level') {
      const list = sources.get(cosmetic.id) || []
      list.push({ type: 'level', id: `level_${origin.level}`, label: `Level ${origin.level}` })
      sources.set(cosmetic.id, list)
    }
    if (origin.type === 'track_mastery') {
      const list = sources.get(cosmetic.id) || []
      list.push({ type: 'mastery', id: origin.trackId, label: `Mastery · ${origin.trackId}` })
      sources.set(cosmetic.id, list)
    }
    if (origin.type === 'event') {
      const list = sources.get(cosmetic.id) || []
      list.push({ type: 'event', id: origin.eventId, label: `Event · ${origin.eventId}` })
      sources.set(cosmetic.id, list)
    }
  }

  for (const achievement of TANK_ACHIEVEMENTS) {
    collectCosmeticGrants(achievement.rewards, sources, {
      type: 'achievement',
      id: achievement.id,
      label: achievement.name,
    })
  }

  for (const collection of COLLECTIONS) {
    collectCosmeticGrants(collection.completionRewards, sources, {
      type: 'collection',
      id: collection.id,
      label: collection.name,
    })
  }

  for (const level of LEVEL_REWARDS) {
    collectCosmeticGrants(level.rewards, sources, {
      type: 'level',
      id: `level_${level.level}`,
      label: `Level ${level.level}`,
    })
  }

  for (const mastery of TRACK_MASTERY_DEFINITIONS) {
    for (const milestone of mastery.milestones) {
      collectCosmeticGrants(milestone.rewards, sources, {
        type: 'mastery',
        id: `${mastery.targetId}:${milestone.threshold}`,
        label: `${mastery.name} · ${milestone.label}`,
      })
    }
  }

  for (const listing of SHOP_LISTINGS) {
    const list = sources.get(listing.cosmeticId) || []
    list.push({ type: 'shop_listing', id: listing.id, label: `Shop · ${listing.id}` })
    sources.set(listing.cosmeticId, list)
  }

  return sources
}

/**
 * Cosmetics still parked for later assignment (shop empty / secret / no grant).
 * Keep in catalog; hang achievements or shop listings over time.
 */
export function selectUnassignedCosmeticPool(): CosmeticPoolEntry[] {
  const hard = buildHardCosmeticSources()
  const pool: CosmeticPoolEntry[] = []

  for (const definition of COSMETIC_CATALOG) {
    const hardSources = hard.get(definition.id) || []
    if (hardSources.length > 0) continue

    const originType = definition.origin.type
    const poolReason: CosmeticPoolEntry['poolReason'] =
      originType === 'secret' ? 'secret' : originType === 'pux_shop' ? 'shop_parked' : 'no_grant'

    pool.push({ definition, poolReason, hardSources })
  }

  return pool.sort((a, b) => {
    const typeCmp = a.definition.type.localeCompare(b.definition.type)
    if (typeCmp !== 0) return typeCmp
    return a.definition.id.localeCompare(b.definition.id)
  })
}

export function poolReasonLabel(reason: CosmeticPoolEntry['poolReason']): string {
  switch (reason) {
    case 'shop_parked':
      return 'Shop-Vorrat (Listing leer)'
    case 'secret':
      return 'Secret / Silhouette'
    default:
      return 'Kein Grant-Pfad'
  }
}
