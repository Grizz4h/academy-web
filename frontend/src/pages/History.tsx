import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import type { Session } from '../api'
import { useUser } from '../context/UserContext'
import SessionCard from '../components/SessionCard'
import Card from '../components/Card'
import FilterSheet from '../components/FilterSheet'
import { PageSkeleton } from '../components/Skeleton'
import styles from './History.module.css'

function isInProgressState(state: string): boolean {
  const value = String(state || '').toUpperCase()
  return value === 'IN_PROGRESS' || value === 'PRE' || value === 'P1' || value === 'P2' || value === 'P3' || value === 'POST'
}

export default function History() {
  const { user } = useUser()
  const queryClient = useQueryClient()
  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ['sessions', user],
    queryFn: () => api.getSessions(user || undefined),
    enabled: Boolean(user)
  })

  const { data: scenesData } = useQuery({
    queryKey: ['scenes', 'history', user],
    queryFn: () => api.getScenes(),
    enabled: Boolean(user)
  })

  const { data: labContent } = useQuery({
    queryKey: ['lab-content'],
    queryFn: () => api.getLabContent(),
    enabled: Boolean(user)
  })

  const labTemplateTitleById = useMemo(() => {
    const map = new Map<string, string>()
    for (const template of labContent?.prediction_templates || []) {
      if (template?.id && template?.title) {
        map.set(template.id, template.title)
      }
    }
    return map
  }, [labContent])

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
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)

  const sessionList = sessions || []

  const overview = useMemo(() => {
    const total = sessionList.length
    const completed = sessionList.filter((s) => s.state === 'COMPLETED').length
    const aborted = sessionList.filter((s) => s.state === 'ABORTED').length
    const inProgress = sessionList.filter((s) => isInProgressState(s.state) && s.state !== 'ABORTED' && s.state !== 'COMPLETED').length
    const scenes = scenesData?.scenes?.length || 0
    return { total, completed, aborted, inProgress, scenes }
  }, [sessionList, scenesData])

  const filteredSessions = sessionList.filter(session => {
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
  })

  // Nach Datum absteigend sortieren (neueste oben)
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return dateB - dateA;
  });

  const uniqueModules = [...new Set(sessionList.map(s => s.module_id) || [])]
  const uniqueCreators = [...new Set(sessionList.map(s => s.created_by).filter(Boolean) || [])] as string[]

  const scenesBySession = useMemo(() => {
    const map = new Map<string, Array<{ id: string; game_time: string; period?: string; created_at: string }>>()
    for (const scene of scenesData?.scenes || []) {
      if (!scene.session_id) continue
      if (!map.has(scene.session_id)) map.set(scene.session_id, [])
      map.get(scene.session_id)?.push({
        id: scene.id,
        game_time: scene.game_time,
        period: scene.period,
        created_at: scene.created_at,
      })
    }
    for (const [, entries] of map) {
      entries.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        return dateB - dateA
      })
    }
    return map
  }, [scenesData])

  const { uniqueYears, monthsByYear } = useMemo(() => {
    const yearsSet = new Set<string>()
    const monthsMap = new Map<string, Set<string>>()

    sessionList.forEach(session => {
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
  }, [sessionList])

  const didInitDateFilter = useRef(false)

  useEffect(() => {
    if (didInitDateFilter.current) return
    if (!sessionList.length) return

    const latestSession = sessionList.reduce((latest, session) => {
      const currentDate = new Date(session.created_at).getTime()
      const latestDate = new Date(latest.created_at).getTime()
      return currentDate > latestDate ? session : latest
    }, sessionList[0])

    const latestDate = new Date(latestSession.created_at)
    if (Number.isNaN(latestDate.getTime())) return

    didInitDateFilter.current = true
    setFilterYear(latestDate.getFullYear().toString())
    setFilterMonth((latestDate.getMonth() + 1).toString())
  }, [sessionList])

  useEffect(() => {
    if (!filterYear) {
      if (filterMonth) setFilterMonth('')
      return
    }
    // Leerer Monat = "Alle" — nicht überschreiben
    if (!filterMonth) return
    const months = monthsByYear.get(filterYear) || []
    if (!months.includes(filterMonth)) {
      setFilterMonth('')
    }
  }, [filterYear, filterMonth, monthsByYear])

  const getMonthLabel = (monthValue: string) => {
    const monthNumber = Number(monthValue)
    if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) return monthValue
    return new Date(2000, monthNumber - 1, 1).toLocaleString('de-DE', { month: 'long' })
  }

  const statusLabel = (value: string) => {
    const labels: Record<string, string> = {
      COMPLETED: 'Abgeschlossen',
      ABORTED: 'Abgebrochen',
      PRE: 'Vorbereitung',
      P1: 'Nach 1. Drittel',
      P2: 'Nach 2. Drittel',
      P3: 'Nach 3. Drittel',
      POST: 'Debrief',
      IN_PROGRESS: 'In Bearbeitung',
    }
    return labels[value] || value
  }

  function resetFilters() {
    setFilterYear('')
    setFilterMonth('')
    setFilterModule('')
    setFilterCreator('')
    setFilterStatus('')
  }

  const activeFilterChips = [
    filterYear ? { key: 'year', label: `Jahr: ${filterYear}`, clear: () => { setFilterYear(''); setFilterMonth('') } } : null,
    filterMonth ? { key: 'month', label: `Monat: ${getMonthLabel(filterMonth)}`, clear: () => setFilterMonth('') } : null,
    filterCreator ? { key: 'creator', label: `Ersteller: ${filterCreator}`, clear: () => setFilterCreator('') } : null,
    filterModule ? { key: 'module', label: `Modul: ${filterModule}`, clear: () => setFilterModule('') } : null,
    filterStatus ? { key: 'status', label: `Status: ${statusLabel(filterStatus)}`, clear: () => setFilterStatus('') } : null,
  ].filter(Boolean) as Array<{ key: string; label: string; clear: () => void }>

  const hasActiveFilters = activeFilterChips.length > 0

  if (!user) {
    return (
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Session-Verlauf</h1>
          <p className={styles.pageLead}>Melde dich an, um deine Sessions und Szenen zu sehen.</p>
        </header>
        <Card>Bitte oben anmelden, dann zeigen wir dir deinen Session-Verlauf.</Card>
      </div>
    )
  }
  if (isLoading) return <PageSkeleton />
  if (error) return <Card>Fehler beim Laden: {(error as Error).message}</Card>

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Session-Verlauf</h1>
        <p className={styles.pageLead}>
          Alle Sessions im Überblick — filtern, öffnen und bei Bedarf Details nachschauen.
        </p>
      </header>

      <div className={styles.kpiGrid}>
        <Card className={styles.kpiCard}>
          <div className={styles.kpiTitle}>Sessions gesamt</div>
          <div className={styles.kpiValue}>{overview.total}</div>
          <div className={styles.kpiHint}>{overview.scenes} Szenen erfasst</div>
        </Card>
        <Card className={styles.kpiCard}>
          <div className={styles.kpiTitle}>Abgeschlossen</div>
          <div className={styles.kpiValue}>{overview.completed}</div>
          <div className={styles.kpiHint}>fertig durchgespielt</div>
        </Card>
        <Card className={styles.kpiCard}>
          <div className={styles.kpiTitle}>In Bearbeitung</div>
          <div className={styles.kpiValue}>{overview.inProgress}</div>
          <div className={styles.kpiHint}>noch offen</div>
        </Card>
        <Card className={styles.kpiCard}>
          <div className={styles.kpiTitle}>Abgebrochen</div>
          <div className={styles.kpiValue}>{overview.aborted}</div>
          <div className={styles.kpiHint}>nicht beendet</div>
        </Card>
      </div>

      <div className={styles.filterMobileBar}>
        <button type="button" className={styles.filterOpenBtn} onClick={() => setFilterSheetOpen(true)}>
          Filter{hasActiveFilters ? ` · ${activeFilterChips.length}` : ''}
        </button>
        {hasActiveFilters && (
          <button type="button" className={styles.filterReset} onClick={resetFilters}>
            Zurücksetzen
          </button>
        )}
      </div>

      <Card className={`${styles.filterCard} ${styles.filterDesktop}`}>
        <div className={styles.filterHeader}>
          <h2 className={styles.filterTitle}>Filter</h2>
          <button type="button" className={styles.filterReset} onClick={resetFilters}>
            Alle Filter zurücksetzen
          </button>
        </div>

        <div className={styles.filterGroups}>
          <div className={styles.filterGroup}>
            <div className={styles.filterGroupLabel}>Zeitraum</div>
            <div className={styles.filterRow}>
              <div className={styles.filterField}>
                <label htmlFor="history-year">Jahr</label>
                <select
                  id="history-year"
                  className="appSelect"
                  value={filterYear}
                  onChange={e => setFilterYear(e.target.value)}
                >
                  <option value="">Alle</option>
                  {uniqueYears.map(year => (<option key={year} value={year}>{year}</option>))}
                </select>
              </div>
              <div className={styles.filterField}>
                <label htmlFor="history-month">Monat</label>
                <select
                  id="history-month"
                  className="appSelect"
                  value={filterMonth}
                  onChange={e => setFilterMonth(e.target.value)}
                  disabled={!filterYear}
                >
                  <option value="">Alle</option>
                  {(filterYear ? monthsByYear.get(filterYear) || [] : []).map(month => (
                    <option key={month} value={month}>{getMonthLabel(month)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className={styles.filterGroup}>
            <div className={styles.filterGroupLabel}>Inhalt</div>
            <div className={styles.filterRow}>
              <div className={styles.filterField}>
                <label htmlFor="history-creator">Ersteller</label>
                <select
                  id="history-creator"
                  className="appSelect"
                  value={filterCreator}
                  onChange={e => setFilterCreator(e.target.value)}
                >
                  <option value="">Alle</option>
                  {uniqueCreators.map(creator => (<option key={creator} value={creator}>{creator}</option>))}
                </select>
              </div>
              <div className={styles.filterField}>
                <label htmlFor="history-module">Modul</label>
                <select
                  id="history-module"
                  className="appSelect"
                  value={filterModule}
                  onChange={e => setFilterModule(e.target.value)}
                >
                  <option value="">Alle</option>
                  {uniqueModules.map(module => (<option key={module} value={module}>{module}</option>))}
                </select>
              </div>
            </div>
          </div>

          <div className={styles.filterGroup}>
            <div className={styles.filterGroupLabel}>Status</div>
            <div className={styles.filterRow}>
              <div className={styles.filterField}>
                <label htmlFor="history-status">Status</label>
                <select
                  id="history-status"
                  className="appSelect"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="">Alle</option>
                  <option value="COMPLETED">Abgeschlossen</option>
                  <option value="ABORTED">Abgebrochen</option>
                  <option value="IN_PROGRESS">In Bearbeitung</option>
                  <option value="PRE">Vorbereitung</option>
                  <option value="P1">Nach 1. Drittel</option>
                  <option value="P2">Nach 2. Drittel</option>
                  <option value="P3">Nach 3. Drittel</option>
                  <option value="POST">Debrief</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className={styles.activeFilters}>
            {activeFilterChips.map((chip) => (
              <span key={chip.key} className={styles.chip}>
                {chip.label}
                <button
                  type="button"
                  className={styles.chipClear}
                  onClick={chip.clear}
                  aria-label={`${chip.label} entfernen`}
                  title="Filter entfernen"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </Card>

      {hasActiveFilters && (
        <div className={`${styles.activeFilters} ${styles.filterMobileChips}`}>
          {activeFilterChips.map((chip) => (
            <span key={chip.key} className={styles.chip}>
              {chip.label}
              <button
                type="button"
                className={styles.chipClear}
                onClick={chip.clear}
                aria-label={`${chip.label} entfernen`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <FilterSheet
        open={filterSheetOpen}
        title="Session-Filter"
        onClose={() => setFilterSheetOpen(false)}
        onReset={resetFilters}
      >
        <div className="stack">
          <div className="sheetSection">
            <div className="sheetSectionTitle">Zeitraum</div>
            <div className="grid2">
              <select className="appSelect" value={filterYear} onChange={e => setFilterYear(e.target.value)} aria-label="Jahr">
                <option value="">Jahr: Alle</option>
                {uniqueYears.map(year => (<option key={year} value={year}>{year}</option>))}
              </select>
              <select className="appSelect" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} disabled={!filterYear} aria-label="Monat">
                <option value="">Monat: Alle</option>
                {(filterYear ? monthsByYear.get(filterYear) || [] : []).map(month => (
                  <option key={month} value={month}>{getMonthLabel(month)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="sheetSection">
            <div className="sheetSectionTitle">Inhalt</div>
            <div className="stack">
              <select className="appSelect" value={filterCreator} onChange={e => setFilterCreator(e.target.value)} aria-label="Ersteller">
                <option value="">Ersteller: Alle</option>
                {uniqueCreators.map(creator => (<option key={creator} value={creator}>{creator}</option>))}
              </select>
              <select className="appSelect" value={filterModule} onChange={e => setFilterModule(e.target.value)} aria-label="Modul">
                <option value="">Modul: Alle</option>
                {uniqueModules.map(module => (<option key={module} value={module}>{module}</option>))}
              </select>
            </div>
          </div>
          <div className="sheetSection">
            <div className="sheetSectionTitle">Status</div>
            <select className="appSelect" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} aria-label="Status">
              <option value="">Status: Alle</option>
              <option value="COMPLETED">Abgeschlossen</option>
              <option value="ABORTED">Abgebrochen</option>
              <option value="IN_PROGRESS">In Bearbeitung</option>
              <option value="PRE">Vorbereitung</option>
              <option value="P1">Nach 1. Drittel</option>
              <option value="P2">Nach 2. Drittel</option>
              <option value="P3">Nach 3. Drittel</option>
              <option value="POST">Debrief</option>
            </select>
          </div>
        </div>
      </FilterSheet>

      <div className={styles.resultsBar}>
        <h2 className={styles.resultsTitle}>
          {sortedSessions.length === 1 ? '1 Session' : `${sortedSessions.length} Sessions`}
        </h2>
        <p className={styles.resultsMeta}>
          {hasActiveFilters
            ? `gefiltert aus ${overview.total} insgesamt`
            : 'alle Sessions, neueste zuerst'}
        </p>
      </div>

      <div className={styles.sessionList}>
        {sortedSessions.length === 0 ? (
          <Card className={styles.emptyCard}>
            <h3 className={styles.emptyTitle}>Keine Sessions gefunden</h3>
            <p className={styles.emptyText}>
              {overview.total === 0
                ? 'Noch keine Sessions vorhanden. Starte in der Akademie mit dem ersten Modul.'
                : 'Mit den aktuellen Filtern gibt es keine Treffer. Setze die Filter zurück oder wähle einen anderen Zeitraum.'}
            </p>
            <div className={styles.emptyActions}>
              {overview.total > 0 ? (
                <button type="button" className={styles.emptyBtnSecondary} onClick={resetFilters}>
                  Filter zurücksetzen
                </button>
              ) : null}
              <Link to="/curriculum" className={styles.emptyBtn}>
                Zur Akademie
              </Link>
            </div>
          </Card>
        ) : (
          sortedSessions.map((session: Session) => (
            <SessionCard
              key={session.id}
              session={{
                ...session,
                observed_team: session.game_info?.observed_team,
                lab_template_id: session.lab_template_id && labTemplateTitleById.get(session.lab_template_id)
                  ? `${session.lab_template_id} · ${labTemplateTitleById.get(session.lab_template_id)}`
                  : session.lab_template_id
              }}
              sceneEntries={scenesBySession.get(session.id) || []}
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
