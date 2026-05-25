import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api, type RosterCatalog, type RosterPlayer, type RosterTeam } from '../api'
import { useUser } from '../context/UserContext'

export default function ObservationSetup() {
  const navigate = useNavigate()
  const { user } = useUser()

  const { data: rosterIndex, isLoading: indexLoading, error: indexError } = useQuery({
    queryKey: ['roster-index'],
    queryFn: () => api.getRosters(),
    enabled: Boolean(user)
  })

  const [league, setLeague] = useState('DEL')
  const [season, setSeason] = useState('2025_2026')

  const rosterOptions = rosterIndex?.rosters || []

  useEffect(() => {
    if (!rosterOptions.length) return
    const preferred = rosterOptions.find((item) => item.league === 'DEL' && item.season === '2025_2026')
    const first = preferred || rosterOptions[0]
    setLeague(first.league)
    setSeason(first.season)
  }, [rosterOptions])

  const { data: roster, isLoading: rosterLoading, error: rosterError } = useQuery<RosterCatalog>({
    queryKey: ['roster', league, season],
    queryFn: () => api.getRoster(league, season),
    enabled: Boolean(user && league && season)
  })

  const [teamId, setTeamId] = useState('')
  const [playerId, setPlayerId] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!roster?.teams?.length) return
    setTeamId((prev) => prev || roster.teams[0].team_id)
  }, [roster])

  const selectedTeam = useMemo<RosterTeam | undefined>(
    () => roster?.teams.find((team) => team.team_id === teamId),
    [roster, teamId]
  )

  useEffect(() => {
    if (!selectedTeam?.players?.length) {
      setPlayerId('')
      return
    }
    const hasExisting = selectedTeam.players.some((player) => player.player_id === playerId)
    if (!hasExisting) {
      setPlayerId(selectedTeam.players[0].player_id)
    }
  }, [selectedTeam, playerId])

  const selectedPlayer = useMemo<RosterPlayer | undefined>(
    () => selectedTeam?.players.find((player) => player.player_id === playerId),
    [selectedTeam, playerId]
  )

  const createRunMutation = useMutation({
    mutationFn: () => {
      if (!selectedTeam || !selectedPlayer) {
        throw new Error('Bitte Team und Spieler auswaehlen.')
      }
      return api.createObservationRun({
        league,
        season,
        team_id: selectedTeam.team_id,
        team_name: selectedTeam.name,
        player_id: selectedPlayer.player_id,
        player_name: selectedPlayer.name,
        player_number: selectedPlayer.number,
        player_position: selectedPlayer.position,
        notes
      })
    },
    onSuccess: (run) => {
      navigate(`/observation/run/${run.run_id}`)
    }
  })

  if (!user) {
    return <div className="card">Bitte zuerst einloggen, um Observation Runs zu starten.</div>
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div className="card">
        <h1>Player Observation Setup</h1>
        <p>Waehle Liga, Saison, Team und Spieler. Danach startet ein eigener Observation Run.</p>
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
            disabled={indexLoading}
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
          <select
            className="appSelect"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            style={{ marginTop: '0.35rem' }}
            disabled={rosterLoading}
          >
            {(roster?.teams || []).map((team) => (
              <option key={team.team_id} value={team.team_id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Spieler
          <select
            className="appSelect"
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            style={{ marginTop: '0.35rem' }}
            disabled={rosterLoading || !selectedTeam}
          >
            {(selectedTeam?.players || []).map((player) => (
              <option key={player.player_id} value={player.player_id}>
                #{player.number ?? '-'} {player.name} ({player.position})
              </option>
            ))}
          </select>
        </label>

        <label>
          Run Notiz (optional)
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            style={{ width: '100%', marginTop: '0.25rem' }}
            placeholder="Kurznotiz zum Run"
          />
        </label>

        {selectedPlayer && (
          <p style={{ margin: 0 }}>
            Ausgewaehlt: #{selectedPlayer.number ?? '-'} {selectedPlayer.name} ({selectedPlayer.position})
          </p>
        )}

        {indexError && <p style={{ color: '#ff8080' }}>Fehler Roster-Index: {(indexError as Error).message}</p>}
        {rosterError && <p style={{ color: '#ff8080' }}>Fehler Roster: {(rosterError as Error).message}</p>}
        {createRunMutation.isError && (
          <p style={{ color: '#ff8080' }}>Run konnte nicht erstellt werden: {(createRunMutation.error as Error).message}</p>
        )}

        <button
          className="btn"
          onClick={() => createRunMutation.mutate()}
          disabled={createRunMutation.isPending || !selectedTeam || !selectedPlayer}
        >
          {createRunMutation.isPending ? 'Erstelle Run...' : 'Observation Run starten'}
        </button>
      </div>
    </div>
  )
}
