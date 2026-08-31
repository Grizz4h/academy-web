import { isDummyActivityEvent } from './activityEvents'
import { findNewlyUnlockedAchievements } from './achievements/achievementEngine'
import { getCosmetic } from './cosmetics/cosmeticCatalog'
import { getLevelFromXp, getLevelRewards, levelsGainedBetween } from './levelSystem'
import type {
  AchievementUnlock,
  CosmeticUnlock,
  ProgressionApplyResult,
  RewardGrant,
  RinkActivityEvent,
  UnlockHistoryEntry,
} from './types'
import { getXpRulesForEvent } from './xpRules'

export type ProgressionStateSlice = {
  xp: number
  progressionCurveVersion?: number
  levelGrandfatherFloor?: number
  unlockedAchievements: Record<string, { id: string; unlockedAt: string; sourceEventId?: string }>
  unlockedCosmetics: Record<string, CosmeticUnlock>
  processedEvents: Record<string, { eventId: string; processedAt: string; grantedXp: number; grantedPux: number }>
  activityLog: RinkActivityEvent[]
  unlockHistory: UnlockHistoryEntry[]
}

function emptyResult(eventId: string, evaluatedAt: string, state: ProgressionStateSlice): ProgressionApplyResult {
  return {
    eventId,
    evaluatedAt,
    grantedXp: 0,
    grantedPux: 0,
    unlockedAchievements: [],
    unlockedCosmetics: [],
    unlockHistory: [],
    levelsGained: [],
    rewardEvents: [],
    nextXp: state.xp || 0,
    nextLevel: getLevelFromXp(state.xp || 0),
    activityEventsAppended: [],
    alreadyProcessed: true,
  }
}

function grantXpAmount(
  rules: ReturnType<typeof getXpRulesForEvent>,
  event: RinkActivityEvent,
  activityLog: RinkActivityEvent[],
  options?: { skipBaseSessionXp?: boolean },
): number {
  let total = 0
  for (const rule of rules) {
    if (
      options?.skipBaseSessionXp &&
      (rule.key === 'session_completed' || rule.key === 'first_session_of_drill')
    ) {
      continue
    }
    if (
      options?.skipBaseSessionXp &&
      rule.key === 'track_completed' &&
      event.type === 'track_completed' &&
      (event.trackId === 'T0' || event.trackId.startsWith('T0'))
    ) {
      continue
    }
    if (rule.key === 'first_session_of_drill') {
      if (event.type === 'session_completed' && event.isFirstSessionOfDrill) {
        total += rule.amount
      }
      continue
    }

    if (rule.policy === 'first_only' && rule.eventType === 'track_completed' && event.type === 'track_completed') {
      const already = activityLog.some(
        (item) => item.type === 'track_completed' && item.trackId === event.trackId,
      )
      if (already) continue
      total += rule.amount
      continue
    }

    // daily_capped / milestone reserved for later balancing — Phase 1 treats matched rules as always.
    if (rule.eventType === event.type) {
      total += rule.amount
    }
  }
  return total
}

function applyGrantList(
  grants: RewardGrant[],
  ctx: {
    sourceType: string
    sourceId: string
    occurredAt: string
    eventId: string
    alreadyCosmetics: Record<string, CosmeticUnlock>
  },
): {
  xp: number
  pux: number
  cosmetics: CosmeticUnlock[]
  history: UnlockHistoryEntry[]
} {
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
    if (grant.type === 'cosmetic') {
      if (ctx.alreadyCosmetics[grant.cosmeticId] || cosmetics.some((c) => c.cosmeticId === grant.cosmeticId)) {
        continue
      }
      const def = getCosmetic(grant.cosmeticId)
      const unlock: CosmeticUnlock = {
        cosmeticId: grant.cosmeticId,
        unlockedAt: ctx.occurredAt,
        sourceType: ctx.sourceType,
        sourceId: ctx.sourceId,
      }
      cosmetics.push(unlock)
      history.push({
        id: `cosmetic:${grant.cosmeticId}:${ctx.eventId}`,
        kind: 'cosmetic',
        title: def?.name || grant.cosmeticId,
        description: def ? `${def.type} · ${def.rarity}` : undefined,
        occurredAt: ctx.occurredAt,
        sourceEventId: ctx.eventId,
        cosmeticId: grant.cosmeticId,
      })
    }
  }

  return { xp, pux, cosmetics, history }
}

/**
 * Pure progression evaluation for one activity event.
 * Unlocks are permanent: does not revoke on deleted source data.
 */
