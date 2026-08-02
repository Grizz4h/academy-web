import { useState, useMemo, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { api, type SceneMarker, type SceneMarkerUpdate, type Session } from '../api'
import { formatCompetitionContext, getCompetitionConfig } from '../data/competitionConfig'

type SceneRatingValue = 1 | 2 | 3 | 4 | 5

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

function isScenePublished(scene: SceneMarker): boolean {
  return (scene.status || 'NEW') === 'ASSIGNED'
}

function getSceneTrack(scene: SceneMarker) {
  return scene.track_id || scene.module_id?.split('_')[0] || ''
}

function sceneStatusLabel(status?: string) {
  if (status === 'ASSIGNED') return 'Zugeordnet'
  return 'Neu'
}

function normalizeObservedTeamValue(value?: string | null): string {
  const normalized = (value || '').trim()
  const lower = normalized.toLowerCase()
  if (!normalized || lower === 'none' || lower === 'null' || lower === 'undefined' || lower === '-') {
    return ''
  }
  return normalized
}

function normalizeEpisodeCodeInput(value: string, width: number): string | null {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (!/^\d+$/.test(trimmed) || trimmed.length > width) return null
  return trimmed.padStart(width, '0')
}

function sceneSeasonCode(scene: SceneMarker) {
  return scene.episode_season || scene.season_code || ''
}

function sceneEpisodeCode(scene: SceneMarker) {
  return scene.episode_number || scene.episode_code || ''
}

function sceneCompetitionContextKey(scene: SceneMarker) {
  const league = scene.league || ''
  const season = scene.season || ''
  const phase = scene.competition_phase || scene.competition_phase_label || ''
  const unitType = scene.competition_unit_type || ''
  const unitValue = String(scene.competition_unit_value || '').trim()
  if (!league || !phase || !unitValue) return ''
  return [league, season, phase, unitType, unitValue].join('__')
}

function seasonRankValue(season?: string) {
  const numbers = String(season || '').match(/\d{2,4}/g)
  if (!numbers?.length) return 0
  return Math.max(...numbers.map((value) => {
    const numeric = Number(value)
    return value.length === 2 ? 2000 + numeric : numeric
  }))
}

function sceneContextRank(scene: SceneMarker) {
  const phaseConfig = getCompetitionConfig(scene.league)?.phases ?? []
  const phaseIndex = phaseConfig.findIndex((phase) => phase.id === scene.competition_phase)
  const unitValue = Number.parseInt(String(scene.competition_unit_value || ''), 10)
  const createdAt = Date.parse(scene.created_at || '') || 0
  return {
    season: seasonRankValue(scene.season),
    phase: phaseIndex >= 0 ? phaseIndex : -1,
    unit: Number.isFinite(unitValue) ? unitValue : 0,
    createdAt,
  }
}

function compareSceneContext(a: SceneMarker, b: SceneMarker) {
  const left = sceneContextRank(a)
  const right = sceneContextRank(b)
  return left.season - right.season
    || left.phase - right.phase
    || left.unit - right.unit
    || left.createdAt - right.createdAt
}

export default function RingAbout() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data, isLoading, error } = useQuery({
    queryKey: ['scenes'],
    queryFn: () => api.getScenes(),
  })

  const sessionFilter = (searchParams.get('session_id') || '').trim()

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions-for-scene-insights'],
    queryFn: () => api.getSessions(),
  })

  const deleteMutation = useMutation({
    mutationFn: (sceneId: string) => api.deleteScene(sceneId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scenes'] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({
      sceneId,
      payload,
    }: {
      sceneId: string
      payload: SceneMarkerUpdate
    }) => api.updateScene(sceneId, payload),
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

  const handleRatingChange = (scene: SceneMarker, rating: SceneRatingValue) => {
    const nextRating = scene.rating === rating ? null : rating
    const previousScenes = queryClient.getQueryData<{ scenes: SceneMarker[] }>(['scenes'])

    queryClient.setQueryData<{ scenes: SceneMarker[] }>(['scenes'], (current) => {
      if (!current?.scenes) return current
      return {
        ...current,
        scenes: current.scenes.map((item) => (item.id === scene.id ? { ...item, rating: nextRating } : item)),
      }
    })

    updateMutation.mutate(
      {
        sceneId: scene.id,
        payload: { rating: nextRating },
      },
      {
        onError: () => {
          if (previousScenes) queryClient.setQueryData(['scenes'], previousScenes)
        },
      }
    )
  }

  const [editingSceneId, setEditingSceneId] = useState<string | null>(null)
  const [editGameTime, setEditGameTime] = useState('')
  const [editNote, setEditNote] = useState('')
  const [editEpisodeSeason, setEditEpisodeSeason] = useState('')
  const [editEpisodeNumber, setEditEpisodeNumber] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [celebratedSceneId, setCelebratedSceneId] = useState<string | null>(null)
  const celebrationTimeoutRef = useRef<number | null>(null)

  useEffect(() => () => {
    if (celebrationTimeoutRef.current) window.clearTimeout(celebrationTimeoutRef.current)
  }, [])

  const celebrateScene = (sceneId: string) => {
    if (celebrationTimeoutRef.current) window.clearTimeout(celebrationTimeoutRef.current)
    setCelebratedSceneId(sceneId)
    celebrationTimeoutRef.current = window.setTimeout(() => {
      setCelebratedSceneId(null)
      celebrationTimeoutRef.current = null
    }, 900)
  }

  const handleEditOpen = (scene: SceneMarker) => {
    setEditingSceneId(scene.id)
    setEditGameTime(scene.game_time)
    setEditNote(scene.note || '')
    setEditEpisodeSeason(sceneSeasonCode(scene))
    setEditEpisodeNumber(sceneEpisodeCode(scene))
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

    const normalizedEpisodeSeason = normalizeEpisodeCodeInput(editEpisodeSeason, 2)
    const normalizedEpisodeNumber = normalizeEpisodeCodeInput(editEpisodeNumber, 3)
    if (normalizedEpisodeSeason === null) {
      setEditError('Staffel bitte nur als Zahl mit maximal 2 Stellen eingeben, z. B. 1 oder 01.')
      return
    }
    if (normalizedEpisodeNumber === null) {
      setEditError('Episode bitte nur als Zahl mit maximal 3 Stellen eingeben, z. B. 13 oder 013.')
      return
    }
    if (!normalizedEpisodeSeason && normalizedEpisodeNumber) {
      setEditError('Bitte erst eine Staffel angeben, bevor du eine Episode zuordnest.')
      return
    }
    if (normalizedEpisodeSeason && !normalizedEpisodeNumber) {
      setEditError('Bitte auch eine Episodennummer angeben oder beide Felder leeren.')
      return
    }
    setEditEpisodeSeason(normalizedEpisodeSeason)
    setEditEpisodeNumber(normalizedEpisodeNumber)

    if (editingSceneId) {
      try {
        await updateMutation.mutateAsync({
          sceneId: editingSceneId,
          payload: {
            game_time: trimmed,
            note: editNote.trim(),
            episode_season: normalizedEpisodeSeason,
            episode_number: normalizedEpisodeNumber,
          },
        })
        if (normalizedEpisodeSeason && normalizedEpisodeNumber) {
          celebrateScene(editingSceneId)
        }
        handleEditClose()
      } catch (err: any) {
        if (err?.status === 409) {
          const conflictMessage = err?.message || 'Episode ist bereits vergeben.'
          if (window.confirm(`${conflictMessage} Trotzdem überschreiben?`)) {
            try {
              await updateMutation.mutateAsync({
                sceneId: editingSceneId,
                payload: {
                  game_time: trimmed,
                  note: editNote.trim(),
                  episode_season: normalizedEpisodeSeason,
                  episode_number: normalizedEpisodeNumber,
                  overwrite_episode: true,
                },
              })
              if (normalizedEpisodeSeason && normalizedEpisodeNumber) {
                celebrateScene(editingSceneId)
              }
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
  const sessionsById = useMemo(() => {
    const map = new Map<string, Session>()
    for (const session of sessionsData || []) {
      map.set(session.id, session)
    }
    return map
  }, [sessionsData])

  const getObservedTeamForScene = (scene: SceneMarker): string => {
    const direct = normalizeObservedTeamValue(scene.observed_team)
    if (direct) return direct
    const session = sessionsById.get(scene.session_id)
    return normalizeObservedTeamValue(session?.game_info?.observed_team || session?.observed_team)
  }

  // Derive filter options from data
  const leagues = useMemo(() => unique(scenes.map(s => s.league).filter(Boolean) as string[]).sort(), [scenes])
  const seasons = useMemo(() => unique(scenes.map(s => s.season).filter(Boolean) as string[]).sort().reverse(), [scenes])
  const episodeSeasons = useMemo(() => unique(scenes.map(s => sceneSeasonCode(s)).filter(Boolean)).sort().reverse(), [scenes])
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
  const [filterMinRating, setFilterMinRating] = useState('')
  const [sortMode, setSortMode] = useState<'created' | 'rating_desc'>('created')
  const [filterTrack, setFilterTrack] = useState('')
  const [filterDrill, setFilterDrill] = useState('')
  const [filterCompetitionPhase, setFilterCompetitionPhase] = useState('')
  const [filterCompetitionUnitType, setFilterCompetitionUnitType] = useState('')
  const [filterCompetitionUnitValue, setFilterCompetitionUnitValue] = useState('')
  const [filterEpisodeSeason, setFilterEpisodeSeason] = useState('')
  const [filterCurrentContext, setFilterCurrentContext] = useState(false)

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

  const sceneStats = useMemo(() => {
    const assigned = scenes.filter((scene) => isScenePublished(scene)).length
    return {
      assigned,
      new: Math.max(scenes.length - assigned, 0),
    }
  }, [scenes])

  const matchesNonCompetitionFilters = (s: SceneMarker) => {
    if (sessionFilter && s.session_id !== sessionFilter) return false
    if (filterLeague && s.league !== filterLeague) return false
    if (filterSeason && s.season !== filterSeason) return false
    if (filterStatus && (s.status || 'NEW') !== filterStatus) return false
    if (filterMinRating && (s.rating || 0) < Number(filterMinRating)) return false
    if (filterTeam) {
      const t = filterTeam.toLowerCase()
      const matchHome = (s.team_home ?? '').toLowerCase() === t
      const matchAway = (s.team_away ?? '').toLowerCase() === t
      const matchObs = (s.observed_team ?? '').toLowerCase() === t
      if (!matchHome && !matchAway && !matchObs) return false
    }
    if (filterTrack && getSceneTrack(s) !== filterTrack) return false
    if (filterDrill && s.drill_id !== filterDrill) return false
    if (filterEpisodeSeason && sceneSeasonCode(s) !== filterEpisodeSeason) return false
    return true
  }

  const currentContextKeys = useMemo(() => {
    if (!filterCurrentContext) return new Set<string>()
    const latestByLeague = new Map<string, SceneMarker>()
    for (const scene of scenes) {
      if (!matchesNonCompetitionFilters(scene)) continue
      if (!sceneCompetitionContextKey(scene)) continue
      const league = scene.league || ''
      if (!league) continue
      const current = latestByLeague.get(league)
      if (!current || compareSceneContext(scene, current) > 0) {
        latestByLeague.set(league, scene)
      }
    }
    return new Set(Array.from(latestByLeague.values()).map(sceneCompetitionContextKey).filter(Boolean))
  }, [scenes, filterCurrentContext, sessionFilter, filterLeague, filterSeason, filterStatus, filterMinRating, filterTeam, filterTrack, filterDrill, filterEpisodeSeason])

  const currentContextLabel = useMemo(() => {
    if (!filterCurrentContext || currentContextKeys.size === 0) return 'Aktuell'
    const labels = scenes
      .filter((scene) => currentContextKeys.has(sceneCompetitionContextKey(scene)))
      .map((scene) => formatCompetitionContext(scene))
      .filter(Boolean)
    const uniqueLabels = unique(labels)
    if (uniqueLabels.length === 1) return `Aktuell: ${uniqueLabels[0]}`
    return `Aktuell: ${uniqueLabels.length} Ligen`
  }, [filterCurrentContext, currentContextKeys, scenes])

  const filtered = useMemo(() => {
    const result = scenes.filter(s => {
      if (!matchesNonCompetitionFilters(s)) return false
      if (filterCurrentContext) {
        if (!currentContextKeys.has(sceneCompetitionContextKey(s))) return false
      } else {
        if (filterCompetitionPhase && s.competition_phase !== filterCompetitionPhase) return false
        if (filterCompetitionUnitType && s.competition_unit_type !== filterCompetitionUnitType) return false
        if (filterCompetitionUnitValue && String(s.competition_unit_value || '') !== filterCompetitionUnitValue) return false
      }
      return true
    })
    if (sortMode === "rating_desc") {
      return [...result].sort((a, b) => {
        const ratingDiff = (b.rating || 0) - (a.rating || 0)
        if (ratingDiff !== 0) return ratingDiff
        return (Date.parse(b.created_at || "") || 0) - (Date.parse(a.created_at || "") || 0)
      })
    }
    return result
  }, [scenes, sessionFilter, filterLeague, filterSeason, filterTeam, filterStatus, filterMinRating, filterTrack, filterDrill, filterCompetitionPhase, filterCompetitionUnitType, filterCompetitionUnitValue, filterEpisodeSeason, filterCurrentContext, currentContextKeys, sortMode])

  const hasActiveFilter = sessionFilter || filterLeague || filterSeason || filterTeam || filterStatus || filterMinRating || sortMode !== 'created' || filterTrack || filterDrill || filterCompetitionPhase || filterCompetitionUnitValue || filterEpisodeSeason || filterCurrentContext

  const resetFilters = () => {
    setFilterLeague('')
    setFilterSeason('')
    setFilterTeam('')
    setFilterStatus('')
    setFilterMinRating('')
    setSortMode('created')
    setFilterTrack('')
    setFilterDrill('')
    setFilterCompetitionPhase('')
    setFilterCompetitionUnitType('')
    setFilterCompetitionUnitValue('')
    setFilterEpisodeSeason('')
    setFilterCurrentContext(false)
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

  const activeTab: 'pool' | 'insights' = searchParams.get('tab') === 'insights' ? 'insights' : 'pool'

  const setActiveTab = (tab: 'pool' | 'insights') => {
    const nextParams = new URLSearchParams(searchParams)
    if (tab === 'insights') {
      nextParams.set('tab', 'insights')
    } else {
      nextParams.delete('tab')
    }
    setSearchParams(nextParams)
  }

  const insights = useMemo(() => {
    const teamMap = new Map<string, { team: string; scenes: number; published: number }>()
    const leagueMap = new Map<string, number>()
    const drillMap = new Map<string, number>()
    let publishedCount = 0

    for (const scene of scenes) {
      const published = isScenePublished(scene)
      if (published) publishedCount += 1

      if (scene.league) {
        leagueMap.set(scene.league, (leagueMap.get(scene.league) || 0) + 1)
      }

      if (scene.drill_id) {
        drillMap.set(scene.drill_id, (drillMap.get(scene.drill_id) || 0) + 1)
      }

      const observedTeam = getObservedTeamForScene(scene)
      if (observedTeam) {
        const row = teamMap.get(observedTeam) || { team: observedTeam, scenes: 0, published: 0 }
        row.scenes += 1
        if (published) row.published += 1
        teamMap.set(observedTeam, row)
      }
    }

    const teamDistribution = Array.from(teamMap.values()).sort((a, b) => b.scenes - a.scenes || a.team.localeCompare(b.team))
    const leagueDistribution = Array.from(leagueMap.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    const drillDistribution = Array.from(drillMap.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))

    const teamMax = teamDistribution[0]?.scenes || 1
    const leagueMax = leagueDistribution[0]?.count || 1
    const drillMax = drillDistribution[0]?.count || 1

    const totalTeamMentions = teamDistribution.reduce((sum, row) => sum + row.scenes, 0)
    const teamAverage = teamDistribution.length > 0 ? totalTeamMentions / teamDistribution.length : 0
    const topTeam = teamDistribution[0]
    const showContentHint = Boolean(
      topTeam && teamAverage > 0 && topTeam.scenes >= Math.ceil(teamAverage * 1.4) && (topTeam.scenes - teamAverage) >= 2
    )

    return {
      teamDistribution,
      leagueDistribution,
      drillDistribution,
      publishedCount,
      unpublishedCount: Math.max(scenes.length - publishedCount, 0),
      teamMax,
      leagueMax,
      drillMax,
      teamAverage,
      topTeam,
      showContentHint,
    }
  }, [scenes, sessionsById])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <style>{`
        @keyframes ringAboutAssignedGlow {
          0% { box-shadow: 0 0 0 rgba(20,184,166,0), 0 0 0 rgba(34,197,94,0); transform: translateY(0) scale(1); }
          45% { box-shadow: 0 0 0 1px rgba(45,212,191,0.7), 0 0 34px rgba(20,184,166,0.34), 0 0 58px rgba(34,197,94,0.18); transform: translateY(-2px) scale(1.01); }
          100% { box-shadow: 0 0 0 1px rgba(45,212,191,0.32), 0 18px 42px rgba(6,78,59,0.18); transform: translateY(0) scale(1); }
        }
        @keyframes ringAboutBadgeIn {
          0% { opacity: 0; transform: translateY(4px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🎬 Rink About It
        </h1>
        <p style={{ margin: '0.4rem 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
          Szenenpool und redaktionelle Insights für die nächste Episode.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.9rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveTab('pool')}
            aria-pressed={activeTab === 'pool'}
            style={{
              padding: '0.38rem 0.82rem',
              borderRadius: '0.5rem',
              border: activeTab === 'pool' ? '1px solid rgba(125,211,252,0.56)' : '1px solid rgba(148,163,184,0.26)',
              background: activeTab === 'pool' ? 'rgba(14,165,233,0.18)' : 'rgba(15,23,42,0.45)',
              color: activeTab === 'pool' ? '#e0f2fe' : '#cbd5e1',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Szenenpool
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('insights')}
            aria-pressed={activeTab === 'insights'}
            style={{
              padding: '0.38rem 0.82rem',
              borderRadius: '0.5rem',
              border: activeTab === 'insights' ? '1px solid rgba(74,222,128,0.56)' : '1px solid rgba(148,163,184,0.26)',
              background: activeTab === 'insights' ? 'rgba(34,197,94,0.16)' : 'rgba(15,23,42,0.45)',
              color: activeTab === 'insights' ? '#dcfce7' : '#cbd5e1',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Insights
          </button>
        </div>
      </div>

      {activeTab === 'pool' && (
        <>

      {scenes.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setFilterStatus(filterStatus === 'NEW' ? '' : 'NEW')}
            aria-pressed={filterStatus === 'NEW'}
            style={{
              padding: '0.38rem 0.7rem', borderRadius: '0.45rem',
              background: filterStatus === 'NEW' ? 'rgba(148,163,184,0.16)' : 'rgba(255,255,255,0.06)',
              border: filterStatus === 'NEW' ? '1px solid rgba(203,213,225,0.48)' : '1px solid rgba(148,163,184,0.18)',
              color: '#cbd5e1', fontSize: '0.82rem', fontWeight: 750,
              cursor: 'pointer',
              boxShadow: filterStatus === 'NEW' ? '0 0 18px rgba(148,163,184,0.12)' : undefined,
            }}
          >
            Neu: {sceneStats.new}
          </button>
          <button
            type="button"
            onClick={() => {
              const next = !filterCurrentContext
              setFilterCurrentContext(next)
              if (next) {
                setFilterCompetitionPhase('')
                setFilterCompetitionUnitType('')
                setFilterCompetitionUnitValue('')
              }
            }}
            aria-pressed={filterCurrentContext}
            disabled={scenes.length === 0}
            title={filterCurrentContext && currentContextKeys.size === 0 ? 'Kein aktueller Spielkontext für die aktiven Filter gefunden' : 'Neueste Spielkontexte anzeigen'}
            style={{
              padding: '0.38rem 0.72rem', borderRadius: '0.45rem',
              background: filterCurrentContext ? 'rgba(14,165,233,0.22)' : 'rgba(14,165,233,0.10)',
              border: filterCurrentContext ? '1px solid rgba(125,211,252,0.56)' : '1px solid rgba(125,211,252,0.24)',
              color: '#bae6fd',
              boxShadow: filterCurrentContext ? '0 0 22px rgba(14,165,233,0.18)' : undefined,
              fontSize: '0.82rem', fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            {currentContextLabel}
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus(filterStatus === 'ASSIGNED' ? '' : 'ASSIGNED')}
            aria-pressed={filterStatus === 'ASSIGNED'}
            style={{
              padding: '0.38rem 0.72rem', borderRadius: '0.45rem',
              background: filterStatus === 'ASSIGNED'
                ? 'linear-gradient(135deg, rgba(20,184,166,0.34), rgba(34,197,94,0.22))'
                : 'linear-gradient(135deg, rgba(20,184,166,0.22), rgba(34,197,94,0.14))',
              border: filterStatus === 'ASSIGNED' ? '1px solid rgba(153,246,228,0.62)' : '1px solid rgba(45,212,191,0.38)',
              color: '#99f6e4',
              boxShadow: filterStatus === 'ASSIGNED' ? '0 0 24px rgba(20,184,166,0.2)' : '0 0 20px rgba(20,184,166,0.12)',
              fontSize: '0.82rem', fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            ✓ Zugeordnet: {sceneStats.assigned}
          </button>
        </div>
      )}

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
          <select value={filterMinRating} onChange={e => setFilterMinRating(e.target.value)} style={selectStyle}>
            <option value="">Alle Bewertungen</option>
            <option value="3">3★+</option>
            <option value="4">4★+</option>
            <option value="5">5★</option>
          </select>
          <select value={sortMode} onChange={e => setSortMode(e.target.value as 'created' | 'rating_desc')} style={selectStyle}>
            <option value="created">Neueste zuerst</option>
            <option value="rating_desc">Bewertung zuerst</option>
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
                setFilterCurrentContext(false)
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
                setFilterCurrentContext(false)
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
            <SceneCard
              key={scene.id}
              scene={scene}
              onDelete={handleDelete}
              onEdit={handleEditOpen}
              onRatingChange={handleRatingChange}
              celebrate={celebratedSceneId === scene.id}
            />
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
                  onChange={e => setEditEpisodeSeason(e.target.value.replace(/\D/g, '').slice(0, 2))}
                  onBlur={() => {
                    const normalized = normalizeEpisodeCodeInput(editEpisodeSeason, 2)
                    if (normalized !== null) setEditEpisodeSeason(normalized)
                  }}
                  placeholder="z. B. 01"
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
                  onChange={e => setEditEpisodeNumber(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  onBlur={() => {
                    const normalized = normalizeEpisodeCodeInput(editEpisodeNumber, 3)
                    if (normalized !== null) setEditEpisodeNumber(normalized)
                  }}
                  placeholder="z. B. 013"
                  style={{
                    width: '100%', padding: '0.55rem', marginTop: '0.35rem', borderRadius: '0.4rem',
                    border: '1px solid #334155', background: '#0f172a', color: '#cbd5e1',
                    fontSize: '0.95rem', fontFamily: 'monospace', boxSizing: 'border-box',
                  }}
                />
              </label>
            </div>

            <div style={{ marginTop: '0.55rem', fontSize: '0.8rem', color: '#94a3b8' }}>
              Staffel und Episode werden automatisch als 01 / 013 gespeichert.
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

        </>
      )}

      {activeTab === 'insights' && (
        <>
          {isLoading && <div className="card">Lade Insights…</div>}
          {error && <div className="card" style={{ color: '#f87171' }}>Fehler beim Laden der Insights.</div>}

          {!isLoading && !error && scenes.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎬</div>
              <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>Noch keine Szenen im Pool</div>
              <div style={{ fontSize: '0.85rem' }}>
                Sobald du Szenen markierst, erscheinen hier automatisch die redaktionellen Insights.
              </div>
            </div>
          )}

          {!isLoading && !error && scenes.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="card" style={{ padding: '1rem 1.1rem' }}>
                <h3 style={{ margin: '0 0 0.65rem', fontSize: '1.03rem' }}>Team-Verteilung</h3>
                <div style={{ display: 'grid', gap: '0.45rem' }}>
                  {insights.teamDistribution.map((row) => (
                    <div key={row.team} style={{ display: 'grid', gridTemplateColumns: '220px 1fr auto', gap: '0.6rem', alignItems: 'center' }}>
                      <span style={{ color: '#e2e8f0', fontSize: '0.87rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.team}</span>
                      <div style={{ height: '0.55rem', borderRadius: '999px', background: 'rgba(148,163,184,0.2)', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.max((row.scenes / insights.teamMax) * 100, 2)}%`, height: '100%', background: 'linear-gradient(90deg, rgba(34,197,94,0.72), rgba(45,212,191,0.92))' }} />
                      </div>
                      <span style={{ color: '#cbd5e1', fontWeight: 700, fontSize: '0.82rem' }}>{row.scenes}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card" style={{ padding: '1rem 1.1rem' }}>
                <h3 style={{ margin: '0 0 0.65rem', fontSize: '1.03rem' }}>Liga-Verteilung</h3>
                <div style={{ display: 'grid', gap: '0.45rem' }}>
                  {insights.leagueDistribution.map((row) => (
                    <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: '0.6rem', alignItems: 'center' }}>
                      <span style={{ color: '#e2e8f0', fontSize: '0.86rem' }}>{row.label}</span>
                      <div style={{ height: '0.5rem', borderRadius: '999px', background: 'rgba(148,163,184,0.2)', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.max((row.count / insights.leagueMax) * 100, 2)}%`, height: '100%', background: 'linear-gradient(90deg, rgba(14,165,233,0.74), rgba(56,189,248,0.92))' }} />
                      </div>
                      <span style={{ color: '#cbd5e1', fontWeight: 700, fontSize: '0.82rem' }}>{row.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card" style={{ padding: '1rem 1.1rem' }}>
                <h3 style={{ margin: '0 0 0.65rem', fontSize: '1.03rem' }}>Drill-Verteilung</h3>
                <div style={{ display: 'grid', gap: '0.45rem' }}>
                  {insights.drillDistribution.map((row) => (
                    <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '140px 1fr auto', gap: '0.6rem', alignItems: 'center' }}>
                      <span style={{ color: '#e2e8f0', fontFamily: 'monospace', fontSize: '0.85rem' }}>{row.label}</span>
                      <div style={{ height: '0.5rem', borderRadius: '999px', background: 'rgba(148,163,184,0.2)', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.max((row.count / insights.drillMax) * 100, 2)}%`, height: '100%', background: 'linear-gradient(90deg, rgba(245,158,11,0.74), rgba(251,191,36,0.92))' }} />
                      </div>
                      <span style={{ color: '#cbd5e1', fontWeight: 700, fontSize: '0.82rem' }}>{row.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card" style={{ padding: '1rem 1.1rem' }}>
                <h3 style={{ margin: '0 0 0.65rem', fontSize: '1.03rem' }}>Veroeffentlichte Szenen</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.65rem' }}>
                  <div style={{ border: '1px solid rgba(45,212,191,0.32)', borderRadius: '0.55rem', padding: '0.75rem', background: 'rgba(20,184,166,0.10)' }}>
                    <div style={{ color: '#99f6e4', fontSize: '0.82rem' }}>Veroeffentlicht</div>
                    <div style={{ color: '#e2e8f0', fontSize: '1.55rem', fontWeight: 800 }}>{insights.publishedCount}</div>
                  </div>
                  <div style={{ border: '1px solid rgba(148,163,184,0.32)', borderRadius: '0.55rem', padding: '0.75rem', background: 'rgba(148,163,184,0.09)' }}>
                    <div style={{ color: '#cbd5e1', fontSize: '0.82rem' }}>Nicht veroeffentlicht</div>
                    <div style={{ color: '#e2e8f0', fontSize: '1.55rem', fontWeight: 800 }}>{insights.unpublishedCount}</div>
                  </div>
                </div>
                <p style={{ margin: '0.55rem 0 0', color: '#94a3b8', fontSize: '0.78rem' }}>
                  Veroeffentlicht basiert auf dem Szenenstatus Zugeordnet (Episode gesetzt).
                </p>
              </div>

              <div className="card" style={{ padding: '1rem 1.1rem' }}>
                <h3 style={{ margin: '0 0 0.65rem', fontSize: '1.03rem' }}>Team x Veroeffentlicht</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(148,163,184,0.26)' }}>
                        <th style={{ padding: '0.45rem 0.35rem' }}>Team</th>
                        <th style={{ padding: '0.45rem 0.35rem' }}>Szenen</th>
                        <th style={{ padding: '0.45rem 0.35rem' }}>Veroeffentlicht</th>
                      </tr>
                    </thead>
                    <tbody>
                      {insights.teamDistribution.map((row) => (
                        <tr key={`table-${row.team}`} style={{ borderBottom: '1px solid rgba(148,163,184,0.12)' }}>
                          <td style={{ padding: '0.45rem 0.35rem', color: '#e2e8f0' }}>{row.team}</td>
                          <td style={{ padding: '0.45rem 0.35rem', color: '#cbd5e1', fontWeight: 700 }}>{row.scenes}</td>
                          <td style={{ padding: '0.45rem 0.35rem', color: '#99f6e4', fontWeight: 700 }}>{row.published}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {insights.showContentHint && insights.topTeam && (
                <div className="card" style={{ padding: '1rem 1.1rem', border: '1px solid rgba(250,204,21,0.36)', background: 'linear-gradient(145deg, rgba(120,53,15,0.24), rgba(15,23,42,0.92))' }}>
                  <h3 style={{ margin: '0 0 0.45rem', fontSize: '1.02rem' }}>Content-Hinweis</h3>
                  <p style={{ margin: 0, color: '#fef3c7', fontSize: '0.87rem', lineHeight: 1.55 }}>
                    {insights.topTeam.team} taucht aktuell besonders haeufig im Szenenpool auf ({insights.topTeam.scenes} Szenen, Durchschnitt {insights.teamAverage.toFixed(1)}).
                  </p>
                  <p style={{ margin: '0.45rem 0 0', color: '#fde68a', fontSize: '0.86rem', lineHeight: 1.55 }}>
                    Fuer mehr Vielfalt koennte als naechstes ein anderes Team priorisiert werden.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function SceneRating({ rating, onChange }: { rating?: SceneMarker["rating"]; onChange: (rating: SceneRatingValue) => void }) {
  const currentRating = rating || 0

  return (
    <div
      aria-label={currentRating ? String(currentRating) + " von 5 Sterne" : "Keine Bewertung"}
      style={{ display: "inline-flex", alignItems: "center", gap: "0.06rem" }}
    >
      {[1, 2, 3, 4, 5].map((value) => {
        const star = value as SceneRatingValue
        const active = star <= currentRating
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            title={currentRating === star ? "Bewertung entfernen" : String(star) + " Sterne setzen"}
            aria-label={currentRating === star ? "Bewertung entfernen" : String(star) + " Sterne setzen"}
            style={{
              width: "1.15rem",
              height: "1.15rem",
              border: "none",
              background: "transparent",
              color: active ? "#fbbf24" : "#475569",
              cursor: "pointer",
              fontSize: "1rem",
              lineHeight: 1,
              padding: 0,
            }}
          >
            {active ? "★" : "☆"}
          </button>
        )
      })}
    </div>
  )
}

function SceneCard({ scene, onDelete, onEdit, onRatingChange, celebrate = false }: { scene: SceneMarker; onDelete: (id: string) => void; onEdit: (scene: SceneMarker) => void; onRatingChange: (scene: SceneMarker, rating: SceneRatingValue) => void; celebrate?: boolean }) {
  const gameLabel = scene.team_home && scene.team_away
    ? `${scene.team_home} vs ${scene.team_away}`
    : scene.team_home || scene.team_away || '–'

  const competitionContext = formatCompetitionContext(scene)

  // Extract drill number suffix, e.g. "B1_D4" -> "D4", "A1_D1" -> "D1"
  const drillSuffix = scene.drill_id
    ? (scene.drill_id.match(/_(D\d+)$/i)?.[1] ?? scene.drill_id)
    : null
  const seasonCode = sceneSeasonCode(scene)
  const episodeCode = sceneEpisodeCode(scene)
  const episodeLabel = seasonCode && episodeCode
    ? `Staffel ${seasonCode} · Episode ${episodeCode}`
    : null
  const isAssigned = (scene.status || 'NEW') === 'ASSIGNED'
  const sceneCode = scene.scene_code || scene.internal_scene_id || scene.id

  return (
    <div
      id={`scene-${scene.id}`}
      className="card"
      style={{
        padding: '1rem 1.1rem',
        borderLeft: isAssigned ? '3px solid #2dd4bf' : '3px solid #4fc3f7',
        borderColor: isAssigned ? 'rgba(45,212,191,0.36)' : undefined,
        background: isAssigned
          ? 'linear-gradient(145deg, rgba(8,47,73,0.74) 0%, rgba(6,78,59,0.38) 48%, rgba(15,23,42,0.92) 100%)'
          : undefined,
        boxShadow: isAssigned
          ? '0 0 0 1px rgba(45,212,191,0.22), 0 18px 42px rgba(6,78,59,0.16)'
          : undefined,
        position: 'relative', overflow: 'hidden',
        animation: celebrate ? 'ringAboutAssignedGlow 720ms cubic-bezier(0.18, 0.9, 0.28, 1)' : undefined,
        display: 'flex', flexDirection: 'column', gap: '0.6rem',
      }}
    >
      {isAssigned && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(115deg, transparent 8%, rgba(153,246,228,0.10) 38%, transparent 62%)',
            opacity: 0.72,
          }}
        />
      )}

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

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', position: 'relative' }}>
        <span style={{
          background: 'rgba(79,195,247,0.15)',
          color: '#7dd3fc',
          border: '1px solid rgba(125,211,252,0.36)',
          borderRadius: '0.32rem',
          padding: '0.18rem 0.52rem',
          fontSize: '0.76rem',
          fontWeight: 900,
          fontFamily: 'monospace',
          letterSpacing: '0.02em',
        }} title="Interne Szenen-ID">
          {sceneCode}
        </span>
        <span style={{
          background: isAssigned
            ? 'linear-gradient(135deg, rgba(34,197,94,0.34), rgba(20,184,166,0.24))'
            : 'rgba(255,255,255,0.08)',
          color: isAssigned ? '#d1fae5' : '#cbd5e1',
          border: isAssigned ? '1px solid rgba(134,239,172,0.52)' : '1px solid rgba(255,255,255,0.14)',
          borderRadius: '0.32rem',
          padding: isAssigned ? '0.18rem 0.58rem' : '0.12rem 0.45rem',
          fontSize: isAssigned ? '0.76rem' : '0.72rem',
          fontWeight: 850,
          boxShadow: isAssigned ? '0 0 16px rgba(34,197,94,0.18)' : undefined,
          animation: celebrate ? 'ringAboutBadgeIn 280ms ease-out both' : undefined,
        }}>
          {isAssigned ? '✓ Zugeordnet' : sceneStatusLabel(scene.status)}
        </span>
        {episodeLabel && (
          <span style={{
            background: isAssigned
              ? 'linear-gradient(135deg, rgba(14,165,233,0.26), rgba(45,212,191,0.22))'
              : 'rgba(96,165,250,0.14)',
            color: isAssigned ? '#e0f2fe' : '#bfdbfe',
            border: isAssigned ? '1px solid rgba(125,211,252,0.42)' : '1px solid rgba(96,165,250,0.22)',
            borderRadius: '0.32rem', padding: isAssigned ? '0.18rem 0.58rem' : '0.12rem 0.45rem',
            fontSize: isAssigned ? '0.76rem' : '0.72rem', fontWeight: 850,
            boxShadow: isAssigned ? '0 0 18px rgba(14,165,233,0.14)' : undefined,
            animation: celebrate ? 'ringAboutBadgeIn 300ms 70ms ease-out both' : undefined,
          }}>
            {isAssigned ? `🎬 ${episodeLabel}` : episodeLabel}
          </span>
        )}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: "1.35rem",
            padding: "0.08rem 0.38rem",
            borderRadius: "0.32rem",
            background: "rgba(251,191,36,0.08)",
            border: "1px solid rgba(251,191,36,0.18)",
          }}
        >
          <SceneRating rating={scene.rating} onChange={(rating) => onRatingChange(scene, rating)} />
        </span>
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
