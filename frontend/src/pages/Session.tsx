import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { api } from '../api'
import DrillRenderer from '../components/DrillRenderer'
import { useState, useEffect } from 'react'

export default function SessionPage() {
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

  // Draft laden beim Phasenwechsel
  useEffect(() => {
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
  }, [draftKey])

  // Draft bei Eingaben speichern
  const handleDraftChange = (next: any) => {
    setAnswerDraft(next)
    if (draftKey) localStorage.setItem(draftKey, JSON.stringify(next))
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
      // Auto-advance to next phase
      if (currentPhase === 'PRE') setCurrentPhase('P1')
      else if (currentPhase === 'P1') setCurrentPhase('P2')
      else if (currentPhase === 'P2') setCurrentPhase('P3')
      else if (currentPhase === 'P3') setCurrentPhase('POST')
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

  const getPhaseTitle = (phase: string) => {
    if (phase === 'PRE') return 'Pre-Match Check-in'
    if (phase === 'P1') return 'Nach 1. Drittel'
    if (phase === 'P2') return 'Nach 2. Drittel'
    if (phase === 'P3') return 'Nach 3. Drittel'
    if (phase === 'POST') return 'Post-Match Review'
    return phase
  }

  const isCompleted = session.state === 'COMPLETED'

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
            </div>
          )}

          {currentPhase === 'POST' && (
            <div>
              <p>Spiel beendet - fasse zusammen.</p>
              <button onClick={handleSessionComplete} className="btn">Session abschließen</button>
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
          <h2>Check-in Historie</h2>
          {session.checkins.map((checkin, i) => (
            <div key={i} style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '5px' }}>
              <h4>{getPhaseTitle(checkin.phase)} - {new Date(checkin.timestamp).toLocaleString()}</h4>
              <pre style={{ fontSize: '0.8rem' }}>{JSON.stringify(checkin.answers, null, 2)}</pre>
              {checkin.feedback && <p><strong>Feedback:</strong> {checkin.feedback}</p>}
              {checkin.next_task && <p><strong>Next Task:</strong> {checkin.next_task}</p>}
            </div>
          ))}
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