export function processActivityEvent(
  state: ProgressionStateSlice,
  event: RinkActivityEvent,
  options?: { suppressHistory?: boolean; skipBaseSessionXp?: boolean },
): ProgressionApplyResult {
  const evaluatedAt = event.occurredAt || new Date().toISOString()

  if (state.processedEvents?.[event.id]) {
    return emptyResult(event.id, evaluatedAt, state)
  }

  if (isDummyActivityEvent(event)) {
    return {
      ...emptyResult(event.id, evaluatedAt, state),
      alreadyProcessed: false,
    }
  }

  const workingAchievements = { ...(state.unlockedAchievements || {}) }
  const workingCosmetics = { ...(state.unlockedCosmetics || {}) }
  const activityLog = [...(state.activityLog || [])]
  const previousXp = state.xp || 0

  let grantedXp = grantXpAmount(getXpRulesForEvent(event), event, activityLog, {
    skipBaseSessionXp: options?.skipBaseSessionXp,
  })
  let grantedPux = 0
  const unlockedAchievements: AchievementUnlock[] = []
  const unlockedCosmetics: CosmeticUnlock[] = []
  const unlockHistory: UnlockHistoryEntry[] = []
  const rewardEvents: Array<Record<string, unknown>> = []

  activityLog.push(event)

  // Achievements may chain (XP from achievement → more levels → more rewards).
  // Iterate until no new unlocks (cap for safety).
  for (let round = 0; round < 8; round += 1) {
    const newly = findNewlyUnlockedAchievements(activityLog, workingAchievements)
    if (!newly.length) break

    for (const definition of newly) {
      const unlock: AchievementUnlock = {
        achievementId: definition.id,
        unlockedAt: evaluatedAt,
        sourceEventId: event.id,
      }
      unlockedAchievements.push(unlock)
      workingAchievements[definition.id] = {
        id: definition.id,
        unlockedAt: evaluatedAt,
        sourceEventId: event.id,
      }

      if (!options?.suppressHistory) {
        unlockHistory.push({
          id: `achievement:${definition.id}:${event.id}`,
          kind: 'achievement',
          title: definition.name,
          description: definition.description,
          occurredAt: evaluatedAt,
          sourceEventId: event.id,
          achievementId: definition.id,
        })
        rewardEvents.push({
          id: `achievement:${definition.id}:${event.id}`,
          kind: 'achievement',
          title: definition.name,
          description: definition.description,
          variant: 'popup',
          visualTier:
            definition.rarity === 'legendary' || definition.rarity === 'epic'
              ? 'mastery'
              : definition.rarity === 'rare'
                ? 'gold'
                : definition.rarity === 'uncommon'
                  ? 'silver'
                  : 'bronze',
          icon: '🏆',
          achievementId: definition.id,
        })
      }

      const applied = applyGrantList(definition.rewards, {
        sourceType: 'achievement',
        sourceId: definition.id,
        occurredAt: evaluatedAt,
        eventId: event.id,
        alreadyCosmetics: workingCosmetics,
      })
      grantedXp += applied.xp
      grantedPux += applied.pux
      for (const cosmetic of applied.cosmetics) {
        unlockedCosmetics.push(cosmetic)
        workingCosmetics[cosmetic.cosmeticId] = cosmetic
      }
      if (!options?.suppressHistory) {
        unlockHistory.push(...applied.history)
      }
    }
  }

  const nextXpAfterAchievements = previousXp + grantedXp
  const levels = levelsGainedBetween(previousXp, nextXpAfterAchievements)

  for (const level of levels) {
    const levelReward = getLevelRewards(level)
    if (!options?.suppressHistory) {
      unlockHistory.push({
        id: `level:${level}:${event.id}`,
        kind: 'level',
        title: `Level ${level}`,
        description: 'Account-Level erreicht',
        occurredAt: evaluatedAt,
        sourceEventId: event.id,
        level,
      })
    }
    if (!levelReward) continue
    const applied = applyGrantList(levelReward.rewards, {
      sourceType: 'level',
      sourceId: String(level),
      occurredAt: evaluatedAt,
      eventId: event.id,
      alreadyCosmetics: workingCosmetics,
    })
    grantedXp += applied.xp
    grantedPux += applied.pux
    for (const cosmetic of applied.cosmetics) {
      unlockedCosmetics.push(cosmetic)
      workingCosmetics[cosmetic.cosmeticId] = cosmetic
    }
    if (!options?.suppressHistory) {
      unlockHistory.push(...applied.history)
      if (applied.pux > 0) {
        rewardEvents.push({
          id: `level:${level}:pux:${event.id}`,
          kind: 'currency',
          title: `Level ${level}`,
          description: `+${applied.pux} PUX`,
          amountPux: applied.pux,
          variant: 'popup',
          visualTier: 'gold',
        })
      }
    }
  }

  // Achievement XP may push additional levels — one more pass.
  const finalXp = previousXp + grantedXp
  const extraLevels = levelsGainedBetween(nextXpAfterAchievements, finalXp)
  for (const level of extraLevels) {
    levels.push(level)
    const levelReward = getLevelRewards(level)
    if (!levelReward) continue
    const applied = applyGrantList(levelReward.rewards, {
      sourceType: 'level',
      sourceId: String(level),
      occurredAt: evaluatedAt,
      eventId: event.id,
      alreadyCosmetics: workingCosmetics,
    })
    grantedXp += applied.xp
    grantedPux += applied.pux
    for (const cosmetic of applied.cosmetics) {
      unlockedCosmetics.push(cosmetic)
      workingCosmetics[cosmetic.cosmeticId] = cosmetic
    }
  }

  if (!options?.suppressHistory && grantedXp > 0) {
    rewardEvents.unshift({
      id: `xp:${event.id}`,
      kind: 'system',
      title: `+${grantedXp} XP`,
      description: event.type.replace(/_/g, ' '),
      variant: 'small',
      meta: { amountXp: grantedXp },
    })
  }

  return {
    eventId: event.id,
    evaluatedAt,
    grantedXp,
    grantedPux,
    unlockedAchievements,
    unlockedCosmetics,
    unlockHistory,
    levelsGained: levels,
    rewardEvents,
    nextXp: previousXp + grantedXp,
    nextLevel: getLevelFromXp(previousXp + grantedXp),
    activityEventsAppended: [event],
    alreadyProcessed: false,
  }
}

