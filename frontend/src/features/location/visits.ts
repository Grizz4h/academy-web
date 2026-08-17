import type { VenueVisit } from '../../data/venues/types'
import type { HomeAwayRole } from './homeAway'
import { isQualifyingVenueVerification } from './verification'
import type { SessionLocationVerification } from '../../data/venues/types'
import type { RinkActivityEvent, SessionCompletedEvent } from '../progression/types'

export function recordVenueVisit(
  visits: Record<string, VenueVisit>,
  input: {
    verification: SessionLocationVerification
    role: HomeAwayRole
    occurredAt: string
  },
): { visits: Record<string, VenueVisit>; isFirstVisit: boolean } {
  if (!isQualifyingVenueVerification(input.verification)) {
    return { visits, isFirstVisit: false }
  }
  const venueId = input.verification.venueId
  const gameId = input.verification.gameId
  const existing = visits[venueId]
  if (!existing) {
    return {
      isFirstVisit: true,
      visits: {
        ...visits,
        [venueId]: {
          venueId,
          firstVerifiedAt: input.occurredAt,
          firstGameId: gameId,
          verifiedGameIds: [gameId],
          homeVisits: input.role === 'home' ? 1 : 0,
          awayVisits: input.role === 'away' ? 1 : 0,
        },
      },
    }
  }
  if (existing.verifiedGameIds.includes(gameId)) {
    return { visits, isFirstVisit: false }
  }
  return {
    isFirstVisit: false,
    visits: {
      ...visits,
      [venueId]: {
        ...existing,
        verifiedGameIds: [...existing.verifiedGameIds, gameId],
        homeVisits: existing.homeVisits + (input.role === 'home' ? 1 : 0),
        awayVisits: existing.awayVisits + (input.role === 'away' ? 1 : 0),
      },
    },
  }
}

/** Stamp first-visit flags, then record qualifying visits. Dev/dummy never enter here as venueVerified. */
export function applyVenuePresenceToEvents(
  events: RinkActivityEvent[],
  visits: Record<string, VenueVisit>,
): { events: RinkActivityEvent[]; visits: Record<string, VenueVisit>; changed: boolean } {
  let nextVisits = visits
  let changed = false
  const nextEvents = events.map((event) => {
    if (event.type !== 'session_completed') return event
    const sessionEvent = event as SessionCompletedEvent
    if (!sessionEvent.venueVerified || !sessionEvent.venueId || !sessionEvent.gameId || sessionEvent.locationVerificationDevSimulated) {
      return sessionEvent
    }
    const isFirstVenueVisit = !nextVisits[sessionEvent.venueId]
    const recorded = recordVenueVisit(nextVisits, {
      verification: {
        checkedAt: sessionEvent.occurredAt,
        venueId: sessionEvent.venueId,
        gameId: sessionEvent.gameId || '',
        insideGeofence: true,
        distanceMeters: sessionEvent.distanceMeters,
        accuracyMeters: sessionEvent.accuracyMeters,
        verificationType: 'browser_geolocation',
        reason: 'inside',
      },
      role: sessionEvent.homeAwayRole || 'unknown',
      occurredAt: sessionEvent.occurredAt,
    })
    if (recorded.visits !== nextVisits) {
      nextVisits = recorded.visits
      changed = true
    }
    return { ...sessionEvent, isFirstVenueVisit }
  })
  return { events: nextEvents, visits: nextVisits, changed }
}
