import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { GlossaryTerm, renderWithGlossary } from '../components/GlossaryTerm'

export default function Drills() {
  const { moduleId } = useParams<{ moduleId: string }>()
  const navigate = useNavigate()

  const { data: curriculum, isLoading, error } = useQuery({
    queryKey: ['curriculum'],
    queryFn: () => api.getCurriculum()
  })

  if (isLoading) return <div className="card">Lade Drills...</div>
  if (error) return <div className="card">Fehler beim Laden: {(error as Error).message}</div>

  const currentModule = curriculum?.tracks.flatMap(t => t.modules).find(m => m.id === moduleId)

  if (!currentModule) {
    return <div className="card">Modul nicht gefunden.</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/theory')}
          style={{ marginBottom: '1rem' }}
        >
          ← Zurück zur Theorie
        </button>
        <h1>Drills: {currentModule.title}</h1>
        <p>{currentModule.description || currentModule.summary}</p>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {currentModule.drills.map((drill) => (
          <div key={drill.id} className="card">
            <h3>
              <GlossaryTerm term={drill.title.toLowerCase()}>{drill.title}</GlossaryTerm>
            </h3>
            <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              Typ: {drill.drill_type}
            </p>
            {drill.description && (
              <p style={{ marginBottom: '1rem' }}>
                {renderWithGlossary(drill.description)}
              </p>
            )}

            {drill.didactics && (
              <div style={{ marginTop: '1rem' }}>
                {drill.didactics.explanation && (
                  <>
                    <h4>Drill-Erklärung</h4>
                    <p>{drill.didactics.explanation}</p>
                  </>
                )}

                {drill.didactics.goal && (
                  <>
                    <h4>Ziel:</h4>
                    <p>{drill.didactics.goal}</p>
                  </>
                )}

                <details style={{ marginTop: '1rem' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                    👀 Beobachtungsanleitung
                  </summary>
                  <div style={{ marginTop: '0.5rem' }}>
                    {drill.didactics.observation_guide?.what_to_watch && (
                      <div>
                        <h5>Worauf achten?</h5>
                        <ul>
                          {drill.didactics.observation_guide.what_to_watch.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {drill.didactics.observation_guide?.how_to_decide && (
                      <div style={{ marginTop: '1rem' }}>
                        <h5>Wie entscheiden?</h5>
                        <ul>
                          {drill.didactics.observation_guide.how_to_decide.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {drill.didactics.observation_guide?.ignore && (
                      <div style={{ marginTop: '1rem' }}>
                        <h5>Was ignorieren?</h5>
                        <ul>
                          {drill.didactics.observation_guide.ignore.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {drill.didactics.watch_for && drill.didactics.watch_for.length > 0 && (
                      <div>
                        <h5>Beobachte:</h5>
                        <ul>
                          {drill.didactics.watch_for.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {drill.didactics.how_to && drill.didactics.how_to.length > 0 && (
                      <div style={{ marginTop: '1rem' }}>
                        <h5>Durchführung:</h5>
                        <ul>
                          {drill.didactics.how_to.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </details>

                {drill.didactics.glossary && Object.keys(drill.didactics.glossary).length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <h4>💡 Begriffe</h4>
                    <ul>
                      {Object.entries(drill.didactics.glossary).map(([term, definition]) => (
                        <li key={term}>
                          <strong>{term}:</strong> {definition}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {drill.didactics.learning_hint && (
                  <div style={{ marginTop: '1rem' }}>
                    <h4>🧠 Lernhinweis</h4>
                    <p style={{ fontStyle: 'italic' }}>{drill.didactics.learning_hint}</p>
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: '1rem' }}>
              <button
                className="btn"
                onClick={() => navigate(`/setup/${moduleId}?drill=${drill.id}`)}
              >
                Mit diesem Drill starten
              </button>
            </div>
          </div>
        ))}

        {currentModule.drills.length === 0 && (
          <div className="card">
            <p>Für dieses Modul sind noch keine Drills verfügbar.</p>
          </div>
        )}
      </div>
    </div>
  )
}