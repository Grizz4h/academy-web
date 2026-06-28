import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { api, type SceneMarker } from '../api'
import { formatCompetitionContext, getCompetitionConfig } from '../data/competitionConfig'

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


function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}

function getSceneTrack(scene: SceneMarker) {
  return scene.track_id || scene.module_id?.split('_')[0] || ''
}

function sceneStatusLabel(status?: string) {
  if (status === 'ASSIGNED') return 'Zugeordnet'
  return 'Neu'
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

  const updateMutation = useMutation({
    mutationFn: ({
      sceneId,
      gameTime,
      note,
      episodeSeason,
      episodeNumber,
      overwriteEpisode,
    }: {
      sceneId: string
      gameTime: string
      note: string
      episodeSeason?: string
      episodeNumber?: string
      overwriteEpisode?: boolean
    }) =>
      api.updateScene(sceneId, {
        game_time: gameTime,
        note,
        episode_season: episodeSeason,
        episode_number: episodeNumber,
        overwrite_episode: overwriteEpisode,
      }),
    onSuccess: (updatedScene) => {
      queryClient.setQueryData<{ scenes: SceneMarker[] }>(['scenes'], (current) => {
        if (!current?.scenes) return current
        return {
          ...current,
          scenes: current.scenes.map((scene) => (scene.id === updatedScene.id ? { ...scene, ...updatedScene } : scene)),
        }
      })
      queryClient.invalidateQueries({ queryKey: ['scenes'] })
    },
  })

  const handleDelete = (sceneId: string) => {
    if (!window.confirm('Szene löschen?')) return
    deleteMutation.mutate(sceneId)
  }

  const [editingSceneId, setEditingSceneId] = useState<string | null>(null)
  const [editGameTime, setEditGameTime] = useState('')
  const [editNote, setEditNote] = useState('')
  const [editEpisodeSeason, setEditEpisodeSeason] = useState('')
  const [editEpisodeNumber, setEditEpisodeNumber] = useState('')
  const [editError, setEditError] = useState<string | null>(null)

  const handleEditOpen = (scene: SceneMarker) => {
    setEditingSceneId(scene.id)
    setEditGameTime(scene.game_time)
    setEditNote(scene.note || '')
    setEditEpisodeSeason(scene.episode_season || '')
    setEditEpisodeNumber(scene.episode_number || '')
    setEditError(null)
  }

  const handleEditClose = () => {
    setEditingSceneId(null)
    setEditGameTime('')
    setEditNote('')
    setEditEpisodeSeason('')
    setEditEpisodeNumber('')
    setEditError(null)
  }

  const handleEditSave = async () => {
    const trimmed = editGameTime.trim()
    if (!trimmed) {
      setEditError('Bitte Spielzeit eingeben')
      return
    }
    if (!/^\d{1,2}(:\d{1,2})?$/.test(trimmed)) {
      setEditError('Bitte eine Spielzeit eingeben – maximal 4 Ziffern, z. B. 13:42')
      return
    }

    const trimmedEpisodeSeason = editEpisodeSeason.trim()
    const trimmedEpisodeNumber = editEpisodeNumber.trim()
    if (!trimmedEpisodeSeason && trimmedEpisodeNumber) {
      setEditError('Bitte erst eine Staffel angeben, bevor du eine Episode zuordnest.')
      return
    }
    if (trimmedEpisodeSeason && !trimmedEpisodeNumber) {
      setEditError('Bitte auch eine Episodennummer angeben oder beide Felder leeren.')
      return
    }

    if (editingSceneId) {
      try {
        await updateMutation.mutateAsync({
          sceneId: editingSceneId,
          gameTime: trimmed,
          note: editNote.trim(),
          episodeSeason: trimmedEpisodeSeason,
          episodeNumber: trimmedEpisodeNumber,
        })
        handleEditClose()
      } catch (err: any) {
        if (err?.status === 409) {
          const conflictMessage = err?.message || 'Episode ist bereits vergeben.'
          if (window.confirm(`${conflictMessage} Trotzdem überschreiben?`)) {
            try {
              await updateMutation.mutateAsync({
                sceneId: editingSceneId,
                gameTime: trimmed,
                note: editNote.trim(),
                episodeSeason: trimmedEpisodeSeason,
                episodeNumber: trimmedEpisodeNumber,
                overwriteEpisode: true,
              })
              handleEditClose()
              return
            } catch {
              setEditError('Fehler beim Überschreiben')
              return
            }
          }
          setEditError(conflictMessage)
          return
        }
        setEditError(err?.message || 'Fehler beim Speichern')
      }
    }
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEditSave()
    }
    if (e.key === 'Escape') {
      handleEditClose()
    }
  }

  const scenes: SceneMarker[] = data?.scenes ?? []

  // Derive filter options from data
  const leagues = useMemo(() => unique(scenes.map(s => s.league).filter(Boolean) as string[]).sort(), [scenes])
  const seasons = useMemo(() => unique(scenes.map(s => s.season).filter(Boolean) as string[]).sort().reverse(), [scenes])
  const episodeSeasons = useMemo(() => unique(scenes.map(s => s.episode_season).filter(Boolean) as string[]).sort().reverse(), [scenes])
  const teams = useMemo(() => {
    const all: string[] = []
    for (const s of scenes) {
      if (s.team_home) all.push(s.team_home)
      if (s.team_away) all.push(s.team_away)
    }
    return unique(all).sort()
  }, [scenes])

  const [filterLeague, setFilterLeague] = useState('')
  const [filterSeason, setFilterSeason] = useState('')
  const [filterTeam, setFilterTeam] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterTrack, setFilterTrack] = useState('')
  const [filterDrill, setFilterDrill] = useState('')
  const [filterCompetitionPhase, setFilterCompetitionPhase] = useState('')
  const [filterCompetitionUnitType, setFilterCompetitionUnitType] = useState('')
  const [filterCompetitionUnitValue, setFilterCompetitionUnitValue] = useState('')
  const [filterEpisodeSeason, setFilterEpisodeSeason] = useState('')

  const tracks = useMemo(() => unique(scenes.map(s => getSceneTrack(s)).filter(Boolean)).sort(), [scenes])
  const drills = useMemo(() => unique((filterTrack ? scenes.filter((scene) => getSceneTrack(scene) === filterTrack) : scenes).map(s => s.drill_id).filter(Boolean) as string[]).sort(), [scenes, filterTrack])
  const competitionConfig = useMemo(() => getCompetitionConfig(filterLeague), [filterLeague])
  const competitionPhases = competitionConfig?.phases ?? []
  const selectedCompetitionPhase = competitionPhases.find((phase) => phase.id === filterCompetitionPhase)
  const competitionUnits = useMemo(() => {
    if (!selectedCompetitionPhase) return []
    return Array.from(
      { length: selectedCompetitionPhase.unit.max - selectedCompetitionPhase.unit.min + 1 },
      (_, index) => {
        const value = String(selectedCompetitionPhase.unit.min + index)
        return {
          value,
          label: selectedCompetitionPhase.unit.label + ' ' + value,
          type: selectedCompetitionPhase.unit.type,
        }
      }
    )
  }, [selectedCompetitionPhase])

  useEffect(() => {
    if (!filterTrack) return
    if (filterDrill && !drills.includes(filterDrill)) {
      setFilterDrill('')
    }
  }, [filterTrack, filterDrill, drills])

  useEffect(() => {
    if (!filterCompetitionPhase) return
    if (!competitionPhases.some((phase) => phase.id === filterCompetitionPhase)) {
      setFilterCompetitionPhase('')
      setFilterCompetitionUnitType('')
      setFilterCompetitionUnitValue('')
    }
  }, [filterCompetitionPhase, competitionPhases])

  useEffect(() => {
    if (!selectedCompetitionPhase) return
    setFilterCompetitionUnitType(selectedCompetitionPhase.unit.type)
    if (filterCompetitionUnitValue && !competitionUnits.some((unit) => unit.value === filterCompetitionUnitValue)) {
      setFilterCompetitionUnitValue('')
    }
  }, [selectedCompetitionPhase, competitionUnits, filterCompetitionUnitValue])

  const filtered = useMemo(() => {
    return scenes.filter(s => {
      if (sessionFilter && s.session_id !== sessionFilter) return false
      if (filterLeague && s.league !== filterLeague) return false
      if (filterSeason && s.season !== filterSeason) return false
      if (filterStatus && (s.status || 'NEW') !== filterStatus) return false
      if (filterTeam) {
        const t = filterTeam.toLowerCase()
        const matchHome = (s.team_home ?? '').toLowerCase() === t
        const matchAway = (s.team_away ?? '').toLowerCase() === t
        const matchObs = (s.observed_team ?? '').toLowerCase() === t
        if (!matchHome && !matchAway && !matchObs) return false
      }
      if (filterTrack && getSceneTrack(s) !== filterTrack) return false
      if (filterDrill && s.drill_id !== filterDrill) return false
      if (filterCompetitionPhase && s.competition_phase !== filterCompetitionPhase) return false
      if (filterCompetitionUnitType && s.competition_unit_type !== filterCompetitionUnitType) return false
      if (filterCompetitionUnitValue && String(s.competition_unit_value || '') !== filterCompetitionUnitValue) return false
      if (filterEpisodeSeason && (s.episode_season || '') !== filterEpisodeSeason) return false
      return true
    })
  }, [scenes, sessionFilter, filterLeague, filterSeason, filterTeam, filterStatus, filterTrack, filterDrill, filterCompetitionPhase, filterCompetitionUnitType, filterCompetitionUnitValue, filterEpisodeSeason])

  const hasActiveFilter = sessionFilter || filterLeague || filterSeason || filterTeam || filterStatus || filterTrack || filterDrill || filterCompetitionPhase || filterCompetitionUnitValue || filterEpisodeSeason

  const resetFilters = () => {
    setFilterLeague('')
    setFilterSeason('')
    setFilterTeam('')
    setFilterStatus('')
    setFilterTrack('')
    setFilterDrill('')
    setFilterCompetitionPhase('')
    setFilterCompetitionUnitType('')
    setFilterCompetitionUnitValue('')
    setFilterEpisodeSeason('')
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
            <select
              value={filterLeague}
              onChange={e => {
                setFilterLeague(e.target.value)
                setFilterCompetitionPhase('')
                setFilterCompetitionUnitType('')
                setFilterCompetitionUnitValue('')
              }}
              style={selectStyle}
            >
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
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selectStyle}>
            <option value="">Alle Status</option>
            <option value="NEW">Neu</option>
            <option value="ASSIGNED">Zugeordnet</option>
          </select>
          {teams.length > 0 && (
            <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)} style={selectStyle}>
              <option value="">Alle Teams</option>
              {teams.map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}
            </select>
          )}
          {tracks.length > 0 && (
            <select value={filterTrack} onChange={e => setFilterTrack(e.target.value)} style={selectStyle}>
              <option value="">Alle Tracks</option>
              {tracks.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          {drills.length > 0 && (
            <select value={filterDrill} onChange={e => setFilterDrill(e.target.value)} style={selectStyle}>
              <option value="">Alle Drills</option>
              {drills.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
          {competitionPhases.length > 0 && (
            <select
              value={filterCompetitionPhase}
              onChange={e => {
                setFilterCompetitionPhase(e.target.value)
                const nextPhase = competitionPhases.find((phase) => phase.id === e.target.value)
                setFilterCompetitionUnitType(nextPhase?.unit.type || '')
                setFilterCompetitionUnitValue('')
              }}
              style={selectStyle}
            >
              <option value="">Alle Phasen</option>
              {competitionPhases.map((phase) => <option key={phase.id} value={phase.id}>{phase.label}</option>)}
            </select>
          )}
          {selectedCompetitionPhase && competitionUnits.length > 0 && (
            <select
              value={filterCompetitionUnitValue}
              onChange={e => {
                setFilterCompetitionUnitType(selectedCompetitionPhase.unit.type)
                setFilterCompetitionUnitValue(e.target.value)
              }}
              style={selectStyle}
            >
              <option value="">Alle {selectedCompetitionPhase.unit.label}</option>
              {competitionUnits.map((unit) => <option key={unit.value} value={unit.value}>{unit.label}</option>)}
            </select>
          )}
          {episodeSeasons.length > 0 && (
            <select value={filterEpisodeSeason} onChange={e => setFilterEpisodeSeason(e.target.value)} style={selectStyle}>
              <option value="">Alle Staffeln</option>
              {episodeSeasons.map(s => <option key={s} value={s}>{s}</option>)}
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
            <SceneCard key={scene.id} scene={scene} onDelete={handleDelete} onEdit={handleEditOpen} />
          ))}
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div style={{ color: '#64748b', fontSize: '0.8rem', textAlign: 'center' }}>
          {filtered.length} von {scenes.length} Szene{scenes.length !== 1 ? 'n' : ''}
        </div>
      )}

      {/* Edit Modal */}
      {editingSceneId && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.75)',
            zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={e => { if (e.target === e.currentTarget) handleEditClose() }}
        >
          <div
            className="card"
            style={{ maxWidth: 420, width: '92%', margin: '0 auto', padding: '1.5rem' }}
            onKeyDown={handleEditKeyDown}
          >
            <h3 style={{ margin: '0 0 0.3rem', fontSize: '1.2rem' }}>✏️ Szene bearbeiten</h3>

            {/* Game time input */}
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.95rem', marginTop: '1rem' }}>
              Minute <span style={{ color: '#f87171' }}>*</span>
            </label>
            <input
              type="text"
              value={editGameTime}
              onChange={e => {
                const raw = e.target.value.replace(/[^\d:]/g, '')
                const digits = raw.replace(/:/g, '').slice(0, 4)
                let formatted = digits
                if (digits.length > 2) {
                  formatted = digits.slice(0, 2) + ':' + digits.slice(2)
                }
                setEditGameTime(formatted)
              }}
              placeholder="z.B. 13:42"
              style={{
                width: '100%', padding: '0.6rem', borderRadius: '0.4rem',
                border: '1px solid #334155', background: '#0f172a', color: '#cbd5e1',
                fontSize: '1rem', fontFamily: 'monospace', boxSizing: 'border-box',
              }}
              autoFocus
            />

            {/* Note input */}
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.95rem', marginTop: '0.8rem' }}>
              Notiz
            </label>
            <textarea
              value={editNote}
              onChange={e => setEditNote(e.target.value)}
              placeholder="Optionale Notiz..."
              style={{
                width: '100%', padding: '0.6rem', borderRadius: '0.4rem',
                border: '1px solid #334155', background: '#0f172a', color: '#cbd5e1',
                fontSize: '0.95rem', fontFamily: 'monospace', boxSizing: 'border-box',
                minHeight: '4rem', resize: 'vertical',
              }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '0.9rem' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.92rem' }}>
                Staffel
                <input
                  type="text"
                  value={editEpisodeSeason}
                  onChange={e => setEditEpisodeSeason(e.target.value)}
                  placeholder="z. B. 1"
                  style={{
                    width: '100%', padding: '0.55rem', marginTop: '0.35rem', borderRadius: '0.4rem',
                    border: '1px solid #334155', background: '#0f172a', color: '#cbd5e1',
                    fontSize: '0.95rem', fontFamily: 'monospace', boxSizing: 'border-box',
                  }}
                />
              </label>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.92rem' }}>
                Episode
                <input
                  type="text"
                  value={editEpisodeNumber}
                  onChange={e => setEditEpisodeNumber(e.target.value)}
                  placeholder="z. B. 017"
                  style={{
                    width: '100%', padding: '0.55rem', marginTop: '0.35rem', borderRadius: '0.4rem',
                    border: '1px solid #334155', background: '#0f172a', color: '#cbd5e1',
                    fontSize: '0.95rem', fontFamily: 'monospace', boxSizing: 'border-box',
                  }}
                />
              </label>
            </div>

            <div style={{ marginTop: '0.55rem', fontSize: '0.8rem', color: '#94a3b8' }}>
              Wenn beide Felder gesetzt sind, wird die Szene als zugeordnet markiert.
            </div>

            {/* Error message */}
            {editError && (
              <div style={{ color: '#f87171', fontSize: '0.9rem', marginTop: '0.8rem' }}>
                {editError}
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.2rem' }}>
              <button
                type="button"
                onClick={handleEditClose}
                style={{
                  flex: 1, padding: '0.6rem', borderRadius: '0.4rem',
                  border: '1px solid #334155', background: 'transparent',
                  color: '#cbd5e1', cursor: 'pointer', fontWeight: 600,
                }}
                disabled={updateMutation.isPending}
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleEditSave}
                style={{
                  flex: 1, padding: '0.6rem', borderRadius: '0.4rem',
                  border: 'none', background: '#4fc3f7', color: '#0f172a',
                  cursor: 'pointer', fontWeight: 600,
                }}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Speichert...' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SceneCard({ scene, onDelete, onEdit }: { scene: SceneMarker; onDelete: (id: string) => void; onEdit: (scene: SceneMarker) => void }) {
  const gameLabel = scene.team_home && scene.team_away
    ? `${scene.team_home} vs ${scene.team_away}`
    : scene.team_home || scene.team_away || '–'

  const competitionContext = formatCompetitionContext(scene)

  // Extract drill number suffix, e.g. "B1_D4" -> "D4", "A1_D1" -> "D1"
  const drillSuffix = scene.drill_id
    ? (scene.drill_id.match(/_(D\d+)$/i)?.[1] ?? scene.drill_id)
    : null
  const episodeLabel = scene.episode_season && scene.episode_number
    ? `Staffel ${scene.episode_season} · Episode ${scene.episode_number}`
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
      {/* Begegnung */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#e2e8f0', lineHeight: 1.3 }}>
          {gameLabel}
        </div>
        <div style={{ display: 'flex', gap: '0.3rem' }}>
          <button
            type="button"
            onClick={() => onEdit(scene)}
            title="Szene bearbeiten"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#475569', fontSize: '1rem', padding: '0 0.2rem', lineHeight: 1,
              flexShrink: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#60a5fa')}
            onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
          >
            ✏️
          </button>
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
      </div>

      {/* Drittel + Spielzeit */}
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

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
        <span style={{
          background: scene.status === 'ASSIGNED' ? 'rgba(34,197,94,0.16)' : 'rgba(255,255,255,0.08)',
          color: scene.status === 'ASSIGNED' ? '#86efac' : '#cbd5e1',
          border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: '0.3rem',
          padding: '0.12rem 0.45rem',
          fontSize: '0.72rem',
          fontWeight: 700,
        }}>
          {sceneStatusLabel(scene.status)}
        </span>
        {episodeLabel && (
          <span style={{
            background: 'rgba(96,165,250,0.14)', color: '#bfdbfe',
            border: '1px solid rgba(96,165,250,0.22)',
            borderRadius: '0.3rem', padding: '0.12rem 0.45rem',
            fontSize: '0.72rem', fontWeight: 700,
          }}>
            {episodeLabel}
          </span>
        )}
      </div>

      {/* Eigene Notiz */}
      {scene.note && (
        <div style={{
          background: 'rgba(79, 195, 247, 0.07)', borderRadius: '0.35rem',
          padding: '0.45rem 0.65rem', fontSize: '0.88rem', color: '#e2e8f0',
          fontStyle: 'italic', lineHeight: 1.5,
        }}>
          „{scene.note}"
        </div>
      )}

      {scene.extensions && Object.keys(scene.extensions).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {Object.entries(scene.extensions).map(([key, value]) => (
            <span
              key={key}
              style={{
                background: 'rgba(20,184,166,0.12)', color: '#99f6e4',
                border: '1px solid rgba(45,212,191,0.24)',
                borderRadius: '0.3rem', padding: '0.16rem 0.5rem',
                fontSize: '0.74rem', fontWeight: 700,
              }}
            >
              {(scene.extension_labels && scene.extension_labels[key]) || key}: {value}
            </span>
          ))}
        </div>
      )}

      {/* Track + Drill */}
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

      {/* Wettbewerbskontext */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', fontSize: '0.78rem', color: '#94a3b8', marginTop: 'auto', paddingTop: '0.15rem' }}>
        <span style={{ color: '#cbd5e1', fontWeight: 650 }}>{competitionContext || 'Kein Wettbewerbskontext'}</span>
        <a
          href={'/session/' + scene.session_id}
          style={{ color: '#7dd3fc', textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          Zur Session
        </a>
      </div>
    </div>
  )
}
