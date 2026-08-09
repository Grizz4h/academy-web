import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useUser } from '../context/UserContext'
import { LEAGUES, getTeamNamesForLeague } from '../data/teamsByLeague'
import { getCompetitionConfig, formatCompetitionContext } from '../data/competitionConfig'
import { normalizeSeasonValue, isSplitSeasonLeague, SEASON_OPTIONS, TOURNAMENT_YEAR_OPTIONS } from '../stats/seasonNormalization'
import { OBSERVATION_SCOPE_OPTIONS, getObservationScopeLabel, type ObservationScope } from '../utils/observationScope'
import type { PredictionTemplate } from '../features/lab/types'
import { PredictionSessionSetup, PredictionTemplatePicker } from '../features/lab/PredictComponents'

export default function LabPredictSetup() {
  const navigate = useNavigate()
  const { user } = useUser()

  const [templateId, setTemplateId] = useState<string>('')
  const [league, setLeague] = useState<string>('DEL')
  const [teamHome, setTeamHome] = useState<string>('')
  const [teamAway, setTeamAway] = useState<string>('')
  const [observedTeam, setObservedTeam] = useState<string>('')
  const [season, setSeason] = useState<string>('')
  const [competitionPhase, setCompetitionPhase] = useState<string>('')
  const [competitionValue, setCompetitionValue] = useState<string>('')
  const [observationScope, setObservationScope] = useState<ObservationScope>('FULL_GAME')

  const { data: labContent, isLoading: isLabContentLoading } = useQuery({
    queryKey: ['lab-content'],
    queryFn: () => api.getLabContent(),
  })

  const predictionTemplates = (labContent?.prediction_templates || []) as PredictionTemplate[]
  const selectedTemplate = predictionTemplates.find((template) => template.id === templateId)
  const competitionConfig = getCompetitionConfig(league)
  const selectedCompetitionPhase = competitionConfig?.phases.find((phase) => phase.id === competitionPhase) || competitionConfig?.phases[0]
  const useSplitSeason = isSplitSeasonLeague(league)
  const seasonOptions = useSplitSeason ? SEASON_OPTIONS : TOURNAMENT_YEAR_OPTIONS

  const { data: teamsResp } = useQuery({
    queryKey: ['teams', league, season],
    queryFn: () => api.getTeams(league, season || undefined),
    enabled: Boolean(league),
    staleTime: 0,
    gcTime: 0,
  })

  const availableTeams = useMemo(() => {
    const apiTeams = teamsResp?.teams?.map((team: any) => team.name) || []
    if (apiTeams.length > 0) return apiTeams
    return getTeamNamesForLeague(league, season || undefined)
  }, [league, season, teamsResp])

  useEffect(() => {
    if (!availableTeams.length) return
    if (teamHome && !availableTeams.includes(teamHome)) setTeamHome('')
    if (teamAway && !availableTeams.includes(teamAway)) setTeamAway('')
    if (observedTeam && !availableTeams.includes(observedTeam)) setObservedTeam('')
  }, [league, season, availableTeams, teamHome, teamAway, observedTeam])

  const createSessionMutation = useMutation({
    mutationFn: (payload: Parameters<typeof api.createSession>[0]) => api.createSession(payload),
    onSuccess: (session) => {
      navigate(`/lab/predict/session/${session.id}`)
    },
  })

  const selectedModule = (labContent?.modules || []).find((module) => module.id === 'predict')

  useEffect(() => {
    if (!templateId && predictionTemplates.length > 0) {
      setTemplateId(predictionTemplates[0].id)
    }
  }, [templateId, predictionTemplates])

  const canCreate = Boolean(
    user && templateId && league && teamHome && teamAway && observedTeam && teamHome !== teamAway
  )

  const handleCreate = () => {
    if (!user?.trim()) {
      alert('Bitte oben im Login einen Namen speichern, damit wir die Session zuordnen können.')
      return
    }
    if (!selectedTemplate) {
      alert('Bitte ein Predict-Template auswählen.')
      return
    }
    if (!teamHome || !teamAway || teamHome === teamAway) {
      alert('Bitte zwei unterschiedliche Teams auswählen.')
      return
    }
    if (!observedTeam) {
      alert('Bitte das ausgewählte Team festlegen.')
      return
    }
    if (competitionConfig && !selectedCompetitionPhase) {
      alert('Bitte eine Wettbewerbsphase wählen.')
      return
    }

    const normalizedSeason = normalizeSeasonValue(season, league)
    const gameInfo: any = {
      league,
      team_home: teamHome,
      team_away: teamAway,
      observed_team: observedTeam,
      observed_team_name: observedTeam,
      observed_team_id: observedTeam,
      date: new Date().toISOString(),
    }

    if (normalizedSeason) gameInfo.season = normalizedSeason

    if (selectedCompetitionPhase) {
      const unitValue = competitionValue.trim()
      if (!unitValue) {
        alert(`Bitte ${selectedCompetitionPhase.unit.label} eingeben.`)
        return
      }
      gameInfo.competition_phase = selectedCompetitionPhase.id
      gameInfo.competition_phase_label = selectedCompetitionPhase.label
      gameInfo.competition_unit_type = selectedCompetitionPhase.unit.type
      gameInfo.competition_unit_label = selectedCompetitionPhase.unit.label
      gameInfo.competition_unit_value = unitValue
      gameInfo.matchday = formatCompetitionContext({
        league,
        season: normalizedSeason || undefined,
        competition_phase: selectedCompetitionPhase.id,
        competition_phase_label: selectedCompetitionPhase.label,
        competition_unit_label: selectedCompetitionPhase.unit.label,
        competition_unit_value: unitValue,
      })
    }

    createSessionMutation.mutate({
      user: user.trim(),
      module_id: 'LAB_PREDICT',
      goal: `Predict: ${selectedTemplate.title}`,
      confidence: 3,
      observation_scope: observationScope,
      session_method: 'live_watch',
      game_info: gameInfo,
      observed_team: observedTeam,
      observed_team_id: observedTeam,
      observed_team_name: observedTeam,
      learning_area: 'lab',
      lab_mode: 'predict',
      lab_template_id: selectedTemplate.id,
    })
  }

  return (
    <div style={{ display: 'grid', gap: '1rem', maxWidth: '760px', margin: '0 auto' }}>
      <h1>Lab · Predict Setup</h1>

      {isLabContentLoading && <div className="card">Lade Lab-Inhalte...</div>}

      {!isLabContentLoading && !selectedModule?.enabled && (
        <div className="card">Aktuell sind keine Predict-Übungen verfügbar.</div>
      )}

      <PredictionTemplatePicker
        templates={predictionTemplates}
        selectedTemplateId={templateId}
        onSelectTemplate={setTemplateId}
      />

      {!predictionTemplates.length && (
        <div className="card">Aktuell sind keine Predict-Übungen verfügbar.</div>
      )}

      {selectedTemplate && (
        <div className="card" style={{ marginBottom: 0 }}>
          <h2 style={{ marginTop: 0 }}>{selectedTemplate.title}</h2>
          <p>{selectedTemplate.description}</p>
          {selectedTemplate.relatedAcademyDrills?.length ? (
            <p style={{ marginBottom: 0 }}>
              Passende Akademie-Grundlage: {selectedTemplate.relatedAcademyDrills.join(', ')}
            </p>
          ) : null}
        </div>
      )}

      <PredictionSessionSetup>
        <label style={{ display: 'grid', gap: '0.4rem' }}>
          Liga
          <select className="appSelect" value={league} onChange={(event) => {
            setLeague(event.target.value)
            setTeamHome('')
            setTeamAway('')
            setObservedTeam('')
          }}>
            <option value="">-- Liga wählen --</option>
            {LEAGUES.map((value) => (
              <option key={value} value={value}>{value.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginTop: '0.8rem' }}>
          <label style={{ display: 'grid', gap: '0.4rem' }}>
            Heimteam
            <select className="appSelect" value={teamHome} onChange={(event) => setTeamHome(event.target.value)}>
              <option value="">-- Heimteam --</option>
              {availableTeams.map((team) => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </label>

          <label style={{ display: 'grid', gap: '0.4rem' }}>
            Auswärtsteam
            <select className="appSelect" value={teamAway} onChange={(event) => setTeamAway(event.target.value)}>
              <option value="">-- Auswärtsteam --</option>
              {availableTeams.map((team) => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ marginTop: '0.8rem', display: 'grid', gap: '0.45rem' }}>
          <strong>Ausgewähltes Team</strong>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <input type="radio" checked={observedTeam === teamHome} onChange={() => setObservedTeam(teamHome)} disabled={!teamHome} />
            {teamHome || 'Heimteam'}
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <input type="radio" checked={observedTeam === teamAway} onChange={() => setObservedTeam(teamAway)} disabled={!teamAway} />
            {teamAway || 'Auswärtsteam'}
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginTop: '0.8rem' }}>
          <label style={{ display: 'grid', gap: '0.4rem' }}>
            Saison (optional)
            <select className="appSelect" value={season} onChange={(event) => setSeason(event.target.value)}>
              <option value="">-- Saison wählen --</option>
              {seasonOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <label style={{ display: 'grid', gap: '0.4rem' }}>
            Beobachtungsumfang
            <select className="appSelect" value={observationScope} onChange={(event) => setObservationScope(event.target.value as ObservationScope)}>
              {OBSERVATION_SCOPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <span style={{ color: 'rgba(216,225,255,0.75)', fontSize: '0.85rem' }}>Aktuell: {getObservationScopeLabel(observationScope)}</span>
          </label>
        </div>

        {competitionConfig && selectedCompetitionPhase && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginTop: '0.8rem' }}>
            <label style={{ display: 'grid', gap: '0.4rem' }}>
              Wettbewerb
              <select
                className="appSelect"
                value={selectedCompetitionPhase.id}
                onChange={(event) => {
                  setCompetitionPhase(event.target.value)
                  setCompetitionValue('')
                }}
              >
                {competitionConfig.phases.map((phase) => (
                  <option key={phase.id} value={phase.id}>{phase.label}</option>
                ))}
              </select>
            </label>

            <label style={{ display: 'grid', gap: '0.4rem' }}>
              {selectedCompetitionPhase.unit.label}
              <input
                type="number"
                value={competitionValue}
                onChange={(event) => setCompetitionValue(event.target.value)}
                min={selectedCompetitionPhase.unit.min}
                max={selectedCompetitionPhase.unit.max}
                style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: '#050712', color: '#f7f7ff' }}
              />
            </label>
          </div>
        )}

        <button
          className="btn"
          onClick={handleCreate}
          disabled={!canCreate || createSessionMutation.isPending}
          style={{ marginTop: '1rem', width: '100%', minHeight: '50px' }}
        >
          {createSessionMutation.isPending ? 'Session wird erstellt...' : 'Predict-Session starten'}
        </button>

        {createSessionMutation.error && (
          <p style={{ color: '#ff9ea3', marginBottom: 0 }}>
            Fehler beim Erstellen: {(createSessionMutation.error as Error).message}
          </p>
        )}
      </PredictionSessionSetup>
    </div>
  )
}
