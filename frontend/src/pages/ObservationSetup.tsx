import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { api, type KaderPlayer, type RosterCatalog, type RosterPlayer, type RosterTeam } from '../api'
import { useUser } from '../context/UserContext'
import { normalizeSeasonValue } from '../stats/seasonNormalization'

type SelectableTeam = {
  team_id: string
  name: string
  league?: string
  source: 'roster' | 'import'
  url?: string
  enabled?: boolean
  kader_available?: boolean
  kader_note?: string
}

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
  const seasonForApi = normalizeSeasonValue(season.replace('_', '/'), league) || season.replace('_', '/')

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
  const [playerBirthYear, setPlayerBirthYear] = useState('')
  const [playerProfileNotes, setPlayerProfileNotes] = useState('')
  const [drillId, setDrillId] = useState('DL1')
  const [sourceType, setSourceType] = useState('self_observation')
  const [sourceLabel, setSourceLabel] = useState('Eigene Beobachtung')

  const { data: importableTeamsData } = useQuery({
    queryKey: ['importable-teams'],
    queryFn: () => api.getImportableTeams(),
    enabled: Boolean(user),
    staleTime: 5 * 60 * 1000,
  })

  const importableTeams = importableTeamsData?.teams || []

  const importMetaByCatalogId = useMemo(() => {
    const map = new Map<string, { kader_available?: boolean; kader_note?: string }>()
    for (const team of importableTeams) {
      const catalogId = team.catalog_id || team.id
      map.set(catalogId, {
        kader_available: team.kader_available,
        kader_note: team.kader_note,
      })
    }
    return map
  }, [importableTeams])

  const selectableTeams = useMemo<SelectableTeam[]>(() => {
    // Season roster catalog is canonical — no duplicate merge with import list
    if (roster?.teams?.length) {
      return roster.teams.map((team) => {
        const importMeta = importMetaByCatalogId.get(team.team_id)
        return {
          team_id: team.team_id,
          name: team.name,
          league,
          source: 'roster' as const,
          kader_available: importMeta?.kader_available,
          kader_note: importMeta?.kader_note,
        }
      })
    }

    return importableTeams
      .filter((team) => team.enabled)
      .map((team) => ({
        team_id: team.catalog_id || team.id,
        name: team.name,
        league: team.league,
        source: 'import' as const,
        url: team.url,
        enabled: team.enabled,
        kader_available: team.kader_available,
        kader_note: team.kader_note,
      }))
  }, [importableTeams, importMetaByCatalogId, league, roster?.teams])

  // Lade Kader-Spieler wenn Team ausgewählt
  const [rosterMissing, setRosterMissing] = useState<string | null>(null)

  const { data: kaderPlayersData, isLoading: kaderLoading } = useQuery({
    queryKey: ['team-players', teamId, seasonForApi, league],
    queryFn: async () => {
      setRosterMissing(null)
      try {
        return await api.getTeamPlayers(teamId, true, { season: seasonForApi, league })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Kader nicht verfügbar'
        setRosterMissing(message)
        return {
          team_id: teamId,
          players: [],
          total: 0,
          updated_at: new Date().toISOString(),
        }
      }
    },
    enabled: Boolean(user && teamId),
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (!selectableTeams.length) return
    setTeamId((prev) => prev || selectableTeams[0].team_id)
  }, [selectableTeams])

  const selectedTeam = useMemo<SelectableTeam | undefined>(
    () => selectableTeams.find((team) => team.team_id === teamId),
    [selectableTeams, teamId]
  )

  const selectedRosterTeam = useMemo<RosterTeam | undefined>(
    () => roster?.teams.find((team) => team.team_id === teamId),
    [roster, teamId]
  )

  // Kombiniere Roster-Spieler mit Kader-Spielern
  const combinedPlayers = useMemo<RosterPlayer[]>(() => {
    if (kaderPlayersData?.players && kaderPlayersData.players.length > 0) {
      return kaderPlayersData.players.map((p) => ({
        player_id: p.player_id,
        name: p.player_name,
        number: p.jersey_number,
        position: p.position || 'Unknown',
      }))
    }
    if (selectedRosterTeam?.players?.length) {
      return selectedRosterTeam.players
    }
    return []
  }, [kaderPlayersData, selectedRosterTeam])

  useEffect(() => {
    if (!combinedPlayers.length) {
      setPlayerId('')
      return
    }
    const hasExisting = combinedPlayers.some((player) => player.player_id === playerId)
    if (!hasExisting) {
      setPlayerId(combinedPlayers[0].player_id)
    }
  }, [combinedPlayers, playerId])

  const selectedPlayer = useMemo<RosterPlayer | undefined>(
    () => combinedPlayers.find((player) => player.player_id === playerId),
    [combinedPlayers, playerId]
  )

  const selectedKaderPlayer = useMemo<KaderPlayer | undefined>(
    () => kaderPlayersData?.players.find((p) => p.player_id === playerId),
    [kaderPlayersData, playerId]
  )

  const createRunMutation = useMutation({
    mutationFn: () => {
      if (!selectedTeam || !selectedPlayer) {
        throw new Error('Bitte Team und Spieler auswaehlen.')
      }
      return api.createObservationRun({
        league: selectedTeam.league || league,
        season: seasonForApi,
        team_id: selectedTeam.team_id,
        team_name: selectedTeam.name,
        player_id: selectedPlayer.player_id,
        player_name: selectedPlayer.name,
        player_number: selectedPlayer.number,
        player_position: selectedPlayer.position || 'Unknown',
        player_birth_year: playerBirthYear.trim() ? Number(playerBirthYear.trim()) : undefined,
        player_notes: playerProfileNotes,
        drill_id: drillId,
        drill_name: drillId,
        source: {
          source_type: sourceType,
          provider: sourceType === 'self_observation' ? 'manual' : 'external',
          label: sourceLabel.trim() || 'Eigene Beobachtung'
        },
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

  const posGroupLabel: Record<string, string> = { forward: 'Stürmer', defense: 'Verteidiger', goalie: 'Torhüter' }

  return (
    <div className="ui-page-shell" style={{ display: 'grid', gap: '1rem' }}>
      <header className="ui-page-header">
        <h1 className="ui-page-title">Observation Setup</h1>
        <p className="ui-page-lead">Beobachtungslauf konfigurieren und starten.</p>
      </header>

      {/* ── Haupt-Layout: Form + Player-Info ── */}
      <div className="ui-grid-2 ui-grid-2--wide" style={{ alignItems: 'start', gap: '1rem' }}>

        {/* ─ Linke Spalte: Auswahl-Form ─ */}
        <div className="card ui-surface ui-surface--primary primary-card" style={{ display: 'grid', gap: '0.85rem' }}>
          <h2 className="ui-section-title">Beobachtung starten</h2>

          <label style={{ display: 'grid', gap: '0.3rem', fontSize: '0.85rem' }}>
            Liga / Saison
            <select className="appSelect" value={`${league}__${season}`}
              onChange={(e) => {
                const [nextLeague, nextSeason] = e.target.value.split('__')
                setLeague(nextLeague); setSeason(nextSeason)
              }}
              disabled={indexLoading}
            >
              {rosterOptions.map((item) => (
                <option key={`${item.league}-${item.season}`} value={`${item.league}__${item.season}`}>
                  {item.league} {item.season}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'grid', gap: '0.3rem', fontSize: '0.85rem' }}>
            Team
            <select className="appSelect" value={teamId} onChange={(e) => setTeamId(e.target.value)} disabled={!selectableTeams.length}>
              {selectableTeams.map((team) => (
                <option key={team.team_id} value={team.team_id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'grid', gap: '0.3rem', fontSize: '0.85rem' }}>
            Spieler · Kader {seasonForApi}
            {kaderLoading
              ? <p style={{ margin: 0, opacity: 0.7, fontSize: '0.8rem' }}>Lade Kader…</p>
              : <select className="appSelect" value={playerId} onChange={(e) => setPlayerId(e.target.value)} disabled={rosterLoading || !selectedTeam || combinedPlayers.length === 0}>
                  {combinedPlayers.map((player) => (
                    <option key={player.player_id} value={player.player_id}>
                      #{player.number ?? '-'} {player.name} ({player.position})
                    </option>
                  ))}
                </select>
            }
            {selectedTeam?.kader_available === false && (
              <span style={{ fontSize: '0.78rem', color: 'rgba(255, 193, 7, 0.95)' }}>
                {selectedTeam.kader_note || 'Kader bei PENNY-DEL noch nicht veröffentlicht — Import folgt, sobald die Kader-Seite online ist.'}
              </span>
            )}
            {rosterMissing && selectedTeam?.kader_available !== false && (
              <span style={{ fontSize: '0.78rem', color: 'rgba(255, 193, 7, 0.95)' }}>
                {rosterMissing}
              </span>
            )}
            {!rosterMissing && selectedTeam?.kader_available !== false && !kaderLoading && combinedPlayers.length === 0 && (
              <span style={{ fontSize: '0.78rem', opacity: 0.7 }}>
                Für {seasonForApi} ist noch kein Kader importiert —{' '}
                <Link to="/dev" style={{ color: 'rgba(153, 246, 228, 0.95)' }}>Dev Cockpit → DEL Data</Link>.
              </span>
            )}
            {kaderPlayersData?.fallback && (
              <span style={{ fontSize: '0.78rem', color: 'rgba(255, 193, 7, 0.95)' }}>
                ⚠ Kader aus {kaderPlayersData.fallback_season} angezeigt — für {seasonForApi} kein Snapshot vorhanden.
              </span>
            )}
            {kaderPlayersData?.quality && kaderPlayersData.quality !== 'plausible' && (
              <span style={{ fontSize: '0.78rem', color: 'rgba(255, 193, 7, 0.9)' }}>
                Kader-Status: {kaderPlayersData.quality}
              </span>
            )}
          </label>

          <div className="ui-grid-2" style={{ gap: '0.6rem' }}>
            <label style={{ display: 'grid', gap: '0.3rem', fontSize: '0.85rem' }}>
              Drill
              <select className="appSelect" value={drillId} onChange={(e) => setDrillId(e.target.value)}>
                <option value="DL1">DL1</option>
                <option value="DL2">DL2</option>
              </select>
            </label>
            <label style={{ display: 'grid', gap: '0.3rem', fontSize: '0.85rem' }}>
              Quelle
              <select className="appSelect" value={sourceType} onChange={(e) => {
                const next = e.target.value; setSourceType(next)
                if (next === 'self_observation') setSourceLabel('Eigene Beobachtung')
              }}>
                <option value="self_observation">Eigene Beobachtung</option>
                <option value="del_video">DEL Video</option>
                <option value="nhl_video">NHL Video</option>
                <option value="instat">InStat</option>
                <option value="wyscout">Wyscout</option>
                <option value="elite_prospects">Elite Prospects</option>
                <option value="other">Sonstige</option>
              </select>
            </label>
          </div>

          <label style={{ display: 'grid', gap: '0.3rem', fontSize: '0.85rem' }}>
            Quellen-Label
            <input className="appSelect" value={sourceLabel} onChange={(e) => setSourceLabel(e.target.value)} placeholder="z.B. EP, Matchclip" />
          </label>

          <div className="ui-grid-2" style={{ gap: '0.6rem' }}>
            <label style={{ display: 'grid', gap: '0.3rem', fontSize: '0.85rem' }}>
              Geburtsjahr
              <input className="appSelect" type="number" min={1900} max={2100} value={playerBirthYear}
                onChange={(e) => setPlayerBirthYear(e.target.value)} placeholder="z.B. 2006" />
            </label>
            <div />
          </div>

          <label style={{ display: 'grid', gap: '0.3rem', fontSize: '0.85rem' }}>
            Profil-Notiz
            <textarea value={playerProfileNotes} onChange={(e) => setPlayerProfileNotes(e.target.value)}
              rows={2} style={{ width: '100%', boxSizing: 'border-box' }} placeholder="Dauerhafte Notiz zum Spielerprofil" />
          </label>

          <label style={{ display: 'grid', gap: '0.3rem', fontSize: '0.85rem' }}>
            Run-Notiz
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={2} style={{ width: '100%', boxSizing: 'border-box' }} placeholder="Kurznotiz zu diesem Run" />
          </label>

          {(indexError || rosterError || createRunMutation.isError) && (
            <div style={{ fontSize: '0.82rem', color: '#ff8080' }}>
              {indexError && <div>Fehler Roster-Index: {(indexError as Error).message}</div>}
              {rosterError && <div>Fehler Roster: {(rosterError as Error).message}</div>}
              {createRunMutation.isError && <div>Run-Fehler: {(createRunMutation.error as Error).message}</div>}
            </div>
          )}

          <button className="btn" onClick={() => createRunMutation.mutate()}
            disabled={createRunMutation.isPending || !selectedTeam || !selectedPlayer}
            style={{ marginTop: '0.25rem' }}
          >
            {createRunMutation.isPending ? 'Erstelle Run…' : '▶ Observation Run starten'}
          </button>
        </div>

        {/* ─ Rechte Spalte: Spieler-Info & Stats ─ */}
        <div style={{ display: 'grid', gap: '1rem', alignContent: 'start' }}>

          {/* Spieler-Profilkarte */}
          {selectedPlayer ? (
            <div className="card ui-surface ui-surface--section ui-flat-mobile" style={{ display: 'grid', gap: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 700 }}>#{selectedPlayer.number ?? '–'}</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{selectedPlayer.name}</span>
                {selectedKaderPlayer?.position_group && (
                  <span style={{ fontSize: '0.78rem', opacity: 0.7, padding: '0.1rem 0.45rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0.3rem' }}>
                    {posGroupLabel[selectedKaderPlayer.position_group] ?? selectedKaderPlayer.position_group}
                  </span>
                )}
              </div>

              {selectedKaderPlayer ? (
                <>
                  {/* Bio-Daten Grid */}
                  <div className="ui-grid-2" style={{ gap: '0.4rem 1rem', fontSize: '0.82rem' }}>
                    {selectedKaderPlayer.nationality && <div><span style={{ opacity: 0.55 }}>Land</span><br />{selectedKaderPlayer.nationality}</div>}
                    {selectedKaderPlayer.age && <div><span style={{ opacity: 0.55 }}>Alter</span><br />{selectedKaderPlayer.age} J.</div>}
                    {selectedKaderPlayer.height_cm && <div><span style={{ opacity: 0.55 }}>Größe</span><br />{selectedKaderPlayer.height_cm} cm</div>}
                    {selectedKaderPlayer.weight_kg && <div><span style={{ opacity: 0.55 }}>Gewicht</span><br />{selectedKaderPlayer.weight_kg} kg</div>}
                    {selectedKaderPlayer.birthplace && <div><span style={{ opacity: 0.55 }}>Geburtsort</span><br />{selectedKaderPlayer.birthplace}</div>}
                    {selectedKaderPlayer.shoots_or_catches && <div><span style={{ opacity: 0.55 }}>Schuss / Fangen</span><br />{selectedKaderPlayer.shoots_or_catches}</div>}
                  </div>

                  {/* Observation-Stats */}
                  <div style={{ marginTop: '0.25rem', padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', display: 'grid', gap: '0.35rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Beobachtungs-Verlauf</div>
                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem' }}>
                      <div>
                        <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{selectedKaderPlayer.observation_count ?? 0}</span>
                        <span style={{ opacity: 0.55, fontSize: '0.78rem', marginLeft: '0.3rem' }}>Beobachtungen</span>
                      </div>
                    </div>
                    {selectedKaderPlayer.last_observed ? (
                      <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                        Zuletzt: {new Date(selectedKaderPlayer.last_observed).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', opacity: 0.5, fontStyle: 'italic' }}>Noch nicht beobachtet</div>
                    )}
                    {selectedKaderPlayer.summary && (
                      <div style={{ fontSize: '0.8rem', opacity: 0.75, marginTop: '0.15rem', lineHeight: 1.4 }}>{selectedKaderPlayer.summary}</div>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '0.82rem', opacity: 0.6, fontStyle: 'italic' }}>
                  Position: {selectedPlayer.position}<br />Kein Import-Profil vorhanden.
                </div>
              )}
            </div>
          ) : (
            <div className="card ui-surface ui-surface--inline" style={{ opacity: 0.5, fontStyle: 'italic', fontSize: '0.85rem' }}>
              Kein Spieler ausgewählt.
            </div>
          )}

          {/* Team-Info */}
          {selectedTeam && (
            <div className="card ui-surface ui-surface--inline" style={{ fontSize: '0.82rem', display: 'grid', gap: '0.3rem', opacity: 0.8 }}>
              <div style={{ fontWeight: 600 }}>{selectedTeam.name}</div>
              <div style={{ opacity: 0.6 }}>{selectedTeam.league} · {season.replace('_', '/')}</div>
              {kaderPlayersData?.players && kaderPlayersData.players.length > 0 && (
                <div style={{ opacity: 0.6 }}>{kaderPlayersData.players.length} Spieler im Kader</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
