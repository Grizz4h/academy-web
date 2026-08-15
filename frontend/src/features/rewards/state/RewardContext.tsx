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
  evaluateChallenges,
  evaluateCollectionCompletions,
  evaluateMasteryGrants,
  evaluateShopPurchase,
  isStarterCosmetic,
  processActivityEvent,
  processActivityEventBatch,
  type ProgressionStateSlice,
  type RinkActivityEvent,
} from '../../progression'
import { contentRegistry } from '../../../content/registry'
import type { MatchdayContext } from '../../progression/challenges/types'
import { createEmptyRewardState, type RewardEvaluationResult, type RewardEvent, type RewardState } from '../types'

type RewardContextValue = {
  rewardState: RewardState
  activeReward: RewardEvent | null
  isRewardVisible: boolean
  enqueueReward: (event: Partial<RewardEvent> & Pick<RewardEvent, 'kind' | 'title' | 'variant'>) => void
  enqueueRewards: (events: Array<Partial<RewardEvent> & Pick<RewardEvent, 'kind' | 'title' | 'variant'>>) => void
  closeActiveReward: () => void
  grantRewardResult: (result: RewardEvaluationResult) => Promise<void>
  /** Process one or more activity events through the progression engine (idempotent). */
  ingestActivityEvents: (
    events: RinkActivityEvent[],
    options?: { showToasts?: boolean },
  ) => Promise<void>
  rebuildProgression: (input: {
    sessions: Parameters<typeof bootstrapProgression>[0]['sessions']
    scenes: Parameters<typeof bootstrapProgression>[0]['scenes']
    trackDrills?: Parameters<typeof bootstrapProgression>[0]['trackDrills']
  }) => Promise<void>
  purchaseShopListing: (listingId: string) => Promise<{ ok: boolean; reason?: string }>
  markCosmeticsSeen: (cosmeticIds: string[]) => Promise<void>
  toggleFavoriteCosmetic: (cosmeticId: string) => Promise<void>
  evaluateLockerMetaProgress: (input: {
    sessions: Parameters<typeof bootstrapProgression>[0]['sessions']
    trackDrills: Record<string, string[]>
  }) => Promise<void>
  syncChallengeBoard: (input?: { matchday?: MatchdayContext | null }) => Promise<void>
  bootstrapStatus: 'idle' | 'running' | 'done' | 'error'
}

const RewardContext = createContext<RewardContextValue | undefined>(undefined)

const EXIT_MS = 180

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
    unlockedAchievements: state.unlockedAchievements || {},
    unlockedCosmetics: state.unlockedCosmetics || {},
    processedEvents: state.processedEvents || {},
    activityLog: state.activityLog || [],
    unlockHistory: state.unlockHistory || [],
  }
}

function applyRewardResultLocally(previousState: RewardState, result: RewardEvaluationResult): RewardState {
  const nextState: RewardState = {
    ...previousState,
    currency: { ...previousState.currency },
    unlockedAchievements: { ...previousState.unlockedAchievements },
    unlockedMasteries: { ...previousState.unlockedMasteries },
    processedSessions: { ...previousState.processedSessions },
    processedEvents: { ...(previousState.processedEvents || {}) },
    unlockedCosmetics: { ...(previousState.unlockedCosmetics || {}) },
    activityLog: [...(previousState.activityLog || [])],
    unlockHistory: [...(previousState.unlockHistory || [])],
    xp: previousState.xp || 0,
  }

  const alreadyProcessed = Boolean(nextState.processedSessions[result.sessionId])

  if (!alreadyProcessed) {
    nextState.currency.PUX = (nextState.currency.PUX || 0) + result.grantedPux
    nextState.processedSessions[result.sessionId] = {
      sessionId: result.sessionId,
      grantedAt: result.evaluatedAt,
      pux: result.grantedPux,
    }
  }

  for (const achievement of result.unlockedAchievements) {
    if (!nextState.unlockedAchievements[achievement.id]) {
      nextState.unlockedAchievements[achievement.id] = {
        id: achievement.id,
        unlockedAt: result.evaluatedAt,
      }
    }
  }

  for (const mastery of result.unlockedMasteries) {
    if (!nextState.unlockedMasteries[mastery.key]) {
      nextState.unlockedMasteries[mastery.key] = mastery
    }
  }

  if (result.progression) {
    const prog = result.progression
    if (!nextState.processedEvents[prog.eventId]) {
      nextState.xp = (nextState.xp || 0) + (prog.grantedXp || 0)
      nextState.currency.PUX = (nextState.currency.PUX || 0) + (prog.grantedPux || 0)
      nextState.processedEvents[prog.eventId] = {
        eventId: prog.eventId,
        processedAt: result.evaluatedAt,
        grantedXp: prog.grantedXp || 0,
        grantedPux: prog.grantedPux || 0,
      }
      for (const achievement of prog.unlockedAchievements || []) {
        if (!nextState.unlockedAchievements[achievement.id]) {
          nextState.unlockedAchievements[achievement.id] = achievement
        }
      }
      for (const cosmetic of prog.unlockedCosmetics || []) {
        if (!nextState.unlockedCosmetics[cosmetic.cosmeticId]) {
          nextState.unlockedCosmetics[cosmetic.cosmeticId] = cosmetic
        }
      }
      const existingIds = new Set(nextState.activityLog.map((e) => e.id))
      for (const event of prog.activityEvents || []) {
        if (!existingIds.has(event.id)) {
          nextState.activityLog.push(event)
          existingIds.add(event.id)
        }
        nextState.processedEvents[event.id] = {
          eventId: event.id,
          processedAt: result.evaluatedAt,
          grantedXp: 0,
          grantedPux: 0,
        }
      }
      nextState.unlockHistory = [...(prog.unlockHistory || []), ...nextState.unlockHistory].slice(0, 100)
      if (prog.bootstrapCompletedAt) {
        nextState.bootstrapCompletedAt = prog.bootstrapCompletedAt
      }
    }
  }

  nextState.lastUpdatedAt = result.evaluatedAt
  return nextState
}

