import { getStarterCosmeticIds } from './cosmetics/cosmeticCatalog'
import { getLevelFromXp } from './levelSystem'
import { processActivityEventBatch, type ProgressionStateSlice } from './progressionEngine'
import { collectBootstrapEvents, type TrackDrillMap, type ModuleDrillMap } from './buildActivityFromSources'
import type { Session, SceneMarker } from '../../api'
import type { CosmeticUnlock, ProgressionApplyResult, UnlockHistoryEntry } from './types'

export const BOOTSTRAP_EVENT_ID = 'bootstrap:v1'
export const PROGRESSION_SCHEMA_VERSION = 1

export type BootstrapInput = {
  sessions: Session[]
  scenes: SceneMarker[]
  trackDrills?: TrackDrillMap
  moduleDrills?: ModuleDrillMap
  existing: ProgressionStateSlice
  /** When true, ignore existing derived progression and rebuild from sources. */
  forceRebuild?: boolean
  userId?: string
}

export type BootstrapResult = {
  skipped: boolean
  reason?: string
  state: ProgressionStateSlice
  aggregate: ProgressionApplyResult
  summaryHistory: UnlockHistoryEntry | null
}

function seedStarterCosmetics(unlockedAt: string): Record<string, CosmeticUnlock> {
  const out: Record<string, CosmeticUnlock> = {}
  for (const cosmeticId of getStarterCosmeticIds()) {
    out[cosmeticId] = {
      cosmeticId,
      unlockedAt,
      sourceType: 'starter',
    }
  }
  return out
}

/**
 * Retroactive Variante A: eligible sessions/scenes → XP + achievements + cosmetics.
 * Dummy sessions are excluded by collectBootstrapEvents.
 * Permanent unlocks: bootstrap only runs once unless forceRebuild (dev).
 */
export function bootstrapProgression(input: BootstrapInput): BootstrapResult {
  const now = new Date().toISOString()
  const existing = input.existing

  if (!input.forceRebuild && existing.processedEvents?.[BOOTSTRAP_EVENT_ID]) {
    return {
      skipped: true,
      reason: 'already_bootstrapped',
      state: existing,
      aggregate: {
        eventId: BOOTSTRAP_EVENT_ID,
        evaluatedAt: now,
        grantedXp: 0,
        grantedPux: 0,
        unlockedAchievements: [],
        unlockedCosmetics: [],
        unlockHistory: [],
        levelsGained: [],
        rewardEvents: [],
        nextXp: existing.xp || 0,
        nextLevel: getLevelFromXp(existing.xp || 0),
        activityEventsAppended: [],
        alreadyProcessed: true,
      },
      summaryHistory: null,
    }
  }

  const starter = seedStarterCosmetics(now)
  const base: ProgressionStateSlice = input.forceRebuild
    ? {
        xp: 0,
        unlockedAchievements: {},
        unlockedCosmetics: { ...starter },
        processedEvents: {},
        activityLog: [],
        unlockHistory: [],
      }
    : {
        xp: existing.xp || 0,
        unlockedAchievements: { ...(existing.unlockedAchievements || {}) },
        unlockedCosmetics: { ...starter, ...(existing.unlockedCosmetics || {}) },
        processedEvents: { ...(existing.processedEvents || {}) },
        activityLog: [...(existing.activityLog || [])],
        unlockHistory: [...(existing.unlockHistory || [])],
      }

  // Fresh bootstrap should start derived XP from zero (Variante A from sources only).
  if (!input.forceRebuild && (existing.xp || 0) === 0 && !(existing.activityLog || []).length) {
    base.xp = 0
    base.activityLog = []
    // Keep legacy unlockedAchievements from old medal system; tank achievements use same map.
  }

  if (input.forceRebuild || (!existing.processedEvents?.[BOOTSTRAP_EVENT_ID] && (existing.xp || 0) === 0)) {
    base.xp = 0
    base.activityLog = []
    // Preserve non-tank legacy achievement ids if present
    base.unlockedAchievements = { ...(existing.unlockedAchievements || {}) }
    // Clear only tank progress fields that we will recompute — keep cosmetics starters
    base.unlockedCosmetics = { ...starter, ...(existing.unlockedCosmetics || {}) }
    base.processedEvents = {}
    base.unlockHistory = []
  }

  const events = collectBootstrapEvents({
    sessions: input.sessions,
    scenes: input.scenes,
    trackDrills: input.trackDrills,
    moduleDrills: input.moduleDrills,
    userId: input.userId,
  })

  const { state, aggregate } = processActivityEventBatch(base, events, {
    suppressPerEventHistory: true,
    // Base unit XP/PUX + Track0 bundle come from the server unified pipeline.
    skipBaseSessionXp: true,
  })

  const summaryHistory: UnlockHistoryEntry = {
    id: `bootstrap:${now}`,
    kind: 'bootstrap',
    title: 'Dein RINK-Fortschritt wurde ausgewertet',
    description: [
      `${aggregate.unlockedAchievements.length} Achievements freigeschaltet`,
      `Level ${aggregate.nextLevel} erreicht`,
      `${aggregate.unlockedCosmetics.length} Cosmetics erhalten`,
      `+${aggregate.grantedXp} XP`,
    ].join(' · '),
    occurredAt: now,
    sourceEventId: BOOTSTRAP_EVENT_ID,
    amountXp: aggregate.grantedXp,
    amountPux: aggregate.grantedPux,
    level: aggregate.nextLevel,
  }

  const nextState: ProgressionStateSlice = {
    ...state,
    processedEvents: {
      ...state.processedEvents,
      [BOOTSTRAP_EVENT_ID]: {
        eventId: BOOTSTRAP_EVENT_ID,
        processedAt: now,
        grantedXp: aggregate.grantedXp,
        grantedPux: aggregate.grantedPux,
      },
    },
    unlockHistory: [summaryHistory, ...state.unlockHistory].slice(0, 100),
  }

  return {
    skipped: false,
    state: nextState,
    aggregate: {
      ...aggregate,
      eventId: BOOTSTRAP_EVENT_ID,
      unlockHistory: [summaryHistory],
      bootstrapSummary: {
        achievements: aggregate.unlockedAchievements.length,
        cosmetics: aggregate.unlockedCosmetics.length,
        level: aggregate.nextLevel,
        xp: aggregate.nextXp,
      },
      rewardEvents: [
        {
          id: `bootstrap-summary:${now}`,
          kind: 'system',
          title: 'Dein RINK-Fortschritt wurde ausgewertet',
          description: summaryHistory.description,
          variant: 'popup',
          visualTier: 'gold',
          icon: '🏆',
        },
      ],
    },
    summaryHistory,
  }
}
