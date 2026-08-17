import type { CatalogGame } from '../../api'
import type { SessionLocationVerification } from '../../data/venues/types'
import { isGeofenceUsable, resolveVenueForGame } from '../../data/venues/resolveVenue'
import { coarseDistanceMeters, haversineDistanceMeters, isInsideGeofence } from './geofence'
import { LOCATION_ACCURACY, type GeolocationFix } from './geolocation'
import { isWithinArenaMatchdayWindow } from './matchdayWindow'

export function evaluateVenuePresence(input: {
  game: CatalogGame
  fix: GeolocationFix
  now?: Date
  verificationType?: SessionLocationVerification['verificationType']
  devSimulated?: boolean
}): SessionLocationVerification {
  const now = input.now || new Date()
  const venue = resolveVenueForGame(input.game)
  const verificationType = input.verificationType || 'browser_geolocation'
  const devSimulated = input.devSimulated === true || verificationType === 'dev_simulation'
  const base: SessionLocationVerification = {
    checkedAt: now.toISOString(),
    gameId: input.game.id,
    venueId: venue?.id || '',
    insideGeofence: false,
    accuracyMeters: Math.round(input.fix.accuracyMeters),
    verificationType,
    devSimulated,
    reason: 'venue_unusable',
  }

  if (!venue || !isGeofenceUsable(venue) || !venue.location) {
    return { ...base, venueId: venue?.id || '', reason: 'venue_unusable' }
  }
  if (!isWithinArenaMatchdayWindow(input.game, now)) {
    return { ...base, venueId: venue.id, reason: 'outside_window' }
  }

  const accuracy = input.fix.accuracyMeters
  const radius = venue.geofenceRadiusMeters
  if (!Number.isFinite(accuracy) || accuracy > LOCATION_ACCURACY.maxAccuracyMeters || accuracy > radius) {
    return { ...base, venueId: venue.id, reason: 'insufficient_accuracy' }
  }

  const distance = haversineDistanceMeters(input.fix, venue.location)
  const inside = isInsideGeofence(input.fix, venue.location, radius)
  return {
    ...base,
    venueId: venue.id,
    insideGeofence: inside,
    distanceMeters: coarseDistanceMeters(distance),
    reason: inside ? 'inside' : 'outside_geofence',
  }
}

export function isQualifyingVenueVerification(
  verification: SessionLocationVerification | null | undefined,
): boolean {
  if (!verification) return false
  if (verification.devSimulated || verification.verificationType === 'dev_simulation') return false
  return verification.insideGeofence === true && verification.reason === 'inside'
}
