import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  api,
  type SceneMarker,
  type SceneMarkerCreate,
  type SceneMarkerUpdate,
} from '../api'
import { formatCompetitionContext, getCompetitionConfig, getCompetitionPhase } from '../data/competitionConfig'
import { LEAGUES, getTeamNamesForLeague } from '../data/teamsByLeague'
import {
  isSplitSeasonLeague,
  SEASON_OPTIONS,
  TOURNAMENT_YEAR_OPTIONS,
} from '../stats/seasonNormalization'
import {
  formatGameTimeInput,
  isValidGameTime,
  SCENE_PERIOD_OPTIONS,
} from '../utils/sceneHelpers'

type SceneRatingValue = 1 | 2 | 3 | 4 | 5

export type ManualSceneFormMode = 'create' | 'enrich' | 'edit'

type ManualSceneFormProps = {
  mode: ManualSceneFormMode
  initialScene?: SceneMarker | null
  onClose: () => void
  onSaved: (scene: SceneMarker, options?: { continueEditing?: boolean }) => void
}

function fieldLabel(text: string, required = false) {
  return (
    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.92rem' }}>
      {text}{required ? <span style={{ color: '#f87171' }}> *</span> : null}
    </label>
  )
}

export function ManualSceneForm({
  mode,
  initialScene = null,
  onClose,
  onSaved,
}: ManualSceneFormProps) {
  const gameTimeRef = useRef<HTMLInputElement>(null)
  const [gameTime, setGameTime] = useState(initialScene?.game_time || '')
  const [period, setPeriod] = useState(initialScene?.period || 'P1')
  const [league, setLeague] = useState(initialScene?.league || '')
  const [teamHome, setTeamHome] = useState(initialScene?.team_home || '')
  const [teamAway, setTeamAway] = useState(initialScene?.team_away || '')
  const [observedTeam, setObservedTeam] = useState(initialScene?.observed_team_name || initialScene?.observed_team || '')
  const [season, setSeason] = useState(initialScene?.season || '')
  const [competitionPhase, setCompetitionPhase] = useState(initialScene?.competition_phase || '')
  const [competitionValue, setCompetitionValue] = useState(
    String(initialScene?.competition_unit_value || '').trim() || '',
  )
  const [gameDate, setGameDate] = useState(initialScene?.game_date || '')
  const [note, setNote] = useState(initialScene?.note || '')
  const [rating, setRating] = useState<SceneRatingValue | null>(initialScene?.rating ?? null)
  const [showDetails, setShowDetails] = useState(mode !== 'create')
  const [postQuickSaveScene, setPostQuickSaveScene] = useState<SceneMarker | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const competitionConfig = useMemo(() => getCompetitionConfig(league), [league])
  const selectedCompetitionPhase = useMemo(
    () => getCompetitionPhase(league, competitionPhase) || competitionConfig?.phases[0],
    [league, competitionPhase, competitionConfig],
  )
  const seasonOptions = isSplitSeasonLeague(league) ? SEASON_OPTIONS : TOURNAMENT_YEAR_OPTIONS
  const availableTeams = league ? getTeamNamesForLeague(league, season || undefined) : []

  useEffect(() => {
    if (mode === 'create') {
      const timer = window.setTimeout(() => gameTimeRef.current?.focus(), 50)
      return () => window.clearTimeout(timer)
    }
  }, [mode])

  useEffect(() => {
    if (competitionConfig && !competitionPhase) {
      setCompetitionPhase(competitionConfig.phases[0]?.id || '')
    }
    if (!competitionConfig) {
      setCompetitionPhase('')
      setCompetitionValue('')
    }
  }, [competitionConfig, competitionPhase])

  useEffect(() => {
    if (!availableTeams.length) return
    if (teamHome && !availableTeams.includes(teamHome)) setTeamHome('')
    if (teamAway && !availableTeams.includes(teamAway)) setTeamAway('')
    if (observedTeam && !availableTeams.includes(observedTeam)) setObservedTeam('')
  }, [league, season, availableTeams, teamHome, teamAway, observedTeam])

  const validateCore = (): string | null => {
    const trimmedTime = gameTime.trim()
    if (!trimmedTime) return 'Bitte Spielzeit eingeben (z. B. 12:43).'
    if (!isValidGameTime(trimmedTime)) return 'Bitte eine gültige Spielzeit eingeben, z. B. 12:43 oder 8:07.'
    if (trimmedTime.includes(':')) {
      const seconds = Number(trimmedTime.split(':')[1] || '')
      if (!Number.isFinite(seconds) || seconds > 59) return 'Sekunden müssen zwischen 00 und 59 liegen.'
    }
    if (!period) return 'Bitte ein Drittel auswählen.'
    if (!teamHome || !teamAway) return 'Bitte Heim- und Auswärtsteam auswählen.'
    if (teamHome === teamAway) return 'Heim- und Auswärtsteam müssen unterschiedlich sein.'
    if (!note.trim()) return 'Bitte kurz beschreiben, was in der Szene passiert.'
    return null
  }

  const buildCompetitionFields = () => {
    const phase = selectedCompetitionPhase
    const unitValue = competitionValue.trim()
    const matchday = formatCompetitionContext({
      league: league || undefined,
      season: season || undefined,
      competition_phase: phase?.id,
      competition_phase_label: phase?.label,
      competition_unit_label: phase?.unit.label,
      competition_unit_value: unitValue || undefined,
    }) || undefined

    return {
      league: league || undefined,
      season: season || undefined,
      competition_phase: phase?.id,
      competition_phase_label: phase?.label,
      competition_unit_type: phase?.unit.type,
      competition_unit_label: phase?.unit.label,
      competition_unit_value: unitValue || undefined,
      matchday,
      game_date: gameDate.trim() || undefined,
    }
  }

  const buildPayload = (metadataStatus: 'incomplete' | 'complete'): SceneMarkerCreate => ({
    source: { type: 'manual', session_id: null, drill_id: null },
    session_id: null,
    module_id: null,
    drill_id: null,
    track_id: null,
    metadata_status: metadataStatus,
    period,
    game_time: gameTime.trim(),
    team_home: teamHome,
    team_away: teamAway,
    observed_team: observedTeam || undefined,
    observed_team_name: observedTeam || undefined,
    note: note.trim(),
    rating: rating ?? undefined,
    ...buildCompetitionFields(),
  })

  const saveCreate = async (metadataStatus: 'incomplete' | 'complete', continueEditing: boolean) => {
    const validationError = validateCore()
    if (validationError) {
      setError(validationError)
      return
    }
    if (metadataStatus === 'complete' && !observedTeam) {
      setError('Bitte das beobachtete Team auswählen.')
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      const scene = await api.createScene(buildPayload(metadataStatus))
      if (continueEditing) {
        setPostQuickSaveScene(scene)
        setShowDetails(true)
        onSaved(scene, { continueEditing: true })
      } else {
        onSaved(scene)
        onClose()
      }
    } catch {
      setError('Szene konnte nicht gespeichert werden. Bitte erneut versuchen.')
    } finally {
      setIsSaving(false)
    }
  }

  const saveUpdate = async (metadataStatus: 'incomplete' | 'complete') => {
    const targetId = postQuickSaveScene?.id || initialScene?.id
    if (!targetId) return

    const validationError = validateCore()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      const competition = buildCompetitionFields()
      const payload: SceneMarkerUpdate = {
        game_time: gameTime.trim(),
        period,
        note: note.trim(),
        team_home: teamHome,
        team_away: teamAway,
        observed_team: observedTeam || undefined,
        observed_team_name: observedTeam || undefined,
        rating: rating,
        metadata_status: metadataStatus,
        ...competition,
      }
      const scene = await api.updateScene(targetId, payload)
      onSaved(scene)
      onClose()
    } catch {
      setError('Szene konnte nicht aktualisiert werden. Bitte erneut versuchen.')
    } finally {
      setIsSaving(false)
    }
  }

  const title =
    mode === 'enrich' ? 'Metadaten ergänzen'
      : mode === 'edit' ? 'Szene bearbeiten'
        : 'Szene hinzufügen'

  const chipStyle = (active: boolean): CSSProperties => ({
    padding: '0.55rem 0.75rem',
    borderRadius: '0.55rem',
    border: active ? '1.5px solid rgba(125,211,252,0.7)' : '1px solid rgba(148,163,184,0.28)',
    background: active ? 'rgba(14,165,233,0.2)' : 'rgba(15,23,42,0.65)',
    color: active ? '#e0f2fe' : '#cbd5e1',
    fontWeight: 700,
    fontSize: '0.86rem',
    cursor: 'pointer',
    minHeight: '2.5rem',
  })

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 2100,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        overflowY: 'auto', padding: '1rem 0.75rem 2rem',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="card"
        style={{
          width: 'min(560px, 100%)',
          margin: '0 auto',
          padding: '1.15rem 1.1rem 1.25rem',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}
      >
        <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.2rem' }}>{title}</h3>
        <p style={{ margin: '0 0 1rem', color: '#94a3b8', fontSize: '0.84rem', lineHeight: 1.45 }}>
          Zuerst Spielzeit, Drittel, Teams und Beschreibung – die Uhr läuft weiter.
        </p>

        {fieldLabel('Spielzeit', true)}
        <input
          ref={gameTimeRef}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={gameTime}
          onChange={(e) => setGameTime(formatGameTimeInput(e.target.value))}
          placeholder="12:43"
          style={{
            width: '100%', padding: '0.7rem 0.8rem', borderRadius: '0.45rem',
            border: '1.5px solid #334155', background: '#0f172a', color: '#f1f5f9',
            fontSize: '1.35rem', fontWeight: 800, letterSpacing: '0.05em',
            boxSizing: 'border-box', marginBottom: '0.85rem',
          }}
        />

        {fieldLabel('Drittel', true)}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.95rem' }}>
          {SCENE_PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPeriod(option.value)}
              style={chipStyle(period === option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {fieldLabel('Teams', true)}
        <label style={{ display: 'block', marginBottom: '0.45rem', fontSize: '0.82rem', color: '#94a3b8' }}>
          Liga
          <select
            className="appSelect"
            value={league}
            onChange={(e) => {
              setLeague(e.target.value)
              setTeamHome('')
              setTeamAway('')
              setObservedTeam('')
              setCompetitionPhase('')
              setCompetitionValue('')
            }}
            style={{ width: '100%', marginTop: '0.3rem' }}
          >
            <option value="">— Liga wählen —</option>
            {LEAGUES.map((lg) => (
              <option key={lg} value={lg}>{lg.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.55rem', marginBottom: '0.95rem' }}>
          <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8' }}>
            Heimteam
            <select
              className="appSelect"
              value={teamHome}
              disabled={!league}
              onChange={(e) => setTeamHome(e.target.value)}
              style={{ width: '100%', marginTop: '0.3rem' }}
            >
              <option value="">— Heim —</option>
              {availableTeams.map((team) => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </label>
          <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8' }}>
            Auswärtsteam
            <select
              className="appSelect"
              value={teamAway}
              disabled={!league}
              onChange={(e) => setTeamAway(e.target.value)}
              style={{ width: '100%', marginTop: '0.3rem' }}
            >
              <option value="">— Auswärts —</option>
              {availableTeams.map((team) => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </label>
        </div>

        {fieldLabel('Was passiert in der Szene?', true)}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Kurze Live-Notiz zum Moment"
          rows={3}
          maxLength={500}
          style={{
            width: '100%', padding: '0.65rem 0.75rem', borderRadius: '0.45rem',
            border: '1.5px solid #334155', background: '#0f172a', color: '#f1f5f9',
            fontSize: '0.95rem', resize: 'vertical', boxSizing: 'border-box',
            marginBottom: '0.85rem',
          }}
        />

        {mode === 'create' && !postQuickSaveScene && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '0.95rem' }}>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => saveCreate('incomplete', true)}
              style={{
                width: '100%', minHeight: '2.8rem', border: 'none', borderRadius: '0.5rem',
                background: '#4fc3f7', color: '#0a0a1a', fontWeight: 800, fontSize: '0.98rem',
                cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1,
              }}
            >
              {isSaving ? 'Speichere…' : 'Szene schnell speichern'}
            </button>
            <button
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              style={{
                background: 'transparent', border: 'none', color: '#7dd3fc',
                fontWeight: 600, fontSize: '0.86rem', cursor: 'pointer', padding: '0.2rem 0',
              }}
            >
              {showDetails ? 'Zusatzfelder ausblenden' : 'Jetzt einordnen (optional)'}
            </button>
          </div>
        )}

        {postQuickSaveScene && (
          <div style={{
            marginBottom: '0.9rem', padding: '0.7rem 0.8rem', borderRadius: '0.5rem',
            background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(45,212,191,0.35)',
            color: '#99f6e4', fontSize: '0.88rem',
          }}>
            Szene {postQuickSaveScene.scene_code || ''} ist gespeichert.
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginTop: '0.55rem' }}>
              <button
                type="button"
                onClick={() => setShowDetails(true)}
                style={{
                  padding: '0.45rem 0.75rem', borderRadius: '0.4rem', border: 'none',
                  background: 'rgba(125,211,252,0.2)', color: '#e0f2fe', fontWeight: 700, cursor: 'pointer',
                }}
              >
                Jetzt einordnen
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '0.45rem 0.75rem', borderRadius: '0.4rem',
                  border: '1px solid rgba(148,163,184,0.35)', background: 'transparent',
                  color: '#cbd5e1', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Später ergänzen
              </button>
            </div>
          </div>
        )}

        {(showDetails || mode !== 'create' || !!postQuickSaveScene) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.2rem' }}>
            <div>
              {fieldLabel('Beobachtetes Team')}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {[teamHome, teamAway].filter(Boolean).map((team) => (
                  <button
                    key={team}
                    type="button"
                    onClick={() => setObservedTeam(team)}
                    style={chipStyle(observedTeam === team)}
                  >
                    {team}
                  </button>
                ))}
              </div>
              {!observedTeam && (
                <div style={{ marginTop: '0.35rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                  Beobachtetes Team nicht hinterlegt
                </div>
              )}
            </div>

            <div>
              {fieldLabel('Sternebewertung')}
              <div style={{ display: 'inline-flex', gap: '0.15rem' }}>
                {[1, 2, 3, 4, 5].map((value) => {
                  const star = value as SceneRatingValue
                  const active = rating !== null && star <= rating
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(rating === star ? null : star)}
                      style={{
                        border: 'none', background: 'transparent', cursor: 'pointer',
                        color: active ? '#fbbf24' : '#475569', fontSize: '1.35rem', lineHeight: 1, padding: '0.1rem',
                      }}
                      aria-label={`${star} Sterne`}
                    >
                      {active ? '★' : '☆'}
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{
              borderTop: '1px solid rgba(148,163,184,0.18)',
              paddingTop: '0.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
            }}>
              <div style={{ fontWeight: 700, color: '#cbd5e1', fontSize: '0.9rem' }}>Spielmetadaten</div>

              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8' }}>
                Saison
                <select
                  className="appSelect"
                  value={season}
                  disabled={!league}
                  onChange={(e) => setSeason(e.target.value)}
                  style={{ width: '100%', marginTop: '0.3rem' }}
                >
                  <option value="">— Saison —</option>
                  {seasonOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              {competitionConfig && selectedCompetitionPhase && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.7fr', gap: '0.55rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8' }}>
                    Wettbewerbsphase
                    <select
                      className="appSelect"
                      value={selectedCompetitionPhase.id}
                      onChange={(e) => {
                        setCompetitionPhase(e.target.value)
                        setCompetitionValue('')
                      }}
                      style={{ width: '100%', marginTop: '0.3rem' }}
                    >
                      {competitionConfig.phases.map((phase) => (
                        <option key={phase.id} value={phase.id}>{phase.label}</option>
                      ))}
                    </select>
                  </label>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8' }}>
                    {selectedCompetitionPhase.unit.label}
                    <input
                      type="number"
                      min={selectedCompetitionPhase.unit.min}
                      max={selectedCompetitionPhase.unit.max}
                      value={competitionValue}
                      onChange={(e) => setCompetitionValue(e.target.value)}
                      style={{
                        width: '100%', marginTop: '0.3rem', padding: '0.55rem 0.65rem',
                        borderRadius: '0.4rem', border: '1px solid #334155',
                        background: '#0f172a', color: '#f1f5f9', boxSizing: 'border-box',
                      }}
                    />
                  </label>
                </div>
              )}

              <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8' }}>
                Spieldatum
                <input
                  type="date"
                  value={gameDate}
                  onChange={(e) => setGameDate(e.target.value)}
                  style={{
                    width: '100%', marginTop: '0.3rem', padding: '0.55rem 0.65rem',
                    borderRadius: '0.4rem', border: '1px solid #334155',
                    background: '#0f172a', color: '#f1f5f9', boxSizing: 'border-box',
                  }}
                />
              </label>
            </div>
          </div>
        )}

        {error && (
          <div style={{ color: '#f87171', fontSize: '0.84rem', marginTop: '0.75rem' }}>{error}</div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem', justifyContent: 'flex-end', marginTop: '1.1rem' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            style={{
              padding: '0.55rem 1.1rem', borderRadius: '0.4rem',
              border: '1px solid #334155', background: 'transparent',
              color: '#94a3b8', cursor: 'pointer', fontWeight: 600,
            }}
          >
            {postQuickSaveScene ? 'Schließen' : 'Abbrechen'}
          </button>

          {(mode !== 'create' || postQuickSaveScene || showDetails) && (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => {
                if (mode === 'create' && !postQuickSaveScene) {
                  void saveCreate('complete', false)
                } else {
                  void saveUpdate(observedTeam && league && season ? 'complete' : 'incomplete')
                }
              }}
              style={{
                padding: '0.55rem 1.2rem', borderRadius: '0.4rem', border: 'none',
                background: '#2dd4bf', color: '#042f2e', fontWeight: 800,
                cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1,
              }}
            >
              {isSaving ? 'Speichere…' : mode === 'create' && !postQuickSaveScene ? 'Vollständig speichern' : 'Änderungen speichern'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
