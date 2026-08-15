import { getMatchdayGroup } from '../../../content/matchdays'
import { COLLECTIONS } from '../collections/collectionCatalog'
import { getCosmetic } from '../cosmetics/cosmeticCatalog'
import { selectAchievementViews, type AchievementViewItem, type ProgressionViewState } from '../selectors'
import { getActiveProgressViews, listActiveDefinitions, syncChallengeRotation } from '../challenges/challengeEngine'
import type {
  CampaignDefinition,
  ChallengeDefinition,
  ChallengePool,
  ChallengeProgress,
  ChallengeRotationState,
  ChallengeType,
  ContentIssue,
  MatchdayContext,
} from '../challenges/types'
import type { RewardGrant } from '../types'

export const TASK_LANES = ['all', 'permanent', 'daily', 'weekly', 'matchday', 'event'] as const
export type TaskLaneFilter = (typeof TASK_LANES)[number]
export type TaskLane = Exclude<TaskLaneFilter, 'all'>

export const TASK_STATUS_FILTERS = ['all', 'active', 'completed'] as const
export type TaskStatusFilter = (typeof TASK_STATUS_FILTERS)[number]

export type TaskUiStatus = 'active' | 'completed' | 'expired' | 'upcoming'

export type LockerTaskView = {
  id: string
  sourceId: string
  source: 'challenge' | 'achievement'
  lane: TaskLane
  title: string
  description: string
  status: TaskUiStatus
  current: number
  target: number
  rewards: RewardGrant[]
  rewardLabel: string
  windowLabel: string
  collectionId?: string
  collectionName?: string
  collectionOwned?: number
  collectionTotal?: number
  matchdayGroupId?: string
  secretHidden?: boolean
  challenge?: { definition: ChallengeDefinition; progress: ChallengeProgress }
  achievement?: AchievementViewItem
}

export const LANE_LABELS: Record<TaskLane, string> = {
  permanent: 'Permanent',
  daily: 'Daily',
  weekly: 'Weekly',
  matchday: 'Matchday',
  event: 'Event',
}

export function lockerTaskHref(input: {
  sourceId: string
  lane?: TaskLaneFilter
  status?: TaskStatusFilter
}): string {
  const params = new URLSearchParams({ tab: 'achievements', task: input.sourceId })
  if (input.lane && input.lane !== 'all') params.set('lane', input.lane)
  if (input.status && input.status !== 'all') params.set('status', input.status)
  return `/locker?${params.toString()}`
}

export function challengeTypeToLane(type: ChallengeType): TaskLane {
  if (type === 'daily' || type === 'weekly' || type === 'matchday') return type
  return 'event'
}

export function formatRewardLabel(rewards: RewardGrant[] | undefined): string {
  return (rewards || [])
    .map((reward) => {
      if (reward.type === 'pux') return `${reward.amount} Pux`
      if (reward.type === 'xp') return `${reward.amount} XP`
      if (reward.type === 'cosmetic') return getCosmetic(reward.cosmeticId)?.name || reward.cosmeticId.replace(/_/g, ' ')
      return ''
    })
    .filter(Boolean)
    .join(' · ')
}

export function compactRewardLabel(rewards: RewardGrant[] | undefined): string {
  const pux = (rewards || []).find((reward) => reward.type === 'pux')
  if (pux && pux.type === 'pux') return `+${pux.amount} Pux`
  const xp = (rewards || []).find((reward) => reward.type === 'xp')
  if (xp && xp.type === 'xp') return `+${xp.amount} XP`
  return formatRewardLabel(rewards)
}

export function formatChallengeWindow(definition: ChallengeDefinition): string {
  if (definition.type === 'daily') return 'Heute'
  if (definition.type === 'weekly') return 'Diese Woche'
  if (definition.type === 'matchday') return 'Spieltag'
  if (definition.availability?.endsAt) {
    const end = new Date(definition.availability.endsAt)
    if (!Number.isNaN(end.getTime())) {
      return `Bis ${end.toLocaleDateString('de-DE')}`
    }
  }
  return 'Offen'
}

function toUiStatus(status: ChallengeProgress['status']): TaskUiStatus {
  if (status === 'completed') return 'completed'
  if (status === 'expired') return 'expired'
  if (status === 'available') return 'upcoming'
  return 'active'
}

