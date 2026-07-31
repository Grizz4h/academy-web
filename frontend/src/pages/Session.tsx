import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { api } from '../api'
import { useUser } from '../context/UserContext'
import { detectDeviceType, evaluateSessionRewards, useRewards } from '../features/rewards'

import { DrillRendererRouter } from '../components/DrillRendererRouter';
import { SceneMarkerButton } from '../components/SceneMarkerButton';
import { formatCompetitionContext } from '../data/competitionConfig';
import { useState, useEffect, useRef, useMemo } from 'react'
import { getObservationScopeLabel } from '../utils/observationScope'

// Patch: Checkin type ohne microfeedback_done
type CheckinWithMicro = {
  phase: string;
  answers: any;
  feedback?: string;
  next_task?: string;
  [key: string]: any;
};

export default function SessionPage() {
  // Notizfeld für Session-Info
  const [sessionNote, setSessionNote] = useState<string>('')
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { user } = useUser()
  const { grantRewardResult, rewardState } = useRewards()

  type Phase = 'PRE' | 'P1' | 'P2' | 'P3' | 'POST';

  const [currentPhase, setCurrentPhase] = useState<Phase>('P1')
  const [drillCompleted, setDrillCompleted] = useState(false)
  const [isAdvancing, setIsAdvancing] = useState(false)

  const [answersByPhase, setAnswersByPhase] = useState<Record<Phase, any>>({
    PRE: {},
    P1: {},
    P2: {},
    P3: {},
    POST: {}
  })

  const [showMicroModal, setShowMicroModal] = useState(false)
  const [microText, setMicroText] = useState('')
  const [microFeedbackError, setMicroFeedbackError] = useState<string>('')
  const [advanceError, setAdvanceError] = useState<string>('')

  // FIX: getrennte States für "Feedback gehört zu welcher Phase" und "wohin danach wechseln"
  const [microPhase, setMicroPhase] = useState<Phase | null>(null)
  const [pendingNextPhase, setPendingNextPhase] = useState<Phase | null>(null)

  // Double-submit hard guard
  const advanceLockRef = useRef(false)
  const draftSaveTimeoutRef = useRef<number | null>(null)
  const remoteDraftsRef = useRef<Record<string, any>>({})

  // Draft key pro Session+Phase (localStorage fallback)
  const draftKey = id ? `academy.session.${id}.phase.${currentPhase}` : null

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['session', id],
    queryFn: () => api.getSession(id!)
  })

  const { data: curriculum } = useQuery({
    queryKey: ['curriculum'],
    queryFn: () => api.getCurriculum(),
    staleTime: 5 * 60 * 1000,
  })

  const activeDrill = useMemo(() => {
    const sessionDrill = session?.drills?.[0]
    if (!sessionDrill) return null

    const tracks = curriculum?.tracks
    if (!Array.isArray(tracks)) return sessionDrill

    const module = tracks
      .flatMap((track: any) => track.modules || [])
      .find((m: any) => m.id === session?.module_id)

    const latest = module?.drills?.find((d: any) => d.id === sessionDrill.id)
    return latest || sessionDrill
  }, [session, curriculum])

  useEffect(() => {
    remoteDraftsRef.current = session?.drafts || {}
  }, [session?.drafts])

  // Renderer switch based on moduleId (A1 = v1, else v2)
  // const moduleId = session?.module_id

  // Session Continuation: nur initial Phase aus Session übernehmen
  const firstLoadRef = useRef(true)

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (!session) return;

    // initial currentPhase setzen (nur einmal); PRE wird im Standard-Workflow übersprungen.
    const initialPhase = session.current_phase === 'PRE' ? 'P1' : session.current_phase
    if (firstLoadRef.current) {
      if (initialPhase && initialPhase !== currentPhase) {
        setCurrentPhase(initialPhase as Phase)
      }
      firstLoadRef.current = false
    }

    // NOTE: NICHT mehr stumpf [currentPhase] auf {} setzen, sonst verlierst du UI-State
    // Wir laden nur, wenn es wirklich Daten gibt.
    if (session.drafts && session.drafts[currentPhase]) {
      setAnswersByPhase(prev => ({ ...prev, [currentPhase]: session.drafts?.[currentPhase] || {} }))
    } else {
      // wenn es schon lokale answers gibt: behalten
      setAnswersByPhase(prev => prev)
    }

    // Session-Notiz (localStorage)
    const noteKey = id ? `academy.session.${id}.note` : null
    if (noteKey) {
      const savedNote = localStorage.getItem(noteKey)
      if (savedNote !== null) setSessionNote(savedNote)
    }
  }, [session, id]) // absichtlich nicht currentPhase

  // Draft laden beim Phasenwechsel (Fallback für alte Sessions)
  useEffect(() => {
    if (!session) return;

    if (session.drafts && session.drafts[currentPhase]) {
      setAnswersByPhase(prev => ({ ...prev, [currentPhase]: session.drafts?.[currentPhase] || {} }))
      return
    }

    // Fallback localStorage
    if (draftKey) {
      const saved = localStorage.getItem(draftKey)
      if (saved) {
        setAnswersByPhase(prev => ({ ...prev, [currentPhase]: JSON.parse(saved) }))
      } else {
        // wenn es schon lokale answers gibt: behalten
        setAnswersByPhase(prev => prev)
      }
    }
  }, [session, currentPhase, draftKey])

  // Draft speichern bei Änderungen
  useEffect(() => {
    if (draftKey) {
      localStorage.setItem(draftKey, JSON.stringify(answersByPhase[currentPhase]))
    }
  }, [answersByPhase, currentPhase, draftKey])

  // Drafts auch serverseitig sichern, damit Gerätewechsel innerhalb des Drittels funktioniert.
  useEffect(() => {
    if (!id || !session) return

    const phaseAnswers = answersByPhase[currentPhase]
    const remotePhaseAnswers = remoteDraftsRef.current?.[currentPhase]
    const nextPhaseJson = JSON.stringify(phaseAnswers || {})
    const remotePhaseJson = JSON.stringify(remotePhaseAnswers || {})

    if (nextPhaseJson === remotePhaseJson) return

    if (draftSaveTimeoutRef.current) {
      window.clearTimeout(draftSaveTimeoutRef.current)
    }

    draftSaveTimeoutRef.current = window.setTimeout(async () => {
      const hasAnswers = phaseAnswers && Object.keys(phaseAnswers).length > 0
      const nextDrafts = { ...remoteDraftsRef.current }

      if (hasAnswers) {
        nextDrafts[currentPhase] = phaseAnswers
      } else {
        delete nextDrafts[currentPhase]
      }

      try {
        await api.saveDrafts(id, nextDrafts)
        remoteDraftsRef.current = nextDrafts
        queryClient.setQueryData(['session', id], (prev: any) => prev ? { ...prev, drafts: nextDrafts } : prev)
      } catch (err) {
        console.error('Failed to save remote drafts', err)
      }
    }, 500)

    return () => {
      if (draftSaveTimeoutRef.current) {
        window.clearTimeout(draftSaveTimeoutRef.current)
      }
    }
  }, [answersByPhase, currentPhase, id, queryClient, session])

  const clearDraft = async () => {
    setAnswersByPhase(prev => ({ ...prev, [currentPhase]: {} }))
    if (draftKey) localStorage.removeItem(draftKey)

    if (!id) return

    const nextDrafts = { ...remoteDraftsRef.current }
    delete nextDrafts[currentPhase]

    try {
      await api.saveDrafts(id, nextDrafts)
      remoteDraftsRef.current = nextDrafts
      queryClient.setQueryData(['session', id], (prev: any) => prev ? { ...prev, drafts: nextDrafts } : prev)
    } catch (err) {
      console.error('Failed to clear remote draft', err)
    }
  }

  const checkinMutation = useMutation({
    mutationFn: (data: { phase: string; answers: any; feedback?: string; next_task?: string }) => api.saveCheckin(id!, data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['session', id] })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      await clearDraft()
      setDrillCompleted(true)
    },
    onError: () => {}
  })

  const abortMutation = useMutation({
    mutationFn: (data: { reason: string; note?: string }) => api.abortSession(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', id] })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    }
  })

  const updatePhaseMutation = useMutation({
    mutationFn: (phaseData: { phase?: string, state?: string }) => api.updateSessionPhase(id!, phaseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', id] })
    }
  })

  // Microfeedback-Guard: Nur für P1/P2/P3, wenn session.microfeedback[phase].done !== true
  function needsMicrofeedback(phase: string, sessionObj: any, drill: any): boolean {
    if (!['P1', 'P2', 'P3'].includes(phase)) return false
    if (!drill) return false
    if (sessionObj?.microfeedback?.[phase]?.done === true) return false
    return true
  }

  useEffect(() => {
    if (drillCompleted) {
      setDrillCompleted(false)
    }
  }, [currentPhase])

  const handleDrillComplete = (answers: any) => {
    checkinMutation.mutate({
      phase: currentPhase,
      answers
    }, {
      onSuccess: async () => {
        queryClient.invalidateQueries({ queryKey: ['session', id] })
        queryClient.invalidateQueries({ queryKey: ['sessions'] })
        await clearDraft()
        setDrillCompleted(true)
        if (currentPhase === 'POST') {
          try {
            const completedSession = await api.completeSession(id!, {
              summary: '',
              unclear: '',
              next_module: '',
              helpfulness: 0
            })
            try {
              await queryClient.invalidateQueries({ queryKey: ['session', id] })
              await queryClient.invalidateQueries({ queryKey: ['sessions'] })

              const freshSessions = await queryClient.fetchQuery({
                queryKey: ['sessions', user],
                queryFn: () => api.getSessions(user || undefined)
              })

              const rewardResult = evaluateSessionRewards({
                currentSession: completedSession,
                sessions: freshSessions,
                rewardState,
                context: {
                  completedAt: completedSession.post?.completed_at || new Date().toISOString(),
                  deviceType: detectDeviceType(),
                  noteText: sessionNote,
                  performance: null,
                }
              })

              await grantRewardResult(rewardResult)
            } catch (rewardError) {
              console.error('Reward evaluation failed', rewardError)
            }
          } catch (e) {}
          // Keep user on the completed session page so reward popups are visible
          // even when a host environment injects a full-page navigate handler.
        }
      }
    })
  }

  const nextPhaseMap: Record<Phase, Phase | null> = {
    PRE: 'P1',
    P1: 'P2',
    P2: 'P3',
    P3: 'POST',
    POST: null
  }

  function validateDrillBeforeAdvance(phase: Phase, drill: any, answers: any): string | null {
    if (!['P1', 'P2', 'P3'].includes(phase)) return null
    if (!drill) return null

    if (drill.drill_type === 'clickable_rink_observation') {
      const observationsKey = drill?.config?.observations_key || 'observations'
      const requiredObservations = Number(drill?.config?.observation_count || 3)
      const reflectionKey = drill?.config?.completion_reflection?.key || 'final_reflection'
      const observations = Array.isArray(answers?.[observationsKey]) ? answers[observationsKey] : []

      if (observations.length < requiredObservations) {
        return 'Bitte erfasse alle ' + requiredObservations + ' Beobachtungen, bevor du weitergehst.'
      }

      if (!answers?.[reflectionKey]) {
        return 'Bitte beantworte kurz die Abschluss-Reflexion, bevor du weitergehst.'
      }
    }

    if (drill.drill_type === 'observation_log_drill') {
      const logsKey = drill?.config?.logs_key || 'logs'
      const requiredLogs = Number(drill?.config?.log_count || 3)
      const logs = Array.isArray(answers?.[logsKey]) ? answers[logsKey] : []

      if (logs.length < requiredLogs) {
        return 'Bitte erfasse alle ' + requiredLogs + ' Beobachtungen, bevor du weitergehst.'
      }
    }

    if (drill.id === 'B2_D1' || drill.id === 'B2_D2' || drill.drill_type === 'pressure_diagnosis' || drill?.config?.mode === 'pressure_diagnosis' || drill?.config?.mode === 'solution_type_diagnosis' || drill?.config?.mode === 'decision_cause_diagnosis' || drill?.config?.mode === 'transition_followup_assessment') {
      const sampleKey = drill?.config?.sample_key || 'pressure_samples'
      const requiredSamples = Number(drill?.config?.required_samples || drill?.config?.max_samples_per_phase || 3)
      const checkinKey = drill?.config?.checkin?.key || 'dominant_source'
      const requiresCheckin = drill?.config?.enable_checkin !== false && drill?.config?.mode !== 'decision_cause_diagnosis' && drill?.config?.mode !== 'transition_followup_assessment'
      const samples = Array.isArray(answers?.[sampleKey]) ? answers[sampleKey] : []
      const sampleFields = Array.isArray(drill?.config?.sample_fields) && drill.config.sample_fields.length > 0
        ? drill.config.sample_fields
        : [
            { key: 'zeitdruck' },
            { key: 'raumdruck' },
            { key: 'gegnerdruck' },
            { key: 'optionsdruck' }
          ]
      const sampleLabel = drill?.config?.sample_label || 'Situation'

      if (samples.length < requiredSamples) {
        return 'Bitte erfasse mindestens ' + requiredSamples + ' ' + sampleLabel + 'en, bevor du weitergehst.'
      }

      const hasAllFields = samples.every((sample: any) => sampleFields.every((field: any) => sample?.[field.key]))
      if (!hasAllFields) {
        return 'Bitte vervollständige jede gespeicherte Situation.'
      }

      if (requiresCheckin && !answers?.[checkinKey]) {
        return 'Bitte waehle die haeufigste Option aus, bevor du weitergehst.'
      }
    }

    return null
  }

  // Save + Advance-Flow
  const handleAdvanceToNext = async (e?: React.SyntheticEvent) => {
    e?.preventDefault?.()
    setAdvanceError('')

    const clickId = crypto.randomUUID().slice(0, 8)
    console.group(`[ADVANCE ${clickId}] CLICK`)
    console.log("phase_before:", currentPhase)
    console.log("isAdvancing_before:", isAdvancing)
    console.log("lock_before:", advanceLockRef.current)

    if (advanceLockRef.current) {
      console.warn(`[ADVANCE ${clickId}] ABORT: lock active`)
      console.groupEnd()
      return
    }

    advanceLockRef.current = true
    setIsAdvancing(true)
    console.log(`[ADVANCE ${clickId}] LOCK SET`)

    try {
      const phase = currentPhase
      const next = nextPhaseMap[phase]

      const validationError = validateDrillBeforeAdvance(phase, activeDrill, answersByPhase[currentPhase])
      if (validationError) {
        setAdvanceError(validationError)
        return
      }

      // 1) Checkin speichern
      await api.saveCheckin(id as string, {
        phase,
        answers: answersByPhase[currentPhase],
        _trace: clickId
      })

      // 2) Session frisch holen
      const sessionFresh = await queryClient.fetchQuery({ queryKey: ["session", id] })
      const sessionObj = sessionFresh as any
      const drill = sessionObj?.drills?.[0]

      // 3) Microfeedback-Guard
      if (needsMicrofeedback(phase, sessionObj, drill)) {
        // FIX: microPhase ist die Phase, für die Feedback abgegeben wird
        setMicroPhase(phase)
        // nextPhase ist wohin wir danach wechseln
        setPendingNextPhase(next)
        setShowMicroModal(true)

        setIsAdvancing(false)
        advanceLockRef.current = false

        console.log(`[ADVANCE ${clickId}] MICROFEEDBACK MODAL for`, phase, "-> next:", next)
        console.groupEnd()
        return
      }

      // 4) Phase updaten (ohne Modal)
      if (next) {
        await api.updateSessionPhase(id as string, { phase: next })
        setCurrentPhase(next)
        setDrillCompleted(false)

        if (sessionObj?.drafts && sessionObj.drafts[next]) {
          setAnswersByPhase(prev => ({ ...prev, [next]: sessionObj.drafts?.[next] || {} }))
        } else {
          const existingCheckin = sessionObj?.checkins?.find((c: any) => c.phase === next) as CheckinWithMicro | undefined
          setAnswersByPhase(prev => ({ ...prev, [next]: existingCheckin?.answers || {} }))
        }

        await queryClient.invalidateQueries({ queryKey: ["session", id] })
      }
    } catch (err) {
      console.error(`[ADVANCE ${clickId}] ERROR`, err)
    } finally {
      setIsAdvancing(false)
      advanceLockRef.current = false
      console.log(`[ADVANCE ${clickId}] DONE`)
      console.groupEnd()
    }
  }

  const handleGoBack = () => {
    // Auto-save current answers if any
    if (answersByPhase[currentPhase] && Object.keys(answersByPhase[currentPhase]).length > 0) {
      checkinMutation.mutate({
        phase: currentPhase,
        answers: answersByPhase[currentPhase]
      })
      console.log("SAVE CHECKIN PAYLOAD", {
        phase: currentPhase,
        answers: answersByPhase[currentPhase]
      })
    }

    const prevPhase = Object.keys(nextPhaseMap).find(phase => nextPhaseMap[phase as Phase] === currentPhase)
    if (prevPhase && prevPhase !== 'PRE') {
      setCurrentPhase(prevPhase as Phase)
      setDrillCompleted(false)
      updatePhaseMutation.mutate({ phase: prevPhase })

      // Antworten für vorherige Phase laden (Draft oder Checkin)
      if (session?.drafts && session.drafts[prevPhase]) {
        setAnswersByPhase(prev => ({ ...prev, [prevPhase]: session.drafts?.[prevPhase] || {} }))
      } else {
        const existingCheckin = session?.checkins?.find((c: any) => c.phase === prevPhase)
        setAnswersByPhase(prev => ({ ...prev, [prevPhase]: existingCheckin?.answers || {} }))
      }
    }
  }

  const handleSessionAbort = () => {
    const reason = prompt("Warum möchtest du die Session abbrechen?\n- time: Zeit knapp\n- wrong_game: Falsches Spiel\n- no_motivation: Keine Motivation\n- bad_session: Session war schlecht\n- other: Anderer Grund")
    if (reason) {
      const note = prompt("Optionale Notiz:")
      abortMutation.mutate({
        reason,
        note: note || undefined
      })
    }
  }

  const isCompleted = session?.state === 'COMPLETED'

  const getPhaseTitle = (phase: string) => {
    if (phase === 'PRE') return 'Vor dem Spiel'
    if (phase === 'P1') return '1. Drittel'
    if (phase === 'P2') return '2. Drittel'
    if (phase === 'P3') return '3. Drittel'
    if (phase === 'POST') return 'Nach dem Spiel'
    return phase
  }

  function handleDraftChange(answers: any): void {
    setAnswersByPhase(prev => ({ ...prev, [currentPhase]: answers }))
    if (draftKey) {
      localStorage.setItem(draftKey, JSON.stringify(answers))
    }
  }

  if (isLoading) return <div className="card">Lade Session...</div>
  if (error) return <div className="card">Fehler beim Laden: {(error as Error).message}</div>
  if (!session) return <div className="card">Session nicht gefunden.</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h1>Live Session: {session.module_id}</h1>

      <div className="card">
        <h2>Spiel-Info</h2>
        {session.game_info ? (
          <>
            <p><strong>Teams:</strong> {session.game_info.team_home} vs {session.game_info.team_away}</p>
            <p><strong>Datum:</strong> {session.game_info.date}</p>
            <p><strong>Liga:</strong> {session.game_info.league.replace(/_/g, ' ')}</p>
            {session.game_info.season && <p><strong>Saison:</strong> {session.game_info.season}</p>}
            {(session.game_info.competition_phase || session.game_info.matchday) && (
              <p><strong>Wettbewerb:</strong> {formatCompetitionContext(session.game_info) || session.game_info.matchday}</p>
            )}
            <p><strong>Beobachtungsumfang:</strong> {getObservationScopeLabel(session.observation_scope)}</p>
          </>
        ) : (
          <>
            <p>Keine Spiel-Info verfügbar</p>
            <p><strong>Ziel:</strong> {session.goal}</p>
            <p><strong>Status:</strong> {session.state}</p>
            <p><strong>Beobachtungsumfang:</strong> {getObservationScopeLabel(session.observation_scope)}</p>
          </>
        )}

        {/* Notizfeld */}
        <div style={{ marginTop: '1rem' }}>
          <label htmlFor="session-note" style={{ fontWeight: 500 }}>Notiz zur Session:</label>
          <textarea
            id="session-note"
            value={sessionNote}
            onChange={e => {
              setSessionNote(e.target.value)
              const noteKey = id ? `academy.session.${id}.note` : null
              if (noteKey) localStorage.setItem(noteKey, e.target.value)
            }}
            rows={2}
            style={{ width: '100%', minHeight: 48, maxHeight: 80, marginTop: 4, borderRadius: 4, padding: 6, resize: 'vertical', fontSize: '1rem', lineHeight: 1.4 }}
            placeholder="Hier kannst du eine Notiz für die gesamte Session festhalten..."
          />
        </div>
      </div>

      {!isCompleted && (
        <div className="card">
          {currentPhase === 'POST' && (
            <div>
              <button onClick={() => handleDrillComplete(answersByPhase[currentPhase])} className="btn btn-success" style={{ minWidth: 120 }}>
                Drill abschließen
              </button>
            </div>
          )}

          {(currentPhase === 'P1' || currentPhase === 'P2' || currentPhase === 'P3') && (
            <div>
              <p>Analysiere das letzte Drittel und gib Feedback.</p>
              {advanceError && (
                <div style={{ marginBottom: '0.8rem', padding: '0.6rem 0.8rem', background: 'rgba(220,53,69,0.12)', border: '1px solid rgba(220,53,69,0.4)', borderRadius: '0.45rem', color: '#ffb7bf', fontSize: '0.9rem' }}>
                  {advanceError}
                </div>
              )}
              {activeDrill ? (
                <DrillRendererRouter
                  drill={activeDrill}
                  answers={answersByPhase[currentPhase]}
                  setAnswers={(newAnswers) => setAnswersByPhase(prev => ({ ...prev, [currentPhase]: newAnswers }))}
                  initialAnswers={answersByPhase[currentPhase]}
                  onChangeAnswers={handleDraftChange}
                  session={session}
                />
              ) : (
                <p>Keine Drills für diese Session verfügbar.</p>
              )}

              {/* RingAbout Szenenmarker */}
              <div style={{ margin: '1.2rem 0 0.6rem', display: 'flex', justifyContent: 'center' }}>
                <SceneMarkerButton
                  session={session}
                  currentPhase={currentPhase}
                  activeDrill={activeDrill}
                />
              </div>

              <div style={{ marginTop: '1.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.7rem' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 500, color: '#888', textAlign: 'center' }}>{getPhaseTitle(currentPhase)}</div>
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: '1.5rem' }}>
                  {currentPhase !== 'P1' && Object.keys(nextPhaseMap).find(phase => nextPhaseMap[phase as Phase] === currentPhase) && (
                    <button onClick={handleGoBack} className="btn" style={{ backgroundColor: '#6c757d', borderColor: '#6c757d', minWidth: 120 }}>
                      ← Zurück
                    </button>
                  )}
                  {nextPhaseMap[currentPhase] && (
                    <button onClick={handleAdvanceToNext} className="btn" style={{ minWidth: 120 }} disabled={isAdvancing}>
                      {isAdvancing ? "Speichere…" : "Weiter →"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!isCompleted && session.state !== 'ABORTED' && (
        <div className="card">
          <button onClick={handleSessionAbort} className="btn" style={{ backgroundColor: '#dc3545', borderColor: '#dc3545' }} disabled={abortMutation.isPending}>
            {abortMutation.isPending ? 'Breche ab...' : 'Session abbrechen'}
          </button>
        </div>
      )}

      {session.checkins && session.checkins.length > 0 && (
        <div className="card">
          <details>
            <summary style={{ cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              Check-in Historie (klicken zum Ausklappen)
            </summary>
            {session.checkins.map((checkin: any, i: number) => (
              <div key={i} style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '5px' }}>
                <h4>{getPhaseTitle(checkin.phase)} - {new Date(checkin.timestamp).toLocaleString()}</h4>
                <pre style={{ fontSize: '0.8rem' }}>{JSON.stringify(checkin.answers, null, 2)}</pre>
                {checkin.feedback && <p><strong>Feedback:</strong> {checkin.feedback}</p>}
                {checkin.next_task && <p><strong>Next Task:</strong> {checkin.next_task}</p>}
              </div>
            ))}
          </details>
        </div>
      )}

      {isCompleted && (
        <div className="card">
          <h2>Session abgeschlossen! 🎉</h2>
          <p>Alle Phasen wurden erfolgreich absolviert.</p>
          <a href="/dashboard" className="btn">Zurück zum Dashboard</a>
        </div>
      )}

      {session.state === 'ABORTED' && (
        <div className="card">
          <h2>Session abgebrochen</h2>
          <p><strong>Grund:</strong> {session.abort?.reason}</p>
          {session.abort?.note && <p><strong>Notiz:</strong> {session.abort.note}</p>}
          <p><strong>Abgebrochen am:</strong> {session.abort?.aborted_at ? new Date(session.abort.aborted_at).toLocaleString() : 'Unbekannt'}</p>
          <a href="/dashboard" className="btn">Zurück zum Dashboard</a>
        </div>
      )}

      {/* Microfeedback Modal */}
      {showMicroModal && (() => {
        const drill = activeDrill
        let question = 'Bitte gib ein kurzes Feedback.'
        let contextSummary: string | null = null
        if (drill && (drill as any).miniFeedback && Array.isArray((drill as any).miniFeedback.groups) && (drill as any).miniFeedback.groups.length > 0) {
          const answers = answersByPhase[currentPhase] || {}
          const sampleKey = (drill as any)?.config?.sample_key
          const samples = sampleKey && Array.isArray((answers as any)[sampleKey])
            ? (answers as any)[sampleKey]
            : (Array.isArray((answers as any).support_samples) ? (answers as any).support_samples : [])
          const selectedIdx = Number.isInteger((answers as any).selected_sample_index)
            ? (answers as any).selected_sample_index
            : (samples.length > 0 ? samples.length - 1 : -1)
          const selectedSample = selectedIdx >= 0 && selectedIdx < samples.length ? samples[selectedIdx] : null

          const resolveWhenValue = (key: string): any => {
            if (key.startsWith('sample.') && selectedSample) {
              return selectedSample[key.slice('sample.'.length)]
            }
            if ((answers as any)[key] !== undefined) {
              return (answers as any)[key]
            }
            if (selectedSample && (selectedSample as any)[key] !== undefined) {
              return (selectedSample as any)[key]
            }
            return undefined
          }

          let found = false
          for (const group of (drill as any).miniFeedback.groups) {
            let match = true
            for (const key in group.when) {
              if (resolveWhenValue(key) !== group.when[key]) {
                match = false
                break
              }
            }
            if (match && group.questions && group.questions.length > 0) {
              contextSummary = group.context_summary || null
              question = group.questions[0]
              found = true
              break
            }
          }
          if (!found) {
            const firstGroup = (drill as any).miniFeedback.groups[0]
            if (firstGroup && firstGroup.questions && firstGroup.questions.length > 0) {
              contextSummary = firstGroup.context_summary || null
              question = firstGroup.questions[0]
            }
          }
        }

        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card" style={{ maxWidth: 500, width: '95%', margin: '0 auto' }}>
              <h3>💡 Microfeedback</h3>
              {contextSummary && (
                <div style={{ marginBottom: '0.75rem', padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.06)', borderRadius: '0.4rem', fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
                  <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', marginBottom: '0.3rem' }}>Ausgewählter Moment</span>
                  {contextSummary}
                </div>
              )}
              <div style={{ marginBottom: '1.2rem', fontWeight: 500, textAlign: 'center', color: '#b6e2f7' }}>{question}</div>

              <textarea
                value={microText}
                onChange={e => setMicroText(e.target.value)}
                placeholder="z. B. 'Ich habe zu spät auf die Hüfte geachtet und war oft beim Puck.'"
                rows={3}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc', marginBottom: 8 }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  className="btn"
                  style={{ background: '#6c757d' }}
                  onClick={() => {
                    setShowMicroModal(false)
                    setMicroPhase(null)
                    setPendingNextPhase(null)
                    setMicroText('')
                    setMicroFeedbackError('')
                  }}
                >
                  Abbrechen
                </button>

                <button
                  className="btn"
                  disabled={!microText.trim()}
                  onClick={async () => {
                    if (!microText.trim()) return
                    if (!microPhase) return

                    try {
                      // 1) Microfeedback für DIE Phase speichern, in der du gerade warst (P1/P2/P3)
                      await api.addMicrofeedback(id!, microPhase as 'P1' | 'P2' | 'P3', microText.trim())

                      // 2) UI schließen
                      setShowMicroModal(false)
                      setMicroText('')
                      setMicroFeedbackError('')

                      // 3) Jetzt Phase wechseln
                      const next = pendingNextPhase
                      setMicroPhase(null)
                      setPendingNextPhase(null)

                      if (next) {
                        await api.updateSessionPhase(id as string, { phase: next })
                        setCurrentPhase(next)
                        setDrillCompleted(false)

                        // answers für next laden (draft oder checkin), aber nix resetten
                        const sessionFresh = await queryClient.fetchQuery({ queryKey: ["session", id] })
                        const sessionObj = sessionFresh as any

                        if (sessionObj?.drafts && sessionObj.drafts[next]) {
                          setAnswersByPhase(prev => ({ ...prev, [next]: sessionObj.drafts[next] || {} }))
                        } else {
                          const existingCheckin = sessionObj?.checkins?.find((c: any) => c.phase === next)
                          setAnswersByPhase(prev => ({ ...prev, [next]: existingCheckin?.answers || {} }))
                        }
                      }

                      await queryClient.invalidateQueries({ queryKey: ['session', id] })
                    } catch (err: any) {
                      setMicroFeedbackError(err?.message || 'Speichern fehlgeschlagen')
                    }
                  }}
                >
                  Speichern & Weiter
                </button>
              </div>

              {microFeedbackError && <div style={{ color: 'red', marginTop: '1rem' }}>{microFeedbackError}</div>}
            </div>
          </div>
        )
      })()}
    </div>
  )
}