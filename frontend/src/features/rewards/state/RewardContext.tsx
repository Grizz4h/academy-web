import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { api } from '../../../api'
import { useUser } from '../../../context/UserContext'
import {
  BOOTSTRAP_EVENT_ID,
  bootstrapProgression,
  buildCurriculumProgressionMaps,
  evaluateChallenges,
  evaluateCollectionCompletions,
  evaluateMasteryGrants,
  evaluateShopPurchase,
  getLevelRewards,
  isStarterCosmetic,
  migrateProgressionCurve,
  processActivityEvent,
  processActivityEventBatch,
  type ProgressionStateSlice,
  type RinkActivityEvent,
} from '../../progression'
import { contentRegistry } from '../../../content/registry'
import type { MatchdayContext } from '../../progression/challenges/types'
import { applyVenuePresenceToEvents } from '../../location/visits'
import { createEmptyRewardState, type RewardEvent, type RewardState } from '../types'

export type ActivityIngestResult = {
  grantedXp: number
  grantedPux: number
  previousXp: number
  nextXp: number
  rewardEvents: RewardEvent[]
}

const EMPTY_INGEST_RESULT = (previousXp = 0): ActivityIngestResult => ({
  grantedXp: 0,
  grantedPux: 0,
  previousXp,
  nextXp: previousXp,
  rewardEvents: [],
})

type RewardContextValue = {
  rewardState: RewardState
  activeReward: RewardEvent | null
  isRewardVisible: boolean
  enqueueReward: (event: Partial<RewardEvent> & Pick<RewardEvent, 'kind' | 'title' | 'variant'>) => void
  enqueueRewards: (events: Array<Partial<RewardEvent> & Pick<RewardEvent, 'kind' | 'title' | 'variant'>>) => void
  closeActiveReward: () => void
  /** Process one or more activity events through the progression engine (idempotent). */
  ingestActivityEvents: (
    events: RinkActivityEvent[],
    options?: { showToasts?: boolean },
  ) => Promise<ActivityIngestResult>
  rebuildProgression: (input: {
    sessions: Parameters<typeof bootstrapProgression>[0]['sessions']
    scenes: Parameters<typeof bootstrapProgression>[0]['scenes']
    trackDrills?: Parameters<typeof bootstrapProgression>[0]['trackDrills']
    moduleDrills?: Parameters<typeof bootstrapProgression>[0]['moduleDrills']
  }) => Promise<void>
  purchaseShopListing: (listingId: string) => Promise<{ ok: boolean; reason?: string }>
  markCosmeticsSeen: (cosmeticIds: string[]) => Promise<void>
  toggleFavoriteCosmetic: (cosmeticId: string) => Promise<void>
  evaluateLockerMetaProgress: (input: {
    sessions: Parameters<typeof bootstrapProgression>[0]['sessions']
    trackDrills: Record<string, string[]>
    showToasts?: boolean
  }) => Promise<ActivityIngestResult>
  syncChallengeBoard: (input?: { matchday?: MatchdayContext | null }) => Promise<void>
  bootstrapStatus: 'idle' | 'running' | 'done' | 'error'
  rewardStateLoaded: boolean
}

const RewardContext = createContext<RewardContextValue | undefined>(undefined)

const EXIT_MS = 180

function isRewardToastEvent(event: { kind?: string }): boolean {
  const kind = event.kind
  return kind === 'achievement' || kind === 'currency' || kind === 'system' || kind === 'mastery'
}

