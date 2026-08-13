import { useMemo, useState } from 'react'
import type { Drill, Session } from '../api'
import { PeriodCheckin } from '../renderers/v2/DrillRenderer'
import specialTeamsCatalog from '../data/sidequests/special_teams.json'
import numericalSituationCatalog from '../data/sidequests/numerical_situation.json'
import {
  appendSidequest,
  createSidequestId,
  filterTemplateQuestions,
  formatSidequestLabel,
  resolveNumericalTemplate,
  summarizeSidequestAnswers,
  type NumericalSituationType,
  type SessionSidequest,
  type SidequestPerspective,
  type SpecialTeamsGameState,
} from '../utils/sessionSidequests'
import { formatGameTimeInput } from '../utils/sceneHelpers'
import { buildSidequestCompletedEvent } from '../features/progression'
import { useRewards } from '../features/rewards'
import { isDummySession } from '../utils/sessionEligibility'
import styles from './SessionCaptureOverlay.module.css'

type HubCategory = 'power_play' | 'penalty_kill' | 'numerical_situation'
type Step = 'category' | 'st_pick' | 'num_situation' | 'num_perspective' | 'drill' | 'saved'

type MiniDrill = {
  id: string
  title: string
  description?: string
  drill_type: string
  didactics?: any
  config?: any
}

interface SpecialTeamsSidequestButtonProps {
  session: Session
  currentPhase: string
  activeDrill: Drill | null
  phaseAnswers: any
  onAppendSidequest: (nextPhaseAnswers: any) => void
}

function validateMiniAnswers(drill: MiniDrill, answers: any): string | null {
  const questions = Array.isArray(drill?.config?.questions) ? drill.config.questions : []
  for (const question of questions) {
    if (!question?.key) continue
    if (question.optional === true) continue
    if (question.required !== true && question.optional !== false) continue

    const value = answers?.[question.key]
    if (question.type === 'multi_select') {
      if (!Array.isArray(value) || value.length === 0) {
        return 'Bitte beantworte alle erforderlichen Fragen.'
      }
      continue
    }
    if (question.type === 'text') {
      const trimmed = String(value || '').trim()
      const minChars = Number(question.min_chars || 0)
      if (!trimmed || (minChars > 0 && trimmed.length < minChars)) {
        return 'Bitte beantworte alle erforderlichen Fragen.'
      }
      continue
    }
    if (value === undefined || value === null || String(value).trim() === '') {
      return 'Bitte beantworte alle erforderlichen Fragen.'
    }
  }
  return null
}

const PERSPECTIVE_LABELS: Record<SidequestPerspective, { label: string; hint: string }> = {
  advantaged: {
    label: 'Vorteil (mehr Spieler)',
    hint: 'Dein beobachtetes Team hat die numerische Überlegenheit',
  },
  disadvantaged: {
    label: 'Nachteil (weniger Spieler)',
    hint: 'Dein beobachtetes Team verteidigt die Unterzahl',
  },
}

