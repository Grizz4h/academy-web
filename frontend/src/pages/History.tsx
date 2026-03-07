import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
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
  const [filterYear, setFilterYear] = useState<string>('')
  const [filterMonth, setFilterMonth] = useState<string>('')

  const filteredSessions = sessions?.filter(session => {
    if (filterYear) {
      const year = new Date(session.created_at).getFullYear().toString()
      if (year !== filterYear) return false
    }
    if (filterMonth) {
      const month = (new Date(session.created_at).getMonth() + 1).toString()
      if (month !== filterMonth) return false
    }
    if (filterModule && session.module_id !== filterModule) return false
    if (filterStatus && session.state !== filterStatus) return false
    if (filterCreator && session.created_by !== filterCreator) return false
    return true
  }) || []

  // Nach Datum absteigend sortieren (neueste oben)
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    // created_at kann string oder Date sein
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return dateB - dateA;
  });

  const uniqueModules = [...new Set(sessions?.map(s => s.module_id) || [])]
  const uniqueCreators = [...new Set(sessions?.map(s => s.created_by).filter(Boolean) || [])]

  const { uniqueYears, monthsByYear } = useMemo(() => {
    const yearsSet = new Set<string>()
    const monthsMap = new Map<string, Set<string>>()

    ;(sessions || []).forEach(session => {
      const date = new Date(session.created_at)
      if (Number.isNaN(date.getTime())) return
      const year = date.getFullYear().toString()
      const month = (date.getMonth() + 1).toString()

      yearsSet.add(year)
      if (!monthsMap.has(year)) monthsMap.set(year, new Set())
      monthsMap.get(year)?.add(month)
    })

    const uniqueYears = Array.from(yearsSet).sort((a, b) => Number(b) - Number(a))
    const monthsByYear = new Map<string, string[]>()
    monthsMap.forEach((months, year) => {
      monthsByYear.set(year, Array.from(months).sort((a, b) => Number(b) - Number(a)))
    })

    return { uniqueYears, monthsByYear }
  }, [sessions])

  useEffect(() => {
    if (!sessions || sessions.length === 0) return
    if (filterYear || filterMonth) return

    const latestSession = sessions.reduce((latest, session) => {
      const currentDate = new Date(session.created_at).getTime()
      const latestDate = new Date(latest.created_at).getTime()
      return currentDate > latestDate ? session : latest
    }, sessions[0])

    const latestDate = new Date(latestSession.created_at)
    if (Number.isNaN(latestDate.getTime())) return
    setFilterYear(latestDate.getFullYear().toString())
    setFilterMonth((latestDate.getMonth() + 1).toString())
  }, [sessions, filterYear, filterMonth])

  useEffect(() => {
    if (!filterYear) {
      if (filterMonth) setFilterMonth('')
      return
    }
    const months = monthsByYear.get(filterYear) || []
    if (!months.includes(filterMonth)) {
      setFilterMonth(months[0] || '')
    }
  }, [filterYear, filterMonth, monthsByYear])

  if (!user) return <div className="card">Bitte oben im Login deinen Namen speichern, dann zeigen wir dir deine Session-Historie.</div>
  if (isLoading) return <div className="card">Lade Historie...</div>
  if (error) return <div className="card">Fehler beim Laden: {(error as Error).message}</div>

  const getMonthLabel = (monthValue: string) => {
    const monthNumber = Number(monthValue)
    if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) return monthValue
    return new Date(2000, monthNumber - 1, 1).toLocaleString('de-DE', { month: 'long' })
  }

  function resetFilters() {
    setFilterYear(''); setFilterMonth(''); setFilterModule(''); setFilterCreator(''); setFilterStatus('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h1>Session Historie</h1>

      {/* Filter (Desktop + Mobile gleich) */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0 }}>Filter</h3>
          <button className="filterReset" onClick={resetFilters}>Reset</button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end', rowGap: '1rem', columnGap: '1rem', justifyContent: 'flex-start', width: '100%', maxWidth: '100%', marginTop: '0.75rem' }}>
          <div style={{ minWidth: '140px', flex: '1 1 140px' }}>
            <label>Jahr:</label>
            <select className="appSelect" value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ marginTop: '0.35rem' }}>
              <option value="">Alle</option>
              {uniqueYears.map(year => (<option key={year} value={year}>{year}</option>))}
            </select>
          </div>
          <div style={{ minWidth: '120px', flex: '1 1 120px' }}>
            <label>Monat:</label>
            <select className="appSelect" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ marginTop: '0.35rem' }} disabled={!filterYear}>
              <option value="">Alle</option>
              {(filterYear ? monthsByYear.get(filterYear) || [] : []).map(month => (
                <option key={month} value={month}>{getMonthLabel(month)}</option>
              ))}
            </select>
          </div>
          <div style={{ minWidth: '140px', flex: '1 1 140px' }}>
            <label>Ersteller:</label>
            <select className="appSelect" value={filterCreator} onChange={e => setFilterCreator(e.target.value)} style={{ marginTop: '0.35rem' }}>
              <option value="">Alle</option>
              {uniqueCreators.map(creator => (<option key={creator} value={creator}>{creator}</option>))}
            </select>
          </div>
          <div style={{ minWidth: '140px', flex: '1 1 140px' }}>
            <label>Modul:</label>
            <select className="appSelect" value={filterModule} onChange={e => setFilterModule(e.target.value)} style={{ marginTop: '0.35rem' }}>
              <option value="">Alle</option>
              {uniqueModules.map(module => (<option key={module} value={module}>{module}</option>))}
            </select>
          </div>
          <div style={{ minWidth: '140px', flex: '1 1 140px' }}>
            <label>Status:</label>
            <select className="appSelect" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ marginTop: '0.35rem' }}>
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
        {sortedSessions.length === 0 ? (
          <div className="card">
            <p>Keine Sessions gefunden.</p>
          </div>
        ) : (
          sortedSessions.map((session: Session) => (
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