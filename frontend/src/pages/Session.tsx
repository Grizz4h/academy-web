import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'

// Patch: Extend Checkin type to allow microfeedback_done (for type safety)
type CheckinWithMicro = {
  phase: string;
  answers: any;
  feedback?: string;
  next_task?: string;
  microfeedback_done?: boolean;
  [key: string]: any;
};
import DrillRendererV1 from '../renderers/v1/DrillRenderer'
import DrillRendererV2 from '../renderers/v2/DrillRenderer'
import { useState, useEffect } from 'react'


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
  const [answerDraft, setAnswerDraft] = useState<any>({})
  const [showMicroModal, setShowMicroModal] = useState(false);
  const [pendingPhaseAdvance, setPendingPhaseAdvance] = useState<string|null>(null);
  const [microText, setMicroText] = useState('');
  const [microFeedbackError, setMicroFeedbackError] = useState<string>('');
  // const [shownFeedbackPhases, setShownFeedbackPhases] = useState<Set<string>>(new Set())
  // Feedback wird pro Session, Drill UND Phase angezeigt
  // Micro-Feedback done pro Phase (persistiert in session.checkins)
  const draftKey = id ? `academy.session.${id}.phase.${currentPhase}` : null

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['session', id],
    queryFn: () => api.getSession(id!)
  })

  // Renderer switch based on moduleId (A1 = v1, else v2)
  const moduleId = session?.module_id;


  // Session Continuation: Phase und Drafts laden
  // Session-Phase und Drafts laden, ohne Hook-Order zu brechen
  useEffect(() => {
    if (!session) return;
    // Setze aktuelle Phase aus Session-Daten, aber nur wenn sie sich unterscheidet
    if (session.current_phase && session.current_phase !== currentPhase) {
      setCurrentPhase(session.current_phase as Phase);
      return; // Drafts werden im nächsten Render geladen
    }
    // Lade Drafts aus Session-Daten statt localStorage
    if (session.drafts && session.drafts[currentPhase]) {
      setAnswerDraft(session.drafts[currentPhase]);
    } else {
      setAnswerDraft({});
    }
    // Lade Notiz aus localStorage (optional: später aus session.note)
    const noteKey = id ? `academy.session.${id}.note` : null;
    if (noteKey) {
      const savedNote = localStorage.getItem(noteKey);
      if (savedNote !== null) setSessionNote(savedNote);
    }
  }, [session, currentPhase, id]);

  // Draft laden beim Phasenwechsel (Fallback für alte Sessions)
  useEffect(() => {
    if (!session) return;
    // Lade Drafts aus Session-Daten, falls vorhanden
    if (session.drafts && session.drafts[currentPhase]) {
      setAnswerDraft(session.drafts[currentPhase]);
    } else {
      // Fallback: localStorage
      if (draftKey) {
        const saved = localStorage.getItem(draftKey);
        if (saved) {
          setAnswerDraft(JSON.parse(saved));
        } else {
          setAnswerDraft({});
        }
      }
    }
  }, [session, currentPhase, draftKey]);

  // Draft speichern bei Änderungen
  useEffect(() => {
    if (draftKey) {
      localStorage.setItem(draftKey, JSON.stringify(answerDraft));
    }
  }, [answerDraft, draftKey]);

  const clearDraft = () => {
    setAnswerDraft({})
    if (draftKey) localStorage.removeItem(draftKey)
  }

  const checkinMutation = useMutation({
    mutationFn: (data: { phase: string; answers: any; feedback?: string; next_task?: string; mini_feedback?: string }) => api.saveCheckin(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', id] })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      clearDraft()
      setDrillCompleted(true)
    },
    onMutate: () => {
    },
    onError: () => {
    }
  })


  const abortMutation = useMutation({
    mutationFn: (data: { reason: string; note?: string }) => api.abortSession(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', id] })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    }
  })

  const updatePhaseMutation = useMutation({
    mutationFn: (phaseData: {phase?: string, state?: string}) => api.updateSessionPhase(id!, phaseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', id] })
    }
  })

  // Mini-Feedback für alle A1-Drills (A1_D1 bis A1_D4)

  useEffect(() => {
    if (drillCompleted) {
      setDrillCompleted(false)
    }
  }, [currentPhase])


  const handleDrillComplete = (answers: any) => {
    let feedback = "Gut gemacht!"
    let nextTask = "Bereite nächste Phase vor"

    if (currentPhase !== 'PRE' && answers.triangle_rating && answers.triangle_rating <= 3) {
      feedback = "Dreieck-Qualität niedrig - fokussiere auf Forwards-Abdeckung."
      nextTask = "Achte auf Pass-Optionen im nächsten Drittel."
    }
    if (currentPhase !== 'PRE' && answers.breakout_quality === 'chaotic') {
      feedback = "Breakout chaotisch - verbessere Puck-Bewegung."
      nextTask = "Center sollte high stehen für Anspielstation."
    }

    checkinMutation.mutate({
      phase: currentPhase,
      answers,
      feedback,
      next_task: nextTask
    }, {
      onSuccess: async () => {
        queryClient.invalidateQueries({ queryKey: ['session', id] })
        queryClient.invalidateQueries({ queryKey: ['sessions'] })
        clearDraft()
        setDrillCompleted(true)
        if (currentPhase === 'POST') {
          // Call backend to mark session as completed
          try {
            await api.completeSession(id!, {
              summary: '',
              unclear: '',
              next_module: '',
              helpfulness: 0
            });
          } catch (e) {}
          navigate('/curriculum')
        }
      }
    })
  }


  const nextPhaseMap: Record<string, string | null> = {
    PRE: 'P1',
    P1: 'P2',
    P2: 'P3',
    P3: 'POST',
    POST: null
  }




  // Option A: Save + Advance-Flow für V1 und V2
  const handleAdvanceToNext = async () => {
    // 0) Validation: Drill muss komplett sein (implementiere isDrillComplete nach Bedarf)
    // if (!isDrillComplete(session?.drills?.[0], answerDraft)) return;

    if (!id) return; // id muss vorhanden sein
    setIsAdvancing(true);
    try {
      const phase = currentPhase;
      const next = nextPhaseMap[phase];

      // 1) Persist answers (Checkin)
      await api.saveCheckin(id as string, {
        phase,
        answers: answerDraft,
        feedback: "Weiter zur nächsten Phase",
        next_task: "Nächste Phase vorbereiten"
      });

      // 2) refetch / invalidate session so checkins aktuell sind
      await queryClient.invalidateQueries({ queryKey: ["session", id] });

      // 3) Microfeedback-Guard (falls P1-P3) -> nur wenn miniFeedback im Drill vorhanden ist UND noch nicht erledigt
      const sessionFresh = await queryClient.fetchQuery({ queryKey: ["session", id] });
      // Typisierung für sessionFresh
      const sessionObj = sessionFresh as typeof session;
      const checkin = sessionObj?.checkins?.find((c: any) => c.phase === phase) as CheckinWithMicro | undefined;
      const drill = sessionObj?.drills?.[0];
      const hasMiniFeedback = drill && typeof drill.miniFeedback === 'object' && drill.miniFeedback !== null;
      const needsMicro = hasMiniFeedback && (["P1", "P2", "P3"].includes(phase)) && !(checkin && checkin.microfeedback_done);
      if (needsMicro) {
        setPendingPhaseAdvance(next || null);
        setShowMicroModal(true);
        setIsAdvancing(false); // Button sofort wieder aktivieren
        return;
      }

      // 4) Phasewechsel
      if (next) {
        await api.updateSessionPhase(id as string, { phase: next });
        setCurrentPhase(next as Phase);
        setDrillCompleted(false);
        if (sessionObj?.drafts && sessionObj.drafts[next]) {
          setAnswerDraft(sessionObj.drafts[next]);
        } else {
          const existingCheckin = sessionObj?.checkins?.find((c: any) => c.phase === next) as CheckinWithMicro | undefined;
          setAnswerDraft(existingCheckin?.answers || {});
        }
      }
    } finally {
      setIsAdvancing(false);
    }
  }

  const handleGoBack = () => {
    // Auto-save current answers if any
    if (answerDraft && Object.keys(answerDraft).length > 0) {
      checkinMutation.mutate({
        phase: currentPhase,
        answers: answerDraft,
        feedback: "Automatisch gespeichert",
        next_task: "Zurück zur vorherigen Phase"
        // mini_feedback NICHT mitsenden!
      });
      console.log("SAVE CHECKIN PAYLOAD", {
        phase: currentPhase,
        answers: answerDraft,
        feedback: "Automatisch gespeichert",
        next_task: "Zurück zur vorherigen Phase"
      });
    }
    const prevPhase = Object.keys(nextPhaseMap).find(phase => nextPhaseMap[phase] === currentPhase)
    if (prevPhase) {
      setCurrentPhase(prevPhase as Phase);
      setDrillCompleted(false);
      updatePhaseMutation.mutate({ phase: prevPhase });
      // Antworten für die vorherige Phase laden (Draft oder Checkin)
      if (session?.drafts && session.drafts[prevPhase]) {
        setAnswerDraft(session.drafts[prevPhase]);
      } else {
        const existingCheckin = session?.checkins?.find((c: any) => c.phase === prevPhase);
        setAnswerDraft(existingCheckin?.answers || {});
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
    setAnswerDraft(answers);
    if (draftKey) {
      localStorage.setItem(draftKey, JSON.stringify(answers));
    }
    // Optional: Draft auch im Backend speichern
    // api.saveDraft(id!, { [currentPhase]: answers });
  }
  // Lade-/Fehler-Return nach allen Hooks
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
        {/* Notizfeld für die Session */}
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
          {/* Keine große Überschrift mehr, Phase nur noch unten anzeigen */}

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
                  // onComplete entfernt, Steuerung zentral
                  initialAnswers={answerDraft}
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
                  answers={answerDraft}
                  setAnswers={setAnswerDraft}
                />
              )}
              {/* Phase und Navigation Buttons */}
              <div style={{ marginTop: '1.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.7rem' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 500, color: '#888', textAlign: 'center', letterSpacing: '0.01em', marginBottom: '0.1em' }}>{getPhaseTitle(currentPhase)}</div>
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: '1.5rem' }}>
                  {Object.keys(nextPhaseMap).find(phase => nextPhaseMap[phase] === currentPhase) && (
                    <button
                      onClick={handleGoBack}
                      className="btn"
                      style={{ backgroundColor: '#6c757d', borderColor: '#6c757d', minWidth: 120 }}
                    >
                      ← Zurück
                    </button>
                  )}
                  {nextPhaseMap[currentPhase] && (
                    <button
                      onClick={isAdvancing ? undefined : handleAdvanceToNext}
                      className="btn"
                      style={{ minWidth: 120 }}
                      disabled={isAdvancing}
                    >
                      {isAdvancing ? "Bitte warten…" : "Weiter →"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentPhase === 'POST' && (
            <div>
              <button
                onClick={() => handleDrillComplete(answerDraft)}
                className="btn btn-success"
                style={{ minWidth: 120 }}
              >
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
                    // onComplete entfernt, Steuerung zentral
                    initialAnswers={answerDraft}
                    onChangeAnswers={handleDraftChange}
                  />
                ) : (
                  <DrillRendererV2
                    drill={session.drills[0]}
                    answers={answerDraft}
                    setAnswers={setAnswerDraft}
                  />
                )
              ) : (
                <p>Keine Drills für diese Session verfügbar.</p>
              )}

              {/* Phase und Navigation Buttons */}
              <div style={{ marginTop: '1.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.7rem' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 500, color: '#888', textAlign: 'center', letterSpacing: '0.01em', marginBottom: '0.1em' }}>{getPhaseTitle(currentPhase)}</div>
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: '1.5rem' }}>
                  {Object.keys(nextPhaseMap).find(phase => nextPhaseMap[phase] === currentPhase) && (
                    <button
                      onClick={handleGoBack}
                      className="btn"
                      style={{ backgroundColor: '#6c757d', borderColor: '#6c757d', minWidth: 120 }}
                    >
                      ← Zurück
                    </button>
                  )}
                  {nextPhaseMap[currentPhase] && (
                    <button
                      onClick={handleAdvanceToNext}
                      className="btn"
                      style={{ minWidth: 120 }}
                      disabled={(() => {
                        // Disable if microfeedback required and not filled
                        if (["P1", "P2", "P3"].includes(String(currentPhase))) {
                          return false;
                        }
                        return false;
                      })()}
                    >
                      Weiter →
                    </button>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>
      )}

      {/* Abbrechen-Button für laufende Sessions */}
      {!isCompleted && session.state !== 'ABORTED' && (
        <div className="card">
          <button
            onClick={handleSessionAbort}
            className="btn"
            style={{ backgroundColor: '#dc3545', borderColor: '#dc3545' }}
            disabled={abortMutation.isPending}
          >
            {abortMutation.isPending ? 'Breche ab...' : 'Session abbrechen'}
          </button>
        </div>
      )}

      {/* Check-ins anzeigen */}
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
        const drill = session?.drills?.[0];
        if (!drill || !drill.miniFeedback) return null;
        // Mini-Feedback selection based on answers and 'when' condition
        let question = 'Bitte gib ein kurzes Feedback.';
        if (Array.isArray(drill.miniFeedback.groups) && drill.miniFeedback.groups.length > 0) {
          // Find the group whose 'when' matches the current answers
          const answers = answerDraft || {};
          let found = false;
          for (const group of drill.miniFeedback.groups) {
            let match = true;
            for (const key in group.when) {
              if (answers[key] !== group.when[key]) {
                match = false;
                break;
              }
            }
            if (match && group.questions && group.questions.length > 0) {
              // Use the first question (or all, if you want to show all)
              question = group.questions[0];
              found = true;
              break;
            }
          }
          // Fallback: if no match, use first group's first question
          if (!found) {
            const firstGroup = drill.miniFeedback.groups[0];
            if (firstGroup && firstGroup.questions && firstGroup.questions.length > 0) {
              question = firstGroup.questions[0];
            }
          }
        }
        // Sets the error message for micro feedback modal
        // setMicroFeedbackError is already defined via useState above.
        // You can remove this function, as setMicroFeedbackError is the state setter from useState.
        // Example usage: setMicroFeedbackError(true) or setMicroFeedbackError(false)
        // No implementation needed here.
        // setShowMicroModal is already defined via useState above.
        // You can remove this function, as setShowMicroModal is the state setter from useState.
        // Example usage: setShowMicroModal(true) or setShowMicroModal(false)
        // No implementation needed here.
        return (
          <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.7)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div className="card" style={{maxWidth:500,width:'95%',margin:'0 auto'}}>
              <h3>💡 Mini-Feedback</h3>
              <div style={{marginBottom:'1.2rem',fontWeight:500,textAlign:'center',color:'#b6e2f7'}}>{question}</div>
              <textarea
                value={microText}
                onChange={e => setMicroText(e.target.value)}
                placeholder="z. B. 'Ich habe zu spät auf die Hüfte geachtet und war oft beim Puck.'"
                rows={3}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc', marginBottom: 8 }}
              />
              <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
                <button className="btn" style={{background:'#6c757d'}} onClick={() => { setShowMicroModal(false); setPendingPhaseAdvance(null); setMicroText(''); setMicroFeedbackError(''); }}>Abbrechen</button>
                <button className="btn" disabled={!microText.trim()} onClick={async () => {
                  if (!microText.trim()) return;
                  try {
                    await api.saveMicroFeedback(id!, { phase: currentPhase, text: microText.trim() });
                    await queryClient.invalidateQueries({ queryKey: ['session', id] });
                    setShowMicroModal(false);
                    setMicroText('');
                    setMicroFeedbackError('');
                    // Advance to pending phase
                    if (pendingPhaseAdvance) {
                      setCurrentPhase(pendingPhaseAdvance as Phase);
                      setDrillCompleted(false);
                      updatePhaseMutation.mutate({ phase: pendingPhaseAdvance });
                      if (session?.drafts && session.drafts[pendingPhaseAdvance]) {
                        setAnswerDraft(session.drafts[pendingPhaseAdvance]);
                      } else {
                        const existingCheckin = session?.checkins?.find((c: any) => c.phase === pendingPhaseAdvance);
                        setAnswerDraft(existingCheckin?.answers || {});
                      }
                      setPendingPhaseAdvance(null);
                    }
                  } catch (err: any) {
                    setMicroFeedbackError(err?.message || 'Speichern fehlgeschlagen');
                  }
                }}>Speichern & Weiter</button>
              </div>
              {microFeedbackError && <div style={{ color: 'red', marginTop: '1rem' }}>{microFeedbackError}</div>}
            </div>
          </div>
        );
      })()}
    </div>
  )
}