function normalizeReward(event: Partial<RewardEvent> & Pick<RewardEvent, 'kind' | 'title' | 'variant'>): RewardEvent {
  return {
    id: event.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`),
    description: event.description,
    amountPux: event.amountPux,
    visualTier: event.visualTier,
    icon: event.icon,
    autoCloseMs: event.autoCloseMs,
    achievementId: event.achievementId,
    mastery: event.mastery,
    meta: event.meta,
    kind: event.kind,
    title: event.title,
    variant: event.variant,
  }
}

function matchdayFromState(state: RewardState): MatchdayContext | null {
  const gameId = state.challengeRotation?.matchdayGameId
  if (!gameId) return null
  return {
    gameId,
    homeTeamId: '',
    awayTeamId: '',
    startsAt: new Date().toISOString(),
    phase: 'live',
    game: {
      id: gameId,
      league_id: '',
      season_id: '',
      home_team_id: '',
      away_team_id: '',
      status: 'scheduled',
    },
  }
}

function toProgressionSlice(state: RewardState): ProgressionStateSlice {
  return {
    xp: state.xp || 0,
    progressionCurveVersion: state.progressionCurveVersion,
    levelGrandfatherFloor: state.levelGrandfatherFloor,
    unlockedAchievements: state.unlockedAchievements || {},
    unlockedCosmetics: state.unlockedCosmetics || {},
    processedEvents: state.processedEvents || {},
    activityLog: state.activityLog || [],
    unlockHistory: state.unlockHistory || [],
  }
}

function normalizeRewardState(state: any): RewardState {
  const base = createEmptyRewardState()
  const merged: RewardState = {
    ...base,
    ...(state || {}),
    currency: {
      ...base.currency,
      ...((state && state.currency) || {}),
    },
    unlockedAchievements: (state && state.unlockedAchievements) || {},
    unlockedMasteries: (state && state.unlockedMasteries) || {},
    processedSessions: (state && state.processedSessions) || {},
    xp: Number(state?.xp || 0),
    processedEvents: (state && state.processedEvents) || {},
    unlockedCosmetics: (state && state.unlockedCosmetics) || {},
    activityLog: ((state && state.activityLog) || []) as RewardState['activityLog'],
    unlockHistory: ((state && state.unlockHistory) || []) as RewardState['unlockHistory'],
    bootstrapCompletedAt: state?.bootstrapCompletedAt || undefined,
    lastUpdatedAt: state?.lastUpdatedAt || undefined,
    favoriteCosmeticIds: state?.favoriteCosmeticIds || [],
    puxTransactions: state?.puxTransactions || [],
    completedCollections: state?.completedCollections || {},
    masteryMilestoneUnlocks: state?.masteryMilestoneUnlocks || {},
    featuredAchievementId: state?.featuredAchievementId ?? null,
    featuredMasteryCoinId: state?.featuredMasteryCoinId ?? null,
    progressionPuxGranted: Number(state?.progressionPuxGranted || 0),
    challengeProgress: (state && state.challengeProgress) || {},
    challengeRotation: (state && state.challengeRotation) || null,
    venueVisits: (state && state.venueVisits) || {},
    processedUnits: state?.processedUnits || {},
    processedGrantKeys: state?.processedGrantKeys || {},
    progressionCurveVersion: state?.progressionCurveVersion,
    levelGrandfatherFloor: state?.levelGrandfatherFloor,
  }
  const migrated = migrateProgressionCurve(merged)
  merged.progressionCurveVersion = migrated.progressionCurveVersion
  merged.levelGrandfatherFloor = migrated.levelGrandfatherFloor
  return merged
}

export function RewardProvider({ children }: { children: ReactNode }) {
  const { user } = useUser()

  const [rewardState, setRewardState] = useState<RewardState>(createEmptyRewardState)
  const [queue, setQueue] = useState<RewardEvent[]>([])
  const [activeReward, setActiveReward] = useState<RewardEvent | null>(null)
  const [isRewardVisible, setIsRewardVisible] = useState(false)
  const [bootstrapStatus, setBootstrapStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [rewardStateLoaded, setRewardStateLoaded] = useState(false)
  const exitTimerRef = useRef<number | null>(null)
  const bootstrapStartedRef = useRef(false)
  const rewardStateRef = useRef(rewardState)
  const metaInFlightRef = useRef(false)
  rewardStateRef.current = rewardState

  const closeActiveReward = useCallback(() => {
    setIsRewardVisible(false)
    if (exitTimerRef.current) {
      window.clearTimeout(exitTimerRef.current)
    }
    exitTimerRef.current = window.setTimeout(() => {
      setActiveReward(null)
    }, EXIT_MS)
  }, [])

  useEffect(() => {
    setQueue([])
    setActiveReward(null)
    setIsRewardVisible(false)
    bootstrapStartedRef.current = false
    setBootstrapStatus('idle')
    setRewardStateLoaded(false)

    if (!user) {
      setRewardState(createEmptyRewardState())
      setRewardStateLoaded(false)
      return
    }

    let cancelled = false
    api
      .getRewardState()
      .then((serverState) => {
        if (cancelled) return
        setRewardState(normalizeRewardState(serverState))
        setRewardStateLoaded(true)
      })
      .catch((err) => {
        console.error('Failed to load reward state from server', err)
        if (cancelled) return
        setRewardState(createEmptyRewardState())
        setRewardStateLoaded(true)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  // Retroactive bootstrap once per user after state load.
  useEffect(() => {
    if (!user || !rewardStateLoaded) return
    if (bootstrapStartedRef.current) return
    if (rewardState.bootstrapCompletedAt || rewardState.processedEvents?.[BOOTSTRAP_EVENT_ID]) {
      setBootstrapStatus('done')
      return
    }

    bootstrapStartedRef.current = true
    setBootstrapStatus('running')

    let cancelled = false
    ;(async () => {
      try {
        const [sessions, scenesPayload, curriculum] = await Promise.all([
          api.getSessions(user),
          api.getScenes(),
          api.getCurriculum().catch(() => null),
        ])
        if (cancelled) return

        const { trackDrills, moduleDrills } = buildCurriculumProgressionMaps(curriculum)

        const result = bootstrapProgression({
          sessions,
          scenes: scenesPayload?.scenes || [],
          trackDrills,
          moduleDrills,
          existing: toProgressionSlice(rewardStateRef.current),
        })

        if (result.skipped) {
          setBootstrapStatus('done')
          return
        }

        const evaluatedAt = new Date().toISOString()
        const response = await api.applyRewardResult({
          event_id: BOOTSTRAP_EVENT_ID,
          evaluated_at: evaluatedAt,
          granted_pux: result.aggregate.grantedPux,
          granted_xp: result.aggregate.grantedXp,
          reward_events: result.aggregate.rewardEvents,
          unlocked_achievements: Object.values(result.state.unlockedAchievements).map((item) => ({
            id: item.id,
            unlockedAt: item.unlockedAt,
            sourceEventId: item.sourceEventId,
          })),
          unlocked_masteries: [],
          unlocked_cosmetics: Object.values(result.state.unlockedCosmetics),
          unlock_history: result.state.unlockHistory,
          activity_events: result.state.activityLog,
          bootstrap_completed_at: evaluatedAt,
          replace_derived: true,
        })

        if (cancelled) return
        // Preserve processed event ids from local bootstrap batch.
        const normalized = normalizeRewardState(response.state)
        normalized.processedEvents = {
          ...normalized.processedEvents,
          ...result.state.processedEvents,
        }
        normalized.xp = result.state.xp
        normalized.activityLog = result.state.activityLog
        normalized.unlockHistory = result.state.unlockHistory
        setRewardState(normalized)
        if (result.aggregate.rewardEvents.length > 0) {
          setQueue((previous) => [
            ...previous,
            ...result.aggregate.rewardEvents.map((event) =>
              normalizeReward(event as Partial<RewardEvent> & Pick<RewardEvent, 'kind' | 'title' | 'variant'>),
            ),
          ])
        }
        setBootstrapStatus('done')
      } catch (err) {
        console.error('Progression bootstrap failed', err)
        if (!cancelled) setBootstrapStatus('error')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user, rewardStateLoaded, rewardState.bootstrapCompletedAt, rewardState.processedEvents])

  useEffect(() => {
    if (activeReward || queue.length === 0) return

    const [nextReward, ...rest] = queue
    setQueue(rest)
    setActiveReward(nextReward)
  }, [activeReward, queue])

  useEffect(() => {
    if (!activeReward) {
      setIsRewardVisible(false)
      return
    }

    let cancelled = false
    const frame = window.requestAnimationFrame(() => {
      if (!cancelled) setIsRewardVisible(true)
    })

    return () => {
      cancelled = true
      window.cancelAnimationFrame(frame)
    }
  }, [activeReward])

  useEffect(() => {
    if (!activeReward || !isRewardVisible) return

    const autoCloseMs = activeReward.autoCloseMs
    if (!autoCloseMs || autoCloseMs <= 0) return

    const timer = window.setTimeout(() => {
      closeActiveReward()
    }, autoCloseMs)

    return () => window.clearTimeout(timer)
  }, [activeReward, isRewardVisible, closeActiveReward])

  useEffect(() => {
    if (!activeReward) return

    return () => {
      if (exitTimerRef.current) {
        window.clearTimeout(exitTimerRef.current)
      }
    }
  }, [activeReward])

  const enqueueReward = useCallback((event: Partial<RewardEvent> & Pick<RewardEvent, 'kind' | 'title' | 'variant'>) => {
    setQueue((previous) => [...previous, normalizeReward(event)])
  }, [])

  const enqueueRewards = useCallback(
    (events: Array<Partial<RewardEvent> & Pick<RewardEvent, 'kind' | 'title' | 'variant'>>) => {
      setQueue((previous) => [...previous, ...events.map(normalizeReward)])
    },
    [],
  )

  const ingestActivityEvents = useCallback(
    async (events: RinkActivityEvent[], options?: { showToasts?: boolean }): Promise<ActivityIngestResult> => {
      const previousXp = Number(rewardStateRef.current.xp || 0)
      if (!events.length) return EMPTY_INGEST_RESULT(previousXp)
      const showToasts = options?.showToasts !== false
      const current = rewardStateRef.current
      const presence = applyVenuePresenceToEvents(events, current.venueVisits || {})
      const workingEvents = presence.events
      const slice = toProgressionSlice(current)
      const { state: nextSlice, aggregate } = processActivityEventBatch(slice, workingEvents, {
        skipBaseSessionXp: true,
      })
      const challengeResult = evaluateChallenges({
        events: workingEvents,
        definitions: contentRegistry.challenges,
        pools: contentRegistry.pools,
        campaigns: contentRegistry.campaigns,
        progress: current.challengeProgress || {},
        processedEvents: nextSlice.processedEvents,
        rotation: current.challengeRotation,
        matchday: matchdayFromState(current),
        unlockedCosmetics: {
          ...nextSlice.unlockedCosmetics,
        },
        userId: user || undefined,
      })

      const collectionResult = evaluateCollectionCompletions({
        unlockedCosmetics: {
          ...nextSlice.unlockedCosmetics,
          ...Object.fromEntries(challengeResult.unlockedCosmetics.map((item) => [item.cosmeticId, item])),
        },
        processedEvents: {
          ...nextSlice.processedEvents,
          ...Object.fromEntries(challengeResult.processedEventIds.map((id) => [id, true])),
        },
        starterOwned: isStarterCosmetic,
      })

      const clientGrantedXp = aggregate.grantedXp + challengeResult.grantedXp + collectionResult.grantedXp
      const clientGrantedPux = aggregate.grantedPux + challengeResult.grantedPux + collectionResult.grantedPux
      const hasProgression =
        clientGrantedXp ||
        clientGrantedPux ||
        aggregate.unlockedAchievements.length ||
        aggregate.unlockedCosmetics.length ||
        challengeResult.unlockedCosmetics.length ||
        collectionResult.unlockedCosmetics.length
      const hasChallenge = challengeResult.changed || challengeResult.processedEventIds.length
      const hasVenueVisits = presence.changed
      const hasServerableActivity = aggregate.activityEventsAppended.length > 0

      const rewardEvents = [
        ...aggregate.rewardEvents,
        ...challengeResult.rewardEvents,
        ...collectionResult.rewardEvents,
      ].map((event) => normalizeReward(event as Partial<RewardEvent> & Pick<RewardEvent, 'kind' | 'title' | 'variant'>))

      if (!hasProgression && !hasChallenge && !hasVenueVisits && !hasServerableActivity) {
        if (Object.keys(nextSlice.processedEvents).length !== Object.keys(slice.processedEvents).length) {
          setRewardState((previous) => ({
            ...previous,
            processedEvents: nextSlice.processedEvents,
            activityLog: nextSlice.activityLog,
          }))
        }
        return EMPTY_INGEST_RESULT(previousXp)
      }

      const processedEventIds = [
        ...challengeResult.processedEventIds,
        ...(collectionResult.processedEventIds || []),
      ]
      const unlockedCosmetics = [
        ...aggregate.unlockedCosmetics,
        ...challengeResult.unlockedCosmetics,
        ...collectionResult.unlockedCosmetics,
      ]
      const unlockHistory = [
        ...aggregate.unlockHistory,
        ...challengeResult.unlockHistory,
        ...collectionResult.unlockHistory,
      ]

      const primaryEventId = events[0]?.id || processedEventIds[0] || `batch:${Date.now()}`
      let resultGrantedXp = clientGrantedXp
      let resultGrantedPux = clientGrantedPux
      let resultNextXp = previousXp + clientGrantedXp

      try {
        const response = await api.applyRewardResult({
          event_id: primaryEventId,
          session_id: events.find((e) => e.type === 'session_completed' && 'sessionId' in e)?.sessionId,
          evaluated_at: aggregate.evaluatedAt || new Date().toISOString(),
          granted_pux: clientGrantedPux,
          granted_xp: clientGrantedXp,
          reward_events: showToasts ? rewardEvents : [],
          unlocked_achievements: aggregate.unlockedAchievements.map((item) => ({
            id: item.achievementId,
            unlockedAt: item.unlockedAt,
            sourceEventId: item.sourceEventId,
          })),
          unlocked_masteries: [],
          unlocked_cosmetics: unlockedCosmetics,
          unlock_history: unlockHistory,
          activity_events: aggregate.activityEventsAppended,
          processed_event_ids: processedEventIds,
          pux_transactions: challengeResult.puxTransactions,
          completed_collections: (collectionResult.completedCollections || []).map((id) => ({
            collectionId: id,
            completedAt: aggregate.evaluatedAt || new Date().toISOString(),
          })),
          challenge_progress: challengeResult.progress,
          challenge_rotation: challengeResult.rotation,
          venue_visits: presence.visits,
          skip_idempotency: !hasProgression && !hasServerableActivity,
        })

        const normalized = normalizeRewardState(response.state)
        // Server XP includes unified unit grants; never overwrite with client-only calc.
        const serverXp = Number(response.state?.xp ?? normalized.xp ?? previousXp)
        const serverGrantedTotal = Number(
          response.granted_xp
          ?? (Number(response.server_granted_xp || 0) + clientGrantedXp),
        )
        resultGrantedXp = Math.max(0, Number.isFinite(serverGrantedTotal) ? serverGrantedTotal : (serverXp - previousXp))
        resultGrantedPux = Number(response.granted_pux ?? clientGrantedPux)
        resultNextXp = Math.max(previousXp, serverXp)

        normalized.xp = resultNextXp
        normalized.processedEvents = {
          ...normalized.processedEvents,
          ...nextSlice.processedEvents,
          ...Object.fromEntries(processedEventIds.map((id) => [id, { eventId: id, processedAt: aggregate.evaluatedAt, grantedXp: 0, grantedPux: 0 }])),
        }
        normalized.activityLog = nextSlice.activityLog
        normalized.unlockHistory = [...unlockHistory, ...(normalized.unlockHistory || [])].slice(0, 100)
        normalized.unlockedCosmetics = {
          ...normalized.unlockedCosmetics,
          ...nextSlice.unlockedCosmetics,
          ...Object.fromEntries(unlockedCosmetics.map((item) => [item.cosmeticId, item])),
        }
        normalized.challengeProgress = challengeResult.progress
        normalized.challengeRotation = challengeResult.rotation
        normalized.venueVisits = presence.visits
        for (const unlock of aggregate.unlockedAchievements) {
          if (!normalized.unlockedAchievements[unlock.achievementId]) {
            normalized.unlockedAchievements[unlock.achievementId] = {
              id: unlock.achievementId,
              unlockedAt: unlock.unlockedAt,
              sourceEventId: unlock.sourceEventId,
            }
          }
        }
        setRewardState(normalized)

        if (showToasts && rewardEvents.length > 0) {
          const toastEvents = rewardEvents.filter(isRewardToastEvent)
          enqueueRewards(
            toastEvents.map((event) => event as Partial<RewardEvent> & Pick<RewardEvent, 'kind' | 'title' | 'variant'>),
          )
        }
      } catch (err) {
        console.error('Failed to apply progression events', err)
        resultNextXp = previousXp + clientGrantedXp
        resultGrantedXp = clientGrantedXp
        resultGrantedPux = clientGrantedPux
        setRewardState((previous) => ({
          ...previous,
          xp: resultNextXp,
          currency: {
            ...previous.currency,
            PUX: (previous.currency.PUX || 0) + clientGrantedPux,
          },
          unlockedAchievements: {
            ...previous.unlockedAchievements,
            ...Object.fromEntries(
              aggregate.unlockedAchievements.map((item) => [
                item.achievementId,
                { id: item.achievementId, unlockedAt: item.unlockedAt, sourceEventId: item.sourceEventId },
              ]),
            ),
          },
          unlockedCosmetics: {
            ...nextSlice.unlockedCosmetics,
            ...Object.fromEntries(unlockedCosmetics.map((item) => [item.cosmeticId, item])),
          },
          processedEvents: nextSlice.processedEvents,
          activityLog: nextSlice.activityLog,
          unlockHistory: [...unlockHistory, ...previous.unlockHistory].slice(0, 100),
          challengeProgress: challengeResult.progress,
          challengeRotation: challengeResult.rotation,
          venueVisits: presence.visits,
        }))
        if (showToasts && rewardEvents.length > 0) {
          enqueueRewards(
            rewardEvents
              .filter(isRewardToastEvent)
              .map(
                (event) => event as Partial<RewardEvent> & Pick<RewardEvent, 'kind' | 'title' | 'variant'>,
              ),
          )
        }
      }

      // Synthetic XP toast for the recap when server unit XP landed without client reward events.
      if (resultGrantedXp > 0 && !rewardEvents.some((event) => event.kind === 'system' && String(event.title || '').includes('XP'))) {
        rewardEvents.unshift(
          normalizeReward({
            id: `xp:session:${primaryEventId}`,
            kind: 'system',
            title: `+${resultGrantedXp} XP`,
            description: 'Session-Fortschritt',
            variant: 'small',
            meta: { amountXp: resultGrantedXp },
          }),
        )
      }

      return {
        grantedXp: resultGrantedXp,
        grantedPux: resultGrantedPux,
        previousXp,
        nextXp: resultNextXp,
        rewardEvents,
      }
    },
    [enqueueRewards, user],
  )

  const rebuildProgression = useCallback(
    async (input: {
      sessions: Parameters<typeof bootstrapProgression>[0]['sessions']
      scenes: Parameters<typeof bootstrapProgression>[0]['scenes']
      trackDrills?: Parameters<typeof bootstrapProgression>[0]['trackDrills']
      moduleDrills?: Parameters<typeof bootstrapProgression>[0]['moduleDrills']
    }) => {
      const confirmed =
        typeof window === 'undefined' ||
        window.confirm(
          'Progression neu berechnen? Abgeleitete XP/Achievements/Cosmetics werden aus deinen echten Sessions nach aktueller Logik neu aufgebaut. Shop-Käufe bleiben erhalten.',
        )
      if (!confirmed) return

      const result = bootstrapProgression({
        ...input,
        existing: toProgressionSlice(rewardStateRef.current),
        forceRebuild: true,
        userId: user || undefined,
      })
      const evaluatedAt = new Date().toISOString()
      // Unit XP/PUX: server. Level rewards: server after final XP.
      // Client PUX on rebuild = achievement/collection only (strip level PUX).
      const levelPuxFromClient = (result.aggregate.levelsGained || []).reduce((sum, level) => {
        const rewards = getLevelRewards(level)?.rewards || []
        return (
          sum +
          rewards.reduce((inner, reward) => {
            if (reward.type === 'pux') return inner + Number(reward.amount || 0)
            return inner
          }, 0)
        )
      }, 0)
      const achievementPux = Math.max(0, Number(result.aggregate.grantedPux || 0) - levelPuxFromClient)
      let response
      try {
        response = await api.applyRewardResult({
          event_id: BOOTSTRAP_EVENT_ID,
          evaluated_at: evaluatedAt,
          granted_pux: achievementPux,
          granted_xp: 0,
          reward_events: result.aggregate.rewardEvents,
          unlocked_achievements: Object.values(result.state.unlockedAchievements).map((item) => ({
            id: item.id,
            unlockedAt: item.unlockedAt,
            sourceEventId: item.sourceEventId,
          })),
          unlocked_masteries: [],
          unlocked_cosmetics: Object.values(result.state.unlockedCosmetics),
          unlock_history: result.state.unlockHistory,
          // Don't ship the full activity log for unit grants — server loads sessions itself.
          activity_events: [],
          bootstrap_completed_at: evaluatedAt,
          replace_derived: true,
        })
      } catch (err) {
        window.alert(
          `Progression-Rebuild fehlgeschlagen — bisheriger Stand bleibt. ${
            err instanceof Error ? err.message : String(err)
          }`,
        )
        return
      }
      const normalized = normalizeRewardState(response.state)
      normalized.processedEvents = {
        ...normalized.processedEvents,
        ...result.state.processedEvents,
      }
      normalized.activityLog = result.state.activityLog
      normalized.unlockHistory = result.state.unlockHistory
      setRewardState(normalized)
      const serverXp = Number(normalized.xp || 0)
      if (serverXp < 500) {
        window.alert(
          `Rebuild verdächtig niedrig (${serverXp} XP). Bitte Backend-Neustart prüfen und nicht erneut rebuilden.`,
        )
      }
      enqueueReward({
        kind: 'system',
        title: 'Progression neu berechnet',
        description: `${result.summaryHistory?.description || ''} · Server ${serverXp} XP`.trim(),
        variant: 'popup',
        visualTier: 'gold',
        icon: '⚡',
      })
    },
    [enqueueReward, user],
  )

  const purchaseShopListing = useCallback(async (listingId: string) => {
    const current = rewardStateRef.current
    const result = evaluateShopPurchase({
      listingId,
      balancePux: Number(current.currency?.PUX || 0),
      unlockedCosmetics: current.unlockedCosmetics || {},
      processedEvents: current.processedEvents || {},
    })
    if (!result.ok) return { ok: false, reason: result.reason }

    try {
      const response = await api.applyRewardResult({
        event_id: result.eventId,
        evaluated_at: result.unlock.unlockedAt,
        granted_pux: -result.pricePux,
        granted_xp: 0,
        reward_events: [
          {
            id: result.eventId,
            kind: 'system',
            title: 'Kauf erfolgreich',
            description: `${result.cosmeticId} · −${result.pricePux} Pux`,
            variant: 'popup',
            visualTier: 'silver',
          },
        ],
        unlocked_achievements: [],
        unlocked_masteries: [],
        unlocked_cosmetics: [result.unlock],
        unlock_history: [result.history],
        pux_transactions: [result.transaction],
      })
      setRewardState(normalizeRewardState(response.state))
      enqueueReward({
        kind: 'system',
        title: 'Kauf erfolgreich',
        description: result.history.description,
        variant: 'popup',
        visualTier: 'silver',
        icon: '🛒',
      })

      // Collection completion may follow a shop purchase.
      const collectionResult = evaluateCollectionCompletions({
        unlockedCosmetics: {
          ...(response.state.unlockedCosmetics || {}),
          [result.unlock.cosmeticId]: result.unlock,
        },
        processedEvents: normalizeRewardState(response.state).processedEvents,
        starterOwned: isStarterCosmetic,
      })
      if (collectionResult.processedEventIds.length) {
        const followUp = await api.applyRewardResult({
          event_id: collectionResult.processedEventIds[0],
          evaluated_at: new Date().toISOString(),
          granted_pux: collectionResult.grantedPux,
          granted_xp: collectionResult.grantedXp,
          reward_events: collectionResult.rewardEvents,
          unlocked_achievements: [],
          unlocked_masteries: [],
          unlocked_cosmetics: collectionResult.unlockedCosmetics,
          unlock_history: collectionResult.unlockHistory,
          completed_collections: (collectionResult.completedCollections || []).map((id) => ({
            collectionId: id,
            completedAt: new Date().toISOString(),
          })),
          processed_event_ids: collectionResult.processedEventIds,
        })
        const normalized = normalizeRewardState(followUp.state)
        for (const eventId of collectionResult.processedEventIds) {
          normalized.processedEvents[eventId] = {
            eventId,
            processedAt: new Date().toISOString(),
            grantedXp: 0,
            grantedPux: 0,
          }
        }
        setRewardState(normalized)
        if (collectionResult.rewardEvents.length) {
          enqueueRewards(
            collectionResult.rewardEvents.map(
              (event) => event as Partial<RewardEvent> & Pick<RewardEvent, 'kind' | 'title' | 'variant'>,
            ),
          )
        }
      }

      return { ok: true }
    } catch (err) {
      console.error('Shop purchase failed', err)
      return { ok: false, reason: 'not_found' }
    }
  }, [enqueueReward, enqueueRewards])

  const markCosmeticsSeen = useCallback(async (cosmeticIds: string[]) => {
    const ids = cosmeticIds.filter(Boolean)
    if (!ids.length) return
    const evaluatedAt = new Date().toISOString()
    try {
      const response = await api.applyRewardResult({
        event_id: `locker:seen:${evaluatedAt}`,
        evaluated_at: evaluatedAt,
        granted_pux: 0,
        reward_events: [],
        unlocked_achievements: [],
        unlocked_masteries: [],
        mark_cosmetics_seen: ids,
        skip_idempotency: true,
      })
      setRewardState(normalizeRewardState(response.state))
    } catch (err) {
      console.error('markCosmeticsSeen failed', err)
      setRewardState((previous) => {
        const next = { ...previous, unlockedCosmetics: { ...previous.unlockedCosmetics } }
        for (const id of ids) {
          const entry = next.unlockedCosmetics[id]
          if (entry && !entry.seenAt) {
            next.unlockedCosmetics[id] = { ...entry, seenAt: evaluatedAt }
          }
        }
        return next
      })
    }
  }, [])

  const toggleFavoriteCosmetic = useCallback(async (cosmeticId: string) => {
    const current = new Set(rewardStateRef.current.favoriteCosmeticIds || [])
    if (current.has(cosmeticId)) current.delete(cosmeticId)
    else current.add(cosmeticId)
    const next = Array.from(current)
    const evaluatedAt = new Date().toISOString()
    setRewardState((previous) => ({ ...previous, favoriteCosmeticIds: next }))
    try {
      const response = await api.applyRewardResult({
        event_id: `locker:favorite:${evaluatedAt}`,
        evaluated_at: evaluatedAt,
        granted_pux: 0,
        reward_events: [],
        unlocked_achievements: [],
        unlocked_masteries: [],
        favorite_cosmetic_ids: next,
        skip_idempotency: true,
      })
      setRewardState(normalizeRewardState(response.state))
    } catch (err) {
      console.error('toggleFavoriteCosmetic failed', err)
    }
  }, [])

  const evaluateLockerMetaProgress = useCallback(
    async (input: {
      sessions: Parameters<typeof bootstrapProgression>[0]['sessions']
      trackDrills: Record<string, string[]>
      showToasts?: boolean
    }): Promise<ActivityIngestResult> => {
      const previousXp = Number(rewardStateRef.current.xp || 0)
      if (metaInFlightRef.current) return EMPTY_INGEST_RESULT(previousXp)
      const showToasts = input.showToasts !== false
      const current = rewardStateRef.current
      const mastery = evaluateMasteryGrants({
        sessions: input.sessions,
        trackDrills: input.trackDrills,
        processedEvents: current.processedEvents || {},
        unlockedCosmetics: current.unlockedCosmetics || {},
        // Locker catch-up: track + collections only. Per-drill mastery runs on session complete.
        scopes: ['track'],
      })
      const cosmetics = {
        ...current.unlockedCosmetics,
        ...Object.fromEntries(mastery.unlockedCosmetics.map((c) => [c.cosmeticId, c])),
      }
      const collections = evaluateCollectionCompletions({
        unlockedCosmetics: cosmetics,
        processedEvents: {
          ...current.processedEvents,
          ...Object.fromEntries(mastery.processedEventIds.map((id) => [id, true])),
        },
        starterOwned: isStarterCosmetic,
      })

      const allEventIds = [...mastery.processedEventIds, ...collections.processedEventIds]
      const grantedXp = mastery.grantedXp + collections.grantedXp
      const grantedPux = mastery.grantedPux + collections.grantedPux
      const rewardEvents = [...mastery.rewardEvents, ...collections.rewardEvents].map((event) =>
        normalizeReward(event as Partial<RewardEvent> & Pick<RewardEvent, 'kind' | 'title' | 'variant'>),
      )
      if (!allEventIds.length && !grantedXp && !grantedPux) {
        return EMPTY_INGEST_RESULT(previousXp)
      }

      // Optimistic lock: mark all event ids locally BEFORE await so concurrent calls no-op.
      metaInFlightRef.current = true
      const evaluatedAt = new Date().toISOString()
      const optimisticProcessed = { ...(current.processedEvents || {}) }
      for (const eventId of allEventIds) {
        optimisticProcessed[eventId] = {
          eventId,
          processedAt: evaluatedAt,
          grantedXp: 0,
          grantedPux: 0,
        }
      }
      rewardStateRef.current = {
        ...current,
        processedEvents: optimisticProcessed,
      }

      try {
        const primaryEventId = allEventIds[0] || `locker:meta:${Date.now()}`
        const response = await api.applyRewardResult({
          event_id: primaryEventId,
          evaluated_at: evaluatedAt,
          granted_pux: grantedPux,
          granted_xp: grantedXp,
          reward_events: showToasts ? rewardEvents : [],
          unlocked_achievements: [],
          unlocked_masteries: [],
          unlocked_cosmetics: [...mastery.unlockedCosmetics, ...collections.unlockedCosmetics],
          unlock_history: [...mastery.unlockHistory, ...collections.unlockHistory],
          completed_collections: (collections.completedCollections || []).map((id) => ({
            collectionId: id,
            completedAt: evaluatedAt,
          })),
          mastery_milestone_unlocks: mastery.masteryUnlocks,
          processed_event_ids: allEventIds,
        })
        const normalized = normalizeRewardState(response.state)
        normalized.processedEvents = {
          ...normalized.processedEvents,
          ...optimisticProcessed,
        }
        setRewardState(normalized)
        if (showToasts && rewardEvents.length) {
          enqueueRewards(
            rewardEvents.map((event) => event as Partial<RewardEvent> & Pick<RewardEvent, 'kind' | 'title' | 'variant'>),
          )
        }
      } catch (err) {
        console.error('Locker meta progress failed', err)
        // Keep optimistic processed markers to avoid retry storm; rebuild can recover.
        setRewardState((previous) => ({
          ...previous,
          processedEvents: {
            ...previous.processedEvents,
            ...optimisticProcessed,
          },
        }))
      } finally {
        metaInFlightRef.current = false
      }

      return {
        grantedXp,
        grantedPux,
        previousXp,
        nextXp: previousXp + grantedXp,
        rewardEvents,
      }
    },
    [enqueueRewards],
  )

  const syncChallengeBoard = useCallback(
    async (input?: { matchday?: MatchdayContext | null }) => {
      if (!rewardStateLoaded) return
      const current = rewardStateRef.current
      const result = evaluateChallenges({
        events: [],
        definitions: contentRegistry.challenges,
        pools: contentRegistry.pools,
        campaigns: contentRegistry.campaigns,
        progress: current.challengeProgress || {},
        processedEvents: current.processedEvents || {},
        rotation: current.challengeRotation,
        matchday: input?.matchday === undefined ? matchdayFromState(current) : input.matchday,
        unlockedCosmetics: current.unlockedCosmetics || {},
        userId: user || undefined,
      })
      if (!result.changed) return
      const evaluatedAt = new Date().toISOString()
      setRewardState((previous) => ({
        ...previous,
        challengeProgress: result.progress,
        challengeRotation: result.rotation,
      }))
      try {
        const response = await api.applyRewardResult({
          event_id: `challenge:sync:${evaluatedAt}`,
          evaluated_at: evaluatedAt,
          granted_pux: 0,
          granted_xp: 0,
          reward_events: [],
          unlocked_achievements: [],
          unlocked_masteries: [],
          challenge_progress: result.progress,
          challenge_rotation: result.rotation,
          skip_idempotency: true,
        })
        const normalized = normalizeRewardState(response.state)
        normalized.challengeProgress = result.progress
        normalized.challengeRotation = result.rotation
        setRewardState(normalized)
      } catch (err) {
        console.error('syncChallengeBoard failed', err)
      }
    },
    [user, rewardStateLoaded],
  )

  const value = useMemo(
    () => ({
      rewardState,
      activeReward,
      isRewardVisible,
      enqueueReward,
      enqueueRewards,
      closeActiveReward,
      ingestActivityEvents,
      rebuildProgression,
      purchaseShopListing,
      markCosmeticsSeen,
      toggleFavoriteCosmetic,
      evaluateLockerMetaProgress,
      syncChallengeBoard,
      bootstrapStatus,
      rewardStateLoaded,
    }),
    [
      rewardState,
      activeReward,
      isRewardVisible,
      enqueueReward,
      enqueueRewards,
      closeActiveReward,
      ingestActivityEvents,
      rebuildProgression,
      purchaseShopListing,
      markCosmeticsSeen,
      toggleFavoriteCosmetic,
      evaluateLockerMetaProgress,
      syncChallengeBoard,
      bootstrapStatus,
      rewardStateLoaded,
    ],
  )

  return <RewardContext.Provider value={value}>{children}</RewardContext.Provider>
}

export function useRewards() {
  const context = useContext(RewardContext)
  if (!context) {
    throw new Error('useRewards must be used within RewardProvider')
  }

  return context
}

/** Helper for session completion: run progression for session-derived events. */
export function evaluateSessionProgression(
  rewardState: RewardState,
  events: RinkActivityEvent[],
) {
  return processActivityEventBatch(toProgressionSlice(rewardState), events)
}

export { processActivityEvent }
