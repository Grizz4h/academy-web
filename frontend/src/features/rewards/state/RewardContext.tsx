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
import { createEmptyRewardState, type RewardEvaluationResult, type RewardEvent, type RewardState } from '../types'

type RewardContextValue = {
  rewardState: RewardState
  activeReward: RewardEvent | null
  isRewardVisible: boolean
  enqueueReward: (event: Partial<RewardEvent> & Pick<RewardEvent, 'kind' | 'title' | 'variant'>) => void
  enqueueRewards: (events: Array<Partial<RewardEvent> & Pick<RewardEvent, 'kind' | 'title' | 'variant'>>) => void
  closeActiveReward: () => void
  grantRewardResult: (result: RewardEvaluationResult) => Promise<void>
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

function applyRewardResultLocally(previousState: RewardState, result: RewardEvaluationResult): RewardState {
  const nextState: RewardState = {
    ...previousState,
    currency: { ...previousState.currency },
    unlockedAchievements: { ...previousState.unlockedAchievements },
    unlockedMasteries: { ...previousState.unlockedMasteries },
    processedSessions: { ...previousState.processedSessions },
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

  nextState.lastUpdatedAt = result.evaluatedAt
  return nextState
}

function normalizeRewardState(
  state:
    | {
        currency?: RewardState['currency']
        unlockedAchievements?: RewardState['unlockedAchievements']
        unlockedMasteries?: RewardState['unlockedMasteries']
        processedSessions?: RewardState['processedSessions']
        lastUpdatedAt?: string | null
      }
    | undefined,
): RewardState {
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
    lastUpdatedAt: state?.lastUpdatedAt || undefined,
  }
}

export function RewardProvider({ children }: { children: ReactNode }) {
  const { user } = useUser()

  const [rewardState, setRewardState] = useState<RewardState>(createEmptyRewardState)
  const [queue, setQueue] = useState<RewardEvent[]>([])
  const [activeReward, setActiveReward] = useState<RewardEvent | null>(null)
  const [isRewardVisible, setIsRewardVisible] = useState(false)
  const exitTimerRef = useRef<number | null>(null)

  useEffect(() => {
    setQueue([])
    setActiveReward(null)
    setIsRewardVisible(false)

    if (!user) {
      setRewardState(createEmptyRewardState())
      return
    }

    let cancelled = false
    api
      .getRewardState()
      .then((serverState) => {
        if (cancelled) return
        setRewardState(normalizeRewardState(serverState))
      })
      .catch((err) => {
        console.error('Failed to load reward state from server', err)
        if (cancelled) return
        setRewardState(createEmptyRewardState())
      })

    return () => {
      cancelled = true
    }
  }, [user])

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
    // Reward cards stay open until the user confirms via the close action.
    // This keeps important unlocks visible and prevents accidental misses.
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

  const grantRewardResult = useCallback(async (result: RewardEvaluationResult) => {
    try {
      const response = await api.applyRewardResult({
        session_id: result.sessionId,
        evaluated_at: result.evaluatedAt,
        granted_pux: result.grantedPux,
        reward_events: result.rewardEvents,
        unlocked_achievements: result.unlockedAchievements.map((achievement) => ({
          id: achievement.id,
          unlockedAt: result.evaluatedAt,
        })),
        unlocked_masteries: result.unlockedMasteries,
      })

      setRewardState(normalizeRewardState(response.state))
      if (response.reward_events.length > 0) {
        enqueueRewards(response.reward_events as RewardEvent[])
      } else if (result.rewardEvents.length > 0) {
        const unlockedAchievements = response.state?.unlockedAchievements || {}
        const unlockedMasteries = response.state?.unlockedMasteries || {}

        const fallbackEvents = result.rewardEvents.filter((event) => {
          if (event.kind === 'achievement' && event.achievementId) {
            const wasUnlockedBefore = Boolean(rewardState.unlockedAchievements[event.achievementId])
            const isUnlockedNow = Boolean(unlockedAchievements[event.achievementId])
            return !wasUnlockedBefore && isUnlockedNow
          }

          if (event.kind === 'mastery' && event.id.startsWith('mastery:')) {
            const masteryKey = event.id.slice('mastery:'.length)
            const wasUnlockedBefore = Boolean(rewardState.unlockedMasteries[masteryKey])
            const isUnlockedNow = Boolean(unlockedMasteries[masteryKey])
            return !wasUnlockedBefore && isUnlockedNow
          }

          return false
        })

        if (fallbackEvents.length > 0) {
          enqueueRewards(fallbackEvents)
        }
      }
    } catch (err) {
      console.error('Failed to apply rewards on server, using local fallback', err)
      setRewardState((previous) => applyRewardResultLocally(previous, result))
      if (result.rewardEvents.length > 0) {
        enqueueRewards(result.rewardEvents)
      }
    }
  }, [enqueueRewards, rewardState.unlockedAchievements, rewardState.unlockedMasteries])

  const value = useMemo(
    () => ({
      rewardState,
      activeReward,
      isRewardVisible,
      enqueueReward,
      enqueueRewards,
      closeActiveReward,
      grantRewardResult,
    }),
    [rewardState, activeReward, isRewardVisible, enqueueReward, enqueueRewards, closeActiveReward, grantRewardResult],
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
