import { useState, useRef, useEffect } from 'react'
import { api, type Session, type Drill } from '../api'
import { buildSceneCreatedEvent } from '../features/progression'
import { useRewards } from '../features/rewards'
import { useCreatorMode } from '../features/creator'
import { isDummySession } from '../utils/sessionEligibility'
import { formatGameTimeInput } from '../utils/sceneHelpers'
import { UiButton, UiSheet, UiSheetActions } from './ui'
import styles from './SceneMarkerButton.module.css'

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
  const creatorMode = useCreatorMode()
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

  useEffect(() => {
    if (!showModal) return
    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true })
    }, 80)
    return () => window.clearTimeout(focusTimer)
  }, [showModal])

  if (!creatorMode) {
    return null
  }

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
          gameId: session.game_id || session.game_info?.game_id,
          }),
        ], { showToasts: false })
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

  return (
    <>
      {/* The main button */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
        <button
          type="button"
          onClick={handleOpen}
          style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            border: '2px solid #4fc3f7',
            borderRadius: '0.75rem',
            color: '#e0f7fa',
            fontSize: '1.1rem',
            fontWeight: 700,
            padding: '0.8rem 1.6rem',
            cursor: 'pointer',
            letterSpacing: '0.02em',
            boxShadow: '0 0 16px rgba(79, 195, 247, 0.25)',
            transition: 'box-shadow 0.15s, transform 0.1s',
            minWidth: 220,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 28px rgba(79, 195, 247, 0.5)'
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 16px rgba(79, 195, 247, 0.25)'
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
          }}
        >
          🎬 Szene merken
        </button>
        {savedMsg && (
          <div style={{ color: '#4fc3f7', fontWeight: 600, fontSize: '0.9rem', textAlign: 'center' }}>
            {savedMsg}
          </div>
        )}
      </div>

      <UiSheet
        open={showModal}
        onClose={handleClose}
        title="🎬 Szene merken"
        label="Szene merken"
        allowBackgroundScroll
        meta={`${phaseLabel}${activeDrill?.title ? ` · ${activeDrill.title}` : session.module_id ? ` · ${session.module_id}` : ''}`}
        onKeyDown={handleKeyDown}
      >
        {(session.game_info?.team_home || session.game_info?.league) && (
          <div className={styles.context}>
            {session.game_info?.team_home && session.game_info?.team_away && (
              <div>
                <strong style={{ color: '#f7f7ff' }}>{session.game_info.team_home}</strong>
                {' vs '}
                <strong style={{ color: '#f7f7ff' }}>{session.game_info.team_away}</strong>
              </div>
            )}
            {session.game_info?.league && (
              <div>
                {session.game_info.league}
                {session.game_info.season ? ` · ${session.game_info.season}` : ''}
              </div>
            )}
          </div>
        )}

        <label className={styles.fieldLabel}>
          Minute <span className={styles.required}>*</span>
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
          className={`${styles.input} ${error ? styles.inputError : ''}`}
        />
        {error && <p className={styles.error}>{error}</p>}

        {sceneMarkerExtensions.map((extension) => (
          <div key={extension.key} className={styles.field}>
            <label className={styles.fieldLabel}>
              {extension.label} <span className={styles.optional}>(optional)</span>
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

        <label className={`${styles.fieldLabel} ${styles.field}`}>
          Kurze Notiz <span className={styles.optional}>(optional)</span>
        </label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="z. B. guter Outlet-Moment, Turnover, interessante Rotation…"
          rows={2}
          maxLength={300}
          className={styles.textarea}
        />

        <UiSheetActions
          secondary={
            <UiButton variant="secondary" onClick={handleClose} disabled={isSaving}>
              Abbrechen
            </UiButton>
          }
          primary={
            <UiButton onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Speichere…' : '🎬 Speichern'}
            </UiButton>
          }
        />
      </UiSheet>
    </>
  )
}
