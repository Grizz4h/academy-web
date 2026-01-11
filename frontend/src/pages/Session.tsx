import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { api } from '../api'
import DrillRenderer from '../components/DrillRenderer'
import { useState, useEffect } from 'react'

export default function SessionPage() {
  // Notizfeld für Session-Info
  const [sessionNote, setSessionNote] = useState<string>('')
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [currentPhase, setCurrentPhase] = useState<string>('PRE')
  const [drillCompleted, setDrillCompleted] = useState(false)
  const [answerDraft, setAnswerDraft] = useState<any>({})
  const draftKey = id ? `academy.session.${id}.phase.${currentPhase}` : null

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['session', id],
    queryFn: () => api.getSession(id!)
  })

  // Session Continuation: Phase und Drafts laden
  useEffect(() => {
    if (session) {
      // Setze aktuelle Phase aus Session-Daten
      if (session.current_phase) {
        setCurrentPhase(session.current_phase)
      }
      // Lade Drafts aus Session-Daten statt localStorage
      if (session.drafts && session.drafts[currentPhase]) {
        setAnswerDraft(session.drafts[currentPhase])
      } else {
        setAnswerDraft({})
      }
      // Lade Notiz aus localStorage (optional: später aus session.note)
      const noteKey = id ? `academy.session.${id}.note` : null
      if (noteKey) {
        const savedNote = localStorage.getItem(noteKey)
        if (savedNote !== null) setSessionNote(savedNote)
      }
    }
  }, [session, currentPhase, id])

  // Draft laden beim Phasenwechsel (Fallback für alte Sessions)
  useEffect(() => {
    if (!session || !session.drafts) {
      if (!draftKey) return
      const saved = localStorage.getItem(draftKey)
      if (!saved) {
        setAnswerDraft({})
        return
      }
      try {
        setAnswerDraft(JSON.parse(saved))
      } catch (e) {
        console.warn('Draft konnte nicht geladen werden', e)
        setAnswerDraft({})
      }
    }
  }, [draftKey, session])

  // Draft bei Eingaben speichern (persistent im Backend)
  const handleDraftChange = (next: any) => {
    setAnswerDraft(next)
    if (id) {
      // Speichere Drafts persistent im Backend
      const drafts = { ...session?.drafts, [currentPhase]: next }
      api.saveDrafts(id, drafts).catch(err => {
        console.warn('Failed to save drafts:', err)
        // Fallback: localStorage
        if (draftKey) localStorage.setItem(draftKey, JSON.stringify(next))
      })
    } else {
      // Fallback für alte Sessions
      if (draftKey) localStorage.setItem(draftKey, JSON.stringify(next))
    }
  }

  const clearDraft = () => {
    setAnswerDraft({})
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
    onMutate: () => {
    },
    onError: () => {
    }
  })

  const completeMutation = useMutation({
    mutationFn: (data: { summary: string; unclear?: string; next_module?: string; helpfulness: number }) => api.completeSession(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', id] })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
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

  useEffect(() => {
    if (drillCompleted) {
      setDrillCompleted(false)
    }
  }, [currentPhase])

  if (isLoading) return <div className="card">Lade Session...</div>
  if (error) return <div className="card">Fehler beim Laden: {(error as Error).message}</div>
  if (!session) return <div className="card">Session nicht gefunden.</div>

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
    })
  }

  const handleSessionComplete = () => {
    completeMutation.mutate({
      summary: "Live-Session erfolgreich abgeschlossen",
      helpfulness: 5
    })
  }

  const nextPhaseMap: Record<string, string | null> = {
    PRE: 'P1',
    P1: 'P2',
    P2: 'P3',
    P3: 'POST',
    POST: null
  }



  const handleAdvanceToNext = () => {
    // Always save current check-in before advancing
    checkinMutation.mutate({
      phase: currentPhase,
      answers: answerDraft,
      feedback: "Weiter zur nächsten Phase",
      next_task: "Nächste Phase vorbereiten"
    })
    const next = nextPhaseMap[currentPhase]
    if (next) {
      setCurrentPhase(next)
      setDrillCompleted(false)
      // Update phase in backend for continuation
      updatePhaseMutation.mutate({ phase: next })
      // Load existing answers for next phase
      const existingCheckin = session?.checkins?.find(c => c.phase === next)
      setAnswerDraft(existingCheckin?.answers || {})
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
      })
    }
    const prevPhase = Object.keys(nextPhaseMap).find(phase => nextPhaseMap[phase] === currentPhase)
    if (prevPhase) {
      setCurrentPhase(prevPhase)
      setDrillCompleted(false)
      // Update phase in backend for continuation
      updatePhaseMutation.mutate({ phase: prevPhase })
      // Load existing answers for previous phase
      const existingCheckin = session?.checkins?.find(c => c.phase === prevPhase)
      setAnswerDraft(existingCheckin?.answers || {})
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



  const isCompleted = session.state === 'COMPLETED'

  const getPhaseTitle = (phase: string) => {
    if (phase === 'PRE') return 'Vor dem Spiel'
    if (phase === 'P1') return '1. Drittel'
    if (phase === 'P2') return '2. Drittel'
    if (phase === 'P3') return '3. Drittel'
    if (phase === 'POST') return 'Nach dem Spiel'
    return phase
  }







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
          <p>Keine Spiel-Info verfügbar</p>
        )}
        <p><strong>Ziel:</strong> {session.goal}</p>
        <p><strong>Status:</strong> {session.state}</p>
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
          <h2>{getPhaseTitle(currentPhase)}</h2>
          <p>Phase: {currentPhase}</p>

          {currentPhase === 'PRE' && (
            <div>
              <p>Vorbereitung: Denke über die Erwartungen nach.</p>
              <DrillRenderer drill={{
                id: 'pre_checkin',
                title: 'Pre-Match Check-in',
                drill_type: 'period_checkin',
                config: {
                  questions: [
                    { key: 'expectations', type: 'text', label: 'Erwartungen für das Spiel', max_chars: 200 }
                  ]
                }
              }} 
              onComplete={handleDrillComplete}
              initialAnswers={answerDraft}
              onChangeAnswers={handleDraftChange}
              />
              {/* Navigation Buttons */}
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
                  Aktuelle Phase: {getPhaseTitle(currentPhase)}
                  {nextPhaseMap[currentPhase] && ` → Weiter zu: ${getPhaseTitle(nextPhaseMap[currentPhase]!)}`}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                  {Object.keys(nextPhaseMap).find(phase => nextPhaseMap[phase] === currentPhase) && (
                    <button
                      onClick={handleGoBack}
                      className="btn"
                      style={{ backgroundColor: '#6c757d', borderColor: '#6c757d' }}
                    >
                      ← Zurück
                    </button>
                  )}
                  {nextPhaseMap[currentPhase] && (
                    <button
                      onClick={handleAdvanceToNext}
                      className="btn"
                    >
                      Weiter →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {(currentPhase === 'P1' || currentPhase === 'P2' || currentPhase === 'P3') && (
            <div>
              <p>Analysiere das letzte Drittel und gib Feedback.</p>
              {session.drills && session.drills.length > 0 ? (
                <DrillRenderer 
                  drill={session.drills[0]} 
                  onComplete={handleDrillComplete}
                  initialAnswers={answerDraft}
                  onChangeAnswers={handleDraftChange}
                />
              ) : (
                <p>Keine Drills für diese Session verfügbar.</p>
              )}

              {/* Navigation Buttons */}
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
                  Aktuelle Phase: {getPhaseTitle(currentPhase)}
                  {Object.keys(nextPhaseMap).find(phase => nextPhaseMap[phase] === currentPhase) && ` ← Zurück zu: ${getPhaseTitle(Object.keys(nextPhaseMap).find(phase => nextPhaseMap[phase] === currentPhase)!)}`}
                  {nextPhaseMap[currentPhase] && ` → Weiter zu: ${getPhaseTitle(nextPhaseMap[currentPhase]!)}`}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                  {Object.keys(nextPhaseMap).find(phase => nextPhaseMap[phase] === currentPhase) && (
                    <button
                      onClick={handleGoBack}
                      className="btn"
                      style={{ backgroundColor: '#6c757d', borderColor: '#6c757d' }}
                    >
                      ← Zurück
                    </button>
                  )}
                  {nextPhaseMap[currentPhase] && (
                    <button
                      onClick={handleAdvanceToNext}
                      className="btn"
                    >
                      Weiter →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentPhase === 'POST' && (
            <div>
              <p>Spiel beendet - fasse zusammen.</p>
              {/* Navigation Buttons auch in POST-Phase */}
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
                  Aktuelle Phase: {getPhaseTitle(currentPhase)}
                  {Object.keys(nextPhaseMap).find(phase => nextPhaseMap[phase] === currentPhase) && ` ← Zurück zu: ${getPhaseTitle(Object.keys(nextPhaseMap).find(phase => nextPhaseMap[phase] === currentPhase)!)}`}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                  {Object.keys(nextPhaseMap).find(phase => nextPhaseMap[phase] === currentPhase) && (
                    <button
                      onClick={handleGoBack}
                      className="btn"
                      style={{ backgroundColor: '#6c757d', borderColor: '#6c757d' }}
                    >
                      ← Zurück
                    </button>
                  )}
                  <button onClick={handleSessionComplete} className="btn">Session abschließen</button>
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
            {session.checkins.map((checkin, i) => (
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
    </div>
  )
}