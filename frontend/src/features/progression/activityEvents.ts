import type {
  RinkActivityEvent,
  SceneCreatedEvent,
  SceneRatedEvent,
  SessionCompletedEvent,
  SidequestCompletedEvent,
  TrackCompletedEvent,
} from './types'

export function activityEventId(type: string, ...parts: Array<string | number | undefined | null>): string {
  const tail = parts
    .map((part) => String(part ?? '').trim())
    .filter(Boolean)
    .join(':')
  return tail ? `${type}:${tail}` : type
}

export function buildSessionCompletedEvent(input: {
  sessionId: string
  drillId: string
  trackId: string
  occurredAt?: string
  observedTeamId?: string
  leagueId?: string
  mechanicIds?: string[]
  tags?: string[]
  isDummy?: boolean
  isFirstSessionOfDrill?: boolean
}): SessionCompletedEvent {
  return {
    id: activityEventId('session_completed', input.sessionId),
    type: 'session_completed',
    occurredAt: input.occurredAt || new Date().toISOString(),
    sessionId: input.sessionId,
    drillId: input.drillId,
    trackId: input.trackId,
    observedTeamId: input.observedTeamId,
    leagueId: input.leagueId,
    mechanicIds: input.mechanicIds,
    tags: input.tags,
    isDummy: input.isDummy,
    isFirstSessionOfDrill: input.isFirstSessionOfDrill,
  }
}

export function buildSceneCreatedEvent(input: {
  sceneId: string
  occurredAt?: string
  sessionId?: string
  drillId?: string
  trackId?: string
  isDummy?: boolean
}): SceneCreatedEvent {
  return {
    id: activityEventId('scene_created', input.sceneId),
    type: 'scene_created',
    occurredAt: input.occurredAt || new Date().toISOString(),
    sceneId: input.sceneId,
    sessionId: input.sessionId,
    drillId: input.drillId,
    trackId: input.trackId,
    isDummy: input.isDummy,
  }
}

export function buildSceneRatedEvent(input: {
  sceneId: string
  rating: number
  occurredAt?: string
  isDummy?: boolean
}): SceneRatedEvent {
  return {
    id: activityEventId('scene_rated', input.sceneId, input.rating),
    type: 'scene_rated',
    occurredAt: input.occurredAt || new Date().toISOString(),
    sceneId: input.sceneId,
    rating: input.rating,
    isDummy: input.isDummy,
  }
}

export function buildTrackCompletedEvent(input: {
  trackId: string
  completionVersion?: string
  occurredAt?: string
}): TrackCompletedEvent {
  const version = input.completionVersion || 'v1'
  return {
    id: activityEventId('track_completed', input.trackId, version),
    type: 'track_completed',
    occurredAt: input.occurredAt || new Date().toISOString(),
    trackId: input.trackId,
    completionVersion: version,
  }
}

export function buildSidequestCompletedEvent(input: {
  sidequestId: string
  category: string
  occurredAt?: string
  sessionId?: string
  situationType?: string
  isDummy?: boolean
}): SidequestCompletedEvent {
  return {
    id: activityEventId('sidequest_completed', input.sidequestId),
    type: 'sidequest_completed',
    occurredAt: input.occurredAt || new Date().toISOString(),
    sidequestId: input.sidequestId,
    category: input.category,
    sessionId: input.sessionId,
    situationType: input.situationType,
    isDummy: input.isDummy,
  }
}

export function isDummyActivityEvent(event: RinkActivityEvent): boolean {
  if ('isDummy' in event && event.isDummy === true) return true
  return false
}
