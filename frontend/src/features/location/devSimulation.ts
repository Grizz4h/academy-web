import type { CatalogGame } from '../../api'
import { resolveVenueForGame } from '../../data/venues/resolveVenue'
import type { GeolocationFix } from './geolocation'

export type DevLocationScenario = 'inside_home' | 'inside_away' | 'outside' | 'poor_accuracy' | 'denied' | 'off'

const STORAGE_KEY = 'rink.devLocationSim'

export function getDevLocationScenario(): DevLocationScenario {
  if (typeof window === 'undefined') return 'off'
  const raw = window.sessionStorage.getItem(STORAGE_KEY)
  if (raw === 'inside_home' || raw === 'inside_away' || raw === 'outside' || raw === 'poor_accuracy' || raw === 'denied') {
    return raw
  }
  return 'off'
}

export function setDevLocationScenario(scenario: DevLocationScenario): void {
  if (typeof window === 'undefined') return
  if (scenario === 'off') window.sessionStorage.removeItem(STORAGE_KEY)
  else window.sessionStorage.setItem(STORAGE_KEY, scenario)
}

function offset(lat: number, lng: number, northMeters: number, eastMeters: number): { latitude: number; longitude: number } {
  const dLat = northMeters / 111_320
  const dLng = eastMeters / (111_320 * Math.cos((lat * Math.PI) / 180))
  return { latitude: lat + dLat, longitude: lng + dLng }
}

export function simulateFixForGame(game: CatalogGame, scenario: DevLocationScenario): GeolocationFix | null {
  if (scenario === 'off' || scenario === 'denied') return null
  const venue = resolveVenueForGame(game)
  if (!venue?.location) return null
  const pin = venue.location
  if (scenario === 'inside_home' || scenario === 'inside_away') {
    const point = offset(pin.latitude, pin.longitude, 40, 20)
    return { ...point, accuracyMeters: 25, timestamp: Date.now() }
  }
  if (scenario === 'outside') {
    const point = offset(pin.latitude, pin.longitude, 900, 0)
    return { ...point, accuracyMeters: 20, timestamp: Date.now() }
  }
  const point = offset(pin.latitude, pin.longitude, 30, 0)
  return { ...point, accuracyMeters: 800, timestamp: Date.now() }
}
