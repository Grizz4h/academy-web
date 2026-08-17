import type { CatalogGame } from '../../api'
import { getVenue, VENUE_CATALOG } from './venueCatalog'
import type { VenueDefinition } from './types'

const TEAM_TO_VENUE = new Map<string, string>()
for (const venue of VENUE_CATALOG) {
  for (const teamId of venue.teamIds || []) {
    TEAM_TO_VENUE.set(teamId, venue.id)
  }
}

export function defaultVenueIdForTeam(teamId: string | null | undefined): string | undefined {
  if (!teamId) return undefined
  return TEAM_TO_VENUE.get(teamId)
}

/** Game venue wins over home-team default (outdoor / special arenas). */
export function resolveVenueIdForGame(game: Pick<CatalogGame, 'home_team_id'> & {
  venue_id?: string | null
  venueId?: string | null
}): string | undefined {
  const explicit = game.venue_id || game.venueId
  if (explicit) return explicit
  return defaultVenueIdForTeam(game.home_team_id)
}

export function resolveVenueForGame(game: Pick<CatalogGame, 'home_team_id'> & {
  venue_id?: string | null
  venueId?: string | null
}): VenueDefinition | undefined {
  return getVenue(resolveVenueIdForGame(game))
}

export function isGeofenceUsable(venue: VenueDefinition | null | undefined): boolean {
  if (!venue || !venue.enabled) return false
  if (venue.dataQuality === 'missing' || venue.dataQuality === 'suspicious') return false
  if (!venue.location) return false
  if (venue.dataQuality !== 'verified' && venue.dataQuality !== 'plausible') return false
  const radius = venue.geofenceRadiusMeters
  return Number.isFinite(radius) && radius >= 50 && radius <= 2000
}
