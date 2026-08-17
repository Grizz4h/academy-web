/**
 * Geofence + location tests.
 * Run: npx --yes tsx src/features/location/geofence.test.ts
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { coarseDistanceMeters, haversineDistanceMeters, isInsideGeofence } from './geofence'
import { evaluateVenuePresence } from './verification'
import { isWithinArenaMatchdayWindow } from './matchdayWindow'
import { resolveHomeAwayRole } from './homeAway'
import { sanitizeLocationVerification } from './privacy'
import { applyVenuePresenceToEvents } from './visits'
import { VENUE_CATALOG } from '../../data/venues'
import { isGeofenceUsable } from '../../data/venues/resolveVenue'
import { LOCATION_ACCURACY } from './geolocation'
import { buildSessionCompletedEvent } from '../progression/activityEvents'
import type { CatalogGame } from '../../api'

function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(label)
}

const saturn = VENUE_CATALOG.find((venue) => venue.id === 'venue.del.saturn_arena')
if (!saturn?.location) throw new Error('Saturn Arena must have coordinates')

{
  const inside = { latitude: saturn.location.latitude + 50 / 111_320, longitude: saturn.location.longitude }
  const outside = { latitude: saturn.location.latitude + 900 / 111_320, longitude: saturn.location.longitude }
  assert(isInsideGeofence(inside, saturn.location, 350) === true, '50 m is inside 350 m')
  assert(isInsideGeofence(outside, saturn.location, 350) === false, '900 m is outside 350 m')
  const edge = { latitude: saturn.location.latitude + 350 / 111_320, longitude: saturn.location.longitude }
  const dist = haversineDistanceMeters(edge, saturn.location)
  assert(Math.abs(dist - 350) < 5, `boundary ~350 m, got ${dist}`)
  assert(isInsideGeofence(edge, saturn.location, 350) === true, 'exact radius counts as inside')
}

{
  assert(coarseDistanceMeters(37) === 25 || coarseDistanceMeters(37) === 50, 'distance is bucketed')
  assert(coarseDistanceMeters(12) === 0 || coarseDistanceMeters(12) === 25, 'small offsets bucket')
}

const game: CatalogGame = {
  id: 'GAME_ERC_STR',
  league_id: 'DEL',
  season_id: '2026/27',
  home_team_id: 'erc_ingolstadt',
  away_team_id: 'straubing_tigers',
  home_team_name: 'ERC Ingolstadt',
  away_team_name: 'Straubing Tigers',
  status: 'scheduled',
  date: '2026-08-17',
  time: '19:30',
  venue_id: 'venue.del.saturn_arena',
}

{
  const now = new Date('2026-08-17T19:00:00')
  assert(isWithinArenaMatchdayWindow(game, now) === true, '1.5 h before start is inside 3 h window')
  const tooEarly = new Date('2026-08-17T15:00:00')
  assert(isWithinArenaMatchdayWindow(game, tooEarly) === false, '4.5 h before start is outside')
  const after = new Date('2026-08-17T23:30:00')
  assert(isWithinArenaMatchdayWindow({ ...game, status: 'live' }, after) === true, 'live status stays in window')
}

{
  const now = new Date('2026-08-17T19:00:00')
  const inside = evaluateVenuePresence({
    game,
    now,
    fix: { latitude: saturn.location.latitude, longitude: saturn.location.longitude, accuracyMeters: 20, timestamp: now.getTime() },
  })
  assert(inside.insideGeofence === true && inside.reason === 'inside', 'accurate pin inside venue')
  assert(!('latitude' in inside) && !('longitude' in inside), 'user coordinates are not stored on the result')

  const poor = evaluateVenuePresence({
    game,
    now,
    fix: { latitude: saturn.location.latitude, longitude: saturn.location.longitude, accuracyMeters: 800, timestamp: now.getTime() },
  })
  assert(poor.reason === 'insufficient_accuracy' && poor.insideGeofence === false, 'poor GPS does not verify')
  assert(LOCATION_ACCURACY.maxAccuracyMeters === 200, 'accuracy cap is central')

  const far = evaluateVenuePresence({
    game,
    now,
    fix: {
      latitude: saturn.location.latitude + 900 / 111_320,
      longitude: saturn.location.longitude,
      accuracyMeters: 20,
      timestamp: now.getTime(),
    },
  })
  assert(far.reason === 'outside_geofence', 'far away is outside_geofence not insufficient_accuracy')
}

{
  assert(resolveHomeAwayRole(game, 'erc_ingolstadt') === 'home', 'observed home team is home')
  assert(resolveHomeAwayRole(game, 'straubing_tigers') === 'away', 'observed away team is away')
  assert(resolveHomeAwayRole(game, 'eisbaren_berlin') === 'unknown', 'other team is unknown')
}

{
  const stripped = sanitizeLocationVerification({
    checkedAt: '2026-08-17T19:00:00.000Z',
    venueId: 'venue.del.saturn_arena',
    gameId: 'GAME_ERC_STR',
    insideGeofence: true,
    verificationType: 'browser_geolocation',
    latitude: 48.75917,
    longitude: 11.43889,
    reason: 'inside',
  })
  assert(stripped != null && !('latitude' in stripped) && !('longitude' in stripped), 'sanitize drops exact coordinates')
}

{
  const event = buildSessionCompletedEvent({
    sessionId: 's1',
    drillId: 'D1',
    trackId: 'C1',
    gameId: 'GAME_ERC_STR',
    venueId: 'venue.del.saturn_arena',
    venueVerified: true,
    homeAwayRole: 'home',
    isDummy: false,
  })
  const first = applyVenuePresenceToEvents([event], {})
  assert(first.events[0].type === 'session_completed' && first.events[0].isFirstVenueVisit === true, 'first visit flagged')
  const second = applyVenuePresenceToEvents([event], first.visits)
  assert(second.events[0].type === 'session_completed' && second.events[0].isFirstVenueVisit === false, 'repeat visit is not first')
  assert(second.changed === false, 'same game does not double-count visits')
}

{
  const dummy = buildSessionCompletedEvent({
    sessionId: 'dummy',
    drillId: 'D1',
    trackId: 'C1',
    gameId: 'GAME_ERC_STR',
    venueId: 'venue.del.saturn_arena',
    venueVerified: false,
    locationVerificationDevSimulated: true,
    isDummy: true,
  })
  const applied = applyVenuePresenceToEvents([dummy], {})
  assert(Object.keys(applied.visits).length === 0, 'dev/dummy simulation does not fill passport')
}

{
  const bremerhaven = VENUE_CATALOG.find((venue) => venue.id === 'venue.del.eisarena_bremerhaven')
  assert(bremerhaven?.dataQuality === 'plausible', 'Bremerhaven is plausible Wikidata, not guessed')
  assert(isGeofenceUsable(bremerhaven) === true, 'plausible coords enable geofence')
  assert(VENUE_CATALOG.filter((venue) => venue.location).length === 15, 'all 15 DEL arenas have coordinates')
  assert(VENUE_CATALOG.every((venue) => venue.dataQuality !== 'missing'), 'no missing coords in current DEL set')
}

{
  const here = dirname(fileURLToPath(import.meta.url))
  const source = readFileSync(join(here, 'geolocation.ts'), 'utf8')
  assert(!source.includes('watchPosition('), 'no watchPosition')
  assert(!source.includes('setInterval'), 'no location polling loop')
  assert(source.includes('getCurrentPosition'), 'one-shot getCurrentPosition')
}

console.log('geofence.test.ts: all assertions passed')
