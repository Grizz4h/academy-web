import type { Session } from '../../../api'
import { isProgressionEligibleSession } from '../../../utils/sessionEligibility'
import { getCosmetic } from '../cosmetics/cosmeticCatalog'
import {
  DRILL_MASTERY_MILESTONES,
  TRACK_MASTERY_DEFINITIONS,
  drillMasteryId,
  getTrackMastery,
  masteryMilestoneEventId,
} from './masteryCatalog'
import type {
  CosmeticUnlock,
  MasteryProgressUnlock,
  RewardGrant,
  UnlockHistoryEntry,
} from '../types'

export type TrackDrillMap = Record<string, string[]>

function drillIdFromSession(session: Session): string {
  return String(session.drill_id || session.module_id || '').trim()
}

function countEligibleRunsByDrill(sessions: Session[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const session of sessions) {
    if (!isProgressionEligibleSession(session) || session.state !== 'COMPLETED') continue
    const drillId = drillIdFromSession(session)
    if (!drillId) continue
    counts[drillId] = (counts[drillId] || 0) + 1
    const moduleId = String(session.module_id || '').trim()
    if (moduleId && moduleId !== drillId) {
      counts[moduleId] = (counts[moduleId] || 0) + 1
    }
  }
  return counts
}

export type TrackMasteryView = {
  masteryId: string
  trackId: string
  name: string
  description?: string
  drillsTotal: number
  /** For each milestone threshold: how many drills meet it. */
  drillsAtOrAbove: Record<number, number>
  unlockedThresholds: number[]
  nextThreshold: number | null
  nextRatio: number
  complete: boolean
}

