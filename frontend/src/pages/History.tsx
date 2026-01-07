import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../api'
import type { Session } from '../api'
import { useUser } from '../context/UserContext'

export default function History() {
  const { user } = useUser()
  const queryClient = useQueryClient()
  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ['sessions', user],
    queryFn: () => api.getSessions(user || undefined),
    enabled: Boolean(user)
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', user] })
    },
    onError: (err: any) => {
      alert(`Löschen fehlgeschlagen: ${err?.message || err}`)
    }
  })

  const [filterModule, setFilterModule] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')

  if (!user) return <div className="card">Bitte oben im Login deinen Namen speichern, dann zeigen wir dir deine Session-Historie.</div>
  if (isLoading) return <div className="card">Lade Historie...</div>
  if (error) return <div className="card">Fehler beim Laden: {(error as Error).message}</div>

  const filteredSessions = sessions?.filter(session => {
    if (filterModule && session.module_id !== filterModule) return false
    if (filterStatus && session.state !== filterStatus) return false
    return true
  }) || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return '#28a745'
      case 'ABORTED': return '#dc3545'
      case 'PRE': case 'P1': case 'P2': case 'P3': return '#ffc107'
      case 'POST': return '#17a2b8'
      default: return '#6c757d'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Abgeschlossen'
      case 'ABORTED': return 'Abgebrochen'
      case 'PRE': return 'Vorbereitung'
      case 'P1': return 'Nach 1. Drittel'
      case 'P2': return 'Nach 2. Drittel'
      case 'P3': return 'Nach 3. Drittel'
      case 'POST': return 'Debrief'
      default: return status
    }
  }

  const uniqueModules = [...new Set(sessions?.map(s => s.module_id) || [])]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h1>Session Historie</h1>

      {/* Filter */}
      <div className="card">
        <h3>Filter</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div>
            <label>Modul:</label>
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              style={{ marginLeft: '0.5rem', padding: '0.25rem' }}
            >
              <option value="">Alle</option>
              {uniqueModules.map(module => (
                <option key={module} value={module}>{module}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ marginLeft: '0.5rem', padding: '0.25rem' }}
            >
              <option value="">Alle</option>
              <option value="COMPLETED">Abgeschlossen</option>
              <option value="ABORTED">Abgebrochen</option>
              <option value="PRE">Vorbereitung</option>
              <option value="P1">Nach 1. Drittel</option>
              <option value="P2">Nach 2. Drittel</option>
              <option value="P3">Nach 3. Drittel</option>
              <option value="POST">Debrief</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sessions Liste */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredSessions.length === 0 ? (
          <div className="card">
            <p>Keine Sessions gefunden.</p>
          </div>
        ) : (
          filteredSessions.map((session: Session) => (
            <div key={session.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3>{session.module_id} - {session.goal}</h3>
                  <p><strong>Erstellt:</strong> {new Date(session.created_at).toLocaleString()}</p>
                  <p><strong>Check-ins:</strong> {session.checkins?.length || 0}</p>
                  {session.abort && (
                    <p><strong>Abbruchgrund:</strong> {session.abort.reason}</p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      backgroundColor: getStatusColor(session.state),
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {getStatusText(session.state)}
                  </div>
                  <a
                    href={`/session/${session.id}`}
                    className="btn"
                    style={{ marginTop: '0.5rem', display: 'inline-block', fontSize: '0.8rem' }}
                  >
                    Details
                  </a>
                    <button
                      onClick={() => {
                        const ok = confirm('Diese Session wirklich löschen? Dieser Schritt kann nicht rückgängig gemacht werden.')
                        if (!ok) return
                        deleteMutation.mutate(session.id)
                      }}
                      className="btn"
                      style={{ marginTop: '0.5rem', marginLeft: '0.5rem', display: 'inline-block', fontSize: '0.8rem', backgroundColor: '#dc3545', borderColor: '#dc3545' }}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? 'Lösche...' : 'Löschen'}
                    </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}