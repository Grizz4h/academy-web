import type {
  CollectionItemUnlockedEvent,
  GameObservationCompletedEvent,
  MatchdayActivityCompletedEvent,
  ObservationCreatedEvent,
  ReflectionCreatedEvent,
  RinkActivityEvent,
  SceneCreatedEvent,
  SceneRatedEvent,
  SessionCompletedEvent,
  SidequestCompletedEvent,
  TrackCompletedEvent,
  Track0CompletedEvent,
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
  gameId?: string
  mechanicIds?: string[]
  tags?: string[]
  isDummy?: boolean
  isFirstSessionOfDrill?: boolean
  observationScope?: string
  venueId?: string
  venueVerified?: boolean
  homeAwayRole?: 'home' | 'away' | 'unknown'
  isFirstVenueVisit?: boolean
  distanceMeters?: number
  accuracyMeters?: number
  locationVerificationDevSimulated?: boolean
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
    gameId: input.gameId,
    mechanicIds: input.mechanicIds,
    tags: input.tags,
    isDummy: input.isDummy,
    isFirstSessionOfDrill: input.isFirstSessionOfDrill,
    observationScope: input.observationScope,
    venueId: input.venueId,
    venueVerified: input.venueVerified,
    homeAwayRole: input.homeAwayRole,
    isFirstVenueVisit: input.isFirstVenueVisit,
    distanceMeters: input.distanceMeters,
    accuracyMeters: input.accuracyMeters,
    locationVerificationDevSimulated: input.locationVerificationDevSimulated,
  }
}

export function buildSceneCreatedEvent(input: {
  sceneId: string
  occurredAt?: string
  sessionId?: string
  drillId?: string
  trackId?: string
  gameId?: string
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
    gameId: input.gameId,
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

export function buildTrack0CompletedEvent(input: {
  userId: string
  occurredAt?: string
}): Track0CompletedEvent {
  return {
    id: activityEventId('track0_completed', input.userId),
    type: 'track0_completed',
    trackId: 'T0',
    userId: input.userId,
    occurredAt: input.occurredAt || new Date().toISOString(),
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

/** Shared gate for XP, achievements, challenges, collections. Dummy never progresses. */
export function isProgressionEligibleEvent(event: RinkActivityEvent): boolean {
  return !isDummyActivityEvent(event)
}

export function buildObservationCreatedEvent(input: {
  sessionId?: string
  drillId?: string
  trackId?: string
  gameId?: string
  teamId?: string
  mechanicIds?: string[]
  occurredAt?: string
  isDummy?: boolean
}): ObservationCreatedEvent {
  return {
    id: activityEventId('observation_created', input.sessionId || input.occurredAt),
    type: 'observation_created',
    occurredAt: input.occurredAt || new Date().toISOString(),
    sessionId: input.sessionId,
    drillId: input.drillId,
    trackId: input.trackId,
    gameId: input.gameId,
    teamId: input.teamId,
    mechanicIds: input.mechanicIds,
    isDummy: input.isDummy,
  }
}

export function buildReflectionCreatedEvent(input: {
  sessionId?: string
  drillId?: string
  trackId?: string
  gameId?: string
  occurredAt?: string
  isDummy?: boolean
}): ReflectionCreatedEvent {
  return {
    id: activityEventId('reflection_created', input.sessionId || input.occurredAt),
    type: 'reflection_created',
    occurredAt: input.occurredAt || new Date().toISOString(),
    sessionId: input.sessionId,
    drillId: input.drillId,
    trackId: input.trackId,
    gameId: input.gameId,
    isDummy: input.isDummy,
  }
}

export function buildGameObservationCompletedEvent(input: {
  sessionId?: string
  gameId?: string
  teamId?: string
  occurredAt?: string
  isDummy?: boolean
}): GameObservationCompletedEvent {
  return {
    id: activityEventId('game_observation_completed', input.sessionId, input.gameId),
    type: 'game_observation_completed',
    occurredAt: input.occurredAt || new Date().toISOString(),
    sessionId: input.sessionId,
    gameId: input.gameId,
    teamId: input.teamId,
    isDummy: input.isDummy,
  }
}

export function buildMatchdayActivityCompletedEvent(input: {
  gameId?: string
  phase?: 'pre_game' | 'in_game' | 'post_game'
  occurredAt?: string
  isDummy?: boolean
}): MatchdayActivityCompletedEvent {
  return {
    id: activityEventId('matchday_activity_completed', input.gameId, input.phase, input.occurredAt),
    type: 'matchday_activity_completed',
    occurredAt: input.occurredAt || new Date().toISOString(),
    gameId: input.gameId,
    phase: input.phase,
    isDummy: input.isDummy,
  }
}

export function buildCollectionItemUnlockedEvent(input: {
  cosmeticId: string
  collectionId?: string
  occurredAt?: string
}): CollectionItemUnlockedEvent {
  return {
    id: activityEventId('collection_item_unlocked', input.cosmeticId, input.occurredAt),
    type: 'collection_item_unlocked',
    occurredAt: input.occurredAt || new Date().toISOString(),
    cosmeticId: input.cosmeticId,
    collectionId: input.collectionId,
  }
}
