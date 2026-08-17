export type GeoPoint = {
  latitude: number
  longitude: number
}

const EARTH_RADIUS_METERS = 6371000

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/** Great-circle distance. Not a degree-box check. */
export function haversineDistanceMeters(from: GeoPoint, to: GeoPoint): number {
  const dLat = toRad(to.latitude - from.latitude)
  const dLng = toRad(to.longitude - from.longitude)
  const lat1 = toRad(from.latitude)
  const lat2 = toRad(to.latitude)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(a)))
}

export function isInsideGeofence(
  userLocation: GeoPoint,
  venueLocation: GeoPoint,
  radiusMeters: number,
): boolean {
  if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) return false
  return haversineDistanceMeters(userLocation, venueLocation) <= radiusMeters
}

/** Round so we never persist a fingerprint-grade offset from the pin. */
export function coarseDistanceMeters(distance: number, bucket = 25): number {
  if (!Number.isFinite(distance) || distance < 0) return 0
  return Math.round(distance / bucket) * bucket
}