function requirementTotals(progress: ChallengeProgress, definition: ChallengeDefinition) {
  const current = progress.requirements.reduce((sum, item) => sum + item.current, 0)
  const target = progress.requirements.reduce((sum, item) => sum + item.target, 0)
    || definition.requirements.reduce((sum, item) => sum + item.target, 0)
    || 1
  return { current, target }
}

function collectionHint(collectionId: string | undefined, unlockedCosmetics: Record<string, unknown>) {
  if (!collectionId) return {}
  const collection = COLLECTIONS.find((item) => item.id === collectionId)
  if (!collection) return { collectionId }
  const owned = collection.itemIds.filter((id) => Boolean(unlockedCosmetics[id])).length
  return {
    collectionId,
    collectionName: collection.name,
    collectionOwned: owned,
    collectionTotal: collection.itemIds.length,
  }
}

export function selectLockerTaskViews(input: {
  state: ProgressionViewState
  definitions: ChallengeDefinition[]
  pools: ChallengePool[]
  campaigns?: CampaignDefinition[]
  progress: Record<string, ChallengeProgress>
  rotation: ChallengeRotationState | null | undefined
  matchday: MatchdayContext | null
  now?: Date
  userId?: string
}): LockerTaskView[] {
  const views: LockerTaskView[] = []
  const seenChallengeIds = new Set<string>()

  for (const item of selectAchievementViews(input.state)) {
    views.push({
      id: `achievement:${item.definition.id}`,
      sourceId: item.definition.id,
      source: 'achievement',
      lane: 'permanent',
      title: item.definition.name,
      description: item.definition.description,
      status: item.unlocked ? 'completed' : 'active',
      current: item.current,
      target: item.target || 1,
      rewards: item.definition.rewards || [],
      rewardLabel: formatRewardLabel(item.definition.rewards),
      windowLabel: 'Permanent',
      secretHidden: item.secretHidden,
      achievement: item,
    })
  }

  if (!input.rotation) return views

  const active = getActiveProgressViews({
    definitions: input.definitions,
    pools: input.pools,
    campaigns: input.campaigns,
    progress: input.progress,
    rotation: input.rotation,
    matchday: input.matchday,
    now: input.now,
    userId: input.userId,
  })

  for (const item of active) {
    seenChallengeIds.add(item.definition.id)
    const totals = requirementTotals(item.progress, item.definition)
    views.push({
      id: item.progress.instanceKey,
      sourceId: item.definition.id,
      source: 'challenge',
      lane: challengeTypeToLane(item.definition.type),
      title: item.definition.title,
      description: item.definition.description,
      status: toUiStatus(item.progress.status),
      current: totals.current,
      target: totals.target,
      rewards: item.definition.rewards,
      rewardLabel: formatRewardLabel(item.definition.rewards),
      windowLabel: formatChallengeWindow(item.definition),
      matchdayGroupId: item.definition.matchdayGroupId,
      ...collectionHint(item.definition.collectionId, input.state.unlockedCosmetics || {}),
      challenge: item,
    })
  }

  for (const progress of Object.values(input.progress)) {
    if (seenChallengeIds.has(progress.challengeId)) continue
    if (progress.status !== 'completed' && progress.status !== 'expired') continue
    const definition = input.definitions.find((item) => item.id === progress.challengeId)
    if (!definition) continue
    const totals = requirementTotals(progress, definition)
    views.push({
      id: progress.instanceKey,
      sourceId: definition.id,
      source: 'challenge',
      lane: challengeTypeToLane(definition.type),
      title: definition.title,
      description: definition.description,
      status: toUiStatus(progress.status),
      current: totals.current,
      target: totals.target,
      rewards: definition.rewards,
      rewardLabel: formatRewardLabel(definition.rewards),
      windowLabel: formatChallengeWindow(definition),
      matchdayGroupId: definition.matchdayGroupId,
      ...collectionHint(definition.collectionId, input.state.unlockedCosmetics || {}),
      challenge: { definition, progress },
    })
  }

  return views
}

