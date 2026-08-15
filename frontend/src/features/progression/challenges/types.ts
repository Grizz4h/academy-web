import type { CatalogGame } from '../../../api'
import type { ChallengeEventType, RewardGrant } from '../types'

export type ChallengeType = 'daily' | 'weekly' | 'matchday' | 'event' | 'collection' | 'seasonal'

export type ChallengeStatus = 'available' | 'active' | 'completed' | 'expired'

export type ChallengePhase = 'pre_game' | 'in_game' | 'post_game'

export type RequirementFilters = {
  drillIds?: string[]
  trackIds?: string[]
  /** Concrete id, or `$matchday` to bind the active matchday game. */
  gameId?: string
  teamId?: string
  seasonId?: string
  mechanicTypes?: string[]
  requireRealSession?: boolean
}

export type RequirementDefinition = {
  id: string
  eventType: ChallengeEventType
  target: number
  label?: string
  filters?: RequirementFilters
}

export type AvailabilityDefinition = {
  startsAt?: string
  endsAt?: string
  recurrence?: 'daily' | 'weekly'
  gameRelative?: {
    startOffsetMinutes?: number
    endOffsetMinutes?: number
  }
}

export type ChallengeContextDefinition = {
  bindGame?: 'today'
  gameId?: string
  observedTeamId?: string
  phase?: ChallengePhase
}

export type ChallengeDefinition = {
  id: string
  type: ChallengeType
  title: string
  description: string
  requirements: RequirementDefinition[]
  rewards: RewardGrant[]
  availability?: AvailabilityDefinition
  context?: ChallengeContextDefinition
  presentation?: {
    icon?: string
    category?: string
    difficulty?: 'easy' | 'medium' | 'hard'
  }
  collectionId?: string
  campaignId?: string
  /** Lightweight matchday set, e.g. AEV–STR 1/3. Not a second progression system. */
  matchdayGroupId?: string
  enabled: boolean
}

export type ChallengePool = {
  id: string
  type: 'daily' | 'weekly'
  challengeIds: string[]
  activeCount: number
}

export type CampaignDefinition = {
  id: string
  title: string
  description?: string
  startsAt: string
  endsAt: string
  challengeIds: string[]
  collectionId?: string
  rewards?: RewardGrant[]
  enabled?: boolean
}

export type RequirementProgress = {
  requirementId: string
  current: number
  target: number
  completed: boolean
}

export type ChallengeProgress = {
  instanceKey: string
  challengeId: string
  rotationKey: string
  startedAt?: string
  completedAt?: string
  status: ChallengeStatus
  requirements: RequirementProgress[]
  countedEventIds: string[]
  boundGameId?: string
  rewardClaimed?: boolean
  devSimulated?: boolean
}

export type ChallengeRotationState = {
  dailyKey: string
  weeklyKey: string
  dailyIds: string[]
  weeklyIds: string[]
  matchdayGameId?: string | null
  matchdayChallengeIds?: string[]
  campaignIds?: string[]
}

export type MatchdayPhase = 'upcoming' | 'pregame' | 'live' | 'postgame' | 'finished'

export type MatchdayContext = {
  gameId: string
  homeTeamId: string
  awayTeamId: string
  homeTeamName?: string
  awayTeamName?: string
  startsAt: string
  phase: MatchdayPhase
  game: CatalogGame
}

export type ChallengeEvaluateResult = {
  progress: Record<string, ChallengeProgress>
  rotation: ChallengeRotationState
  grantedXp: number
  grantedPux: number
  unlockedCosmetics: import('../types').CosmeticUnlock[]
  unlockHistory: import('../types').UnlockHistoryEntry[]
  rewardEvents: Array<Record<string, unknown>>
  processedEventIds: string[]
  puxTransactions: import('../types').PuxTransaction[]
  completedInstanceKeys: string[]
  changed: boolean
}

export type ContentIssue = {
  severity: 'error' | 'warning'
  code: string
  message: string
  entityType: 'challenge' | 'reward' | 'collection' | 'campaign' | 'pool' | 'event'
  entityId?: string
}

export type RewardReachability = {
  rewardId: string
  reachable: boolean
  sources: Array<{ type: string; id: string; label: string }>
}