export function selectTrackMasteryViews(
  sessions: Session[],
  trackDrills: TrackDrillMap,
  processedEvents: Record<string, unknown>,
): TrackMasteryView[] {
  const runs = countEligibleRunsByDrill(sessions)
  return TRACK_MASTERY_DEFINITIONS.map((definition) => {
    const drills = trackDrills[definition.targetId] || []
    const uniqueDrills = Array.from(new Set(drills))
    const unlockedThresholds: number[] = []
    const drillsAtOrAbove: Record<number, number> = {}

    for (const milestone of definition.milestones) {
      const count = uniqueDrills.filter((drillId) => (runs[drillId] || 0) >= milestone.threshold).length
      drillsAtOrAbove[milestone.threshold] = count
      const eventId = masteryMilestoneEventId(definition.id, milestone.threshold)
      const met = uniqueDrills.length > 0 && count >= uniqueDrills.length
      if (met && processedEvents[eventId]) unlockedThresholds.push(milestone.threshold)
      else if (met) unlockedThresholds.push(milestone.threshold) // view as earned even before grant persist
    }

    const next = definition.milestones.find((milestone) => {
      const count = drillsAtOrAbove[milestone.threshold] || 0
      return uniqueDrills.length === 0 || count < uniqueDrills.length
    })

    return {
      masteryId: definition.id,
      trackId: definition.targetId,
      name: definition.name,
      description: definition.description,
      drillsTotal: uniqueDrills.length,
      drillsAtOrAbove,
      unlockedThresholds,
      nextThreshold: next?.threshold ?? null,
      nextRatio:
        next && uniqueDrills.length
          ? (drillsAtOrAbove[next.threshold] || 0) / uniqueDrills.length
          : 1,
      complete: Boolean(next === undefined && uniqueDrills.length > 0),
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
    cosmetics.push({
      cosmeticId: grant.cosmeticId,
      unlockedAt: ctx.occurredAt,
      sourceType: ctx.sourceType,
      sourceId: ctx.sourceId,
      earnKind: 'derived',
    })
    history.push({
      id: `cosmetic:${grant.cosmeticId}:${ctx.eventId}`,
      kind: 'cosmetic',
      title: def?.name || grant.cosmeticId,
      description: 'Mastery Reward',
      occurredAt: ctx.occurredAt,
      sourceEventId: ctx.eventId,
      cosmeticId: grant.cosmeticId,
      masteryId: ctx.sourceId,
    })
  }
  return { xp, pux, cosmetics, history }
}

/**
 * Evaluate newly reached drill + track mastery milestones (idempotent via processedEvents).
 */
export function evaluateMasteryGrants(input: {
  sessions: Session[]
  trackDrills: TrackDrillMap
  processedEvents: Record<string, unknown>
  unlockedCosmetics: Record<string, CosmeticUnlock>
  occurredAt?: string
  /** Default both. Locker catch-up should prefer track-only to avoid grant storms. */
  scopes?: Array<'drill' | 'track'>
}): {
  grantedXp: number
  grantedPux: number
  unlockedCosmetics: CosmeticUnlock[]
  unlockHistory: UnlockHistoryEntry[]
  rewardEvents: Array<Record<string, unknown>>
  masteryUnlocks: MasteryProgressUnlock[]
  processedEventIds: string[]
} {
  const occurredAt = input.occurredAt || new Date().toISOString()
  const scopes = input.scopes || ['drill', 'track']
  const runs = countEligibleRunsByDrill(input.sessions)
  const working = { ...input.unlockedCosmetics }
  let grantedXp = 0
  let grantedPux = 0
  const unlockedCosmetics: CosmeticUnlock[] = []
  const unlockHistory: UnlockHistoryEntry[] = []
  const rewardEvents: Array<Record<string, unknown>> = []
  const masteryUnlocks: MasteryProgressUnlock[] = []
  const processedEventIds: string[] = []

  // Drill mastery for drills that appear in eligible sessions
  if (scopes.includes('drill')) {
  for (const [drillId, count] of Object.entries(runs)) {
    const masteryId = drillMasteryId(drillId)
    for (const milestone of DRILL_MASTERY_MILESTONES) {
      if (count < milestone.threshold) continue
      const eventId = masteryMilestoneEventId(masteryId, milestone.threshold)
      if (input.processedEvents[eventId] || processedEventIds.includes(eventId)) continue
      const applied = applyGrants(milestone.rewards, {
        occurredAt,
        eventId,
        sourceType: 'drill_mastery',
        sourceId: masteryId,
        already: working,
      })
      grantedXp += applied.xp
      grantedPux += applied.pux
      for (const cosmetic of applied.cosmetics) {
        unlockedCosmetics.push(cosmetic)
        working[cosmetic.cosmeticId] = cosmetic
      }
      unlockHistory.push({
        id: `mastery:${masteryId}:${milestone.threshold}`,
        kind: 'mastery',
        title: `${drillId} · ${milestone.label}`,
        description: `${count}× completed`,
        occurredAt,
        sourceEventId: eventId,
        masteryId,
        amountXp: applied.xp,
        amountPux: applied.pux,
      })
      unlockHistory.push(...applied.history)
      if (applied.pux > 0 || applied.cosmetics.length > 0 || milestone.threshold >= 5) {
        rewardEvents.push({
          id: eventId,
          kind: 'mastery',
          title: `Mastery · ${milestone.label}`,
          description: drillId,
          variant: 'popup',
          visualTier: milestone.threshold >= 10 ? 'gold' : 'silver',
        })
      }
      masteryUnlocks.push({
        masteryId,
        milestoneThreshold: milestone.threshold,
        unlockedAt: occurredAt,
        sourceEventId: eventId,
      })
      processedEventIds.push(eventId)
    }
  }
  }

  // Track mastery
  if (scopes.includes('track')) {
  for (const definition of TRACK_MASTERY_DEFINITIONS) {
    const drills = Array.from(new Set(input.trackDrills[definition.targetId] || []))
    if (!drills.length) continue
    for (const milestone of definition.milestones) {
      const met = drills.every((drillId) => (runs[drillId] || 0) >= milestone.threshold)
      if (!met) continue
      const eventId = masteryMilestoneEventId(definition.id, milestone.threshold)
      if (input.processedEvents[eventId] || processedEventIds.includes(eventId)) continue
      const applied = applyGrants(milestone.rewards, {
        occurredAt,
        eventId,
        sourceType: 'track_mastery',
        sourceId: definition.id,
        already: working,
      })
      grantedXp += applied.xp
      grantedPux += applied.pux
      for (const cosmetic of applied.cosmetics) {
        unlockedCosmetics.push(cosmetic)
        working[cosmetic.cosmeticId] = cosmetic
      }
      unlockHistory.push({
        id: `mastery:${definition.id}:${milestone.threshold}`,
        kind: 'mastery',
        title: `${definition.name} · ${milestone.label}`,
        occurredAt,
        sourceEventId: eventId,
        masteryId: definition.id,
        amountXp: applied.xp,
        amountPux: applied.pux,
      })
      unlockHistory.push(...applied.history)
      rewardEvents.push({
        id: eventId,
        kind: 'mastery',
        title: `Track Mastery · ${milestone.label}`,
        description: definition.name,
        amountPux: applied.pux || undefined,
        variant: 'popup',
        visualTier: 'gold',
        icon: '🪙',
      })
      masteryUnlocks.push({
        masteryId: definition.id,
        milestoneThreshold: milestone.threshold,
        unlockedAt: occurredAt,
        sourceEventId: eventId,
      })
      processedEventIds.push(eventId)
    }
  }
  }

  return {
    grantedXp,
    grantedPux,
    unlockedCosmetics,
    unlockHistory,
    rewardEvents,
    masteryUnlocks,
    processedEventIds,
  }
}

export { getTrackMastery, countEligibleRunsByDrill }
