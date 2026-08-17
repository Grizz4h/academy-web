import type { SessionLocationVerification } from '../../data/venues/types'

const PREFIX = 'rink.venuePresence:'

export function readPendingVenuePresence(gameId: string): SessionLocationVerification | null {
  if (typeof window === 'undefined' || !gameId) return null
  try {
    const raw = window.sessionStorage.getItem(PREFIX + gameId)
    if (!raw) return null
    return JSON.parse(raw) as SessionLocationVerification
  } catch {
    return null
  }
}

export function writePendingVenuePresence(verification: SessionLocationVerification): void {
  if (typeof window === 'undefined' || !verification.gameId) return
  window.sessionStorage.setItem(PREFIX + verification.gameId, JSON.stringify(verification))
}

export function clearPendingVenuePresence(gameId: string): void {
  if (typeof window === 'undefined' || !gameId) return
  window.sessionStorage.removeItem(PREFIX + gameId)
}
