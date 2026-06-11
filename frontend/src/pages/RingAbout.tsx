import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { api, type SceneMarker } from '../api'

const PERIOD_LABELS: Record<string, string> = {
  PRE: 'Vor dem Spiel',
  P1: '1. Drittel',
  P2: '2. Drittel',
  P3: '3. Drittel',
  POST: 'Nach dem Spiel',
}

function periodLabel(p?: string) {
  if (!p) return '–'
  return PERIOD_LABELS[p] ?? p
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return iso
  }
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}

export default function RingAbout() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data, isLoading, error } = useQuery({
    queryKey: ['scenes'],
    queryFn: () => api.getScenes(),
  })

  const sessionFilter = (searchParams.get('session_id') || '').trim()

  const deleteMutation = useMutation({
    mutationFn: (sceneId: string) => api.deleteScene(sceneId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scenes'] }),
  })

  const handleDelete = (sceneId: string) => {
    if (!window.confirm('Szene löschen?')) return
    deleteMutation.mutate(sceneId)
  }

  const scenes: SceneMarker[] = data?.scenes ?? []

  // Derive filter options from data
  const leagues = useMemo(() => unique(scenes.map(s => s.league).filter(Boolean) as string[]).sort(), [scenes])
  const seasons = useMemo(() => unique(scenes.map(s => s.season).filter(Boolean) as string[]).sort().reverse(), [scenes])
  const teams = useMemo(() => {
    const all: string[] = []
    for (const s of scenes) {
      if (s.team_home) all.push(s.team_home)
      if (s.team_away) all.push(s.team_away)
    }
    return unique(all).sort()
  }, [scenes])
  const tracks = useMemo(() => unique(scenes.map(s => s.module_id).filter(Boolean) as string[]).sort(), [scenes])
  const drills = useMemo(() => unique(scenes.map(s => s.drill_id).filter(Boolean) as string[]).sort(), [scenes])

  const [filterLeague, setFilterLeague] = useState('')
  const [filterSeason, setFilterSeason] = useState('')
  const [filterTeam, setFilterTeam] = useState('')
  const [filterTrack, setFilterTrack] = useState('')
  const [filterDrill, setFilterDrill] = useState('')

  const filtered = useMemo(() => {
    return scenes.filter(s => {
      if (sessionFilter && s.session_id !== sessionFilter) return false
      if (filterLeague && s.league !== filterLeague) return false
      if (filterSeason && s.season !== filterSeason) return false
      if (filterTeam) {
        const t = filterTeam.toLowerCase()
        const matchHome = (s.team_home ?? '').toLowerCase() === t
        const matchAway = (s.team_away ?? '').toLowerCase() === t
        const matchObs = (s.observed_team ?? '').toLowerCase() === t
        if (!matchHome && !matchAway && !matchObs) return false
      }
      if (filterTrack && s.module_id !== filterTrack) return false
      if (filterDrill && s.drill_id !== filterDrill) return false
      return true
    })
  }, [scenes, sessionFilter, filterLeague, filterSeason, filterTeam, filterTrack, filterDrill])

  const hasActiveFilter = sessionFilter || filterLeague || filterSeason || filterTeam || filterTrack || filterDrill

  const resetFilters = () => {
    setFilterLeague('')
    setFilterSeason('')
    setFilterTeam('')
    setFilterTrack('')
    setFilterDrill('')
    if (sessionFilter) {
      setSearchParams({})
    }
  }

  const selectStyle: React.CSSProperties = {
    padding: '0.4rem 0.6rem',
    borderRadius: '0.4rem',
    border: '1px solid #334155',
    background: '#0f172a',
    color: '#cbd5e1',
    fontSize: '0.85rem',
    minWidth: 120,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🎬 Rink About It – Szenenpool
        </h1>
        <p style={{ margin: '0.4rem 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
          Gemerkte Szenen aus deinen Drills – dein Rohmaterial für Rink About It.
        </p>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '1rem' }}>
        {sessionFilter && (
          <div style={{ marginBottom: '0.6rem', fontSize: '0.8rem', color: '#7dd3fc' }}>
            Session-Filter aktiv: <strong>{sessionFilter}</strong>
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
          {leagues.length > 0 && (
            <select value={filterLeague} onChange={e => setFilterLeague(e.target.value)} style={selectStyle}>
              <option value="">Alle Ligen</option>
              {leagues.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          )}
          {seasons.length > 0 && (
            <select value={filterSeason} onChange={e => setFilterSeason(e.target.value)} style={selectStyle}>
              <option value="">Alle Saisons</option>
              {seasons.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          {teams.length > 0 && (
            <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)} style={selectStyle}>
              <option value="">Alle Teams</option>
              {teams.map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}
            </select>
          )}
          {tracks.length > 0 && (
            <select value={filterTrack} onChange={e => setFilterTrack(e.target.value)} style={selectStyle}>
              <option value="">Alle Module</option>
              {tracks.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          {drills.length > 0 && (
            <select value={filterDrill} onChange={e => setFilterDrill(e.target.value)} style={selectStyle}>
              <option value="">Alle Drills</option>
              {drills.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
          {hasActiveFilter && (
            <button
              type="button"
              onClick={resetFilters}
              style={{
                padding: '0.4rem 0.8rem', borderRadius: '0.4rem',
                border: '1px solid #475569', background: 'transparent',
                color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem',
              }}
            >
              ✕ Filter zurücksetzen
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading && <div className="card">Lade Szenen…</div>}
      {error && <div className="card" style={{ color: '#f87171' }}>Fehler beim Laden der Szenen.</div>}

      {!isLoading && !error && scenes.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎬</div>
          <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>Noch keine Szenen gespeichert</div>
          <div style={{ fontSize: '0.85rem' }}>
            Während eines Drills kannst du mit dem Button „🎬 Szene merken" interessante Momente für Rink About It festhalten.
          </div>
        </div>
      )}

      {!isLoading && !error && scenes.length > 0 && filtered.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b' }}>
          Keine Szenen für die gewählten Filter.
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {filtered.map(scene => (
            <SceneCard key={scene.id} scene={scene} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div style={{ color: '#64748b', fontSize: '0.8rem', textAlign: 'center' }}>
          {filtered.length} von {scenes.length} Szene{scenes.length !== 1 ? 'n' : ''}
        </div>
      )}
    </div>
  )
}

function SceneCard({ scene, onDelete }: { scene: SceneMarker; onDelete: (id: string) => void }) {
  const gameLabel = scene.team_home && scene.team_away
    ? `${scene.team_home} vs ${scene.team_away}`
    : scene.team_home || scene.team_away || '–'

  const contextParts = [
    scene.league,
    scene.season,
  ].filter(Boolean).join(' · ')

  // Extract drill number suffix, e.g. "B1_D4" -> "D4", "A1_D1" -> "D1"
  const drillSuffix = scene.drill_id
    ? (scene.drill_id.match(/_(D\d+)$/i)?.[1] ?? scene.drill_id)
    : null

  return (
    <div
      id={`scene-${scene.id}`}
      className="card"
      style={{
        padding: '1rem 1.1rem',
        borderLeft: '3px solid #4fc3f7',
        display: 'flex', flexDirection: 'column', gap: '0.6rem',
      }}
    >
      {/* PRIMARY: Teams + delete */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#e2e8f0', lineHeight: 1.3 }}>
          {gameLabel}
        </div>
        <button
          type="button"
          onClick={() => onDelete(scene.id)}
          title="Szene löschen"
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: '#475569', fontSize: '1rem', padding: '0 0.2rem', lineHeight: 1,
            flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
          onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
        >
          ✕
        </button>
      </div>

      {/* PRIMARY: Drittel + Minute */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#cbd5e1' }}>
          {periodLabel(scene.period)}
        </span>
        <span style={{
          background: '#1e293b', borderRadius: '0.35rem', padding: '0.2rem 0.65rem',
          fontSize: '1.1rem', fontWeight: 800, color: '#4fc3f7',
          letterSpacing: '0.05em',
        }}>
          {scene.game_time}
        </span>
      </div>

      {/* Note */}
      {scene.note && (
        <div style={{
          background: 'rgba(79, 195, 247, 0.07)', borderRadius: '0.35rem',
          padding: '0.45rem 0.65rem', fontSize: '0.88rem', color: '#e2e8f0',
          fontStyle: 'italic', lineHeight: 1.5,
        }}>
          „{scene.note}"
        </div>
      )}

      {/* SECONDARY: Module / Drill pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', alignItems: 'center' }}>
        {scene.module_id && (
          <span style={{
            background: 'rgba(99,102,241,0.18)', color: '#a5b4fc',
            borderRadius: '0.3rem', padding: '0.1rem 0.45rem',
            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em',
          }}>
            {scene.module_id}
          </span>
        )}
        {drillSuffix && (
          <span style={{
            background: 'rgba(34,197,94,0.13)', color: '#86efac',
            borderRadius: '0.3rem', padding: '0.1rem 0.45rem',
            fontSize: '0.72rem', fontWeight: 700,
          }}>
            {drillSuffix}
          </span>
        )}
        {scene.drill_title && (
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
            {scene.drill_title}
          </span>
        )}
      </div>

      {/* Footer: Liga · Saison + Datum */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#475569', marginTop: 'auto', paddingTop: '0.1rem' }}>
        <span>{contextParts}</span>
        <span style={{ display: 'inline-flex', gap: '0.6rem', alignItems: 'center' }}>
          <a
            href={`/session/${scene.session_id}`}
            style={{ color: '#7dd3fc', textDecoration: 'none', fontWeight: 600 }}
          >
            Zur Session
          </a>
          <span>{formatDate(scene.created_at)}</span>
        </span>
      </div>
    </div>
  )
}
