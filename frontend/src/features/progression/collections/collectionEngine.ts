import { getCosmetic } from '../cosmetics/cosmeticCatalog'
import { COLLECTIONS, collectionCompletionEventId } from './collectionCatalog'
import type {
  CollectionDefinition,
  CosmeticUnlock,
  ProgressionApplyResult,
  RewardGrant,
  UnlockHistoryEntry,
} from '../types'

export type CollectionProgress = {
  collection: CollectionDefinition
  owned: number
  total: number
  ratio: number
  completed: boolean
  missingIds: string[]
  ownedIds: string[]
}

export function selectCollectionProgress(
  unlockedCosmetics: Record<string, CosmeticUnlock>,
  starterOwned: (id: string) => boolean,
): CollectionProgress[] {
  return COLLECTIONS.filter((collection) => collection.visibility !== 'secret').map((collection) => {
    const ownedIds: string[] = []
    const missingIds: string[] = []
    for (const itemId of collection.itemIds) {
      if (unlockedCosmetics[itemId] || starterOwned(itemId)) ownedIds.push(itemId)
      else missingIds.push(itemId)
    }
    const owned = ownedIds.length
    const total = collection.itemIds.length
    return {
      collection,
      owned,
      total,
      ratio: total > 0 ? owned / total : 0,
      completed: total > 0 && owned >= total,
      missingIds,
      ownedIds,
    }
  })
}

function applyGrants(
  grants: RewardGrant[],
  ctx: {
    occurredAt: string
    eventId: string
    sourceType: string
    sourceId: string
    already: Record<string, CosmeticUnlock>
  },
): { xp: number; pux: number; cosmetics: CosmeticUnlock[]; history: UnlockHistoryEntry[] } {
  let xp = 0
  let pux = 0
  const cosmetics: CosmeticUnlock[] = []
  const history: UnlockHistoryEntry[] = []
  for (const grant of grants) {
    if (grant.type === 'xp') {
      xp += grant.amount
      continue
    }
    if (grant.type === 'pux') {
      pux += grant.amount
      continue
    }
    if (ctx.already[grant.cosmeticId] || cosmetics.some((c) => c.cosmeticId === grant.cosmeticId)) continue
    const def = getCosmetic(grant.cosmeticId)
    const unlock: CosmeticUnlock = {
      cosmeticId: grant.cosmeticId,
      unlockedAt: ctx.occurredAt,
      sourceType: ctx.sourceType,
      sourceId: ctx.sourceId,
      earnKind: 'derived',
    }
    cosmetics.push(unlock)
    history.push({
      id: `cosmetic:${grant.cosmeticId}:${ctx.eventId}`,
      kind: 'cosmetic',
      title: def?.name || grant.cosmeticId,
      description: 'Collection Reward',
      occurredAt: ctx.occurredAt,
      sourceEventId: ctx.eventId,
      cosmeticId: grant.cosmeticId,
      collectionId: ctx.sourceId,
    })
  }
  return { xp, pux, cosmetics, history }
}

/**
 * Grant completion rewards for newly completed collections.
 * Idempotent via processedEvents[collection_completed:{id}].
 */
export function evaluateCollectionCompletions(input: {
  unlockedCosmetics: Record<string, CosmeticUnlock>
  processedEvents: Record<string, unknown>
  starterOwned: (id: string) => boolean
  occurredAt?: string
}): Pick<
  ProgressionApplyResult,
  'grantedXp' | 'grantedPux' | 'unlockedCosmetics' | 'unlockHistory' | 'rewardEvents' | 'completedCollections'
> & { processedEventIds: string[] } {
  const occurredAt = input.occurredAt || new Date().toISOString()
  const working = { ...input.unlockedCosmetics }
  let grantedXp = 0
  let grantedPux = 0
  const unlockedCosmetics: CosmeticUnlock[] = []
  const unlockHistory: UnlockHistoryEntry[] = []
  const rewardEvents: Array<Record<string, unknown>> = []
  const completedCollections: string[] = []
  const processedEventIds: string[] = []

  // Multiple passes: completing A may unlock item that completes B.
  for (let round = 0; round < 4; round += 1) {
    let progressed = false
    const progress = selectCollectionProgress(working, input.starterOwned)
    for (const item of progress) {
      if (!item.completed) continue
      const eventId = collectionCompletionEventId(item.collection.id)
      if (input.processedEvents[eventId] || processedEventIds.includes(eventId)) continue
      const rewards = item.collection.completionRewards || []
      const applied = applyGrants(rewards, {
        occurredAt,
        eventId,
        sourceType: 'collection',
        sourceId: item.collection.id,
        already: working,
      })
      grantedXp += applied.xp
      grantedPux += applied.pux
      for (const cosmetic of applied.cosmetics) {
        unlockedCosmetics.push(cosmetic)
        working[cosmetic.cosmeticId] = cosmetic
      }
      unlockHistory.push({
        id: `collection:${item.collection.id}`,
        kind: 'collection',
        title: `Collection Complete · ${item.collection.name}`,
        description: `${item.owned} / ${item.total}`,
        occurredAt,
        sourceEventId: eventId,
        collectionId: item.collection.id,
        amountXp: applied.xp,
        amountPux: applied.pux,
      })
      unlockHistory.push(...applied.history)
      rewardEvents.push({
        id: eventId,
        kind: 'system',
        title: 'Collection Complete',
        description: item.collection.name,
        variant: 'popup',
        visualTier: 'gold',
        icon: '🗂️',
      })
      completedCollections.push(item.collection.id)
      processedEventIds.push(eventId)
      progressed = true
    }
    if (!progressed) break
  }

  return {
    grantedXp,
    grantedPux,
    unlockedCosmetics,
    unlockHistory,
    rewardEvents,
    completedCollections,
    processedEventIds,
  }
}