/** Deterministically process many events in chronological order. */
export function processActivityEventBatch(
  initial: ProgressionStateSlice,
  events: RinkActivityEvent[],
  options?: { suppressPerEventHistory?: boolean; skipBaseSessionXp?: boolean },
): { state: ProgressionStateSlice; aggregate: ProgressionApplyResult } {
  let slice: ProgressionStateSlice = {
    xp: initial.xp || 0,
    unlockedAchievements: { ...(initial.unlockedAchievements || {}) },
    unlockedCosmetics: { ...(initial.unlockedCosmetics || {}) },
    processedEvents: { ...(initial.processedEvents || {}) },
    activityLog: [...(initial.activityLog || [])],
    unlockHistory: [...(initial.unlockHistory || [])],
  }

  const sorted = [...events].sort((a, b) => String(a.occurredAt).localeCompare(String(b.occurredAt)))
  let totalXp = 0
  let totalPux = 0
  const allAchievements: AchievementUnlock[] = []
  const allCosmetics: CosmeticUnlock[] = []
  const allHistory: UnlockHistoryEntry[] = []
  const allLevels: number[] = []
  const allRewardEvents: Array<Record<string, unknown>> = []
  const appended: RinkActivityEvent[] = []

  for (const event of sorted) {
    const result = processActivityEvent(slice, event, {
      suppressHistory: options?.suppressPerEventHistory,
      skipBaseSessionXp: options?.skipBaseSessionXp,
    })
    if (result.alreadyProcessed) continue
    if (isDummyActivityEvent(event)) {
      slice = {
        ...slice,
        processedEvents: {
          ...slice.processedEvents,
          [event.id]: {
            eventId: event.id,
            processedAt: result.evaluatedAt,
            grantedXp: 0,
            grantedPux: 0,
          },
        },
      }
      continue
    }

    totalXp += result.grantedXp
    totalPux += result.grantedPux
    allAchievements.push(...result.unlockedAchievements)
    allCosmetics.push(...result.unlockedCosmetics)
    allHistory.push(...result.unlockHistory)
    allLevels.push(...result.levelsGained)
    allRewardEvents.push(...result.rewardEvents)
    appended.push(...result.activityEventsAppended)

    const nextAchievements = { ...slice.unlockedAchievements }
    for (const unlock of result.unlockedAchievements) {
      nextAchievements[unlock.achievementId] = {
        id: unlock.achievementId,
        unlockedAt: unlock.unlockedAt,
        sourceEventId: unlock.sourceEventId,
      }
    }
    const nextCosmetics = { ...slice.unlockedCosmetics }
    for (const unlock of result.unlockedCosmetics) {
      nextCosmetics[unlock.cosmeticId] = unlock
    }

    slice = {
      xp: result.nextXp,
      unlockedAchievements: nextAchievements,
      unlockedCosmetics: nextCosmetics,
      processedEvents: {
        ...slice.processedEvents,
        [event.id]: {
          eventId: event.id,
          processedAt: result.evaluatedAt,
          grantedXp: result.grantedXp,
          grantedPux: result.grantedPux,
        },
      },
      activityLog: [...slice.activityLog, ...result.activityEventsAppended],
      unlockHistory: options?.suppressPerEventHistory
        ? slice.unlockHistory
        : [...slice.unlockHistory, ...result.unlockHistory],
    }
  }

  const aggregate: ProgressionApplyResult = {
    eventId: 'batch',
    evaluatedAt: new Date().toISOString(),
    grantedXp: totalXp,
    grantedPux: totalPux,
    unlockedAchievements: allAchievements,
    unlockedCosmetics: allCosmetics,
    unlockHistory: allHistory,
    levelsGained: Array.from(new Set(allLevels)).sort((a, b) => a - b),
    rewardEvents: allRewardEvents,
    nextXp: slice.xp,
    nextLevel: getLevelFromXp(slice.xp),
    activityEventsAppended: appended,
    alreadyProcessed: false,
  }

  return { state: slice, aggregate }
}
