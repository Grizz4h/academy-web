import type { Session, SceneMarker } from '../../api'
import { isProgressionEligibleSession } from '../../utils/sessionEligibility'
import { readSidequests } from '../../utils/sessionSidequests'
import { sanitizeLocationVerification } from '../location/privacy'
import { isQualifyingVenueVerification } from '../location/verification'
import { resolveHomeAwayRole } from '../location/homeAway'
import {
  buildGameObservationCompletedEvent,
  buildObservationCreatedEvent,
  buildSceneCreatedEvent,
  buildSceneRatedEvent,
  buildSessionCompletedEvent,
  buildSidequestCompletedEvent,
  buildTrackCompletedEvent,
} from './activityEvents'
import type { RinkActivityEvent } from './types'

const SPATIAL_MECHANICS = new Set([
  'rink_corridor_observation',
  'blue_line_entry_observation',
  'paintable_rink_observation',
  'directional_path_observation',
])

function trackIdFromModule(moduleId: string | undefined | null): string {
  const raw = String(moduleId || '').trim().toUpperCase()
  if (!raw) return 'UNKNOWN'
  if (raw.includes('_')) return raw.split('_')[0]
  return raw.slice(0, 2) || raw
}

function drillIdFromSession(session: Session): string {
  return String(session.drill_id || session.module_id || 'unknown').trim() || 'unknown'
}

function collectSessionAnswerMaps(session: Session): any[] {
  const maps: any[] = []
  const drafts = (session as any).drafts
  if (drafts && typeof drafts === 'object') {
    for (const value of Object.values(drafts)) {
      if (value && typeof value === 'object') maps.push(value)
    }
  }
  for (const checkin of session.checkins || []) {
    if (checkin?.answers && typeof checkin.answers === 'object') {
      maps.push(checkin.answers)
    }
  }
  return maps
}

function collectAnswerBlob(session: Session): string {
  const chunks: string[] = []
  for (const answers of collectSessionAnswerMaps(session)) {
    try {
      chunks.push(JSON.stringify(answers))
    } catch {
      // ignore
    }
  }
  return chunks.join('\n').toLowerCase()
}

export function deriveSessionTags(session: Session, mechanicIds: string[]): string[] {
  const tags = new Set<string>()
  const moduleId = String(session.module_id || '').toUpperCase()
  const blob = collectAnswerBlob(session)

  if (moduleId.startsWith('D2') || blob.includes('slot') || blob.includes('defensive')) {
    tags.add('defensive_zone')
  }
  if (moduleId.startsWith('C2') || blob.includes('neutral')) {
    tags.add('neutral_zone')
  }
  if (
    moduleId.startsWith('D3') ||
    mechanicIds.some((id) => id.includes('corridor') || id.includes('blue_line') || id.includes('directional_path'))
  ) {
    tags.add('blue_line')
  }
  if (blob.includes('"unclear"') || blob.includes("'unclear'")) {
    tags.add('unclear')
  }

  return Array.from(tags)
}

export function deriveMechanicIdsFromSession(session: Session): string[] {
  const ids = new Set<string>()
  for (const answers of collectSessionAnswerMaps(session)) {
    for (const key of Object.keys(answers)) {
      if (key.includes('paintable')) ids.add('paintable_rink_observation')
      if (key.includes('directional_path') || key.includes('path_observation')) {
        ids.add('directional_path_observation')
      }
      if (key.includes('corridor') || key.includes('blue_line')) {
        ids.add('rink_corridor_observation')
      }
      if (key.includes('defensive_structure') || key.includes('player_placement')) {
        ids.add('defensive_structure')
      }
    }
  }

  // Heuristic by module when answers don't expose mechanic keys.
  const moduleId = String(session.module_id || '').toUpperCase()
  if (moduleId.includes('D3_D1')) ids.add('rink_corridor_observation')
  if (moduleId.includes('D3_D2')) ids.add('defensive_structure')
  if (moduleId.includes('D3_D4')) ids.add('directional_path_observation')
  if (moduleId.includes('C1_D1') || moduleId.includes('PAINT')) ids.add('paintable_rink_observation')

  // Prefer drill_type from embedded drills when present.
  for (const drill of session.drills || []) {
    const type = String((drill as any)?.drill_type || '').trim()
    if (type) ids.add(type)
  }

  return Array.from(ids)
}

