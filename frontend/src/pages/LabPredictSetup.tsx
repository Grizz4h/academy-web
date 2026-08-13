import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api, type GameInfo } from '../api'
import { useUser } from '../context/UserContext'
import { getTeamNamesForLeague } from '../data/teamsByLeague'
import { getCompetitionConfig, formatCompetitionContext } from '../data/competitionConfig'
import { isSplitSeasonLeague, SEASON_OPTIONS, TOURNAMENT_YEAR_OPTIONS } from '../stats/seasonNormalization'
import { inferSplitSeasonLabelForDate } from '../stats/seasonNormalization'
import type { PredictionTemplate } from '../features/lab/types'
import { PredictionTemplatePicker } from '../features/lab/PredictComponents'
import { LiveObservationPanel, type LiveObservationFields } from '../components/game/LiveObservationPanel'
import { useGameCatalogMatch } from '../components/game/useGameCatalogMatch'
import { isDummyCatalogGame } from '../features/schedule/scheduleLayer'

export default function LabPredictSetup() {
  const navigate = useNavigate()
  const { user } = useUser()

  const [templateId, setTemplateId] = useState<string>('')
  const [fields, setFields] = useState<LiveObservationFields>({
    league: 'DEL',
    season: '',
    competitionPhase: '',
    competitionValue: '',
    teamHome: '',
    teamAway: '',
    observedTeam: '',
    observationScope: 'FULL_GAME',
  })

  const { data: labContent, isLoading: isLabContentLoading } = useQuery({
    queryKey: ['lab-content'],
    queryFn: () => api.getLabContent(),
  })

  const predictionTemplates = (labContent?.prediction_templates || []) as PredictionTemplate[]
  const selectedTemplate = predictionTemplates.find((template) => template.id === templateId)
  const selectedModule = (labContent?.modules || []).find((module) => module.id === 'predict')
  const competitionConfig = getCompetitionConfig(fields.league)
  const selectedCompetitionPhase =
    competitionConfig?.phases.find((phase) => phase.id === fields.competitionPhase) || competitionConfig?.phases[0]
  const useSplitSeason = isSplitSeasonLeague(fields.league)
  const seasonOptions = useSplitSeason ? SEASON_OPTIONS : TOURNAMENT_YEAR_OPTIONS

  const catalog = useGameCatalogMatch({
    league: fields.league,
    season: fields.season,
    teamHome: fields.teamHome,
    teamAway: fields.teamAway,
    competitionValue: fields.competitionValue,
    selectedGameId: fields.selectedGameId,
  })

  const { data: teamsResp } = useQuery({
    queryKey: ['teams', fields.league, fields.season],
    queryFn: () => api.getTeams(fields.league, fields.season || undefined),
    enabled: Boolean(fields.league),
    staleTime: 0,
    gcTime: 0,
  })

  const availableTeams = useMemo(() => {
    const apiTeams = teamsResp?.teams?.map((team: any) => team.name) || []
    if (apiTeams.length > 0) return apiTeams
    return getTeamNamesForLeague(fields.league, fields.season || undefined)
  }, [fields.league, fields.season, teamsResp])

  useEffect(() => {
    if (templateId && !predictionTemplates.some((template) => template.id === templateId)) {
      setTemplateId('')
    }
  }, [templateId, predictionTemplates])

  useEffect(() => {
    if (fields.league !== 'DEL' || fields.season) return
    const inferred = inferSplitSeasonLabelForDate()
    if (seasonOptions.includes(inferred)) {
      setFields((prev) => ({ ...prev, season: inferred }))
    }
  }, [fields.league, fields.season, seasonOptions])

  useEffect(() => {
    if (!availableTeams.length) return
    setFields((prev) => {
      const next = { ...prev }
      let changed = false
      if (prev.teamHome && !availableTeams.includes(prev.teamHome)) {
        next.teamHome = ''
        changed = true
      }
      if (prev.teamAway && !availableTeams.includes(prev.teamAway)) {
        next.teamAway = ''
        changed = true
      }
      if (prev.observedTeam && !availableTeams.includes(prev.observedTeam)) {
        next.observedTeam = ''
        changed = true
      }
      return changed ? next : prev
    })
  }, [fields.league, fields.season, availableTeams])

  useEffect(() => {
    if (competitionConfig && !fields.competitionPhase) {
      setFields((prev) => ({
        ...prev,
        competitionPhase: competitionConfig.phases[0]?.id || '',
        competitionValue: '',
      }))
    }
    if (!competitionConfig && fields.competitionPhase) {
      setFields((prev) => ({ ...prev, competitionPhase: '', competitionValue: '' }))
    }
  }, [competitionConfig, fields.competitionPhase])

  const createSessionMutation = useMutation({
    mutationFn: (payload: Parameters<typeof api.createSession>[0]) => api.createSession(payload),
    onSuccess: (session) => {
      navigate(`/lab/predict/session/${session.id}`)
    },
  })

  const canCreate = Boolean(
    user
      && templateId
      && fields.league
      && fields.teamHome
      && fields.teamAway
      && fields.observedTeam
      && fields.teamHome !== fields.teamAway,
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
    if (!fields.teamHome || !fields.teamAway || fields.teamHome === fields.teamAway) {
      alert('Bitte zwei unterschiedliche Teams auswählen.')
      return
    }
    if (!fields.observedTeam) {
      alert('Bitte das ausgewählte Team festlegen.')
      return
    }
    if (competitionConfig && !selectedCompetitionPhase) {
      alert('Bitte eine Wettbewerbsphase wählen.')
      return
    }
    if (selectedCompetitionPhase) {
      const numericValue = Number(fields.competitionValue)
      if (
        !fields.competitionValue
        || !Number.isFinite(numericValue)
        || numericValue < selectedCompetitionPhase.unit.min
        || numericValue > selectedCompetitionPhase.unit.max
      ) {
        alert(
          `Bitte ${selectedCompetitionPhase.unit.label} ${selectedCompetitionPhase.unit.min}-${selectedCompetitionPhase.unit.max} eingeben.`,
        )
        return
      }
    }

    const normalizedSeason = catalog.normalizedSeason
    const matched = catalog.matchedCatalogGame
    const gameInfo: GameInfo = {
      league: fields.league,
      team_home: fields.teamHome,
      team_away: fields.teamAway,
      observed_team: fields.observedTeam,
      observed_team_name: fields.observedTeam,
      observed_team_id: fields.observedTeam,
      date: new Date().toISOString(),
    }

    if (normalizedSeason) gameInfo.season = normalizedSeason
    const dummyGame = isDummyCatalogGame(matched)
    if (matched?.id && !dummyGame) gameInfo.game_id = matched.id
    if (dummyGame) gameInfo.is_dummy = true
    if (matched?.date) {
      gameInfo.date = `${matched.date}T${matched.time || '19:00'}:00`
    }

    if (selectedCompetitionPhase) {
      const unitValue = fields.competitionValue.trim()
      gameInfo.competition_phase = selectedCompetitionPhase.id
      gameInfo.competition_phase_label = selectedCompetitionPhase.label
      gameInfo.competition_unit_type = selectedCompetitionPhase.unit.type
      gameInfo.competition_unit_label = selectedCompetitionPhase.unit.label
      gameInfo.competition_unit_value = unitValue
      gameInfo.matchday = formatCompetitionContext({
        league: fields.league,
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
      observation_scope: fields.observationScope,
      session_method: 'live_watch',
      game_info: gameInfo,
      game_id: dummyGame ? undefined : (matched?.id || undefined),
      observed_team: fields.observedTeam,
      observed_team_id: fields.observedTeam,
      observed_team_name: fields.observedTeam,
      learning_area: 'lab',
      lab_mode: 'predict',
      lab_template_id: selectedTemplate.id,
    })
  }

  return (
    <div className="ui-page-shell" style={{ display: 'grid', gap: '1rem', maxWidth: '600px', margin: '0 auto' }}>
      <header className="ui-page-header">
        <h1 className="ui-page-title">Lab · Predict Setup</h1>
        <p className="ui-page-lead">Wähle zuerst, was du vorhersagen möchtest. Danach legst du den Spielkontext fest.</p>
      </header>

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
        <div className="card ui-surface ui-surface--section ui-flat-mobile" style={{ marginBottom: 0 }}>
          {selectedTemplate.shortTitle && (
            <p style={{ margin: 0, fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.95)' }}>
              {selectedTemplate.shortTitle}
            </p>
          )}
          <h2 style={{ marginTop: '0.25rem' }}>{selectedTemplate.title}</h2>
          <p>{selectedTemplate.description}</p>
          {selectedTemplate.learningGoal && <p>{selectedTemplate.learningGoal}</p>}
          {selectedTemplate.relatedAcademyDrills?.length ? (
            <p style={{ marginBottom: 0 }}>
              Passende Akademie-Grundlage: {selectedTemplate.relatedAcademyDrills.join(', ')}
            </p>
          ) : null}
        </div>
      )}

      {selectedTemplate && (
        <div className="card ui-surface ui-surface--primary primary-card">
          <h2 className="ui-section-title">Session vorbereiten</h2>
          <LiveObservationPanel
            intro="Liga und Saison wählen, dann ein Spiel. Heim-/Auswärtsteam, Datum und Spieltag kommen aus dem Spielplan. Welches Team du beobachtest, bleibt deine Auswahl."
            fields={fields}
            onChange={(patch) => setFields((prev) => ({ ...prev, ...patch }))}
            availableTeams={availableTeams}
            catalog={catalog}
          />

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
        </div>
      )}
    </div>
  )
}
