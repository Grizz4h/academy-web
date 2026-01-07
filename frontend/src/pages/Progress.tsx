import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import type { Session } from '../api'
import { useUser } from '../context/UserContext'

export default function Progress() {
  const { user } = useUser()
  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ['sessions', user],
    queryFn: () => api.getSessions(user || undefined),
    enabled: Boolean(user)
  })

  const { data: curriculum } = useQuery({
    queryKey: ['curriculum'],
    queryFn: () => api.getCurriculum()
  })

  if (!user) return <div className="card">Bitte oben im Login deinen Namen speichern, dann können wir deinen Fortschritt anzeigen.</div>
  if (isLoading) return <div className="card">Lade Fortschritt...</div>
  if (error) return <div className="card">Fehler beim Laden: {(error as Error).message}</div>

  // Berechne Fortschritt pro Modul
  const moduleProgress = new Map<string, {
    total: number
    completed: number
    aborted: number
    lastSession?: Session
  }>()

  sessions?.forEach(session => {
    if (!moduleProgress.has(session.module_id)) {
      moduleProgress.set(session.module_id, {
        total: 0,
        completed: 0,
        aborted: 0
      })
    }
    const progress = moduleProgress.get(session.module_id)!
    progress.total++

    if (session.state === 'COMPLETED') {
      progress.completed++
    } else if (session.state === 'ABORTED') {
      progress.aborted++
    }

    // Track letzte Session
    if (!progress.lastSession ||
        new Date(session.created_at) > new Date(progress.lastSession.created_at)) {
      progress.lastSession = session
    }
  })

  const getModuleTitle = (moduleId: string) => {
    for (const track of curriculum?.tracks || []) {
      for (const module of track.modules) {
        if (module.id === moduleId) {
          return module.title
        }
      }
    }
    return moduleId
  }

  const getProgressColor = (completed: number, total: number) => {
    const ratio = completed / total
    if (ratio >= 0.8) return '#28a745'
    if (ratio >= 0.5) return '#ffc107'
    return '#dc3545'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h1>Lernfortschritt</h1>

      <div className="card">
        <h2>Übersicht</h2>
        <p><strong>Gesamt Sessions:</strong> {sessions?.length || 0}</p>
        <p><strong>Abgeschlossen:</strong> {sessions?.filter(s => s.state === 'COMPLETED').length || 0}</p>
        <p><strong>Abgebrochen:</strong> {sessions?.filter(s => s.state === 'ABORTED').length || 0}</p>
        <p><strong>Aktiv:</strong> {sessions?.filter(s => s.state !== 'COMPLETED' && s.state !== 'ABORTED').length || 0}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        {Array.from(moduleProgress.entries()).map(([moduleId, progress]) => (
          <div key={moduleId} className="card">
            <h3>{getModuleTitle(moduleId)}</h3>

            <div style={{ margin: '1rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Fortschritt</span>
                <span>{progress.completed}/{progress.total}</span>
              </div>
              <div style={{
                width: '100%',
                height: '10px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '5px'
              }}>
                <div
                  style={{
                    width: `${(progress.completed / progress.total) * 100}%`,
                    height: '100%',
                    backgroundColor: getProgressColor(progress.completed, progress.total),
                    borderRadius: '5px'
                  }}
                />
              </div>
            </div>

            <p><strong>Abgebrochen:</strong> {progress.aborted}</p>

            {progress.lastSession && (
              <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '5px' }}>
                <p><strong>Letzte Session:</strong></p>
                <p>{new Date(progress.lastSession.created_at).toLocaleDateString()}</p>
                <p>Status: {progress.lastSession.state}</p>
                {progress.lastSession.abort && (
                  <p>Abbruch: {progress.lastSession.abort.reason}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {moduleProgress.size === 0 && (
        <div className="card">
          <p>Noch keine Sessions vorhanden. Starte mit dem Curriculum!</p>
        </div>
      )}
    </div>
  )
}