export function buildEventsFromCompletedSession(
  session: Session,
  options?: { priorCompletedDrillIds?: Set<string>; occurredAt?: string },
): RinkActivityEvent[] {
  if (!isProgressionEligibleSession(session) || session.state !== 'COMPLETED') {
    return []
  }

  const drillId = drillIdFromSession(session)
  const trackId = trackIdFromModule(session.module_id)
  const mechanicIds = deriveMechanicIdsFromSession(session)
  const tags = deriveSessionTags(session, mechanicIds)
  const occurredAt =
    options?.occurredAt ||
    session.post?.completed_at ||
    session.created_at ||
    new Date().toISOString()
  const gameId = session.game_id || session.game_info?.game_id || undefined
  const teamId =
    session.observed_team_id ||
    session.game_info?.observed_team_id ||
    session.observed_team ||
    session.game_info?.observed_team ||
    undefined

  const prior = options?.priorCompletedDrillIds
  const isFirstSessionOfDrill = prior ? !prior.has(drillId) : true
  const verification = sanitizeLocationVerification((session as Session).location_verification)
  const venueVerified = isQualifyingVenueVerification(verification)
  const homeAwayRole = resolveHomeAwayRole(
    {
      home_team_id: session.game_info?.home_team_id || '',
      away_team_id: session.game_info?.away_team_id || '',
      home_team_name: session.game_info?.team_home,
      away_team_name: session.game_info?.team_away,
    },
    teamId,
  )

  const events: RinkActivityEvent[] = [
    buildSessionCompletedEvent({
      sessionId: session.id,
      drillId,
      trackId,
      occurredAt,
      observedTeamId: teamId,
      leagueId: session.game_info?.league || undefined,
      gameId,
      mechanicIds,
      tags,
      isDummy: false,
      isFirstSessionOfDrill,
      venueId: verification?.venueId,
      venueVerified,
      homeAwayRole,
      distanceMeters: verification?.distanceMeters,
      accuracyMeters: verification?.accuracyMeters,
      locationVerificationDevSimulated: verification?.devSimulated === true,
    }),
    buildObservationCreatedEvent({
      sessionId: session.id,
      drillId,
      trackId,
      gameId,
      teamId,
      mechanicIds,
      occurredAt,
      isDummy: false,
    }),
  ]

  if (gameId) {
    events.push(
      buildGameObservationCompletedEvent({
        sessionId: session.id,
        gameId,
        teamId,
        occurredAt,
        isDummy: false,
      }),
    )
  }

  // Sidequests embedded in drafts / checkin answers
  for (const answers of collectSessionAnswerMaps(session)) {
    for (const sq of readSidequests(answers)) {
      events.push(
        buildSidequestCompletedEvent({
          sidequestId: sq.id,
          category: sq.category,
          occurredAt: sq.createdAt || occurredAt,
          sessionId: session.id,
          situationType: 'situationType' in sq ? sq.situationType : undefined,
          isDummy: false,
        }),
      )
    }
  }

  return events
}

export function buildEventsFromScene(scene: SceneMarker, options?: { isDummy?: boolean }): RinkActivityEvent[] {
  if (options?.isDummy) return []
  const events: RinkActivityEvent[] = [
    buildSceneCreatedEvent({
      sceneId: scene.id,
      occurredAt: scene.created_at || new Date().toISOString(),
      sessionId: scene.session_id || scene.source?.session_id || undefined,
      drillId: scene.drill_id || undefined,
      trackId: scene.track_id || scene.module_id || undefined,
      isDummy: false,
    }),
  ]
  if (typeof scene.rating === 'number' && scene.rating >= 1) {
    events.push(
      buildSceneRatedEvent({
        sceneId: scene.id,
        rating: scene.rating,
        occurredAt: (scene as any).updated_at || scene.created_at || new Date().toISOString(),
        isDummy: false,
      }),
    )
  }
  return events
}

export type TrackDrillMap = Record<string, string[]>

/**
 * Emit track_completed when every drill id in a track has ≥1 eligible completed session.
 */
export function buildTrackCompletionEvents(
  sessions: Session[],
  trackDrills: TrackDrillMap,
): RinkActivityEvent[] {
  const eligible = sessions.filter((session) => isProgressionEligibleSession(session) && session.state === 'COMPLETED')
  const completedDrills = new Set(eligible.map((session) => drillIdFromSession(session).toUpperCase()))
  const moduleCompleted = new Set(eligible.map((session) => String(session.module_id || '').toUpperCase()))

  const events: RinkActivityEvent[] = []
  for (const [trackId, drills] of Object.entries(trackDrills)) {
    if (!drills.length) continue
    const done = drills.every((drillId) => {
      const upper = drillId.toUpperCase()
      return completedDrills.has(upper) || moduleCompleted.has(upper)
    })
    if (!done) continue

    const latest = eligible
      .filter((session) => {
        const id = drillIdFromSession(session).toUpperCase()
        return drills.some((d) => d.toUpperCase() === id || String(session.module_id || '').toUpperCase() === d.toUpperCase())
      })
      .map((session) => session.post?.completed_at || session.created_at || '')
      .sort()
      .at(-1)

    events.push(
      buildTrackCompletedEvent({
        trackId,
        completionVersion: 'v1',
        occurredAt: latest || new Date().toISOString(),
      }),
    )
  }
  return events
}

export function collectBootstrapEvents(input: {
  sessions: Session[]
  scenes: SceneMarker[]
  trackDrills?: TrackDrillMap
}): RinkActivityEvent[] {
  const eligibleSessions = input.sessions
    .filter((session) => isProgressionEligibleSession(session) && session.state === 'COMPLETED')
    .sort((a, b) =>
      String(a.post?.completed_at || a.created_at || '').localeCompare(
        String(b.post?.completed_at || b.created_at || ''),
      ),
    )

  const events: RinkActivityEvent[] = []
  const seenDrills = new Set<string>()

  for (const session of eligibleSessions) {
    const drillId = drillIdFromSession(session)
    events.push(...buildEventsFromCompletedSession(session, { priorCompletedDrillIds: new Set(seenDrills) }))
    seenDrills.add(drillId)
  }

  for (const scene of input.scenes || []) {
    events.push(...buildEventsFromScene(scene))
  }

  if (input.trackDrills) {
    events.push(...buildTrackCompletionEvents(eligibleSessions, input.trackDrills))
  }

  return events.sort((a, b) => String(a.occurredAt).localeCompare(String(b.occurredAt)))
}

export { trackIdFromModule, SPATIAL_MECHANICS }
