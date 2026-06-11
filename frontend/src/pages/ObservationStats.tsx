import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, type ObservationPlayerStats, type RosterCatalog } from '../api'
import { useUser } from '../context/UserContext'

type SelectableTeam = { team_id: string; name: string; league: string; source: 'roster' | 'import' }

function formatDimensionLabel(key: string): string {
  return key
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default function ObservationStats() {
  const { user } = useUser()

  const { data: rosterIndex } = useQuery({
    queryKey: ['roster-index'],
    queryFn: () => api.getRosters(),
    enabled: Boolean(user)
  })

  const [league, setLeague] = useState('DEL')
  const [season, setSeason] = useState('2025_2026')
  const [teamId, setTeamId] = useState('')
  const [selectedPlayerId, setSelectedPlayerId] = useState('')

  const rosterOptions = rosterIndex?.rosters || []

  useEffect(() => {
    if (!rosterOptions.length) return
    const preferred = rosterOptions.find((item) => item.league === 'DEL' && item.season === '2025_2026')
    const first = preferred || rosterOptions[0]
    setLeague(first.league)
    setSeason(first.season)
  }, [rosterOptions])

  const { data: roster } = useQuery<RosterCatalog>({
    queryKey: ['roster', league, season],
    queryFn: () => api.getRoster(league, season),
    enabled: Boolean(user && league && season)
  })

  const { data: importableTeamsData } = useQuery({
    queryKey: ['importable-teams'],
    queryFn: () => api.getImportableTeams(),
    enabled: Boolean(user),
    staleTime: 5 * 60 * 1000,
  })

  const selectableTeams = useMemo<SelectableTeam[]>(() => {
    const merged: SelectableTeam[] = []
    const seen = new Set<string>()
    for (const team of roster?.teams || []) {
      const normalizedId = team.team_id.replace(/_/g, '-')
      if (seen.has(normalizedId)) continue
      seen.add(normalizedId)
      merged.push({ team_id: team.team_id, name: team.name, league, source: 'roster' })
    }
    for (const team of importableTeamsData?.teams || []) {
      if (seen.has(team.id)) continue
      seen.add(team.id)
      merged.push({ team_id: team.id, name: team.name, league: team.league, source: 'import' })
    }
    return merged
  }, [roster?.teams, importableTeamsData?.teams, league])

  useEffect(() => {
    if (!selectableTeams.length) { setTeamId(''); return }
    const match = selectableTeams.some((team) => team.team_id === teamId)
    if (!match) setTeamId(selectableTeams[0].team_id)
  }, [selectableTeams, teamId])

  const selectedTeam = useMemo<SelectableTeam | undefined>(
    () => selectableTeams.find((team) => team.team_id === teamId),
    [selectableTeams, teamId]
  )

  const statsParams = useMemo(() => ({
    league,
    season,
    team_id: teamId || undefined
  }), [league, season, teamId])

  const { data: statsResp, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['observation-stats', statsParams],
    queryFn: () => api.getObservationStats(statsParams),
    enabled: Boolean(user && league && season)
  })

  const players = statsResp?.players || []

  useEffect(() => {
    if (!players.length) {
      setSelectedPlayerId('')
      return
    }
    const existing = players.some((player) => player.player_id === selectedPlayerId)
    if (!existing) {
      setSelectedPlayerId(players[0].player_id)
    }
  }, [players, selectedPlayerId])

  const selectedPlayer = useMemo<ObservationPlayerStats | undefined>(
    () => players.find((player) => player.player_id === selectedPlayerId),
    [players, selectedPlayerId]
  )

  const { data: playerDetail } = useQuery({
    queryKey: ['observation-player-stats', selectedPlayerId, statsParams],
    queryFn: () => api.getObservationStatsForPlayer(selectedPlayerId, statsParams),
    enabled: Boolean(selectedPlayerId)
  })

  const profile = playerDetail?.profile

  const handleExportRaw = () => {
    if (!playerDetail) return
    const blob = new Blob([JSON.stringify(playerDetail.observations, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${selectedPlayerId}_raw_observations.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  if (!user) {
    return <div className="card">Bitte zuerst einloggen, um Observation Stats zu sehen.</div>
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div className="card">
        <h1>Observation Stats</h1>
        <p>Filtere nach Liga, Team und Spieler. Die Player Card basiert auf den gespeicherten Raw Observations.</p>
      </div>

      <div className="card" style={{ display: 'grid', gap: '0.75rem' }}>
        <label>
          Liga/Saison
          <select
            className="appSelect"
            value={`${league}__${season}`}
            onChange={(e) => {
              const [nextLeague, nextSeason] = e.target.value.split('__')
              setLeague(nextLeague)
              setSeason(nextSeason)
            }}
            style={{ marginTop: '0.35rem' }}
          >
            {rosterOptions.map((item) => (
              <option key={`${item.league}-${item.season}`} value={`${item.league}__${item.season}`}>
                {item.league} {item.season}
              </option>
            ))}
          </select>
        </label>

        <label>
          Team
          <select className="appSelect" value={teamId} onChange={(e) => setTeamId(e.target.value)} style={{ marginTop: '0.35rem' }}>
            <option value="">Alle Teams</option>
            {selectableTeams.map((team) => (
              <option key={team.team_id} value={team.team_id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>

        {selectedTeam && (
          <p style={{ margin: 0, opacity: 0.7, fontSize: '0.82rem' }}>
            {selectedTeam.name} · {selectedTeam.league}
          </p>
        )}
      </div>

      <div className="card">
        <h2>Spielerliste</h2>
        {statsLoading && <p>Lade Observation Stats...</p>}
        {statsError && <p style={{ color: '#ff8080' }}>Fehler: {(statsError as Error).message}</p>}
        {!statsLoading && players.length === 0 && <p>Keine Beobachtungen fuer den aktuellen Filter.</p>}
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {players.map((player) => (
            <button
              key={player.player_id}
              className="btn"
              style={{
                textAlign: 'left',
                background: player.player_id === selectedPlayerId ? '#80e0fa' : '#5191a2'
              }}
              onClick={() => setSelectedPlayerId(player.player_id)}
            >
              {player.player_name} ({player.player_position}) - {player.observation_count} Beobachtungen
            </button>
          ))}
        </div>
      </div>

      {selectedPlayer && (
        <div className="card">
          <h2>Player Card</h2>
          <p style={{ margin: '0.25rem 0' }}><strong>Name:</strong> {selectedPlayer.player_name}</p>
          <p style={{ margin: '0.25rem 0' }}><strong>Team:</strong> {selectedPlayer.team_name}</p>
          <p style={{ margin: '0.25rem 0' }}><strong>Position:</strong> {selectedPlayer.player_position}</p>
          <p style={{ margin: '0.25rem 0' }}><strong>Observation Count:</strong> {selectedPlayer.observation_count}</p>
          <p style={{ margin: '0.25rem 0' }}><strong>Erste Beobachtung:</strong> {selectedPlayer.first_observation || '-'}</p>
          <p style={{ margin: '0.25rem 0' }}><strong>Letzte Beobachtung:</strong> {selectedPlayer.last_observation || '-'}</p>
          {typeof selectedPlayer.observation_session_count === 'number' && (
            <p style={{ margin: '0.25rem 0' }}><strong>Observation Sessions:</strong> {selectedPlayer.observation_session_count}</p>
          )}

          {profile && (
            <>
              <h3>Spielerprofil</h3>
              <p style={{ margin: '0.25rem 0' }}><strong>Geburtsjahr:</strong> {profile.player_birth_year ?? '-'}</p>
              <p style={{ margin: '0.25rem 0' }}><strong>Profil-Notiz:</strong> {profile.notes || '-'}</p>
              <p style={{ margin: '0.25rem 0' }}><strong>Summary:</strong> {profile.summary?.text || '(Placeholder)'}</p>
              <p style={{ margin: '0.25rem 0' }}><strong>Summary Status:</strong> {profile.summary?.status || '-'}</p>
            </>
          )}

          <h3>Dimensionen</h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {Object.entries(selectedPlayer.dimension_stats || {}).map(([dimensionKey, values]) => {
              const modeValue = values.mode
              const filtered = Object.entries(values).filter(([key]) => key !== 'mode')
              return (
                <div key={dimensionKey} style={{ border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '0.75rem' }}>
                  <strong>{formatDimensionLabel(dimensionKey)}</strong>
                  <p style={{ margin: '0.25rem 0' }}>Mode: {String(modeValue || '-')}</p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {filtered.map(([value, count]) => (
                      <span key={value} style={{ padding: '0.2rem 0.45rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 999 }}>
                        {value}: {String(count)}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: '1rem' }}>
            <button className="btn" onClick={handleExportRaw} disabled={!playerDetail?.observations?.length}>
              Raw JSON exportieren
            </button>
          </div>

          {profile?.history?.note_timeline?.length ? (
            <>
              <h3 style={{ marginTop: '1rem' }}>Verlauf der Notizen</h3>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {profile.history.note_timeline.slice().reverse().slice(0, 12).map((item, index) => (
                  <div key={`${item.run_id}-${item.entry_id || 'run'}-${index}`} style={{ border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '0.6rem' }}>
                    <strong>{new Date(item.created_at).toLocaleString()}</strong>
                    <p style={{ margin: '0.35rem 0 0.2rem 0' }}>{item.note}</p>
                    <small>Quelle: {item.source?.label || item.source?.source_type || '-'}</small>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}
