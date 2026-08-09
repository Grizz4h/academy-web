import type { Session } from '../../api'

export const DISPLAY_CURRENCY_LABEL = 'PUX!'

export type CurrencyCode = 'PUX'

export type RewardVisualTier = 'bronze' | 'silver' | 'gold' | 'mastery'

export type RewardDisplayVariant = 'small' | 'popup' | 'hero'

export type AchievementCategory =
  | 'progression'
  | 'consistency'
  | 'skill_mastery'
  | 'exploration'
  | 'behavior'
  | 'time'
  | 'device'
  | 'hidden'
  | 'absurd'

export type DeviceType = 'mobile' | 'desktop'

export type AchievementCondition =
  | { type: 'completed_drills_total'; min: number }
  | { type: 'completed_sessions_total'; min: number }
  | { type: 'completed_session_streak'; min: number }
  | { type: 'active_days_total'; min: number }
  | { type: 'distinct_drills_total'; min: number }
  | { type: 'current_session_drill_count'; min: number }
  | { type: 'note_length'; min: number }
  | { type: 'completion_hour_between'; start: number; end: number }
  | { type: 'device_type'; device: DeviceType }
  | { type: 'session_duration_max_seconds'; max: number }

export interface AchievementReward {
  PUX?: number
  visualTier?: RewardVisualTier
  icon?: string
}

export interface AchievementDefinition {
  id: string
  title: string
  description: string
  category: AchievementCategory
  tier: RewardVisualTier
  hidden: boolean
  reward: AchievementReward
  condition: AchievementCondition
}

export type MasteryTier = 'bronze' | 'silver' | 'gold' | 'mastery'

export interface MasteryStatsSnapshot {
  runs: number
  averageAccuracy?: number | null
  perfectRuns: number
}

export interface MasteryThreshold {
  tier: MasteryTier
  minRuns: number
  minAccuracy?: number
  rewardPux: number
}

export interface DrillMasteryProgress {
  key: string
  drillId: string
  tier: MasteryTier
  unlockedAt: string
  rewardPux: number
  statsSnapshot?: MasteryStatsSnapshot
}

export interface PerformanceSnapshot {
  accuracy?: number | null
  perfect?: boolean
}

export interface BaseRewardGrant {
  id: string
  reason: 'completion' | 'performance_bonus' | 'perfect_bonus' | 'streak_bonus'
  title: string
  description?: string
  amountPux: number
  visualTier: RewardVisualTier
  variant: RewardDisplayVariant
}

export interface RewardEvent {
  id: string
  kind: 'currency' | 'achievement' | 'mastery' | 'system'
  title: string
  description?: string
  amountPux?: number
  visualTier?: RewardVisualTier
  icon?: string
  autoCloseMs?: number
  achievementId?: string
  mastery?: MasteryTier
  meta?: Record<string, unknown>
  variant: RewardDisplayVariant
}

export interface RewardState {
  currency: Record<CurrencyCode, number>
  unlockedAchievements: Record<string, { id: string; unlockedAt: string; sourceEventId?: string }>
  unlockedMasteries: Record<string, DrillMasteryProgress>
  processedSessions: Record<string, { sessionId: string; grantedAt: string; pux: number }>
  /** Phase-1 progression foundation */
  xp: number
  processedEvents: Record<string, { eventId: string; processedAt: string; grantedXp: number; grantedPux: number }>
  unlockedCosmetics: Record<string, import('../progression/types').CosmeticUnlock>
  activityLog: import('../progression/types').RinkActivityEvent[]
  unlockHistory: import('../progression/types').UnlockHistoryEntry[]
  bootstrapCompletedAt?: string
  lastUpdatedAt?: string
  /** Phase-2 locker / economy */
  favoriteCosmeticIds?: string[]
  puxTransactions?: import('../progression/types').PuxTransaction[]
  completedCollections?: Record<string, { collectionId: string; completedAt: string }>
  masteryMilestoneUnlocks?: Record<string, import('../progression/types').MasteryProgressUnlock>
  featuredAchievementId?: string | null
  featuredMasteryCoinId?: string | null
  progressionPuxGranted?: number
}

export interface RewardFacts {
  completedSessionsCount: number
  completedDrillsCount: number
  distinctDrillsCount: number
  activeDaysCount: number
  currentStreakDays: number
  completedSessionStreak: number
  currentSessionDrillCount: number
  currentSessionDurationSeconds: number
  completionHour: number
  noteLength: number
  deviceType: DeviceType
  drillStatsById: Record<string, MasteryStatsSnapshot>
}

export interface RewardEvaluationContext {
  completedAt: string
  deviceType: DeviceType
  noteText?: string
  performance?: PerformanceSnapshot | null
}

export interface RewardEvaluationInput {
  currentSession: Session
  sessions: Session[]
  rewardState: RewardState
  context: RewardEvaluationContext
}

export interface RewardEvaluationResult {
  sessionId: string
  grantedPux: number
  currencyGrants: BaseRewardGrant[]
  unlockedAchievements: AchievementDefinition[]
  unlockedMasteries: DrillMasteryProgress[]
  rewardEvents: RewardEvent[]
  evaluatedAt: string
  progression?: {
    eventId: string
    grantedXp: number
    grantedPux: number
    unlockedAchievements: Array<{ id: string; unlockedAt: string; sourceEventId?: string }>
    unlockedCosmetics: import('../progression/types').CosmeticUnlock[]
    unlockHistory: import('../progression/types').UnlockHistoryEntry[]
    activityEvents: import('../progression/types').RinkActivityEvent[]
    bootstrapCompletedAt?: string
  }
}

export function createEmptyRewardState(): RewardState {
  return {
    currency: { PUX: 0 },
    unlockedAchievements: {},
    unlockedMasteries: {},
    processedSessions: {},
    xp: 0,
    processedEvents: {},
    unlockedCosmetics: {},
    activityLog: [],
    unlockHistory: [],
    favoriteCosmeticIds: [],
    puxTransactions: [],
    completedCollections: {},
    masteryMilestoneUnlocks: {},
  }
}

export function formatPux(amount: number): string {
  return `${amount} ${DISPLAY_CURRENCY_LABEL}`
}
