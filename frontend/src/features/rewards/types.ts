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
  /** Phase-5 unified pipeline unit dedup */
  processedUnits?: Record<string, { progressionUnitKey: string; sessionId?: string; grantedAt: string; ruleIds?: string[] }>
  processedGrantKeys?: Record<string, string>
  /** Phase-5 capped level curve (v2) + grandfather floor */
  progressionCurveVersion?: number
  levelGrandfatherFloor?: number
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
  challengeProgress?: Record<string, import('../progression/challenges/types').ChallengeProgress>
  challengeRotation?: import('../progression/challenges/types').ChallengeRotationState | null
  venueVisits?: Record<string, import('../../data/venues/types').VenueVisit>
}

export function createEmptyRewardState(): RewardState {
  return {
    currency: { PUX: 0 },
    unlockedAchievements: {},
    unlockedMasteries: {},
    processedSessions: {},
    processedUnits: {},
    processedGrantKeys: {},
    progressionCurveVersion: undefined,
    levelGrandfatherFloor: undefined,
    xp: 0,
    processedEvents: {},
    unlockedCosmetics: {},
    activityLog: [],
    unlockHistory: [],
    favoriteCosmeticIds: [],
    puxTransactions: [],
    completedCollections: {},
    masteryMilestoneUnlocks: {},
    challengeProgress: {},
    challengeRotation: null,
    venueVisits: {},
  }
}

export function formatPux(amount: number): string {
  return `${amount} ${DISPLAY_CURRENCY_LABEL}`
}