function normalizeRewardState(state: any): RewardState {
  const base = createEmptyRewardState()
  return {
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
  }
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

        const trackDrills: Record<string, string[]> = {}
        const tracks = curriculum?.tracks || []
        for (const track of tracks) {
          const trackId = String(track.id || '').trim()
          if (!trackId) continue
          const drillIds: string[] = []
          for (const module of track.modules || []) {
            if (module.active === false) continue
            for (const drill of module.drills || []) {
              if (drill.id) drillIds.push(drill.id)
            }
            if (module.id) drillIds.push(module.id)
          }
          trackDrills[trackId] = Array.from(new Set(drillIds))
        }

        const result = bootstrapProgression({
          sessions,
          scenes: scenesPayload?.scenes || [],
          trackDrills,
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

    const frame = window.requestAnimationFrame(() => {
      setIsRewardVisible(true)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [activeReward, queue])

  useEffect(() => {
    if (!activeReward) return

    return () => {
      if (exitTimerRef.current) {
        window.clearTimeout(exitTimerRef.current)
      }
    }
  }, [activeReward])

  const closeActiveReward = useCallback(() => {
    setIsRewardVisible(false)
    if (exitTimerRef.current) {
      window.clearTimeout(exitTimerRef.current)
    }
    exitTimerRef.current = window.setTimeout(() => {
      setActiveReward(null)
    }, EXIT_MS)
  }, [])

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
    async (events: RinkActivityEvent[], options?: { showToasts?: boolean }) => {
      if (!events.length) return
      const showToasts = options?.showToasts !== false
      const current = rewardStateRef.current
      const slice = toProgressionSlice(current)
      const { state: nextSlice, aggregate } = processActivityEventBatch(slice, events)
      const challengeResult = evaluateChallenges({
        events,
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

      const grantedXp = aggregate.grantedXp + challengeResult.grantedXp + collectionResult.grantedXp
      const grantedPux = aggregate.grantedPux + challengeResult.grantedPux + collectionResult.grantedPux
      const hasProgression =
        grantedXp ||
        grantedPux ||
        aggregate.unlockedAchievements.length ||
        aggregate.unlockedCosmetics.length ||
        challengeResult.unlockedCosmetics.length ||
        collectionResult.unlockedCosmetics.length
      const hasChallenge = challengeResult.changed || challengeResult.processedEventIds.length

      if (!hasProgression && !hasChallenge) {
        if (Object.keys(nextSlice.processedEvents).length !== Object.keys(slice.processedEvents).length) {
          setRewardState((previous) => ({
            ...previous,
            processedEvents: nextSlice.processedEvents,
            activityLog: nextSlice.activityLog,
          }))
        }
        return
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
      const rewardEvents = [
        ...aggregate.rewardEvents,
        ...challengeResult.rewardEvents,
        ...collectionResult.rewardEvents,
      ]

      const primaryEventId = events[0]?.id || processedEventIds[0] || `batch:${Date.now()}`
      try {
        const response = await api.applyRewardResult({
          event_id: primaryEventId,
          session_id: events.find((e) => e.type === 'session_completed' && 'sessionId' in e)?.sessionId,
          evaluated_at: aggregate.evaluatedAt || new Date().toISOString(),
          granted_pux: grantedPux,
          granted_xp: grantedXp,
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
          skip_idempotency: !hasProgression,
        })

        const normalized = normalizeRewardState(response.state)
        normalized.processedEvents = {
          ...normalized.processedEvents,
          ...nextSlice.processedEvents,
          ...Object.fromEntries(processedEventIds.map((id) => [id, { eventId: id, processedAt: aggregate.evaluatedAt, grantedXp: 0, grantedPux: 0 }])),
        }
        normalized.xp = nextSlice.xp + challengeResult.grantedXp + collectionResult.grantedXp
        normalized.activityLog = nextSlice.activityLog
        normalized.unlockHistory = [...unlockHistory, ...(normalized.unlockHistory || [])].slice(0, 100)
        normalized.unlockedCosmetics = {
          ...normalized.unlockedCosmetics,
          ...nextSlice.unlockedCosmetics,
          ...Object.fromEntries(unlockedCosmetics.map((item) => [item.cosmeticId, item])),
        }
        normalized.challengeProgress = challengeResult.progress
        normalized.challengeRotation = challengeResult.rotation
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
          const toastEvents = rewardEvents.filter((event) => {
            const kind = (event as { kind?: string }).kind
            return kind === 'achievement' || kind === 'currency' || kind === 'system'
          })
          enqueueRewards(
            toastEvents.map((event) => event as Partial<RewardEvent> & Pick<RewardEvent, 'kind' | 'title' | 'variant'>),
          )
        }
      } catch (err) {
        console.error('Failed to apply progression events', err)
        setRewardState((previous) => ({
          ...previous,
          xp: nextSlice.xp + challengeResult.grantedXp + collectionResult.grantedXp,
          currency: {
            ...previous.currency,
            PUX: (previous.currency.PUX || 0) + grantedPux,
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
        }))
        if (showToasts && rewardEvents.length > 0) {
          enqueueRewards(
            rewardEvents.map(
              (event) => event as Partial<RewardEvent> & Pick<RewardEvent, 'kind' | 'title' | 'variant'>,
            ),
          )
        }
      }
    },
    [enqueueRewards, user],
  )

  const grantRewardResult = useCallback(
    async (result: RewardEvaluationResult) => {
      const hasAnythingToApply =
        (result.grantedPux || 0) > 0 ||
        (result.unlockedAchievements || []).length > 0 ||
        (result.unlockedMasteries || []).length > 0 ||
        (result.rewardEvents || []).length > 0 ||
        Boolean(result.progression)

      if (!hasAnythingToApply) {
        return
      }

      try {
        const prog = result.progression
        const response = await api.applyRewardResult({
          session_id: result.sessionId,
          event_id: prog?.eventId,
          evaluated_at: result.evaluatedAt,
          granted_pux: result.grantedPux + (prog?.grantedPux || 0),
          granted_xp: prog?.grantedXp || 0,
          reward_events: result.rewardEvents,
          unlocked_achievements: [
            ...result.unlockedAchievements.map((achievement) => ({
              id: achievement.id,
              unlockedAt: result.evaluatedAt,
            })),
            ...((prog?.unlockedAchievements || []).map((item) => ({
              id: item.id,
              unlockedAt: item.unlockedAt,
              sourceEventId: item.sourceEventId,
            })) || []),
          ],
          unlocked_masteries: result.unlockedMasteries,
          unlocked_cosmetics: prog?.unlockedCosmetics || [],
          unlock_history: prog?.unlockHistory || [],
          activity_events: prog?.activityEvents || [],
          bootstrap_completed_at: prog?.bootstrapCompletedAt,
        })

        const nextState = normalizeRewardState(response.state)
        const unlockedAchievementDelta = Object.keys(nextState.unlockedAchievements).filter(
          (id) => !rewardState.unlockedAchievements[id],
        )
        const unlockedMasteryDelta = Object.keys(nextState.unlockedMasteries).filter(
          (key) => !rewardState.unlockedMasteries[key],
        )

        setRewardState(nextState)

        const serverEvents = (response.reward_events || []) as RewardEvent[]
        const fallbackEvents = result.rewardEvents.filter((event) => {
          if (event.kind === 'achievement' && event.achievementId) {
            return unlockedAchievementDelta.includes(event.achievementId)
          }

          if (event.kind === 'mastery' && event.id.startsWith('mastery:')) {
            const masteryKey = event.id.slice('mastery:'.length)
            return unlockedMasteryDelta.includes(masteryKey)
          }

          return false
        })

        const mergedEventsById = new Map<string, RewardEvent>()
        for (const event of serverEvents) {
          if (event?.id) mergedEventsById.set(event.id, event)
        }
        for (const event of fallbackEvents) {
          if (event?.id && !mergedEventsById.has(event.id)) {
            mergedEventsById.set(event.id, event)
          }
        }

        const mergedEvents = Array.from(mergedEventsById.values())
        if (mergedEvents.length > 0) {
          enqueueRewards(mergedEvents)
        }
      } catch (err) {
        console.error('Failed to apply rewards on server, using local fallback', err)
        setRewardState((previous) => applyRewardResultLocally(previous, result))
        if (result.rewardEvents.length > 0) {
          enqueueRewards(result.rewardEvents)
        }
      }
    },
    [enqueueRewards, rewardState.unlockedAchievements, rewardState.unlockedMasteries],
  )

  const rebuildProgression = useCallback(
    async (input: {
      sessions: Parameters<typeof bootstrapProgression>[0]['sessions']
      scenes: Parameters<typeof bootstrapProgression>[0]['scenes']
      trackDrills?: Parameters<typeof bootstrapProgression>[0]['trackDrills']
    }) => {
      const confirmed =
        typeof window === 'undefined' ||
        window.confirm(
          'Progression neu berechnen? Abgeleitete XP/Achievements/Cosmetics werden aus echten Daten neu aufgebaut. Legacy-PUX aus alten Session-Rewards bleibt erhalten.',
        )
      if (!confirmed) return

      const result = bootstrapProgression({
        ...input,
        existing: toProgressionSlice(rewardStateRef.current),
        forceRebuild: true,
      })
      const evaluatedAt = new Date().toISOString()
      const response = await api.applyRewardResult({
        event_id: BOOTSTRAP_EVENT_ID,
        evaluated_at: evaluatedAt,
        // Rebuild must not re-grant PUX into the existing currency balance.
        granted_pux: 0,
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
      const normalized = normalizeRewardState(response.state)
      normalized.processedEvents = {
        ...normalized.processedEvents,
        ...result.state.processedEvents,
      }
      normalized.xp = result.state.xp
      normalized.activityLog = result.state.activityLog
      normalized.unlockHistory = result.state.unlockHistory
      setRewardState(normalized)
      enqueueReward({
        kind: 'system',
        title: 'Progression neu berechnet',
        description: result.summaryHistory?.description,
        variant: 'popup',
        visualTier: 'gold',
        icon: '⚡',
      })
    },
    [enqueueReward],
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
    }) => {
      if (metaInFlightRef.current) return
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
      if (!allEventIds.length && !grantedXp && !grantedPux) {
        return
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
          reward_events: [...mastery.rewardEvents, ...collections.rewardEvents],
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
        const toasts = [...mastery.rewardEvents, ...collections.rewardEvents]
        if (toasts.length) {
          enqueueRewards(
            toasts.map((event) => event as Partial<RewardEvent> & Pick<RewardEvent, 'kind' | 'title' | 'variant'>),
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
    },
    [enqueueRewards],
  )

  const syncChallengeBoard = useCallback(
    async (input?: { matchday?: MatchdayContext | null }) => {
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
    [user],
  )

  const value = useMemo(
    () => ({
      rewardState,
      activeReward,
      isRewardVisible,
      enqueueReward,
      enqueueRewards,
      closeActiveReward,
      grantRewardResult,
      ingestActivityEvents,
      rebuildProgression,
      purchaseShopListing,
      markCosmeticsSeen,
      toggleFavoriteCosmetic,
      evaluateLockerMetaProgress,
      syncChallengeBoard,
      bootstrapStatus,
    }),
    [
      rewardState,
      activeReward,
      isRewardVisible,
      enqueueReward,
      enqueueRewards,
      closeActiveReward,
      grantRewardResult,
      ingestActivityEvents,
      rebuildProgression,
      purchaseShopListing,
      markCosmeticsSeen,
      toggleFavoriteCosmetic,
      evaluateLockerMetaProgress,
      syncChallengeBoard,
      bootstrapStatus,
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
