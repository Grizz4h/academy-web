import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CatalogGame } from '../../api'
import Card from '../Card'
import { UiButton } from '../ui'
import { isDevNavEnabled } from '../../config/featureFlags'
import { isDummyCatalogGame } from '../../features/schedule/scheduleLayer'
import { isGeofenceUsable, resolveVenueForGame } from '../../data/venues/resolveVenue'
import {
  evaluateVenuePresence,
  getCurrentPositionOnce,
  getDevLocationScenario,
  isQualifyingVenueVerification,
  isWithinArenaMatchdayWindow,
  readGeolocationPermission,
  readPendingVenuePresence,
  setDevLocationScenario,
  simulateFixForGame,
  writePendingVenuePresence,
  type DevLocationScenario,
  type GeolocationPermissionState,
} from '../../features/location'
import type { SessionLocationVerification } from '../../data/venues/types'
import styles from './ArenaCheckPanel.module.css'

const SCENARIOS: Array<{ id: DevLocationScenario; label: string }> = [
  { id: 'off', label: 'Aus' },
  { id: 'inside_home', label: 'Im Stadion' },
  { id: 'inside_away', label: 'Im Stadion (Away-Rolle)' },
  { id: 'outside', label: 'Außerhalb' },
  { id: 'poor_accuracy', label: 'Schlechte Genauigkeit' },
  { id: 'denied', label: 'Permission denied' },
]

type ArenaCheckPanelProps = {
  game: CatalogGame | null | undefined
  compact?: boolean
}

export default function ArenaCheckPanel({ game, compact = false }: ArenaCheckPanelProps) {
  const [permission, setPermission] = useState<GeolocationPermissionState>('unknown')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<SessionLocationVerification | null>(null)
  const [message, setMessage] = useState('')
  const [scenario, setScenario] = useState<DevLocationScenario>('off')
  const devMode = isDevNavEnabled()

  const venue = useMemo(() => (game ? resolveVenueForGame(game) : undefined), [game])
  const usable = isGeofenceUsable(venue)
  const dummy = Boolean(game && isDummyCatalogGame(game))
  const inWindow = Boolean(game && isWithinArenaMatchdayWindow(game))

  useEffect(() => {
    if (!game?.id) {
      setResult(null)
      return
    }
    setResult(readPendingVenuePresence(game.id))
    setScenario(getDevLocationScenario())
    void readGeolocationPermission().then(setPermission)
  }, [game?.id])

  const runCheck = useCallback(async () => {
    if (!game || dummy || !usable) return
    setBusy(true)
    setMessage('')
    const activeScenario = getDevLocationScenario()
    if (activeScenario === 'denied') {
      const denied: SessionLocationVerification = {
        checkedAt: new Date().toISOString(),
        venueId: venue?.id || '',
        gameId: game.id,
        insideGeofence: false,
        verificationType: 'dev_simulation',
        devSimulated: true,
        reason: 'denied',
      }
      setPermission('denied')
      setResult(denied)
      writePendingVenuePresence(denied)
      setBusy(false)
      return
    }

    const simulated = activeScenario !== 'off' ? simulateFixForGame(game, activeScenario) : null
    const fixResult = simulated
      ? { ok: true as const, permission: 'granted' as const, fix: simulated }
      : await getCurrentPositionOnce()

    if (!fixResult.ok) {
      setPermission(fixResult.permission)
      const failed: SessionLocationVerification = {
        checkedAt: new Date().toISOString(),
        venueId: venue?.id || '',
        gameId: game.id,
        insideGeofence: false,
        verificationType: 'browser_geolocation',
        reason: fixResult.permission === 'denied' ? 'denied' : fixResult.permission === 'unavailable' ? 'unavailable' : 'error',
      }
      setResult(failed)
      writePendingVenuePresence(failed)
      setMessage(fixResult.message)
      setBusy(false)
      return
    }

    setPermission('granted')
    const verification = evaluateVenuePresence({
      game,
      fix: fixResult.fix,
      verificationType: simulated ? 'dev_simulation' : 'browser_geolocation',
      devSimulated: Boolean(simulated),
    })
    setResult(verification)
    writePendingVenuePresence(verification)
    setBusy(false)
  }, [dummy, game, usable, venue?.id])

  if (!game || dummy || !venue) return null

  const verified = isQualifyingVenueVerification(result)
  const simVerified = result?.insideGeofence && result.reason === 'inside' && result.devSimulated
  const reason = result?.reason

  return (
    <Card surface="nested" className={compact ? styles.compact : styles.panel}>
      <p className={styles.eyebrow}>Arena Check</p>
      <h3 className={styles.title}>{venue.name}</h3>
      {!usable ? (
        <p className={styles.copy}>
          Koordinaten für diese Halle fehlen noch. Der normale Drill läuft weiter — Location Rewards sind hier noch nicht aktiv.
        </p>
      ) : !inWindow && reason !== 'inside' ? (
        <p className={styles.copy}>
          Standortprüfung ist im Matchday-Zeitfenster verfügbar (3 Stunden vor dem Spiel bis 3 Stunden nach dem erwarteten Ende).
        </p>
      ) : permission === 'unknown' && !result ? (
        <p className={styles.copy}>
          RINK Tank kann einmalig deinen Standort prüfen, um festzustellen, ob du dieses Spiel tatsächlich vor Ort begleitest.
          Dein Standort wird nicht dauerhaft verfolgt.
        </p>
      ) : null}

      {verified ? (
        <p className={styles.ok}>
          ✓ Arena erkannt
          <span>
            {venue.name}
            <br />
            Matchday verification active
            <br />
            Schließe jetzt deinen Drill ab.
          </span>
        </p>
      ) : null}

      {simVerified ? (
        <p className={styles.warn}>
          DEV-Simulation: Arena erkannt — erzeugt keine echten Rewards.
        </p>
      ) : null}

      {reason === 'outside_geofence' ? (
        <p className={styles.neutral}>Arena Check nicht bestätigt. Der normale Drill bleibt gültig.</p>
      ) : null}
      {reason === 'insufficient_accuracy' ? (
        <p className={styles.warn}>
          Standort konnte nicht genau genug bestimmt werden. Versuche es erneut.
        </p>
      ) : null}
      {reason === 'denied' ? (
        <p className={styles.neutral}>Kein Location Reward — der Drill funktioniert trotzdem.</p>
      ) : null}
      {reason === 'unavailable' || reason === 'error' ? (
        <p className={styles.warn}>{message || 'Standort konnte nicht bestimmt werden.'}</p>
      ) : null}
      {reason === 'outside_window' && usable ? (
        <p className={styles.neutral}>Außerhalb des Matchday-Zeitfensters — kein Location Reward für dieses Spiel.</p>
      ) : null}

      {usable && (inWindow || reason === 'insufficient_accuracy' || devMode) ? (
        <UiButton type="button" size="sm" onClick={() => void runCheck()} disabled={busy || (permission === 'denied' && !devMode)}>
          {busy ? 'Prüfe…' : result ? 'Erneut prüfen' : 'Standort prüfen'}
        </UiButton>
      ) : null}

      {devMode ? (
        <div className={styles.dev}>
          <span>DEV → Location</span>
          <div className={styles.devRow}>
            {SCENARIOS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={scenario === item.id ? styles.devActive : undefined}
                onClick={() => {
                  setDevLocationScenario(item.id)
                  setScenario(item.id)
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  )
}
