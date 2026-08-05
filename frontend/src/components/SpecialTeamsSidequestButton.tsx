import { useMemo, useState } from 'react'
import type { Drill, Session } from '../api'
import { PeriodCheckin } from '../renderers/v2/DrillRenderer'
import specialTeamsCatalog from '../data/sidequests/special_teams.json'
import {
  appendSidequest,
  createSidequestId,
  type SessionSidequest,
} from '../utils/sessionSidequests'

type GameState = 'power_play' | 'penalty_kill'
type Step = 'category' | 'pick' | 'drill'

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

export function SpecialTeamsSidequestButton({
  session,
  currentPhase,
  activeDrill,
  phaseAnswers,
  onAppendSidequest,
}: SpecialTeamsSidequestButtonProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('category')
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [selectedDrill, setSelectedDrill] = useState<MiniDrill | null>(null)
  const [miniAnswers, setMiniAnswers] = useState<Record<string, unknown>>({})
  const [gameTime, setGameTime] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const catalog = specialTeamsCatalog as any
  const gameStateConfig = gameState ? catalog?.game_states?.[gameState] : null
  const miniDrills: MiniDrill[] = Array.isArray(gameStateConfig?.mini_drills) ? gameStateConfig.mini_drills : []

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
      config: selectedDrill.config,
    }
  }, [selectedDrill])

  const resetFlow = () => {
    setStep('category')
    setGameState(null)
    setSelectedDrill(null)
    setMiniAnswers({})
    setGameTime('')
    setError(null)
  }

  const handleOpen = () => {
    resetFlow()
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    resetFlow()
  }

  const handleSave = () => {
    if (!selectedDrill || !gameState || !syntheticDrill) return
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

    const entry: SessionSidequest = {
      id: createSidequestId(),
      type: 'special_teams_sidequest',
      category: 'special_teams',
      gameState,
      miniDrillId: selectedDrill.id,
      parentDrillId: activeDrill?.id,
      phase: currentPhase,
      gameTime: trimmedTime || undefined,
      observedTeam: observedTeam || undefined,
      answers: { ...miniAnswers },
      createdAt: new Date().toISOString(),
    }

    const nextAnswers = appendSidequest(phaseAnswers, entry)
    onAppendSidequest(nextAnswers)

    const stateLabel = gameState === 'power_play' ? 'Überzahl' : 'Unterzahl'
    const returnTitle = activeDrill?.title || 'Hauptdrill'
    setSavedMsg(`${stateLabel}-Beobachtung gespeichert · Zurück zu ${returnTitle}`)
    setIsSaving(false)
    setOpen(false)
    resetFlow()
    window.setTimeout(() => setSavedMsg(null), 2800)
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
          style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #1e293b 100%)',
            border: '2px solid #fbbf24',
            borderRadius: '0.75rem',
            color: '#fef3c7',
            fontSize: '1.05rem',
            fontWeight: 700,
            padding: '0.8rem 1.4rem',
            cursor: 'pointer',
            letterSpacing: '0.02em',
            boxShadow: '0 0 16px rgba(251, 191, 36, 0.22)',
            minWidth: 220,
          }}
        >
          Special Teams
        </button>
        {savedMsg && (
          <div style={{ color: '#fbbf24', fontWeight: 600, fontSize: '0.88rem', textAlign: 'center', maxWidth: 320 }}>
            {savedMsg}
          </div>
        )}
      </div>

      {open && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.78)',
            zIndex: 2100,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: '0.75rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose()
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 560,
              maxHeight: '92vh',
              overflowY: 'auto',
              margin: '0 auto',
              padding: '1.2rem 1.25rem',
              borderTopLeftRadius: '1rem',
              borderTopRightRadius: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Special Teams</h3>
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
                  background: 'transparent',
                  color: '#f7f7ff',
                  borderRadius: '999px',
                  padding: '0.25rem 0.7rem',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
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
                    { id: 'power_play' as const, label: 'Überzahl', hint: 'Beobachtetes Team spielt fünf gegen vier' },
                    { id: 'penalty_kill' as const, label: 'Unterzahl', hint: 'Beobachtetes Team spielt vier gegen fünf' },
                  ]).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setGameState(item.id)
                        setStep('pick')
                        setError(null)
                      }}
                      style={{
                        textAlign: 'left',
                        padding: '0.85rem 0.95rem',
                        borderRadius: '0.65rem',
                        border: '1px solid rgba(251,191,36,0.35)',
                        background: 'rgba(251,191,36,0.08)',
                        color: '#fef3c7',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{item.label}</div>
                      <div style={{ marginTop: '0.2rem', fontSize: '0.82rem', color: 'rgba(254,243,199,0.75)' }}>{item.hint}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 'pick' && gameStateConfig && (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('category')
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
                <h4 style={{ margin: '0 0 0.35rem' }}>{gameStateConfig.label}</h4>
                <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                  {gameStateConfig.description}
                </p>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {miniDrills.map((drill) => (
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
                        border: '1px solid rgba(255,255,255,0.16)',
                        background: 'rgba(255,255,255,0.04)',
                        color: '#f7f7ff',
                        cursor: 'pointer',
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

            {step === 'drill' && syntheticDrill && selectedDrill && (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('pick')
                    setSelectedDrill(null)
                    setMiniAnswers({})
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
                  ← Mini-Drill wählen
                </button>

                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                  Spielzeit <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.55)' }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={gameTime}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/[^\d]/g, '').slice(0, 4)
                    let formatted = digits
                    if (digits.length > 2) {
                      formatted = `${digits.slice(0, digits.length - 2)}:${digits.slice(-2)}`
                    }
                    setGameTime(formatted.slice(0, 5))
                  }}
                  placeholder="12:43"
                  maxLength={5}
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
                    {isSaving ? 'Speichere…' : 'Mini-Drill speichern'}
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
          </div>
        </div>
      )}
    </>
  )
}
