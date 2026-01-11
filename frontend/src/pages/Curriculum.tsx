import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import type { CurriculumTrack, CurriculumModule } from '../api'

export default function Curriculum() {
  const navigate = useNavigate()
  const { data: curriculum, isLoading, error } = useQuery({
    queryKey: ['curriculum'],
    queryFn: () => api.getCurriculum()
  })

  if (isLoading) return <div className="card">Lade Curriculum...</div>
  if (error) return <div className="card">Fehler beim Laden: {(error as Error).message}</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h1>Curriculum</h1>

      {curriculum?.tracks.map((track: CurriculumTrack) => (
        <div key={track.id} className="card">
          <h2>{track.title}</h2>
          <p style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{track.description}</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '1rem', marginTop: '1rem' }}>
            {track.modules.map((module: CurriculumModule) => (
              <div key={module.id} style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '0.5rem', minWidth: 0, overflow: 'hidden' }}>
                <h3 style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{module.title}</h3>
                <p style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{module.summary}</p>
                {module.description && (
                  <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.5rem', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                    {module.description}
                  </p>
                )}
                {module.learningGoals && module.learningGoals.length > 0 && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                    <strong>Lernziele:</strong>
                    <ul style={{ marginTop: '0.25rem', paddingLeft: '1rem' }}>
                      {module.learningGoals.map((goal, i) => (
                        <li key={i}>{goal}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                  Schwierigkeit: {module.difficulty || 1} | Dauer: {module.duration || 45} Min
                </div>
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    className="btn"
                    onClick={() => navigate(`/setup/${module.id}`)}
                  >
                    Starten
                  </button>
                  {(module.id === 'A1' || module.id === 'A2' || module.id === 'A3') && (
                    <button
                      className="btn"
                      onClick={() => navigate(`/theory/${module.id}`)}
                    >
                      Theorie
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}