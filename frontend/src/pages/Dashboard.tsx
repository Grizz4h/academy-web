import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import type { Session } from '../api'

export default function Dashboard() {
  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.getSessions()
  })

  if (isLoading) return <div className="card">Lade Sessions...</div>
  if (error) return <div className="card">Fehler beim Laden: {(error as Error).message}</div>

  const activeSession = sessions?.find(s => s.state !== 'COMPLETED')
  const completedSessions = sessions?.filter(s => s.state === 'COMPLETED') || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h1>Dashboard</h1>

      {activeSession && (
        <div className="card">
          <h2>Aktive Session</h2>
          <p><strong>Modul:</strong> {activeSession.module_id}</p>
          <p><strong>Ziel:</strong> {activeSession.goal}</p>
          <p><strong>Status:</strong> {activeSession.state}</p>
          <a
            href={`/session/${activeSession.id}`}
            className="btn"
          >
            Fortfahren
          </a>
        </div>
      )}

      <div className="card">
        <h2>Session-Historie</h2>
        {completedSessions.length === 0 ? (
          <p>Keine abgeschlossenen Sessions.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {completedSessions.map((session: Session) => (
              <li key={session.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                <p><strong>Modul:</strong> {session.module_id}</p>
                <p><strong>Abgeschlossen:</strong> {new Date(session.post?.completed_at || '').toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}