import { useState, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api, type Session, type Drill } from '../api'
import {
  buildSceneCreatedEvent,
  buildSceneRatedEvent,
  type RinkActivityEvent,
} from '../features/progression'
import { useRewards } from '../features/rewards'
import { useCreatorMode } from '../features/creator'
import { isDummySession } from '../utils/sessionEligibility'
import {
  formatGameTimeInput,
  hasExplicitScenePeriod,
  SCENE_PERIOD_OPTIONS,
  SCENE_PERIOD_REQUIRED_MESSAGE,
} from '../utils/sceneHelpers'
import {
  readActiveObservationDraft,
  withActiveObservationDraft,
} from '../features/sceneCapture/activeObservation'
import { SceneStarRating, type SceneRatingValue } from '../features/sceneCapture/SceneStarRating'
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
  /**
   * Post-session / after-the-fact capture: user must pick the period.
   * During a live session the period comes from Session Setup / currentPhase —
   * do not ask again.
   */
  phaseEditable?: boolean
  phaseAnswers?: Record<string, any>
  onPhaseAnswersChange?: (next: Record<string, any>) => void
}

const PERIOD_OPTIONS = SCENE_PERIOD_OPTIONS.filter((option) =>
  option.value === 'P1' || option.value === 'P2' || option.value === 'P3',
)

function sessionPhaseOrEmpty(phase: string): string {
  const normalized = String(phase || '').trim().toUpperCase()
  if (normalized === 'P1' || normalized === 'P2' || normalized === 'P3') return normalized
  return ''
}

