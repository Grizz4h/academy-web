import type { SessionLocationVerification } from '../../data/venues/types'

const ALLOWED_KEYS: Array<keyof SessionLocationVerification> = [
  'checkedAt',
  'venueId',
  'gameId',
  'insideGeofence',
  'distanceMeters',
  'accuracyMeters',
  'verificationType',
  'reason',
  'devSimulated',
]

/** Persist presence result only — never exact user lat/lng. */
export function sanitizeLocationVerification(
  value: unknown,
): SessionLocationVerification | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const next: Partial<SessionLocationVerification> = {}
  for (const key of ALLOWED_KEYS) {
    if (key in raw) (next as Record<string, unknown>)[key] = raw[key]
  }
  if (!next.checkedAt || !next.venueId || !next.gameId || !next.verificationType) return null
  return {
    checkedAt: String(next.checkedAt),
    venueId: String(next.venueId),
    gameId: String(next.gameId),
    insideGeofence: Boolean(next.insideGeofence),
    distanceMeters: typeof next.distanceMeters === 'number' ? next.distanceMeters : undefined,
    accuracyMeters: typeof next.accuracyMeters === 'number' ? next.accuracyMeters : undefined,
    verificationType: next.verificationType === 'dev_simulation' ? 'dev_simulation' : 'browser_geolocation',
    reason: next.reason,
    devSimulated: next.devSimulated === true || next.verificationType === 'dev_simulation',
  }
}
