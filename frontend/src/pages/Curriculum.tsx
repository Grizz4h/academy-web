
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import type { CurriculumTrack, CurriculumModule } from '../api'
import theoryData from '../data/theoryData.json'

const cluster2Tracks = [
  {
    id: 'F',
    title: 'Track F - Raeumliches Situationslesen',
    description: 'Cluster 2 MVP: raeumlicher, kontextbezogener und bewusst getrennt vom Legacy-System. Einstieg in die neuen modularen Drill-Renderer mit Clickable Rink, Single Choice und Text Note.',
    clusterLabel: 'Cluster 2',
    modules: [
      {
        id: 'F',
        title: 'F - Raeumliches Situationslesen',
        summary: 'Erster Pilot fuer raeumliches Beobachten: Gefahrenraum, Kipppunkt und erste Passoption im Raum.',
        description: 'Enthaelt die drei MVP-Beispiel-Drills F1-F3 und laeuft im neuen Cluster-2-Player.',
        difficulty: 2,
        duration: 20,
        learningGoals: [
          'Gefaehrliche Raeume gezielt markieren',
          'Kipppunkte im Raum lokalisieren',
          'Erste sinnvolle Passoptionen raeumlich einordnen',
        ],
      },
    ],
  },
]

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
                  {module.id in theoryData && (
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

      {cluster2Tracks.map((track) => (
        <div key={track.id} className="card" style={{ border: '1px solid rgba(81,145,162,0.35)', background: 'linear-gradient(180deg, rgba(10,12,26,0.94) 0%, rgba(8,16,30,0.96) 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(129,221,245,0.82)', marginBottom: '0.35rem' }}>
                {track.clusterLabel}
              </div>
              <h2 style={{ marginBottom: '0.35rem' }}>{track.title}</h2>
              <p style={{ margin: 0, wordWrap: 'break-word', overflowWrap: 'break-word' }}>{track.description}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '1rem', marginTop: '1rem' }}>
            {track.modules.map((module) => (
              <div key={module.id} style={{ border: '1px solid rgba(81,145,162,0.22)', padding: '1rem', borderRadius: '0.5rem', minWidth: 0, overflow: 'hidden', background: 'rgba(255,255,255,0.03)' }}>
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
                  Schwierigkeit: {module.difficulty || 1} | Dauer: {module.duration || 20} Min
                </div>
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    className="btn"
                    onClick={() => navigate('/cluster2/f')}
                  >
                    Starten
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}