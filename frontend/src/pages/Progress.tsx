import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import type { Session } from '../api'
import { useUser } from '../context/UserContext'
import styles from './Progress.module.css'

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

  return (
    <div className={styles.page}>
      <h1>Lernfortschritt</h1>

      <div className="card">
        <h2>Übersicht</h2>
        <p><strong>Gesamt Sessions:</strong> {sessions?.length || 0}</p>
        <p><strong>Abgeschlossen:</strong> {sessions?.filter(s => s.state === 'COMPLETED').length || 0}</p>
        <p><strong>Abgebrochen:</strong> {sessions?.filter(s => s.state === 'ABORTED').length || 0}</p>
        <p><strong>Aktiv:</strong> {sessions?.filter(s => s.state !== 'COMPLETED' && s.state !== 'ABORTED').length || 0}</p>
      </div>

      <div className={styles.grid}>
        {Array.from(moduleProgress.entries()).map(([moduleId, progress]) => (
          <div key={moduleId} className="card">
            <h3>{getModuleTitle(moduleId)}</h3>

            <div className={styles.progressSection}>
              <div className={styles.progressHeader}>
                <span>Fortschritt</span>
                <span className={styles.completionCount}>{progress.completed}/{progress.total}</span>
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={`${styles.progressFill} ${progress.total > 0 && progress.completed === progress.total ? styles.progressFillComplete : ''}`}
                  style={{
                    width: `${progress.total ? (progress.completed / progress.total) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            <p><strong>Abgebrochen:</strong> {progress.aborted}</p>

            {progress.lastSession && (
              <div className={styles.lastSessionCard}>
                <p><strong>Letzte Session:</strong></p>
                <p>{new Date(progress.lastSession.created_at).toLocaleDateString()}</p>
                <p>
                  Status:{' '}
                  <span className={styles.statusBadge}>
                    {progress.lastSession.state.replace(/_/g, ' ')}
                  </span>
                </p>
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