export function filterLockerTaskViews(
  views: LockerTaskView[],
  lane: TaskLaneFilter = 'all',
  status: TaskStatusFilter = 'all',
): LockerTaskView[] {
  return views.filter((item) => {
    if (lane !== 'all' && item.lane !== lane) return false
    if (status === 'active' && item.status !== 'active' && item.status !== 'upcoming') return false
    if (status === 'completed' && item.status !== 'completed' && item.status !== 'expired') return false
    return true
  })
}

export type HomeTodaySummary = {
  daily: { done: number; total: number }
  weekly: { done: number; total: number }
  matchday: { done: number; total: number; empty: boolean; label?: string }
  highlight: LockerTaskView | null
}

export function selectHomeTodaySummary(
  views: LockerTaskView[],
  matchday: MatchdayContext | null,
): HomeTodaySummary {
  const ofLane = (lane: TaskLane) => views.filter((item) => item.source === 'challenge' && item.lane === lane && item.status !== 'expired')
  const daily = ofLane('daily')
  const weekly = ofLane('weekly')
  const matchdayViews = ofLane('matchday')
  const incomplete = (list: LockerTaskView[]) => list.find((item) => item.status === 'active' || item.status === 'upcoming')
  const grouped = matchdayViews.filter((item) => item.matchdayGroupId)
  const group = getMatchdayGroup(grouped[0]?.matchdayGroupId)
  const label = matchday
    ? `${matchday.homeTeamName || matchday.homeTeamId} – ${matchday.awayTeamName || matchday.awayTeamId}`
    : group?.shortLabel
  return {
    daily: {
      done: daily.filter((item) => item.status === 'completed').length,
      total: daily.length,
    },
    weekly: {
      done: weekly.filter((item) => item.status === 'completed').length,
      total: weekly.length,
    },
    matchday: {
      done: matchdayViews.filter((item) => item.status === 'completed').length,
      total: matchdayViews.length,
      empty: matchdayViews.length === 0,
      label,
    },
    highlight: incomplete(matchdayViews) || incomplete(daily) || incomplete(weekly) || null,
  }
}

export function validateHomeLockerIntegrity(input: {
  challenges: ChallengeDefinition[]
  pools: ChallengePool[]
  campaigns?: CampaignDefinition[]
  now?: Date
  userId?: string
}): ContentIssue[] {
  const now = input.now || new Date()
  const synced = syncChallengeRotation({
    definitions: input.challenges,
    pools: input.pools,
    campaigns: input.campaigns,
    progress: {},
    matchday: null,
    now,
    userId: input.userId || 'integrity',
  })
  const home = getActiveProgressViews({
    definitions: input.challenges,
    pools: input.pools,
    campaigns: input.campaigns,
    progress: synced.progress,
    rotation: synced.rotation,
    matchday: null,
    now,
    userId: input.userId || 'integrity',
  })
  const locker = selectLockerTaskViews({
    state: { xp: 0, unlockedAchievements: {}, unlockedCosmetics: {}, activityLog: [], unlockHistory: [] },
    definitions: input.challenges,
    pools: input.pools,
    campaigns: input.campaigns,
    progress: synced.progress,
    rotation: synced.rotation,
    matchday: null,
    now,
    userId: input.userId || 'integrity',
  })
  const issues: ContentIssue[] = []
  const active = listActiveDefinitions({
    definitions: input.challenges,
    pools: input.pools,
    campaigns: input.campaigns,
    rotation: synced.rotation,
    matchday: null,
    now,
    userId: input.userId || 'integrity',
  })

  for (const definition of active) {
    const resolved = locker.some((item) => item.source === 'challenge' && item.sourceId === definition.id)
    if (!resolved) {
      issues.push({
        severity: 'error',
        code: 'locker_unresolvable_challenge',
        message: `Locker kann aktive Challenge ${definition.id} nicht auflösen`,
        entityType: 'challenge',
        entityId: definition.id,
      })
    }
  }

  for (const item of home) {
    const resolved = locker.some((view) => view.source === 'challenge' && view.sourceId === item.definition.id)
    if (!resolved) {
      issues.push({
        severity: 'error',
        code: 'home_challenge_unresolvable',
        message: `Home-Challenge ${item.definition.id} hat keine Locker-Detaildefinition`,
        entityType: 'challenge',
        entityId: item.definition.id,
      })
    }
  }

  return issues
}
