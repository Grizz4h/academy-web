/** One-shot browser geolocation. Never watchPosition. Never poll.
 * Production is HTTPS (https://academy.highspeed-novadelta.de); localhost is a secure context for Vite. */

export type GeolocationPermissionState = 'unknown' | 'granted' | 'denied' | 'unavailable' | 'error'

export type GeolocationFix = {
  latitude: number
  longitude: number
  accuracyMeters: number
  timestamp: number
}

export type GeolocationResult =
  | { ok: true; fix: GeolocationFix; permission: 'granted' }
  | { ok: false; permission: GeolocationPermissionState; message: string }

export const LOCATION_ACCURACY = {
  /** Reject fixes worse than this even if the venue radius is larger. */
  maxAccuracyMeters: 200,
}

export function isSecureGeolocationContext(): boolean {
  if (typeof window === 'undefined') return false
  if (window.isSecureContext) return true
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1'
}

export function geolocationApiAvailable(): boolean {
  return typeof navigator !== 'undefined' && Boolean(navigator.geolocation)
}

export async function readGeolocationPermission(): Promise<GeolocationPermissionState> {
  if (!geolocationApiAvailable()) return 'unavailable'
  const permissions = navigator.permissions
  if (!permissions?.query) return 'unknown'
  try {
    const status = await permissions.query({ name: 'geolocation' as PermissionName })
    if (status.state === 'granted') return 'granted'
    if (status.state === 'denied') return 'denied'
    return 'unknown'
  } catch {
    return 'unknown'
  }
}

export function getCurrentPositionOnce(options?: PositionOptions): Promise<GeolocationResult> {
  if (!geolocationApiAvailable()) {
    return Promise.resolve({
      ok: false,
      permission: 'unavailable',
      message: 'Standort ist auf diesem Gerät nicht verfügbar.',
    })
  }
  if (!isSecureGeolocationContext()) {
    return Promise.resolve({
      ok: false,
      permission: 'unavailable',
      message: 'Standort braucht HTTPS (oder localhost).',
    })
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          ok: true,
          permission: 'granted',
          fix: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracyMeters: position.coords.accuracy,
            timestamp: position.timestamp,
          },
        })
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          resolve({ ok: false, permission: 'denied', message: 'Standortfreigabe abgelehnt.' })
          return
        }
        if (error.code === error.TIMEOUT) {
          resolve({ ok: false, permission: 'error', message: 'Standort-Zeitüberschreitung. Versuch es erneut.' })
          return
        }
        resolve({ ok: false, permission: 'error', message: 'Standort konnte nicht bestimmt werden.' })
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
        ...options,
      },
    )
  })
}