export function SceneMarkerButton({
  session,
  currentPhase,
  activeDrill,
  phaseEditable = false,
  phaseAnswers,
  onPhaseAnswersChange,
}: SceneMarkerButtonProps) {
  const creatorMode = useCreatorMode()
  const queryClient = useQueryClient()
  const { ingestActivityEvents } = useRewards()
  const [showModal, setShowModal] = useState(false)
  const [gameTime, setGameTime] = useState('')
  const [note, setNote] = useState('')
  const [phase, setPhase] = useState(() => (phaseEditable ? '' : sessionPhaseOrEmpty(currentPhase)))
  const [extensionValues, setExtensionValues] = useState<Record<string, string>>({})
  const [rating, setRating] = useState<SceneRatingValue | null>(null)
  const [linkToObservation, setLinkToObservation] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [periodError, setPeriodError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const periodFieldRef = useRef<HTMLDivElement>(null)
  const sceneMarkerExtensions: SceneMarkerExtension[] = Array.isArray(activeDrill?.config?.sceneMarkerExtensions)
    ? activeDrill.config.sceneMarkerExtensions.filter((extension: any) =>
        extension?.type === 'select' &&
        typeof extension.key === 'string' &&
        typeof extension.label === 'string' &&
        Array.isArray(extension.options) &&
        extension.options.length > 0
      )
    : []

  const activeObservation = readActiveObservationDraft(phaseAnswers)
  const canLinkObservation = Boolean(
    activeObservation
    && activeObservation.sessionId === session.id
    && activeObservation.phase === currentPhase
    && (!activeDrill?.id || activeObservation.drillId === activeDrill.id),
  )

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

  const focusPeriodField = () => {
    setPeriodError(true)
    window.requestAnimationFrame(() => {
      periodFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      const firstChip = periodFieldRef.current?.querySelector('button')
      if (firstChip instanceof HTMLElement) firstChip.focus({ preventScroll: true })
    })
  }

  const handleOpen = () => {
    setGameTime('')
    setNote('')
    // Live session: period already fixed by Session Setup / current phase.
    // Post-session (phaseEditable): start empty so the user chooses actively.
    setPhase(phaseEditable ? '' : sessionPhaseOrEmpty(currentPhase))
    setExtensionValues({})
    setRating(null)
    setLinkToObservation(true)
    setError(null)
    setPeriodError(false)
    setShowModal(true)
  }

  const handleClose = () => {
    setShowModal(false)
    setError(null)
    setPeriodError(false)
  }

  const handleSave = async () => {
    const resolvedPeriod = phaseEditable ? phase : sessionPhaseOrEmpty(currentPhase) || phase
    if (phaseEditable && !hasExplicitScenePeriod(resolvedPeriod)) {
      focusPeriodField()
      setError(null)
      return
    }
    if (!hasExplicitScenePeriod(resolvedPeriod)) {
      setError('Kein Drittel in der Session gesetzt. Bitte Session-Setup prüfen.')
      return
    }

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
    setPeriodError(false)

    const linkNow = canLinkObservation && linkToObservation && activeObservation

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
          observation_id: linkNow ? activeObservation.id : null,
          observation_label: linkNow ? activeObservation.label : null,
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
        period: resolvedPeriod,
        game_time: trimmed,
        note: note.trim() || undefined,
        rating: rating ?? null,
        extensions: Object.fromEntries(
          Object.entries(extensionValues).filter(([, value]) => value.trim().length > 0)
        ),
        extension_labels: Object.fromEntries(
          sceneMarkerExtensions.map((extension) => [extension.key, extension.label])
        ),
      })

      let backlinkWarning: string | null = null
      if (linkNow && activeObservation) {
        if (onPhaseAnswersChange) {
          onPhaseAnswersChange(withActiveObservationDraft(phaseAnswers || {}, {
            ...activeObservation,
            sceneId: scene.id,
            sceneCode: scene.scene_code || null,
          }))
        }
        // Confirm / repair durable bidirectional link server-side (Tank-S2).
        // Scene already has source.observation_id; this backfills sample/draft.sceneId when present.
        try {
          const linked = await api.linkSceneObservation(scene.id, {
            observation_id: activeObservation.id,
            session_id: session.id,
            allow_pending_sample: true,
          })
          if (linked.observation_link?.status === 'backlink_failed') {
            backlinkWarning = 'Szene gespeichert, Beobachtungs-Verknüpfung unvollständig.'
          }
        } catch {
          backlinkWarning = 'Szene gespeichert, Beobachtungs-Verknüpfung unvollständig.'
        }
      }

      setShowModal(false)
      const ratingSuffix = rating ? ` · ${rating}★` : ''
      if (backlinkWarning) {
        setError(backlinkWarning)
        setSavedMsg(`🎬 ${(scene.scene_code || trimmed)} gespeichert`)
      } else {
        setSavedMsg(`🎬 ${(scene.scene_code || trimmed)} gespeichert${ratingSuffix}`)
      }
      setTimeout(() => setSavedMsg(null), 2500)
      queryClient.invalidateQueries({ queryKey: ['scenes'] })
      queryClient.invalidateQueries({ queryKey: ['session', session.id] })
      if (!isDummySession(session)) {
        const events: RinkActivityEvent[] = [
          buildSceneCreatedEvent({
            sceneId: scene.id,
            occurredAt: scene.created_at,
            sessionId: session.id,
            drillId: activeDrill?.id,
            gameId: session.game_id || session.game_info?.game_id,
          }),
        ]
        if (rating) {
          events.push(buildSceneRatedEvent({
            sceneId: scene.id,
            rating,
            occurredAt: scene.updated_at || scene.created_at,
          }))
        }
        void ingestActivityEvents(events, { showToasts: false })
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

  const displayPeriod = phaseEditable ? phase : sessionPhaseOrEmpty(currentPhase) || phase
  const phaseLabel = PERIOD_OPTIONS.find((option) => option.value === displayPeriod)?.label
    || (phaseEditable ? 'Drittel wählen' : 'Drittel')

  return (
    <>
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

        {phaseEditable ? (
          <div className={styles.field} ref={periodFieldRef}>
            <label className={styles.fieldLabel}>
              Drittel <span className={styles.required}>*</span>
            </label>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.4rem',
                padding: periodError ? '0.45rem' : 0,
                borderRadius: '0.55rem',
                border: periodError ? '1.5px solid rgba(248,113,113,0.7)' : '1.5px solid transparent',
                background: periodError ? 'rgba(248,113,113,0.08)' : 'transparent',
              }}
            >
              {PERIOD_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setPhase(option.value)
                    setPeriodError(false)
                  }}
                  style={{
                    padding: '0.4rem 0.7rem',
                    borderRadius: '0.45rem',
                    border: phase === option.value ? '1.5px solid rgba(125,211,252,0.7)' : '1px solid rgba(148,163,184,0.28)',
                    background: phase === option.value ? 'rgba(14,165,233,0.2)' : 'rgba(15,23,42,0.65)',
                    color: phase === option.value ? '#e0f2fe' : '#cbd5e1',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {periodError ? <p className={styles.error}>{SCENE_PERIOD_REQUIRED_MESSAGE}</p> : null}
          </div>
        ) : null}

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

        {canLinkObservation && activeObservation && (
          <label
            className={styles.field}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.55rem',
              padding: '0.55rem 0.65rem',
              borderRadius: '8px',
              border: '1px solid rgba(81,145,162,0.35)',
              background: 'rgba(81,145,162,0.08)',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={linkToObservation}
              onChange={(e) => setLinkToObservation(e.target.checked)}
              style={{ marginTop: '0.2rem' }}
            />
            <span>
              <span style={{ display: 'block', fontWeight: 650, color: '#e2e8f0', fontSize: '0.9rem' }}>
                Mit aktuellem {activeObservation.label} verknüpfen
              </span>
              <span style={{ display: 'block', marginTop: '0.15rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.62)' }}>
                Optional · {activeObservation.drillTitle || activeObservation.drillId}
              </span>
            </span>
          </label>
        )}

        <div className={styles.field}>
          <label className={styles.fieldLabel}>
            Bewertung <span className={styles.optional}>(optional)</span>
          </label>
          <SceneStarRating
            size="sm"
            rating={rating}
            onChange={(next) => setRating(rating === next ? null : next)}
          />
        </div>

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
