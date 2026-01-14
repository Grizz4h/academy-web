import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'

import DrillRendererV1 from '../renderers/v1/DrillRenderer'
import DrillRendererV2 from '../renderers/v2/DrillRenderer'
import { useState, useEffect, useRef } from 'react'

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
  const navigate = (window as any).appNavigate || useNavigate();
  const queryClient = useQueryClient()

  type Phase = 'PRE' | 'P1' | 'P2' | 'P3' | 'POST';

  const [currentPhase, setCurrentPhase] = useState<Phase>('PRE')
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

  // FIX: getrennte States für "Feedback gehört zu welcher Phase" und "wohin danach wechseln"
  const [microPhase, setMicroPhase] = useState<Phase | null>(null)
  const [pendingNextPhase, setPendingNextPhase] = useState<Phase | null>(null)

  // Double-submit hard guard
  const advanceLockRef = useRef(false)

  // Draft key pro Session+Phase (localStorage fallback)
  const draftKey = id ? `academy.session.${id}.phase.${currentPhase}` : null

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['session', id],
    queryFn: () => api.getSession(id!)
  })

  // Renderer switch based on moduleId (A1 = v1, else v2)
  const moduleId = session?.module_id

  // Session Continuation: nur initial Phase aus Session übernehmen
  const firstLoadRef = useRef(true)

  useEffect(() => {
    if (!session) return;

    // initial currentPhase setzen (nur einmal)
    if (firstLoadRef.current && session.current_phase && session.current_phase !== currentPhase) {
      setCurrentPhase(session.current_phase as Phase)
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

  const clearDraft = () => {
    setAnswersByPhase(prev => ({ ...prev, [currentPhase]: {} }))
    if (draftKey) localStorage.removeItem(draftKey)
  }

  const checkinMutation = useMutation({
    mutationFn: (data: { phase: string; answers: any; feedback?: string; next_task?: string }) => api.saveCheckin(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', id] })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      clearDraft()
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
        clearDraft()
        setDrillCompleted(true)
        if (currentPhase === 'POST') {
          try {
            await api.completeSession(id!, {
              summary: '',
              unclear: '',
              next_module: '',
              helpfulness: 0
            })
          } catch (e) {}
          navigate('/curriculum')
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

  // Save + Advance-Flow
  const handleAdvanceToNext = async (e?: React.SyntheticEvent) => {
    e?.preventDefault?.()

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
    if (prevPhase) {
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
            <p><strong>Liga:</strong> {session.game_info.league}</p>
          </>
        ) : (
          <>
            <p>Keine Spiel-Info verfügbar</p>
            <p><strong>Ziel:</strong> {session.goal}</p>
            <p><strong>Status:</strong> {session.state}</p>
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
          {currentPhase === 'PRE' && (
            <div>
              <p>Vorbereitung: Denke über die Erwartungen nach.</p>
              {moduleId === 'A1' ? (
                <DrillRendererV1
                  drill={{
                    id: 'pre_checkin',
                    title: 'Pre-Match Check-in',
                    drill_type: 'period_checkin',
                    config: {
                      questions: [
                        { key: 'expectations', type: 'text', label: 'Erwartungen für das Spiel', max_chars: 200 }
                      ]
                    }
                  }}
                  initialAnswers={answersByPhase[currentPhase]}
                  onChangeAnswers={handleDraftChange}
                />
              ) : (
                <DrillRendererV2
                  drill={{
                    id: 'pre_checkin',
                    title: 'Pre-Match Check-in',
                    drill_type: 'period_checkin',
                    config: {
                      questions: [
                        { key: 'expectations', type: 'text', label: 'Erwartungen für das Spiel', max_chars: 200 }
                      ]
                    }
                  }}
                  answers={answersByPhase[currentPhase]}
                  setAnswers={(newAnswers) => setAnswersByPhase(prev => ({ ...prev, [currentPhase]: newAnswers }))}
                />
              )}

              <div style={{ marginTop: '1.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.7rem' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 500, color: '#888', textAlign: 'center' }}>{getPhaseTitle(currentPhase)}</div>
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: '1.5rem' }}>
                  {Object.keys(nextPhaseMap).find(phase => nextPhaseMap[phase as Phase] === currentPhase) && (
                    <button onClick={handleGoBack} className="btn" style={{ backgroundColor: '#6c757d', borderColor: '#6c757d', minWidth: 120 }}>
                      ← Zurück
                    </button>
                  )}
                  {nextPhaseMap[currentPhase] && (
                    <button
                      type="button"
                      onClick={(e) => {
                        console.log("[BUTTON] Weiter clicked", { disabled: isAdvancing, phase: currentPhase })
                        handleAdvanceToNext(e)
                      }}
                      className="btn"
                      style={{ minWidth: 120 }}
                      disabled={isAdvancing}
                    >
                      {isAdvancing ? "Speichere…" : "Weiter →"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

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
              {session.drills && session.drills.length > 0 ? (
                moduleId === 'A1' ? (
                  <DrillRendererV1
                    drill={session.drills[0]}
                    initialAnswers={answersByPhase[currentPhase]}
                    onChangeAnswers={handleDraftChange}
                  />
                ) : (
                  <DrillRendererV2
                    drill={session.drills[0]}
                    answers={answersByPhase[currentPhase]}
                    setAnswers={(newAnswers) => setAnswersByPhase(prev => ({ ...prev, [currentPhase]: newAnswers }))}
                  />
                )
              ) : (
                <p>Keine Drills für diese Session verfügbar.</p>
              )}

              <div style={{ marginTop: '1.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.7rem' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 500, color: '#888', textAlign: 'center' }}>{getPhaseTitle(currentPhase)}</div>
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: '1.5rem' }}>
                  {Object.keys(nextPhaseMap).find(phase => nextPhaseMap[phase as Phase] === currentPhase) && (
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
        const drill = session?.drills?.[0]
        let question = 'Bitte gib ein kurzes Feedback.'
        if (drill && (drill as any).miniFeedback && Array.isArray((drill as any).miniFeedback.groups) && (drill as any).miniFeedback.groups.length > 0) {
          const answers = answersByPhase[currentPhase] || {}
          let found = false
          for (const group of (drill as any).miniFeedback.groups) {
            let match = true
            for (const key in group.when) {
              if (answers[key] !== group.when[key]) {
                match = false
                break
              }
            }
            if (match && group.questions && group.questions.length > 0) {
              question = group.questions[0]
              found = true
              break
            }
          }
          if (!found) {
            const firstGroup = (drill as any).miniFeedback.groups[0]
            if (firstGroup && firstGroup.questions && firstGroup.questions.length > 0) {
              question = firstGroup.questions[0]
            }
          }
        }

        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card" style={{ maxWidth: 500, width: '95%', margin: '0 auto' }}>
              <h3>💡 Microfeedback</h3>
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