export function SpecialTeamsSidequestButton({
  session,
  currentPhase,
  activeDrill,
  phaseAnswers,
  onAppendSidequest,
}: SpecialTeamsSidequestButtonProps) {
  const { ingestActivityEvents } = useRewards()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('category')
  const [hubCategory, setHubCategory] = useState<HubCategory | null>(null)
  const [gameState, setGameState] = useState<SpecialTeamsGameState | null>(null)
  const [situationType, setSituationType] = useState<NumericalSituationType | null>(null)
  const [perspective, setPerspective] = useState<SidequestPerspective | null>(null)
  const [selectedDrill, setSelectedDrill] = useState<MiniDrill | null>(null)
  const [miniAnswers, setMiniAnswers] = useState<Record<string, unknown>>({})
  const [gameTime, setGameTime] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<SessionSidequest | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const stCatalog = specialTeamsCatalog as any
  const numCatalog = numericalSituationCatalog as any
  const situationOptions = Array.isArray(numCatalog?.situation_types) ? numCatalog.situation_types : []
  const numericalTemplates = Array.isArray(numCatalog?.templates) ? numCatalog.templates : []

  const stGameStateConfig = gameState ? stCatalog?.game_states?.[gameState] : null
  const stMiniDrills: MiniDrill[] = Array.isArray(stGameStateConfig?.mini_drills) ? stGameStateConfig.mini_drills : []

  const selectedSituation = situationOptions.find((item: any) => item.id === situationType) || null
  const availablePerspectives: SidequestPerspective[] = Array.isArray(selectedSituation?.perspectives)
    ? selectedSituation.perspectives
    : ['advantaged', 'disadvantaged']

  const observedTeam = useMemo(() => {
    return (
      session.game_info?.observed_team_name
      || session.game_info?.observed_team
      || session.observed_team
      || ''
    )
  }, [session])

  const syntheticDrill = useMemo(() => {
    if (!selectedDrill) return null
    return {
      id: selectedDrill.id,
      title: selectedDrill.title,
      description: selectedDrill.description,
      drill_type: selectedDrill.drill_type || 'period_checkin',
      didactics: selectedDrill.didactics,
      config: {
        ...(selectedDrill.config || {}),
        compact_ui: true,
      },
    }
  }, [selectedDrill])

  const resetFlow = () => {
    setStep('category')
    setHubCategory(null)
    setGameState(null)
    setSituationType(null)
    setPerspective(null)
    setSelectedDrill(null)
    setMiniAnswers({})
    setGameTime('')
    setError(null)
    setLastSaved(null)
  }

  const handleOpen = () => {
    resetFlow()
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    resetFlow()
  }

  const openNumericalTemplate = (nextSituation: NumericalSituationType, nextPerspective: SidequestPerspective) => {
    const template = resolveNumericalTemplate(numericalTemplates, nextSituation, nextPerspective)
    if (!template) {
      setError('Für diese Kombination ist noch kein Mini-Template hinterlegt.')
      return
    }
    const filteredQuestions = filterTemplateQuestions(template, nextSituation)
    setSelectedDrill({
      id: template.id,
      title: template.title,
      description: template.description,
      drill_type: template.drill_type || 'period_checkin',
      didactics: template.didactics,
      config: {
        ...(template.config || {}),
        questions: filteredQuestions,
      },
    })
    setMiniAnswers({})
    setStep('drill')
    setError(null)
  }

  const handleSave = () => {
    if (!selectedDrill || !syntheticDrill || !hubCategory) return
    const validationError = validateMiniAnswers(selectedDrill, miniAnswers)
    if (validationError) {
      setError(validationError)
      return
    }

    const trimmedTime = gameTime.trim()
    if (trimmedTime && !/^\d{1,2}(:\d{1,2})?$/.test(trimmedTime)) {
      setError('Spielzeit bitte als Minute eingeben, z. B. 12:43')
      return
    }

    setIsSaving(true)
    setError(null)

    let entry: SessionSidequest
    if (hubCategory === 'numerical_situation') {
      if (!situationType || !perspective) {
        setIsSaving(false)
        setError('Situation und Perspektive fehlen.')
        return
      }
      entry = {
        id: createSidequestId(),
        type: 'numerical_situation_sidequest',
        category: 'numerical_situation',
        situationType,
        perspective,
        miniDrillId: selectedDrill.id,
        templateId: selectedDrill.id,
        parentDrillId: activeDrill?.id,
        phase: currentPhase,
        gameTime: trimmedTime || undefined,
        observedTeam: observedTeam || undefined,
        answers: { ...miniAnswers },
        createdAt: new Date().toISOString(),
      }
    } else {
      if (!gameState) {
        setIsSaving(false)
        setError('Spielzustand fehlt.')
        return
      }
      entry = {
        id: createSidequestId(),
        type: 'special_teams_sidequest',
        category: 'special_teams',
        gameState,
        miniDrillId: selectedDrill.id,
        templateId: selectedDrill.id,
        parentDrillId: activeDrill?.id,
        phase: currentPhase,
        gameTime: trimmedTime || undefined,
        observedTeam: observedTeam || undefined,
        answers: { ...miniAnswers },
        createdAt: new Date().toISOString(),
      }
    }

    const nextAnswers = appendSidequest(phaseAnswers, entry)
    onAppendSidequest(nextAnswers)

    if (!isDummySession(session)) {
      void ingestActivityEvents([
        buildSidequestCompletedEvent({
          sidequestId: entry.id,
          category: entry.category,
          occurredAt: entry.createdAt,
          sessionId: session.id,
          situationType: 'situationType' in entry ? entry.situationType : undefined,
          isDummy: false,
        }),
      ])
    }

    const returnTitle = activeDrill?.title || 'Hauptdrill'
    const label = formatSidequestLabel(entry)
    setLastSaved(entry)
    setSavedMsg(`✓ ${label} Sidequest gespeichert · Zurück zu ${returnTitle}`)
    setIsSaving(false)
    setStep('saved')
    window.setTimeout(() => setSavedMsg(null), 3200)
  }

  const phaseLabel =
    currentPhase === 'P1' ? '1. Drittel'
    : currentPhase === 'P2' ? '2. Drittel'
    : currentPhase === 'P3' ? '3. Drittel'
    : currentPhase

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
        <button
          type="button"
          onClick={handleOpen}
          className={`${styles.trigger} ${styles.triggerAmber}`}
        >
          ⚡ Special Teams
        </button>
        {savedMsg && (
          <div style={{ color: '#fbbf24', fontWeight: 600, fontSize: '0.88rem', textAlign: 'center', maxWidth: 320 }}>
            {savedMsg}
          </div>
        )}
      </div>

      {open && (
        <div
          className={`${styles.overlay} ${styles.overlayBottom}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose()
          }}
        >
          <div className={`${styles.panel} ${styles.panelAmber}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>⚡ Special Teams</h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.62)' }}>
                  {phaseLabel}
                  {activeDrill?.title ? ` · ${activeDrill.title}` : ''}
                  {observedTeam ? ` · ${observedTeam}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  border: '1px solid rgba(255,255,255,0.25)',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#f7f7ff',
                  borderRadius: '999px',
                  padding: '0.25rem 0.7rem',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
              >
                Schließen
              </button>
            </div>

            {step === 'category' && (
              <div>
                <p style={{ marginTop: 0, marginBottom: '0.85rem', color: 'rgba(255,255,255,0.82)' }}>
                  Was beobachtest du gerade?
                </p>
                <div style={{ display: 'grid', gap: '0.55rem' }}>
                  {([
                    { id: 'power_play' as const, label: 'Powerplay', hint: 'Beobachtetes Team spielt fünf gegen vier' },
                    { id: 'penalty_kill' as const, label: 'Penalty Kill', hint: 'Beobachtetes Team spielt vier gegen fünf' },
                    { id: 'numerical_situation' as const, label: 'Numerical Situation', hint: '5v3, 6v5, Empty Net und andere seltene Lagen' },
                  ]).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setHubCategory(item.id)
                        setError(null)
                        if (item.id === 'numerical_situation') {
                          setStep('num_situation')
                          return
                        }
                        setGameState(item.id)
                        setStep('st_pick')
                      }}
                      className={styles.choiceButton}
                    >
                      <div style={{ fontWeight: 700 }}>{item.label}</div>
                      <div style={{ marginTop: '0.2rem', fontSize: '0.82rem', color: 'rgba(254,243,199,0.75)' }}>{item.hint}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 'st_pick' && stGameStateConfig && (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('category')
                    setHubCategory(null)
                    setGameState(null)
                    setError(null)
                  }}
                  style={{
                    marginBottom: '0.7rem',
                    border: 'none',
                    background: 'transparent',
                    color: '#8fd3df',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '0.85rem',
                  }}
                >
                  ← Zurück
                </button>
                <h4 style={{ margin: '0 0 0.35rem' }}>{stGameStateConfig.label}</h4>
                <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                  {stGameStateConfig.description}
                </p>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {stMiniDrills.map((drill) => (
                    <button
                      key={drill.id}
                      type="button"
                      onClick={() => {
                        setSelectedDrill(drill)
                        setMiniAnswers({})
                        setStep('drill')
                        setError(null)
                      }}
                      style={{
                        textAlign: 'left',
                        padding: '0.8rem 0.9rem',
                        borderRadius: '0.65rem',
                        border: '1px solid rgba(255,255,255,0.18)',
                        background: 'rgba(255,255,255,0.08)',
                        color: '#f7f7ff',
                        cursor: 'pointer',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{drill.title}</div>
                      {drill.description && (
                        <div style={{ marginTop: '0.2rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.68)', lineHeight: 1.35 }}>
                          {drill.description}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 'num_situation' && (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('category')
                    setHubCategory(null)
                    setSituationType(null)
                    setError(null)
                  }}
                  style={{
                    marginBottom: '0.7rem',
                    border: 'none',
                    background: 'transparent',
                    color: '#8fd3df',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '0.85rem',
                  }}
                >
                  ← Zurück
                </button>
                <h4 style={{ margin: '0 0 0.35rem' }}>Welche Sondersituation beobachtest du?</h4>
                <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                  Kurz mitnehmen, wenn Hockey sie dir gerade schenkt.
                </p>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {situationOptions.map((item: any) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        const nextType = item.id as NumericalSituationType
                        const perspectives = Array.isArray(item.perspectives) ? item.perspectives : []
                        setSituationType(nextType)
                        setError(null)
                        if (perspectives.length === 1) {
                          const only = perspectives[0] as SidequestPerspective
                          setPerspective(only)
                          openNumericalTemplate(nextType, only)
                          return
                        }
                        setPerspective(null)
                        setStep('num_perspective')
                      }}
                      style={{
                        textAlign: 'left',
                        padding: '0.8rem 0.9rem',
                        borderRadius: '0.65rem',
                        border: '1px solid rgba(255,255,255,0.18)',
                        background: 'rgba(255,255,255,0.08)',
                        color: '#f7f7ff',
                        cursor: 'pointer',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{item.label}</div>
                      {item.hint && (
                        <div style={{ marginTop: '0.2rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.68)', lineHeight: 1.35 }}>
                          {item.hint}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 'num_perspective' && situationType && (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('num_situation')
                    setPerspective(null)
                    setError(null)
                  }}
                  style={{
                    marginBottom: '0.7rem',
                    border: 'none',
                    background: 'transparent',
                    color: '#8fd3df',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '0.85rem',
                  }}
                >
                  ← Situation wählen
                </button>
                <h4 style={{ margin: '0 0 0.35rem' }}>Welche Perspektive beobachtest du?</h4>
                <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                  Bezogen auf {observedTeam || 'dein beobachtetes Team'}
                </p>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {availablePerspectives.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setPerspective(value)
                        openNumericalTemplate(situationType, value)
                      }}
                      className={styles.choiceButton}
                    >
                      <div style={{ fontWeight: 700 }}>{PERSPECTIVE_LABELS[value].label}</div>
                      <div style={{ marginTop: '0.2rem', fontSize: '0.82rem', color: 'rgba(254,243,199,0.75)' }}>
                        {PERSPECTIVE_LABELS[value].hint}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 'drill' && syntheticDrill && selectedDrill && (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDrill(null)
                    setMiniAnswers({})
                    setError(null)
                    if (hubCategory === 'numerical_situation') {
                      if (availablePerspectives.length > 1) setStep('num_perspective')
                      else setStep('num_situation')
                      return
                    }
                    setStep('st_pick')
                  }}
                  style={{
                    marginBottom: '0.7rem',
                    border: 'none',
                    background: 'transparent',
                    color: '#8fd3df',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '0.85rem',
                  }}
                >
                  ← Zurück
                </button>

                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                  Spielzeit <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.55)' }}>(optional)</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={gameTime}
                  onChange={(e) => setGameTime(formatGameTimeInput(e.target.value))}
                  placeholder="12:43"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.7rem',
                    borderRadius: '0.4rem',
                    border: '1.5px solid #334155',
                    background: '#050712',
                    color: '#f7f7ff',
                    marginBottom: '0.85rem',
                  }}
                />

                <div className="sidequest-mini-drill">
                  <PeriodCheckin
                    drill={syntheticDrill}
                    answers={miniAnswers}
                    setAnswers={setMiniAnswers}
                  />
                </div>

                {error && (
                  <p style={{ margin: '0.7rem 0 0', color: '#ffb7bf', fontSize: '0.86rem' }}>{error}</p>
                )}

                <div style={{ display: 'flex', gap: '0.55rem', marginTop: '0.9rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn"
                    style={{ minWidth: 160 }}
                  >
                    {isSaving ? 'Speichere…' : 'Speichern'}
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    style={{
                      padding: '0.55rem 0.9rem',
                      borderRadius: '0.45rem',
                      border: '1px solid rgba(255,255,255,0.25)',
                      background: 'transparent',
                      color: '#f7f7ff',
                      cursor: 'pointer',
                    }}
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}

            {step === 'saved' && lastSaved && (
              <div>
                <h4 style={{ margin: '0 0 0.45rem', color: '#99f6e4' }}>✓ {formatSidequestLabel(lastSaved)} Sidequest gespeichert</h4>
                <div style={{ display: 'grid', gap: '0.25rem', marginBottom: '0.85rem', fontSize: '0.86rem', color: 'rgba(255,255,255,0.78)' }}>
                  {summarizeSidequestAnswers(lastSaved).map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn"
                  onClick={handleClose}
                  style={{ minWidth: 180 }}
                >
                  Zurück zum Drill
                </button>
              </div>
            )}

            {error && step !== 'drill' && (
              <p style={{ margin: '0.7rem 0 0', color: '#ffb7bf', fontSize: '0.86rem' }}>{error}</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
