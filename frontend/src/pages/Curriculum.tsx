import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import type { CurriculumTrack, CurriculumModule } from '../api'

export default function Curriculum() {
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
          <p>{track.description}</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            {track.modules.map((module: CurriculumModule) => (
              <div key={module.id} style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '0.5rem' }}>
                <h3>{module.title}</h3>
                <p>{module.summary}</p>
                <a
                  href={`/session/${module.id}`}
                  className="btn"
                  style={{ marginTop: '0.5rem', display: 'inline-block' }}
                  onClick={(e) => {
                    e.preventDefault()
                    // Erstelle eine neue Session für dieses Modul
                    fetch('http://localhost:8000/api/sessions', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        user: 'demo',
                        module_id: module.id,
                        goal: `Lernen: ${module.title}`,
                        confidence: 3
                      })
                    })
                    .then(res => res.json())
                    .then(session => {
                      window.location.href = `/session/${session.id}`
                    })
                    .catch(err => console.error('Fehler beim Erstellen der Session:', err))
                  }}
                >
                  Starten
                </a>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}