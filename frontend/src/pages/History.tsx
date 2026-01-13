import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../api'
import type { Session } from '../api'
import { useUser } from '../context/UserContext'
import SessionCard from '../components/SessionCard'

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
  const [filterCreator, setFilterCreator] = useState<string>('')

  if (!user) return <div className="card">Bitte oben im Login deinen Namen speichern, dann zeigen wir dir deine Session-Historie.</div>
  if (isLoading) return <div className="card">Lade Historie...</div>
  if (error) return <div className="card">Fehler beim Laden: {(error as Error).message}</div>

  const filteredSessions = sessions?.filter(session => {
    if (filterModule && session.module_id !== filterModule) return false
    if (filterStatus && session.state !== filterStatus) return false
    if (filterCreator && session.created_by !== filterCreator) return false
    return true
  }) || []

  const uniqueModules = [...new Set(sessions?.map(s => s.module_id) || [])]
  const uniqueCreators = [...new Set(sessions?.map(s => s.created_by).filter(Boolean) || [])]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h1>Session Historie</h1>

      {/* Filter */}
      <div className="card">
        <h3>Filter</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label>Ersteller:</label>
            <select
              value={filterCreator}
              onChange={(e) => setFilterCreator(e.target.value)}
              style={{ marginLeft: '0.5rem', padding: '0.25rem' }}
            >
              <option value="">Alle</option>
              {uniqueCreators.map(creator => (
                <option key={creator} value={creator}>{creator}</option>
              ))}
            </select>
          </div>
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
            <SessionCard
              key={session.id}
              session={{ ...session, observed_team: session.game_info?.observed_team }}
              onDelete={(id) => deleteMutation.mutate(id)}
              isDeletingId={
                deleteMutation.isPending
                  ? deleteMutation.variables
                  : undefined
              }
            />
          ))
        )}
      </div>
    </div>
  )
}