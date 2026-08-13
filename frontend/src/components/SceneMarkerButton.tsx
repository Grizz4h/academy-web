import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { api, type Session, type Drill } from '../api'
import { buildSceneCreatedEvent } from '../features/progression'
import { useRewards } from '../features/rewards'
import { isDummySession } from '../utils/sessionEligibility'
import { formatGameTimeInput } from '../utils/sceneHelpers'
import styles from './SessionCaptureOverlay.module.css'

interface SceneMarkerExtension {
  type: 'select'
  key: string
  label: string
  options: string[]
}

interface SceneMarkerButtonProps {
  session: Session
  currentPhase: string
  activeDrill: Drill | null
}

export function SceneMarkerButton({ session, currentPhase, activeDrill }: SceneMarkerButtonProps) {
  const { ingestActivityEvents } = useRewards()
  const [showModal, setShowModal] = useState(false)
  const [gameTime, setGameTime] = useState('')
  const [note, setNote] = useState('')
  const [extensionValues, setExtensionValues] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const sceneMarkerExtensions: SceneMarkerExtension[] = Array.isArray(activeDrill?.config?.sceneMarkerExtensions)
    ? activeDrill.config.sceneMarkerExtensions.filter((extension: any) =>
        extension?.type === 'select' &&
        typeof extension.key === 'string' &&
        typeof extension.label === 'string' &&
        Array.isArray(extension.options) &&
        extension.options.length > 0
      )
    : []

  // Focus game_time after portal mounts; lock body scroll while open
  useEffect(() => {
    if (!showModal) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true })
    }, 80)

    return () => {
      document.body.style.overflow = previousOverflow
      window.clearTimeout(focusTimer)
    }
  }, [showModal])

  const handleOpen = () => {
    setGameTime('')
    setNote('')
    setExtensionValues({})
    setError(null)
    setShowModal(true)
  }

  const handleClose = () => {
    setShowModal(false)
    setError(null)
  }

  const handleSave = async () => {
    const trimmed = gameTime.trim()
    if (!trimmed) {
      setError('Bitte Spielzeit eingeben (z. B. 13:42)')
      return
    }
    if (!/^\d{1,2}(:\d{1,2})?$/.test(trimmed)) {
      setError('Bitte eine Spielzeit eingeben – maximal 4 Ziffern, z. B. 13:42')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const scene = await api.createScene({
        session_id: session.id,
        module_id: session.module_id,
        track_id: session.module_id,
        drill_id: activeDrill?.id,
        drill_title: activeDrill?.title,
        source: {
          type: 'drill',
          session_id: session.id,
          drill_id: activeDrill?.id || null,
        },
        metadata_status: 'complete',
        league: session.game_info?.league,
        season: session.game_info?.season,
        competition_phase: session.game_info?.competition_phase,
        competition_phase_label: session.game_info?.competition_phase_label,
        competition_unit_type: session.game_info?.competition_unit_type,
        competition_unit_label: session.game_info?.competition_unit_label,
        competition_unit_value: session.game_info?.competition_unit_value,
        matchday: session.game_info?.matchday,
        team_home: session.game_info?.team_home,
        team_away: session.game_info?.team_away,
        observed_team: session.observed_team,
        observed_team_id: session.game_info?.observed_team_id || session.observed_team_id,
        observed_team_name: session.game_info?.observed_team_name || session.game_info?.observed_team || session.observed_team,
        period: currentPhase,
        game_time: trimmed,
        note: note.trim() || undefined,
        extensions: Object.fromEntries(
          Object.entries(extensionValues).filter(([, value]) => value.trim().length > 0)
        ),
        extension_labels: Object.fromEntries(
          sceneMarkerExtensions.map((extension) => [extension.key, extension.label])
        ),
      })
      setShowModal(false)
      setSavedMsg("🎬 " + (scene.scene_code || trimmed) + " gespeichert")
      setTimeout(() => setSavedMsg(null), 2500)
      if (!isDummySession(session)) {
        void ingestActivityEvents([
          buildSceneCreatedEvent({
            sceneId: scene.id,
            occurredAt: scene.created_at,
            sessionId: session.id,
            drillId: activeDrill?.id,
            trackId: session.module_id,
            isDummy: false,
          }),
        ])
      }
    } catch {
      setError('Fehler beim Speichern. Bitte nochmal versuchen.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      handleClose()
    }
  }

  const phaseLabel =
    currentPhase === 'P1' ? '1. Drittel'
    : currentPhase === 'P2' ? '2. Drittel'
    : currentPhase === 'P3' ? '3. Drittel'
    : currentPhase

  const observedTeam =
    session.game_info?.observed_team_name
    || session.game_info?.observed_team
    || session.observed_team
    || ''

  const headerMeta = [
    phaseLabel,
    activeDrill?.title || session.module_id,
    observedTeam,
  ].filter(Boolean).join(' · ')

  return (
    <>
      {/* The main button */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
        <button
          type="button"
          onClick={handleOpen}
          className={`${styles.trigger} ${styles.triggerCyan}`}
        >
          🎬 Szene merken
        </button>
        {savedMsg && (
          <div style={{ color: '#4fc3f7', fontWeight: 600, fontSize: '0.88rem', textAlign: 'center', maxWidth: 320 }}>
            {savedMsg}
          </div>
        )}
      </div>

      {/* Modal — portaled to body so fixed centering ignores page scroll / transformed parents */}
      {showModal && createPortal(
        <div
          className={styles.overlay}
          onClick={e => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div
            className={`${styles.panel} ${styles.panelCyan}`}
            role="dialog"
            aria-modal="true"
            aria-label="Szene merken"
            onKeyDown={handleKeyDown}
          >
            <div className={styles.header}>
              <div>
                <h3 className={styles.headerTitle}>🎬 Szene merken</h3>
                <p className={styles.headerMeta}>
                  {headerMeta}
                  {session.game_info?.team_home && session.game_info?.team_away
                    ? ` · ${session.game_info.team_home} vs ${session.game_info.team_away}`
                    : ''}
                  {session.game_info?.league
                    ? ` · ${session.game_info.league}${session.game_info.season ? ` · ${session.game_info.season}` : ''}`
                    : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className={styles.closeButton}
              >
                Schließen
              </button>
            </div>

            {/* Game time input */}
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.9rem' }}>
              Minute <span style={{ color: '#f87171' }}>*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={gameTime}
              onChange={e => {
                setGameTime(formatGameTimeInput(e.target.value))
              }}
              placeholder="13:42"
              style={{
                width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.65rem',
                border: error ? '1.5px solid #f87171' : '1.5px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.06)', color: '#f1f5f9',
                fontSize: '1.15rem', fontWeight: 700, letterSpacing: '0.05em',
                boxSizing: 'border-box', marginBottom: '0.3rem',
                backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              }}
            />
            {error && (
              <div style={{ color: '#ffb7bf', fontSize: '0.86rem', marginBottom: '0.5rem' }}>{error}</div>
            )}

            {sceneMarkerExtensions.map((extension) => (
              <div key={extension.key} style={{ marginTop: '0.85rem' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                  {extension.label} <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.55)' }}>(optional)</span>
                </label>
                <select
                  className="appSelect"
                  value={extensionValues[extension.key] || ''}
                  onChange={e => setExtensionValues(prev => ({ ...prev, [extension.key]: e.target.value }))}
                  style={{ width: '100%' }}
                >
                  <option value="">Auswählen...</option>
                  {extension.options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            ))}

            {/* Note input */}
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', marginTop: '0.85rem', fontSize: '0.9rem' }}>
              Kurze Notiz <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.55)' }}>(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="z. B. guter Outlet-Moment, Turnover, interessante Rotation…"
              rows={2}
              maxLength={300}
              style={{
                width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.65rem',
                border: '1.5px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)', color: '#f1f5f9',
                fontSize: '0.95rem', resize: 'vertical', boxSizing: 'border-box',
                backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              }}
            />

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.55rem', marginTop: '0.9rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="btn"
                style={{ minWidth: 160, opacity: isSaving ? 0.7 : 1 }}
              >
                {isSaving ? 'Speichere…' : '🎬 Speichern'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={isSaving}
                style={{
                  border: '1px solid rgba(255,255,255,0.25)',
                  background: 'transparent',
                  color: '#f7f7ff',
                  borderRadius: '999px',
                  padding: '0.45rem 0.9rem',
                  cursor: 'pointer',
                  fontSize: '0.86rem',
                }}
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
