import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { api } from '../api'
import type { Session } from '../api'
import DrillRenderer from '../components/DrillRenderer'
import { useState, useEffect } from 'react'

export default function SessionPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [currentPhase, setCurrentPhase] = useState<string>('PRE')
  const [drillCompleted, setDrillCompleted] = useState(false)

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['session', id],
    queryFn: () => api.getSession(id!)
  })

  const checkinMutation = useMutation({
    mutationFn: (data: { phase: string; answers: any; feedback?: string; next_task?: string }) => api.saveCheckin(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', id] })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
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
        <p><strong>Teams:</strong> {session.game_info?.team_home} vs {session.game_info?.team_away}</p>
        <p><strong>Datum:</strong> {session.game_info?.date}</p>
        <p><strong>Liga:</strong> {session.game_info?.league}</p>
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
              }} onComplete={handleDrillComplete} />
            </div>
          )}

          {(currentPhase === 'P1' || currentPhase === 'P2' || currentPhase === 'P3') && (
            <div>
              <p>Analysiere das letzte Drittel und gib Feedback.</p>
              <DrillRenderer drill={{
                id: 'period_checkin',
                title: 'Period Check-in',
                drill_type: 'period_checkin',
                config: {
                  questions: [
                    { key: 'center_position', type: 'radio', label: 'Center-Position', options: ['low', 'middle', 'high'] },
                    { key: 'triangle_rating', type: 'slider', label: 'Dreieck-Qualität (1-5)', min: 1, max: 5 },
                    { key: 'breakout_quality', type: 'radio', label: 'Breakout-Qualität', options: ['clean', 'mixed', 'chaotic'] },
                    { key: 'note', type: 'text', label: 'Notiz', max_chars: 120 }
                  ]
                }
              }} onComplete={handleDrillComplete} />
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
    </div>
  )
}