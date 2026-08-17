import { isProgressionEligibleEvent } from '../activityEvents'
import type { ChallengeEventType, RinkActivityEvent } from '../types'
import type { ChallengeProgress, RequirementDefinition } from './types'

const EVENT_ALIASES: Record<string, string[]> = {
  observation_created: ['observation_created', 'session_completed'],
  scene_saved: ['scene_saved', 'scene_created'],
  prediction_created: ['prediction_created', 'prediction_completed'],
  drill_completed: ['drill_completed', 'session_completed'],
}

function eventMatchesType(event: RinkActivityEvent, required: ChallengeEventType): boolean {
  if (event.type === required) return true
  const aliases = EVENT_ALIASES[required]
  return Boolean(aliases?.includes(event.type))
}

export type EventContext = {
  drillId?: string
  trackId?: string
  sessionId?: string
  gameId?: string
  teamId?: string
  seasonId?: string
  sceneId?: string
  mechanicIds: string[]
  venueId?: string
  venueVerified?: boolean
  homeAwayRole?: 'home' | 'away' | 'unknown'
  isFirstVenueVisit?: boolean
  locationVerificationDevSimulated?: boolean
}

export function readEventContext(event: RinkActivityEvent): EventContext {
  const record = event as unknown as Record<string, unknown>
  const mechanicIds = Array.isArray(record.mechanicIds)
    ? (record.mechanicIds as string[])
    : typeof record.mechanicId === 'string'
      ? [record.mechanicId]
      : []
  return {
    drillId: typeof record.drillId === 'string' ? record.drillId : undefined,
    trackId: typeof record.trackId === 'string' ? record.trackId : undefined,
    sessionId: typeof record.sessionId === 'string' ? record.sessionId : undefined,
    gameId: typeof record.gameId === 'string' ? record.gameId : undefined,
    teamId: typeof record.teamId === 'string' ? record.teamId : typeof record.observedTeamId === 'string' ? record.observedTeamId : undefined,
    seasonId: typeof record.seasonId === 'string' ? record.seasonId : undefined,
    sceneId: typeof record.sceneId === 'string' ? record.sceneId : undefined,
    mechanicIds,
    venueId: typeof record.venueId === 'string' ? record.venueId : undefined,
    venueVerified: record.venueVerified === true,
    homeAwayRole:
      record.homeAwayRole === 'home' || record.homeAwayRole === 'away' || record.homeAwayRole === 'unknown'
        ? record.homeAwayRole
        : undefined,
    isFirstVenueVisit: record.isFirstVenueVisit === true,
    locationVerificationDevSimulated: record.locationVerificationDevSimulated === true,
  }
}

export function eventMatchesRequirement(
  event: RinkActivityEvent,
  requirement: RequirementDefinition,
  boundGameId?: string,
): boolean {
  if (!eventMatchesType(event, requirement.eventType)) return false
  if (requirement.filters?.requireRealSession !== false && !isProgressionEligibleEvent(event)) {
    return false
  }
  if (isProgressionEligibleEvent(event) === false) return false

  const filters = requirement.filters
  if (!filters) return isProgressionEligibleEvent(event)

  const ctx = readEventContext(event)
  if (filters.drillIds?.length) {
    if (!ctx.drillId || !filters.drillIds.includes(ctx.drillId)) return false
  }
  if (filters.trackIds?.length) {
    if (!ctx.trackId || !filters.trackIds.includes(ctx.trackId)) return false
  }
  const expectedGameId = filters.gameId === '$matchday' ? boundGameId : filters.gameId
  if (expectedGameId) {
    if (!ctx.gameId || ctx.gameId !== expectedGameId) return false
  }
  if (filters.teamId) {
    if (!ctx.teamId || ctx.teamId !== filters.teamId) return false
  }
  if (filters.seasonId) {
    if (!ctx.seasonId || ctx.seasonId !== filters.seasonId) return false
  }
  if (filters.mechanicTypes?.length) {
    const hay = ctx.mechanicIds.join(' ').toLowerCase()
    const ok = filters.mechanicTypes.some((type) => hay.includes(type.toLowerCase()) || ctx.mechanicIds.includes(type))
    if (!ok) return false
  }
  if (filters.requireGameContext) {
    if (!ctx.gameId) return false
  }
  if (filters.requireVenueVerification) {
    if (ctx.locationVerificationDevSimulated) return false
    if (ctx.venueVerified !== true) return false
  }
  if (filters.homeAwayRole) {
    if (ctx.homeAwayRole !== filters.homeAwayRole) return false
  }
  if (filters.requireFirstVenueVisit) {
    if (ctx.isFirstVenueVisit !== true) return false
  }
  return true
}

export function applyEventToProgress(
  progress: ChallengeProgress,
  requirements: RequirementDefinition[],
  event: RinkActivityEvent,
): ChallengeProgress {
  if (progress.status === 'completed' || progress.status === 'expired') return progress
  if (progress.countedEventIds.includes(event.id)) return progress

  let changed = false
  const nextReqs = progress.requirements.map((item) => {
    const definition = requirements.find((req) => req.id === item.requirementId)
    if (!definition || item.completed) return item
    if (!eventMatchesRequirement(event, definition, progress.boundGameId)) return item
    const current = Math.min(item.target, item.current + 1)
    changed = true
    return {
      ...item,
      current,
      completed: current >= item.target,
    }
  })

  if (!changed) return progress

  const allDone = nextReqs.length > 0 && nextReqs.every((item) => item.completed)
  return {
    ...progress,
    status: allDone ? 'completed' : 'active',
    startedAt: progress.startedAt || event.occurredAt,
    completedAt: allDone ? event.occurredAt : progress.completedAt,
    requirements: nextReqs,
    countedEventIds: [...progress.countedEventIds, event.id],
  }
}
