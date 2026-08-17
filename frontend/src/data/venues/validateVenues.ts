import type { CatalogGame } from '../../api'
import { VENUE_CATALOG } from './venueCatalog'
import { resolveVenueIdForGame } from './resolveVenue'
import type { VenueDefinition } from './types'

export type VenueIssue = {
  severity: 'error' | 'warning'
  code: string
  message: string
  venueId?: string
  gameId?: string
}

const ids = new Set<string>()

function validCoord(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && !(lat === 0 && lng === 0)
}

export function validateVenueCatalog(games: CatalogGame[] = []): VenueIssue[] {
  const issues: VenueIssue[] = []
  ids.clear()

  for (const venue of VENUE_CATALOG) {
    if (ids.has(venue.id)) {
      issues.push({ severity: 'error', code: 'duplicate_venue_id', message: `Doppelte Venue-ID ${venue.id}`, venueId: venue.id })
    }
    ids.add(venue.id)

    const radius = venue.geofenceRadiusMeters
    if (!Number.isFinite(radius) || radius < 50 || radius > 2000) {
      issues.push({
        severity: 'error',
        code: 'suspicious_radius',
        message: `${venue.name}: Radius ${radius} m ist nicht sinnvoll (50–2000)`,
        venueId: venue.id,
      })
    }

    if (venue.location) {
      if (!validCoord(venue.location.latitude, venue.location.longitude)) {
        issues.push({
          severity: 'error',
          code: 'invalid_coordinates',
          message: `${venue.name}: ungültige Koordinaten`,
          venueId: venue.id,
        })
      }
    } else if (venue.enabled && (venue.dataQuality === 'verified' || venue.dataQuality === 'plausible')) {
      issues.push({
        severity: 'error',
        code: 'missing_coordinates',
        message: `${venue.name}: ${venue.dataQuality} ohne Koordinaten`,
        venueId: venue.id,
      })
    }

    if (venue.dataQuality === 'missing') {
      issues.push({
        severity: 'warning',
        code: 'missing_coordinates',
        message: `${venue.name}: Koordinaten fehlen — Geofence deaktiviert`,
        venueId: venue.id,
      })
    }

    if (venue.dataQuality === 'suspicious') {
      issues.push({
        severity: 'warning',
        code: 'suspicious_venue',
        message: `${venue.name}: Koordinaten unsicher — Geofence deaktiviert`,
        venueId: venue.id,
      })
    }
  }

  const knownTeams = new Set(VENUE_CATALOG.flatMap((venue) => venue.teamIds || []))
  for (const game of games) {
    const venueId = resolveVenueIdForGame(game)
    if (!venueId) {
      issues.push({
        severity: 'warning',
        code: 'game_missing_venue',
        message: `Game ${game.id} hat keine Venue (Home ${game.home_team_id})`,
        gameId: game.id,
      })
      continue
    }
    if (!ids.has(venueId)) {
      issues.push({
        severity: 'error',
        code: 'unknown_venue',
        message: `Game ${game.id} referenziert unbekannte Venue ${venueId}`,
        gameId: game.id,
        venueId,
      })
    }
    if (game.home_team_id && !knownTeams.has(game.home_team_id) && !game.venue_id && !game.venueId) {
      issues.push({
        severity: 'warning',
        code: 'unknown_team_venue',
        message: `Kein Default-Venue für Team ${game.home_team_id}`,
        gameId: game.id,
      })
    }
  }

  return issues
}

export function venueForInspector(venue: VenueDefinition, games: CatalogGame[] = []) {
  const gameCount = games.filter((game) => resolveVenueIdForGame(game) === venue.id).length
  return {
    id: venue.id,
    name: venue.name,
    teams: venue.teamIds || [],
    coordinates: venue.location ? `${venue.location.latitude}, ${venue.location.longitude}` : '—',
    radius: venue.geofenceRadiusMeters,
    dataQuality: venue.dataQuality,
    source: venue.source?.label || venue.source?.type || '—',
    sourceUrl: venue.source?.url,
    games: gameCount,
  }
}
