import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useState } from 'react'

export default function SessionSetup() {
  const { moduleId } = useParams<{ moduleId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [focus, setFocus] = useState<string>('')
  const [goal, setGoal] = useState<string>('')
  const [confidence, setConfidence] = useState<number>(3)
  const [selectedDrill, setSelectedDrill] = useState<string>('')

  const { data: curriculum } = useQuery({
    queryKey: ['curriculum'],
    queryFn: () => api.getCurriculum()
  })

  const createSessionMutation = useMutation({
    mutationFn: (data: { user: string; module_id: string; goal: string; confidence: number; focus?: string; session_method?: string; drill_id?: string }) => api.createSession(data),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      navigate(`/session/${session.id}`)
    }
  })

  // Finde aktuelles Modul
  const currentModule = curriculum?.tracks.flatMap(t => t.modules).find(m => m.id === moduleId)

  if (!currentModule) {
    return <div className="card">Modul nicht gefunden</div>
  }

  const handleCreateSession = () => {
    if (!goal.trim()) {
      alert('Bitte ein Lernziel eingeben')
      return
    }
    if (!selectedDrill && currentModule.drills.length > 0) {
      alert('Bitte einen Drill wählen')
      return
    }

    createSessionMutation.mutate({
      user: 'demo',
      module_id: moduleId!,
      goal,
      confidence,
      focus: focus || currentModule.defaultFocus,
      session_method: currentModule.recommendedSessionMethod || 'live_watch',
      drill_id: selectedDrill || undefined
    })
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h1>Session Setup: {currentModule.title}</h1>

      <div className="card">
        <h2>Modul Info</h2>
        <p>{currentModule.description}</p>
        <div style={{ marginTop: '1rem' }}>
          <strong>Lernziele:</strong>
          <ul style={{ marginTop: '0.5rem' }}>
            {currentModule.learningGoals?.map((goal, i) => (
              <li key={i}>{goal}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <h2>Dein Fokus</h2>
        <p>Worauf möchtest du heute fokussieren?</p>
        <select
          value={focus}
          onChange={(e) => setFocus(e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem',
            marginTop: '0.5rem',
            backgroundColor: '#050712',
            color: '#f7f7ff',
            border: '1px solid #5191a2'
          }}
        >
          <option value="">-- Wähle Fokus --</option>
          <option value={currentModule.defaultFocus}>{currentModule.defaultFocus} (empfohlen)</option>
          {currentModule.defaultFocus && (
            <option value="General">Allgemein</option>
          )}
        </select>
      </div>

      {currentModule.drills && currentModule.drills.length > 0 && (
        <div className="card">
          <h2>Wähle deine Übung</h2>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
            Alle Übungen trainieren das gleiche Modul – wähle je nach Situation und Fokus.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            {currentModule.drills.map((drill) => (
              <label key={drill.id} style={{ display: 'flex', alignItems: 'center', padding: '0.5rem', border: selectedDrill === drill.id ? '2px solid #5191a2' : '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', cursor: 'pointer', backgroundColor: selectedDrill === drill.id ? 'rgba(81,145,162,0.1)' : 'transparent' }}>
                <input
                  type="radio"
                  name="drill"
                  value={drill.id}
                  checked={selectedDrill === drill.id}
                  onChange={(e) => setSelectedDrill(e.target.value)}
                  style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold' }}>{drill.title}</div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>{drill.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2>Lernziel für diese Session</h2>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="z.B. 'Heute fokussiere ich auf Center-Positionen in der Offensive'"
          style={{
            width: '100%',
            padding: '0.5rem',
            marginTop: '0.5rem',
            backgroundColor: '#050712',
            color: '#f7f7ff',
            border: '1px solid #5191a2',
            borderRadius: '4px',
            minHeight: '100px',
            fontFamily: 'inherit'
          }}
        />
      </div>

      <div className="card">
        <h2>Wie selbstbewusst bist du?</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
          <input
            type="range"
            min="1"
            max="5"
            value={confidence}
            onChange={(e) => setConfidence(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
            {confidence}/5
          </span>
        </div>
        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.5rem' }}>
          1 = sehr unsicher, 5 = sehr selbstbewusst
        </p>
      </div>

      <button
        onClick={handleCreateSession}
        className="btn"
        style={{
          padding: '1rem',
          fontSize: '1.1rem',
          backgroundColor: '#5191a2'
        }}
        disabled={createSessionMutation.isPending}
      >
        {createSessionMutation.isPending ? 'Erstelle Session...' : 'Session starten'}
      </button>

      <button
        onClick={() => navigate('/curriculum')}
        style={{
          padding: '0.5rem',
          backgroundColor: 'transparent',
          border: '1px solid rgba(255,255,255,0.3)',
          color: '#f7f7ff',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Abbrechen
      </button>
    </div>
  )
}