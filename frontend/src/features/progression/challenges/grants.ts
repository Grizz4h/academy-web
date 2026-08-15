import { getCosmetic } from '../cosmetics/cosmeticCatalog'
import type { CosmeticUnlock, PuxTransaction, UnlockHistoryEntry } from '../types'
import type { ChallengeDefinition, ChallengeProgress } from './types'
import { challengeCompletionEventId } from './ids'

export function applyChallengeRewards(input: {
  definition: ChallengeDefinition
  progress: ChallengeProgress
  occurredAt: string
  alreadyCosmetics: Record<string, CosmeticUnlock>
}): {
  xp: number
  pux: number
  cosmetics: CosmeticUnlock[]
  history: UnlockHistoryEntry[]
  puxTransactions: PuxTransaction[]
  rewardEvents: Array<Record<string, unknown>>
} {
  const eventId = challengeCompletionEventId(input.progress.instanceKey)
  let xp = 0
  let pux = 0
  const cosmetics: CosmeticUnlock[] = []
  const history: UnlockHistoryEntry[] = []
  const puxTransactions: PuxTransaction[] = []
  const rewardEvents: Array<Record<string, unknown>> = []

  for (const grant of input.definition.rewards) {
    if (grant.type === 'xp') {
      xp += grant.amount
      continue
    }
    if (grant.type === 'pux') {
      pux += grant.amount
      continue
    }
    if (grant.type === 'cosmetic') {
      if (input.alreadyCosmetics[grant.cosmeticId] || cosmetics.some((item) => item.cosmeticId === grant.cosmeticId)) {
        continue
      }
      const def = getCosmetic(grant.cosmeticId)
      cosmetics.push({
        cosmeticId: grant.cosmeticId,
        unlockedAt: input.occurredAt,
        sourceType: 'challenge',
        sourceId: input.definition.id,
        earnKind: 'derived',
      })
      history.push({
        id: `cosmetic:${grant.cosmeticId}:${eventId}`,
        kind: 'cosmetic',
        title: def?.name || grant.cosmeticId,
        description: def ? `${def.type} · ${def.rarity}` : undefined,
        occurredAt: input.occurredAt,
        sourceEventId: eventId,
        cosmeticId: grant.cosmeticId,
        challengeId: input.definition.id,
        collectionId: def?.collectionId,
      })
    }
  }

  history.unshift({
    id: `challenge:${input.progress.instanceKey}`,
    kind: 'challenge',
    title: input.definition.title,
    description: 'Challenge abgeschlossen',
    occurredAt: input.occurredAt,
    sourceEventId: eventId,
    challengeId: input.definition.id,
    amountXp: xp || undefined,
    amountPux: pux || undefined,
  })

  if (pux > 0) {
    puxTransactions.push({
      id: `pux:challenge:${input.progress.instanceKey}`,
      type: 'earn',
      amount: pux,
      sourceType: 'challenge',
      sourceId: input.definition.id,
      occurredAt: input.occurredAt,
    })
  }

  const rewardBits = [
    xp > 0 ? `+${xp} XP` : '',
    pux > 0 ? `+${pux} PUX` : '',
    cosmetics[0] ? getCosmetic(cosmetics[0].cosmeticId)?.name || cosmetics[0].cosmeticId : '',
  ].filter(Boolean)

  rewardEvents.push({
    id: eventId,
    kind: 'system',
    title: 'Challenge complete',
    description: `${input.definition.title}${rewardBits.length ? ` · ${rewardBits.join(' · ')}` : ''}`,
    amountPux: pux || undefined,
    variant: 'popup',
    visualTier: 'gold',
    icon: input.definition.presentation?.icon || '🎯',
    meta: { challengeId: input.definition.id, amountXp: xp },
  })

  return { xp, pux, cosmetics, history, puxTransactions, rewardEvents }
}
