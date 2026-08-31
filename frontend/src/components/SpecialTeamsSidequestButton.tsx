import { useMemo, useState } from 'react'
import type { Drill, Session } from '../api'
import {
  UiButton,
  UiSheet,
  UiSheetActions,
  UiSheetBack,
  UiSheetChoice,
  UiSheetChoiceList,
  uiSheetStyles,
} from './ui'
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

function endSituationLabel(hubCategory: HubCategory | null, gameState: SpecialTeamsGameState | null): string {
  if (hubCategory === 'power_play' || gameState === 'power_play') return 'Powerplay beenden'
  if (hubCategory === 'penalty_kill' || gameState === 'penalty_kill') return 'Penalty Kill beenden'
  return 'Situation beenden'
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
  const [situationGroupId, setSituationGroupId] = useState<string | null>(null)
  const [scenesInSituation, setScenesInSituation] = useState(0)
  const [situationCompleted, setSituationCompleted] = useState(false)
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

  const ensureSituationGroup = () => {
    if (situationGroupId) return situationGroupId
    const nextId = createSidequestId()
    setSituationGroupId(nextId)
    return nextId
  }

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
    setSituationGroupId(null)
    setScenesInSituation(0)
    setSituationCompleted(false)
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

  const handleSaveScene = () => {
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

    const groupId = ensureSituationGroup()
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
        situationGroupId: groupId,
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
        situationGroupId: groupId,
      }
    }

    const nextAnswers = appendSidequest(phaseAnswers, entry)
    onAppendSidequest(nextAnswers)

    const nextCount = scenesInSituation + 1
    setScenesInSituation(nextCount)
    setLastSaved(entry)
    setSavedMsg(`✓ Szene ${nextCount} geloggt · Situation läuft weiter`)
    setIsSaving(false)
    setStep('saved')
    window.setTimeout(() => setSavedMsg(null), 3200)
  }

  const handleAnotherScene = () => {
    setMiniAnswers({})
    setGameTime('')
    setError(null)
    setLastSaved(null)
    setStep('drill')
  }

  const handleEndSituation = () => {
    if (!hubCategory || !lastSaved || situationCompleted) {
      handleClose()
      return
    }

    const completionId = situationGroupId || lastSaved.id
    if (!isDummySession(session)) {
      void ingestActivityEvents(
        [
          buildSidequestCompletedEvent({
            sidequestId: completionId,
            category: lastSaved.category,
            occurredAt: new Date().toISOString(),
            sessionId: session.id,
            situationType: 'situationType' in lastSaved ? lastSaved.situationType : undefined,
            isDummy: false,
          }),
        ],
        { showToasts: false },
      )
    }

    setSituationCompleted(true)
    const label = formatSidequestLabel(lastSaved)
    const returnTitle = activeDrill?.title || 'Hauptdrill'
    setSavedMsg(`✓ ${label} Situation beendet (${scenesInSituation} Szene${scenesInSituation === 1 ? '' : 'n'}) · Zurück zu ${returnTitle}`)
    window.setTimeout(() => setSavedMsg(null), 3200)
    handleClose()
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
            transition: 'box-shadow 0.15s, transform 0.1s',
            minWidth: 220,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 28px rgba(251, 191, 36, 0.5)'
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 16px rgba(251, 191, 36, 0.22)'
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
          }}
        >
          ⚡ Special Teams
        </button>
        {savedMsg && (
          <div style={{ color: '#fbbf24', fontWeight: 600, fontSize: '0.88rem', textAlign: 'center', maxWidth: 320 }}>
            {savedMsg}
          </div>
        )}
      </div>

      <UiSheet
        open={open}
        onClose={handleClose}
        title="⚡ Special Teams"
        label="Special Teams"
        meta={`${phaseLabel}${activeDrill?.title ? ` · ${activeDrill.title}` : ''}${observedTeam ? ` · ${observedTeam}` : ''}`}
      >
        {step === 'category' && (
          <div>
            <p style={{ marginTop: 0, marginBottom: '0.85rem', color: 'rgba(255,255,255,0.82)' }}>
              Was beobachtest du gerade?
            </p>
            <UiSheetChoiceList>
              {([
                { id: 'power_play' as const, label: 'Powerplay', hint: 'Beobachtetes Team spielt fünf gegen vier' },
                { id: 'penalty_kill' as const, label: 'Penalty Kill', hint: 'Beobachtetes Team spielt vier gegen fünf' },
                { id: 'numerical_situation' as const, label: 'Numerische Sondersituation', hint: 'Zusätzlicher Feldspieler, 5v3, 6v5, leeres Tor und andere seltene Lagen' },
              ]).map((item) => (
                <UiSheetChoice
                  key={item.id}
                  title={item.label}
                  hint={item.hint}
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
                />
              ))}
            </UiSheetChoiceList>
            <UiSheetActions
              secondary={<UiButton variant="secondary" onClick={handleClose}>Abbrechen</UiButton>}
            />
          </div>
        )}

        {step === 'st_pick' && stGameStateConfig && (
          <div>
            <UiSheetBack
              onClick={() => {
                setStep('category')
                setHubCategory(null)
                setGameState(null)
                setError(null)
              }}
            />
            <h4 style={{ margin: '0 0 0.35rem' }}>{stGameStateConfig.label}</h4>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
              {stGameStateConfig.description}
            </p>
            <UiSheetChoiceList>
              {stMiniDrills.map((drill) => (
                <UiSheetChoice
                  key={drill.id}
                  title={drill.title}
                  hint={drill.description}
                  onClick={() => {
                    setSelectedDrill(drill)
                    setMiniAnswers({})
                    setStep('drill')
                    setError(null)
                  }}
                />
              ))}
            </UiSheetChoiceList>
            <UiSheetActions
              secondary={<UiButton variant="secondary" onClick={handleClose}>Abbrechen</UiButton>}
            />
          </div>
        )}

        {step === 'num_situation' && (
          <div>
            <UiSheetBack
              onClick={() => {
                setStep('category')
                setHubCategory(null)
                setSituationType(null)
                setError(null)
              }}
            />
            <h4 style={{ margin: '0 0 0.35rem' }}>Welche Sondersituation beobachtest du?</h4>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
              Kurz mitnehmen, wenn Hockey sie dir gerade schenkt.
            </p>
            <UiSheetChoiceList>
              {situationOptions.map((item: any) => (
                <UiSheetChoice
                  key={item.id}
                  title={item.label}
                  hint={item.hint}
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
                />
              ))}
            </UiSheetChoiceList>
            <UiSheetActions
              secondary={<UiButton variant="secondary" onClick={handleClose}>Abbrechen</UiButton>}
            />
          </div>
        )}

        {step === 'num_perspective' && situationType && (
          <div>
            <UiSheetBack
              onClick={() => {
                setStep('num_situation')
                setPerspective(null)
                setError(null)
              }}
            >
              ← Situation wählen
            </UiSheetBack>
            <h4 style={{ margin: '0 0 0.35rem' }}>Welche Perspektive beobachtest du?</h4>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
              Bezogen auf {observedTeam || 'dein beobachtetes Team'}
            </p>
            <UiSheetChoiceList>
              {availablePerspectives.map((value) => (
                <UiSheetChoice
                  key={value}
                  title={PERSPECTIVE_LABELS[value].label}
                  hint={PERSPECTIVE_LABELS[value].hint}
                  onClick={() => {
                    setPerspective(value)
                    openNumericalTemplate(situationType, value)
                  }}
                />
              ))}
            </UiSheetChoiceList>
            <UiSheetActions
              secondary={<UiButton variant="secondary" onClick={handleClose}>Abbrechen</UiButton>}
            />
          </div>
        )}

        {step === 'drill' && syntheticDrill && selectedDrill && (
          <div>
            <UiSheetBack
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
            />

            {scenesInSituation > 0 ? (
              <p style={{ margin: '0 0 0.65rem', fontSize: '0.85rem', color: 'rgba(251,191,36,0.9)' }}>
                Situation läuft · {scenesInSituation} Szene{scenesInSituation === 1 ? '' : 'n'} geloggt
              </p>
            ) : null}

            <label className={uiSheetStyles.fieldLabel}>
              Spielzeit <span className={uiSheetStyles.optional}>(optional)</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={gameTime}
              onChange={(e) => setGameTime(formatGameTimeInput(e.target.value))}
              placeholder="12:43"
              className={uiSheetStyles.input}
            />

            <div className="sidequest-mini-drill">
              <PeriodCheckin
                drill={syntheticDrill}
                answers={miniAnswers}
                setAnswers={setMiniAnswers}
              />
            </div>

            {error && <p className={uiSheetStyles.error}>{error}</p>}

            <UiSheetActions
              secondary={
                <UiButton variant="secondary" onClick={handleClose} disabled={isSaving}>
                  Abbrechen
                </UiButton>
              }
              primary={
                <UiButton onClick={handleSaveScene} disabled={isSaving}>
                  {isSaving ? 'Speichere…' : 'Szene speichern'}
                </UiButton>
              }
            />
          </div>
        )}

        {step === 'saved' && lastSaved && (
          <div>
            <h4 style={{ margin: '0 0 0.45rem', color: '#99f6e4' }}>
              ✓ Szene {scenesInSituation} geloggt
            </h4>
            <p style={{ margin: '0 0 0.65rem', fontSize: '0.86rem', color: 'rgba(255,255,255,0.78)' }}>
              {formatSidequestLabel(lastSaved)} läuft weiter — speichere so viele Szenen wie du willst.
            </p>
            <div style={{ display: 'grid', gap: '0.25rem', marginBottom: '0.85rem', fontSize: '0.86rem', color: 'rgba(255,255,255,0.78)' }}>
              {summarizeSidequestAnswers(lastSaved).map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
            <UiSheetActions
              secondary={
                <UiButton variant="secondary" onClick={handleEndSituation}>
                  {endSituationLabel(hubCategory, gameState)}
                </UiButton>
              }
              primary={
                <UiButton onClick={handleAnotherScene}>
                  Weitere Szene
                </UiButton>
              }
            />
          </div>
        )}

        {error && step !== 'drill' && (
          <p className={uiSheetStyles.error}>{error}</p>
        )}
      </UiSheet>
    </>
  )
}
