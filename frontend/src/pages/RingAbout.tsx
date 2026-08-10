import { useState, useMemo, useEffect, useRef, type KeyboardEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { api, type SceneMarker, type SceneMarkerUpdate, type Session } from '../api'
import Card from '../components/Card'
import FilterSheet from '../components/FilterSheet'
import { ManualSceneForm, type ManualSceneFormMode } from '../components/ManualSceneForm'
import { PageSkeleton } from '../components/Skeleton'
import { formatCompetitionContext, getCompetitionConfig } from '../data/competitionConfig'
import {
  formatGameTimeInput,
  getSceneMetadataStatus,
  getSceneSource,
  isManualScene,
  scenePeriodLabel,
} from '../utils/sceneHelpers'
import { shareOrCopy } from '../utils/share'
import {
  copyTextToClipboard,
  generateSceneAssetNameFromScene,
} from '../utils/sceneAssetName'
import { buildSceneRatedEvent } from '../features/progression'
import { useRewards } from '../features/rewards'
import { computeScenePoolOverview } from '../stats/sceneOverview'
import { ScenePoolOverviewKpis } from '../components/dashboard/ScenePoolOverviewKpis'
import { SceneInsightsOverviewKpis } from '../components/dashboard/SceneInsightsOverviewKpis'
import styles from './RingAbout.module.css'

type SceneRatingValue = 1 | 2 | 3 | 4 | 5

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}

function isScenePublished(scene: SceneMarker): boolean {
  return getSceneStatus(scene) === 'ASSIGNED'
}

function getSceneStatus(scene: Pick<SceneMarker, 'status'> | { status?: string }): 'NEW' | 'PIPELINE' | 'ASSIGNED' {
  const value = (scene.status || 'NEW').toUpperCase()
  if (value === 'ASSIGNED' || value === 'PIPELINE') return value
  return 'NEW'
}

function sceneStatusLabel(status?: string) {
  const normalized = getSceneStatus({ status })
  if (normalized === 'ASSIGNED') return 'Zugeordnet'
  if (normalized === 'PIPELINE') return 'Pipeline'
  return 'Neu'
}

function getSceneTrack(scene: SceneMarker) {
  return scene.track_id || scene.module_id?.split('_')[0] || ''
}

function normalizeObservedTeamValue(value?: string | null): string {
  const normalized = (value || '').trim()
  const lower = normalized.toLowerCase()
  if (!normalized || lower === 'none' || lower === 'null' || lower === 'undefined' || lower === '-') {
    return ''
  }
  return normalized
}

function sceneObservedTeamSnapshot(scene: SceneMarker): string {
  return normalizeObservedTeamValue(scene.observed_team_name || scene.observed_team)
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

/** Compact chip label, e.g. "DEL · ST 34" or "NHL · G72". */
function compactCompetitionContext(scene: SceneMarker): string {
  const league = scene.league || ''
  const unitLabel = (scene.competition_unit_label || '').toLowerCase()
  const unitValue = String(scene.competition_unit_value || '').trim()
  let unitShort = unitValue
  if (unitLabel.includes('spieltag')) unitShort = `ST ${unitValue}`
  else if (unitLabel.includes('game')) unitShort = `G${unitValue}`
  else if (scene.competition_unit_label && unitValue) {
    unitShort = `${scene.competition_unit_label} ${unitValue}`
  }
  return [league, unitShort].filter(Boolean).join(' · ')
}

type LatestRoundChip = {
  contextKey: string
  league: string
  label: string
  shortLabel: string
  sceneCount: number
}

function buildLatestRoundChips(scenes: SceneMarker[], leagueFilter?: string): LatestRoundChip[] {
  const latestByLeague = new Map<string, SceneMarker>()
  for (const scene of scenes) {
    const contextKey = sceneCompetitionContextKey(scene)
    if (!contextKey) continue
    const league = scene.league || ''
    if (!league) continue
    if (leagueFilter && league !== leagueFilter) continue
    const current = latestByLeague.get(league)
    if (!current || compareSceneContext(scene, current) > 0) {
      latestByLeague.set(league, scene)
    }
  }

  const chips: LatestRoundChip[] = []
  for (const scene of latestByLeague.values()) {
    const contextKey = sceneCompetitionContextKey(scene)
    if (!contextKey) continue
    const sceneCount = scenes.filter((item) => sceneCompetitionContextKey(item) === contextKey).length
    chips.push({
      contextKey,
      league: scene.league || '',
      label: formatCompetitionContext(scene),
      shortLabel: compactCompetitionContext(scene),
      sceneCount,
    })
  }

  return chips.sort((a, b) => a.league.localeCompare(b.league, 'de'))
}

export default function RingAbout() {
  const queryClient = useQueryClient()
  const { ingestActivityEvents } = useRewards()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data, isLoading, error } = useQuery({
    queryKey: ['scenes'],
    queryFn: () => api.getScenes(),
  })

  const { data: curriculum } = useQuery({
    queryKey: ['curriculum'],
    queryFn: () => api.getCurriculum(),
  })

  const drillSceneSlugById = useMemo(() => {
    const map = new Map<string, string>()
    for (const track of curriculum?.tracks || []) {
      for (const module of track.modules || []) {
        for (const drill of module.drills || []) {
          if (drill.id && drill.sceneSlug) {
            map.set(drill.id, drill.sceneSlug)
          }
        }
      }
    }
    return map
  }, [curriculum])

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
        onSuccess: () => {
          if (typeof nextRating === 'number' && nextRating >= 1) {
            void ingestActivityEvents([
              buildSceneRatedEvent({
                sceneId: scene.id,
                rating: nextRating,
              }),
            ])
          }
        },
        onError: () => {
          if (previousScenes) queryClient.setQueryData(['scenes'], previousScenes)
        },
      }
    )
  }

  const handlePipelineToggle = (scene: SceneMarker) => {
    const current = getSceneStatus(scene)
    if (current === 'ASSIGNED') return
    const nextStatus = current === 'PIPELINE' ? 'NEW' : 'PIPELINE'
    const previousScenes = queryClient.getQueryData<{ scenes: SceneMarker[] }>(['scenes'])

    queryClient.setQueryData<{ scenes: SceneMarker[] }>(['scenes'], (currentData) => {
      if (!currentData?.scenes) return currentData
      return {
        ...currentData,
        scenes: currentData.scenes.map((item) => (
          item.id === scene.id ? { ...item, status: nextStatus } : item
        )),
      }
    })

    updateMutation.mutate(
      {
        sceneId: scene.id,
        payload: { status: nextStatus },
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
  const [manualFormMode, setManualFormMode] = useState<ManualSceneFormMode | null>(null)
  const [manualFormScene, setManualFormScene] = useState<SceneMarker | null>(null)
  const [filterSource, setFilterSource] = useState<'' | 'drill' | 'manual'>('')

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
    if (isManualScene(scene)) {
      setManualFormScene(scene)
      setManualFormMode(getSceneMetadataStatus(scene) === 'incomplete' ? 'enrich' : 'edit')
      return
    }
    setEditingSceneId(scene.id)
    setEditGameTime(scene.game_time)
    setEditNote(scene.note || '')
    setEditEpisodeSeason(sceneSeasonCode(scene))
    setEditEpisodeNumber(sceneEpisodeCode(scene))
    setEditError(null)
  }

  const handleEnrichOpen = (scene: SceneMarker) => {
    setManualFormScene(scene)
    setManualFormMode('enrich')
  }

  const handleManualFormClose = () => {
    setManualFormMode(null)
    setManualFormScene(null)
  }

  const handleManualFormSaved = (scene: SceneMarker, options?: { continueEditing?: boolean }) => {
    queryClient.setQueryData<{ scenes: SceneMarker[] }>(['scenes'], (current) => {
      if (!current?.scenes) return { scenes: [scene] }
      const exists = current.scenes.some((item) => item.id === scene.id)
      return {
        scenes: exists
          ? current.scenes.map((item) => (item.id === scene.id ? { ...item, ...scene } : item))
          : [scene, ...current.scenes],
      }
    })
    if (options?.continueEditing) {
      setManualFormScene(scene)
    }
    queryClient.invalidateQueries({ queryKey: ['scenes'] })
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

  const handleEditKeyDown = (e: KeyboardEvent) => {
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
    const direct = sceneObservedTeamSnapshot(scene)
    if (direct) return direct
    const session = scene.session_id ? sessionsById.get(scene.session_id) : undefined
    return normalizeObservedTeamValue(
      session?.game_info?.observed_team_name ||
      session?.game_info?.observed_team ||
      session?.observed_team_name ||
      session?.observed_team
    )
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
      const observedTeam = getObservedTeamForScene(s)
      if (observedTeam) all.push(observedTeam)
    }
    return unique(all).sort()
  }, [scenes, sessionsById])

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
  const [filterContextKey, setFilterContextKey] = useState('')
  const [insightsLeagueFilter, setInsightsLeagueFilter] = useState('DEL')
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)

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

  const sceneOverview = useMemo(() => computeScenePoolOverview(scenes), [scenes])

  const matchesNonCompetitionFilters = (s: SceneMarker) => {
    if (sessionFilter && s.session_id !== sessionFilter) return false
    if (filterSource === 'manual' && !isManualScene(s)) return false
    if (filterSource === 'drill' && isManualScene(s)) return false
    if (filterLeague && s.league !== filterLeague) return false
    if (filterSeason && s.season !== filterSeason) return false
    if (filterStatus && getSceneStatus(s) !== filterStatus) return false
    if (filterMinRating && (s.rating || 0) < Number(filterMinRating)) return false
    if (filterTeam) {
      const t = filterTeam.toLowerCase()
      const matchHome = (s.team_home ?? '').toLowerCase() === t
      const matchAway = (s.team_away ?? '').toLowerCase() === t
      const matchObs = getObservedTeamForScene(s).toLowerCase() === t
      if (!matchHome && !matchAway && !matchObs) return false
    }
    if (filterTrack && getSceneTrack(s) !== filterTrack) return false
    if (filterDrill && s.drill_id !== filterDrill) return false
    if (filterEpisodeSeason && sceneSeasonCode(s) !== filterEpisodeSeason) return false
    return true
  }

  const latestRoundChips = useMemo(
    () => buildLatestRoundChips(scenes, filterLeague || undefined),
    [scenes, filterLeague],
  )

  const activeContextChip = useMemo(
    () => latestRoundChips.find((chip) => chip.contextKey === filterContextKey) || null,
    [latestRoundChips, filterContextKey],
  )

  useEffect(() => {
    if (filterContextKey && !latestRoundChips.some((chip) => chip.contextKey === filterContextKey)) {
      setFilterContextKey('')
    }
  }, [filterContextKey, latestRoundChips])

  const filtered = useMemo(() => {
    const result = scenes.filter(s => {
      if (!matchesNonCompetitionFilters(s)) return false
      if (filterContextKey) {
        if (sceneCompetitionContextKey(s) !== filterContextKey) return false
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
  }, [scenes, sessionFilter, filterSource, filterLeague, filterSeason, filterTeam, filterStatus, filterMinRating, filterTrack, filterDrill, filterCompetitionPhase, filterCompetitionUnitType, filterCompetitionUnitValue, filterEpisodeSeason, filterContextKey, sortMode])

  const hasActiveFilter = sessionFilter || filterSource || filterLeague || filterSeason || filterTeam || filterStatus || filterMinRating || sortMode !== 'created' || filterTrack || filterDrill || filterCompetitionPhase || filterCompetitionUnitValue || filterEpisodeSeason || filterContextKey

  const resetFilters = () => {
    setFilterLeague('')
    setFilterSeason('')
    setFilterTeam('')
    setFilterStatus('')
    setFilterMinRating('')
    setSortMode('created')
    setFilterTrack('')
    setFilterDrill('')
    setFilterSource('')
    setFilterCompetitionPhase('')
    setFilterCompetitionUnitType('')
    setFilterCompetitionUnitValue('')
    setFilterEpisodeSeason('')
    setFilterContextKey('')
    if (sessionFilter) {
      setSearchParams({})
    }
  }

  const activeTab: 'pool' | 'insights' = searchParams.get('tab') === 'insights' ? 'insights' : 'pool'

  const setActiveTab = (tab: 'pool' | 'insights') => {
    const nextParams = new URLSearchParams(searchParams)
    if (tab === 'insights') {
      nextParams.set('tab', 'insights')
      setInsightsLeagueFilter('DEL')
    } else {
      nextParams.delete('tab')
    }
    setSearchParams(nextParams)
  }

  useEffect(() => {
    if (activeTab === 'insights') {
      setInsightsLeagueFilter('DEL')
    }
  }, [activeTab])

  const insightsScenes = useMemo(() => {
    if (!insightsLeagueFilter) return scenes
    return scenes.filter((scene) => scene.league === insightsLeagueFilter)
  }, [scenes, insightsLeagueFilter])

  const insights = useMemo(() => {
    const teamMap = new Map<string, { team: string; scenes: number; published: number }>()
    const leagueMap = new Map<string, number>()
    const drillMap = new Map<string, number>()
    let publishedCount = 0

    for (const scene of insightsScenes) {
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
      unpublishedCount: Math.max(insightsScenes.length - publishedCount, 0),
      teamMax,
      leagueMax,
      drillMax,
      teamAverage,
      topTeam,
      showContentHint,
    }
  }, [insightsScenes, sessionsById])

  const activeFilterChips = [
    sessionFilter ? { key: 'session', label: `Session: ${sessionFilter}`, clear: () => setSearchParams({}) } : null,
    filterSource ? { key: 'source', label: filterSource === 'manual' ? 'Quelle: Manuell' : 'Quelle: Drills', clear: () => setFilterSource('') } : null,
    filterLeague ? { key: 'league', label: `Liga: ${filterLeague}`, clear: () => {
      setFilterLeague('')
      setFilterCompetitionPhase('')
      setFilterCompetitionUnitType('')
      setFilterCompetitionUnitValue('')
    } } : null,
    filterSeason ? { key: 'season', label: `Saison: ${filterSeason}`, clear: () => setFilterSeason('') } : null,
    filterStatus ? { key: 'status', label: `Status: ${sceneStatusLabel(filterStatus)}`, clear: () => setFilterStatus('') } : null,
    filterMinRating ? { key: 'rating', label: `Bewertung: ${filterMinRating}★+`, clear: () => setFilterMinRating('') } : null,
    sortMode !== 'created' ? { key: 'sort', label: 'Sortierung: Bewertung', clear: () => setSortMode('created') } : null,
    filterTeam ? { key: 'team', label: `Team: ${filterTeam}`, clear: () => setFilterTeam('') } : null,
    filterTrack ? { key: 'track', label: `Track: ${filterTrack}`, clear: () => setFilterTrack('') } : null,
    filterDrill ? { key: 'drill', label: `Drill: ${filterDrill}`, clear: () => setFilterDrill('') } : null,
    filterCompetitionPhase ? { key: 'phase', label: `Phase: ${competitionPhases.find((p) => p.id === filterCompetitionPhase)?.label || filterCompetitionPhase}`, clear: () => {
      setFilterCompetitionPhase('')
      setFilterCompetitionUnitType('')
      setFilterCompetitionUnitValue('')
    } } : null,
    filterCompetitionUnitValue ? { key: 'unit', label: `${selectedCompetitionPhase?.unit.label || 'Einheit'}: ${filterCompetitionUnitValue}`, clear: () => setFilterCompetitionUnitValue('') } : null,
    filterEpisodeSeason ? { key: 'episodeSeason', label: `Staffel: ${filterEpisodeSeason}`, clear: () => setFilterEpisodeSeason('') } : null,
    activeContextChip ? { key: 'context', label: activeContextChip.label, clear: () => setFilterContextKey('') } : null,
  ].filter(Boolean) as Array<{ key: string; label: string; clear: () => void }>

  const advancedFilterCount = [
    filterMinRating,
    sortMode !== 'created',
    filterTeam,
    filterTrack,
    filterDrill,
    filterCompetitionPhase,
    filterCompetitionUnitValue,
    filterEpisodeSeason,
  ].filter(Boolean).length

  return (
    <div className={styles.page}>
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

      <header className="ui-page-header">
        <h1 className="ui-page-title">Rink About It!</h1>
        <p className="ui-page-lead">
          Szenenpool und redaktionelle Insights — filtern, bewerten und für die nächste Episode vorbereiten.
        </p>
        <div className={styles.headerRow}>
          <div className={styles.tabs}>
            <button
              type="button"
              onClick={() => setActiveTab('pool')}
              aria-pressed={activeTab === 'pool'}
              className={`${styles.tab}${activeTab === 'pool' ? ` ${styles.tabActive}` : ''}`}
            >
              Szenenpool
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('insights')}
              aria-pressed={activeTab === 'insights'}
              className={`${styles.tab}${activeTab === 'insights' ? ` ${styles.tabActiveInsights}` : ''}`}
            >
              Insights
            </button>
            <button
              type="button"
              className={styles.addBtn}
              onClick={() => {
                setManualFormScene(null)
                setManualFormMode('create')
              }}
            >
              Szene hinzufügen
            </button>
          </div>
        </div>
      </header>

      {activeTab === 'pool' && (
        <>
          {scenes.length > 0 && (
            <ScenePoolOverviewKpis
              overview={sceneOverview}
              className={styles.kpiGrid}
              onApplyStatusFilter={(status) => setFilterStatus(status)}
            />
          )}

          {scenes.length > 0 && (
            <div className={styles.quickFilters}>
              <button
                type="button"
                onClick={() => setFilterStatus(filterStatus === 'NEW' ? '' : 'NEW')}
                aria-pressed={filterStatus === 'NEW'}
                className={`${styles.quickChip}${filterStatus === 'NEW' ? ` ${styles.quickChipActive}` : ''}`}
              >
                Neu: {sceneOverview.new}
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus(filterStatus === 'PIPELINE' ? '' : 'PIPELINE')}
                aria-pressed={filterStatus === 'PIPELINE'}
                className={`${styles.quickChip} ${styles.quickChipPipeline}${filterStatus === 'PIPELINE' ? ` ${styles.quickChipPipelineActive}` : ''}`}
              >
                Pipeline: {sceneOverview.pipeline}
              </button>
              {latestRoundChips.map((chip) => (
                <button
                  key={chip.contextKey}
                  type="button"
                  onClick={() => {
                    const nextKey = filterContextKey === chip.contextKey ? '' : chip.contextKey
                    setFilterContextKey(nextKey)
                    if (nextKey) {
                      setFilterCompetitionPhase('')
                      setFilterCompetitionUnitType('')
                      setFilterCompetitionUnitValue('')
                    }
                  }}
                  aria-pressed={filterContextKey === chip.contextKey}
                  title={`Neuester Spieltag in ${chip.league}: ${chip.label}`}
                  className={`${styles.quickChip} ${styles.quickChipCurrent}${filterContextKey === chip.contextKey ? ` ${styles.quickChipCurrentActive}` : ''}`}
                >
                  {chip.shortLabel} · {chip.sceneCount}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setFilterStatus(filterStatus === 'ASSIGNED' ? '' : 'ASSIGNED')}
                aria-pressed={filterStatus === 'ASSIGNED'}
                className={`${styles.quickChip} ${styles.quickChipAssigned}${filterStatus === 'ASSIGNED' ? ` ${styles.quickChipAssignedActive}` : ''}`}
              >
                Zugeordnet: {sceneOverview.assigned}
              </button>
            </div>
          )}

          <Card className={styles.filterCard}>
            <div className={styles.filterHeader}>
              <h2 className={styles.filterTitle}>Filter</h2>
              {hasActiveFilter && (
                <button type="button" className={styles.filterReset} onClick={resetFilters}>
                  Zurücksetzen
                </button>
              )}
            </div>

            {sessionFilter && (
              <p className={styles.sessionFilterNote}>
                Session-Filter aktiv: <strong>{sessionFilter}</strong>
              </p>
            )}

            <div className={styles.filterBase}>
              {leagues.length > 0 && (
                <div className={styles.filterField}>
                  <label htmlFor="scene-league">Liga</label>
                  <select
                    id="scene-league"
                    className="appSelect"
                    value={filterLeague}
                    onChange={e => {
                      setFilterLeague(e.target.value)
                      setFilterCompetitionPhase('')
                      setFilterCompetitionUnitType('')
                      setFilterCompetitionUnitValue('')
                    }}
                  >
                    <option value="">Alle</option>
                    {leagues.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              )}
              {seasons.length > 0 && (
                <div className={styles.filterField}>
                  <label htmlFor="scene-season">Saison</label>
                  <select id="scene-season" className="appSelect" value={filterSeason} onChange={e => setFilterSeason(e.target.value)}>
                    <option value="">Alle</option>
                    {seasons.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
              <div className={styles.filterField}>
                <label htmlFor="scene-status">Status</label>
                <select id="scene-status" className="appSelect" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="">Alle</option>
                  <option value="NEW">Neu</option>
                  <option value="PIPELINE">Pipeline</option>
                  <option value="ASSIGNED">Zugeordnet</option>
                </select>
              </div>
              <div className={styles.filterField}>
                <label htmlFor="scene-source">Quelle</label>
                <select id="scene-source" className="appSelect" value={filterSource} onChange={e => setFilterSource((e.target.value as '' | 'drill' | 'manual') || '')}>
                  <option value="">Alle</option>
                  <option value="drill">Aus Drills</option>
                  <option value="manual">Manuell erfasst</option>
                </select>
              </div>
            </div>

            <details className={`${styles.filterMore} ${styles.filterMoreDesktop}`}>
              <summary className={styles.filterMoreSummary}>
                <span>
                  Weitere Filter
                  {advancedFilterCount > 0 ? ` · ${advancedFilterCount} aktiv` : ''}
                </span>
                <span className={styles.moreChevron} aria-hidden="true" />
              </summary>
              <div className={styles.filterMoreBody}>
                <div className={styles.filterGroups}>
                  <div className={styles.filterGroup}>
                    <div className={styles.filterGroupLabel}>Inhalt</div>
                    <div className={styles.filterRow}>
                      <div className={styles.filterField}>
                        <label htmlFor="scene-rating">Bewertung</label>
                        <select id="scene-rating" className="appSelect" value={filterMinRating} onChange={e => setFilterMinRating(e.target.value)}>
                          <option value="">Alle</option>
                          <option value="3">3★+</option>
                          <option value="4">4★+</option>
                          <option value="5">5★</option>
                        </select>
                      </div>
                      <div className={styles.filterField}>
                        <label htmlFor="scene-sort">Sortierung</label>
                        <select id="scene-sort" className="appSelect" value={sortMode} onChange={e => setSortMode(e.target.value as 'created' | 'rating_desc')}>
                          <option value="created">Neueste zuerst</option>
                          <option value="rating_desc">Bewertung zuerst</option>
                        </select>
                      </div>
                      {teams.length > 0 && (
                        <div className={styles.filterField}>
                          <label htmlFor="scene-team">Team</label>
                          <select id="scene-team" className="appSelect" value={filterTeam} onChange={e => setFilterTeam(e.target.value)}>
                            <option value="">Alle</option>
                            {teams.map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}
                          </select>
                        </div>
                      )}
                      {tracks.length > 0 && (
                        <div className={styles.filterField}>
                          <label htmlFor="scene-track">Track</label>
                          <select id="scene-track" className="appSelect" value={filterTrack} onChange={e => setFilterTrack(e.target.value)}>
                            <option value="">Alle</option>
                            {tracks.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      )}
                      {drills.length > 0 && (
                        <div className={styles.filterField}>
                          <label htmlFor="scene-drill">Drill</label>
                          <select id="scene-drill" className="appSelect" value={filterDrill} onChange={e => setFilterDrill(e.target.value)}>
                            <option value="">Alle</option>
                            {drills.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {(competitionPhases.length > 0 || episodeSeasons.length > 0) && (
                    <div className={styles.filterGroup}>
                      <div className={styles.filterGroupLabel}>Wettbewerb</div>
                      <div className={styles.filterRow}>
                        {competitionPhases.length > 0 && (
                          <div className={styles.filterField}>
                            <label htmlFor="scene-phase">Phase</label>
                            <select
                              id="scene-phase"
                              className="appSelect"
                              value={filterCompetitionPhase}
                              onChange={e => {
                                setFilterContextKey('')
                                setFilterCompetitionPhase(e.target.value)
                                const nextPhase = competitionPhases.find((phase) => phase.id === e.target.value)
                                setFilterCompetitionUnitType(nextPhase?.unit.type || '')
                                setFilterCompetitionUnitValue('')
                              }}
                            >
                              <option value="">Alle</option>
                              {competitionPhases.map((phase) => <option key={phase.id} value={phase.id}>{phase.label}</option>)}
                            </select>
                          </div>
                        )}
                        {selectedCompetitionPhase && competitionUnits.length > 0 && (
                          <div className={styles.filterField}>
                            <label htmlFor="scene-unit">{selectedCompetitionPhase.unit.label}</label>
                            <select
                              id="scene-unit"
                              className="appSelect"
                              value={filterCompetitionUnitValue}
                              onChange={e => {
                                setFilterContextKey('')
                                setFilterCompetitionUnitType(selectedCompetitionPhase.unit.type)
                                setFilterCompetitionUnitValue(e.target.value)
                              }}
                            >
                              <option value="">Alle</option>
                              {competitionUnits.map((unit) => <option key={unit.value} value={unit.value}>{unit.label}</option>)}
                            </select>
                          </div>
                        )}
                        {episodeSeasons.length > 0 && (
                          <div className={styles.filterField}>
                            <label htmlFor="scene-episode-season">Staffel</label>
                            <select id="scene-episode-season" className="appSelect" value={filterEpisodeSeason} onChange={e => setFilterEpisodeSeason(e.target.value)}>
                              <option value="">Alle</option>
                              {episodeSeasons.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </details>

            <button
              type="button"
              className={styles.filterOpenBtn}
              onClick={() => setFilterSheetOpen(true)}
            >
              Weitere Filter{advancedFilterCount > 0 ? ` · ${advancedFilterCount} aktiv` : ''}
            </button>

            <FilterSheet
              open={filterSheetOpen}
              title="Weitere Filter"
              onClose={() => setFilterSheetOpen(false)}
              onReset={() => {
                setFilterMinRating('')
                setSortMode('created')
                setFilterTeam('')
                setFilterTrack('')
                setFilterDrill('')
                setFilterCompetitionPhase('')
                setFilterCompetitionUnitType('')
                setFilterCompetitionUnitValue('')
                setFilterEpisodeSeason('')
              }}
            >
              <div className="stack">
                <div className="sheetSection">
                  <div className="sheetSectionTitle">Inhalt</div>
                  <div className="stack">
                    <select className="appSelect" value={filterMinRating} onChange={e => setFilterMinRating(e.target.value)} aria-label="Bewertung">
                      <option value="">Bewertung: Alle</option>
                      <option value="3">3★+</option>
                      <option value="4">4★+</option>
                      <option value="5">5★</option>
                    </select>
                    <select className="appSelect" value={sortMode} onChange={e => setSortMode(e.target.value as 'created' | 'rating_desc')} aria-label="Sortierung">
                      <option value="created">Neueste zuerst</option>
                      <option value="rating_desc">Bewertung zuerst</option>
                    </select>
                    {teams.length > 0 && (
                      <select className="appSelect" value={filterTeam} onChange={e => setFilterTeam(e.target.value)} aria-label="Team">
                        <option value="">Team: Alle</option>
                        {teams.map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}
                      </select>
                    )}
                    {tracks.length > 0 && (
                      <select className="appSelect" value={filterTrack} onChange={e => setFilterTrack(e.target.value)} aria-label="Track">
                        <option value="">Track: Alle</option>
                        {tracks.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    )}
                    {drills.length > 0 && (
                      <select className="appSelect" value={filterDrill} onChange={e => setFilterDrill(e.target.value)} aria-label="Drill">
                        <option value="">Drill: Alle</option>
                        {drills.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    )}
                  </div>
                </div>
                {(competitionPhases.length > 0 || episodeSeasons.length > 0) && (
                  <div className="sheetSection">
                    <div className="sheetSectionTitle">Wettbewerb</div>
                    <div className="stack">
                      {competitionPhases.length > 0 && (
                        <select
                          className="appSelect"
                          value={filterCompetitionPhase}
                          onChange={e => {
                            setFilterContextKey('')
                            setFilterCompetitionPhase(e.target.value)
                            const nextPhase = competitionPhases.find((phase) => phase.id === e.target.value)
                            setFilterCompetitionUnitType(nextPhase?.unit.type || '')
                            setFilterCompetitionUnitValue('')
                          }}
                          aria-label="Phase"
                        >
                          <option value="">Phase: Alle</option>
                          {competitionPhases.map((phase) => <option key={phase.id} value={phase.id}>{phase.label}</option>)}
                        </select>
                      )}
                      {selectedCompetitionPhase && competitionUnits.length > 0 && (
                        <select
                          className="appSelect"
                          value={filterCompetitionUnitValue}
                          onChange={e => {
                            setFilterContextKey('')
                            setFilterCompetitionUnitType(selectedCompetitionPhase.unit.type)
                            setFilterCompetitionUnitValue(e.target.value)
                          }}
                          aria-label={selectedCompetitionPhase.unit.label}
                        >
                          <option value="">Alle {selectedCompetitionPhase.unit.label}</option>
                          {competitionUnits.map((unit) => <option key={unit.value} value={unit.value}>{unit.label}</option>)}
                        </select>
                      )}
                      {episodeSeasons.length > 0 && (
                        <select className="appSelect" value={filterEpisodeSeason} onChange={e => setFilterEpisodeSeason(e.target.value)} aria-label="Staffel">
                          <option value="">Staffel: Alle</option>
                          {episodeSeasons.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </FilterSheet>

            {activeFilterChips.length > 0 && (
              <div className={styles.activeFilters}>
                {activeFilterChips.map((chip) => (
                  <span key={chip.key} className={styles.chip}>
                    {chip.label}
                    <button type="button" className={styles.chipClear} onClick={chip.clear} aria-label={`${chip.label} entfernen`}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </Card>

          {isLoading && <PageSkeleton />}
          {error && <Card><span style={{ color: '#f87171' }}>Fehler beim Laden der Szenen.</span></Card>}

          {!isLoading && !error && scenes.length === 0 && (
            <Card className={styles.emptyCard}>
              <h2 className={styles.emptyTitle}>Noch keine Szenen gespeichert</h2>
              <p className={styles.emptyText}>
                Erfasse Momente live mit „Szene hinzufügen“ oder während eines Drills mit „Szene merken“.
              </p>
              <div className={styles.emptyActions}>
                <button
                  type="button"
                  className={styles.addBtn}
                  onClick={() => {
                    setManualFormScene(null)
                    setManualFormMode('create')
                  }}
                >
                  Szene hinzufügen
                </button>
              </div>
            </Card>
          )}

          {!isLoading && !error && scenes.length > 0 && filtered.length === 0 && (
            <Card className={styles.emptyCard}>
              <h2 className={styles.emptyTitle}>Keine Szenen für die gewählten Filter</h2>
              <p className={styles.emptyText}>
                {filterContextKey
                  ? 'Kein Treffer für diesen Spieltag — evtl. blockieren andere Filter (Status, Team …) die Auswahl.'
                  : 'Passe die Filter an oder setze sie zurück, um wieder Szenen zu sehen.'}
              </p>
              <div className={styles.emptyActions}>
                <button type="button" className={styles.filterReset} onClick={resetFilters}>
                  Filter zurücksetzen
                </button>
              </div>
            </Card>
          )}

          {!isLoading && filtered.length > 0 && (
            <>
              <div className={styles.resultsBar}>
                <h2 className={styles.resultsTitle}>Szenen</h2>
                <p className={styles.resultsMeta}>
                  {filtered.length} von {scenes.length} Szene{scenes.length !== 1 ? 'n' : ''}
                </p>
              </div>
              <div className={styles.sceneGrid}>
                {filtered.map(scene => (
                  <SceneCard
                    key={scene.id}
                    scene={scene}
                    observedTeam={getObservedTeamForScene(scene) || 'Beobachtetes Team nicht hinterlegt'}
                    drillSceneSlugById={drillSceneSlugById}
                    onDelete={handleDelete}
                    onEdit={handleEditOpen}
                    onEnrich={handleEnrichOpen}
                    onRatingChange={handleRatingChange}
                    onPipelineToggle={handlePipelineToggle}
                    celebrate={celebratedSceneId === scene.id}
                  />
                ))}
              </div>
            </>
          )}

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
                <h3 style={{ margin: '0 0 0.3rem', fontSize: '1.2rem' }}>Szene bearbeiten</h3>

                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.95rem', marginTop: '1rem' }}>
                  Minute <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={editGameTime}
                  onChange={e => {
                    setEditGameTime(formatGameTimeInput(e.target.value))
                  }}
                  placeholder="z. B. 13:42"
                  style={{
                    width: '100%', padding: '0.6rem', borderRadius: '0.4rem',
                    border: '1px solid #334155', background: '#0f172a', color: '#cbd5e1',
                    fontSize: '1rem', fontFamily: 'monospace', boxSizing: 'border-box',
                  }}
                  autoFocus
                />

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

                {editError && (
                  <div style={{ color: '#f87171', fontSize: '0.9rem', marginTop: '0.8rem' }}>
                    {editError}
                  </div>
                )}

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
          {isLoading && <PageSkeleton />}
          {error && <Card><span style={{ color: '#f87171' }}>Fehler beim Laden der Insights.</span></Card>}

          {!isLoading && !error && scenes.length === 0 && (
            <Card className={styles.emptyCard}>
              <h2 className={styles.emptyTitle}>Noch keine Szenen im Pool</h2>
              <p className={styles.emptyText}>
                Sobald du Szenen markierst, erscheinen hier automatisch die redaktionellen Insights.
              </p>
            </Card>
          )}

          {!isLoading && !error && scenes.length > 0 && (
            <div className={styles.insightsStack}>
              <SceneInsightsOverviewKpis
                className={styles.kpiGrid}
                overview={{
                  total: insightsScenes.length,
                  published: insights.publishedCount,
                  unpublished: insights.unpublishedCount,
                  teamCount: insights.teamDistribution.length,
                  leagueFilter: insightsLeagueFilter || undefined,
                }}
              />

              {leagues.length > 0 && (
                <Card className={styles.filterCard}>
                  <div className={styles.filterHeader}>
                    <h2 className={styles.filterTitle}>Insights-Filter</h2>
                  </div>
                  <div className={styles.filterRow}>
                    <div className={styles.filterField}>
                      <label htmlFor="insights-league">Liga</label>
                      <select
                        id="insights-league"
                        className="appSelect"
                        value={insightsLeagueFilter}
                        onChange={e => setInsightsLeagueFilter(e.target.value)}
                      >
                        <option value="">Alle Ligen</option>
                        {leagues.map((league) => <option key={league} value={league}>{league}</option>)}
                      </select>
                    </div>
                  </div>
                </Card>
              )}

              {insightsScenes.length === 0 && (
                <Card className={styles.emptyCard}>
                  <h2 className={styles.emptyTitle}>Keine Insights für die gewählte Liga</h2>
                  <p className={styles.emptyText}>Wähle eine andere Liga oder setze den Filter zurück.</p>
                </Card>
              )}

              {insightsScenes.length > 0 && (
                <>
                  {insights.showContentHint && insights.topTeam && (
                    <Card className={styles.contentHint}>
                      <h3 className={styles.insightTitle}>Content-Hinweis</h3>
                      <p className={styles.contentHintText}>
                        {insights.topTeam.team} taucht aktuell besonders häufig im Szenenpool auf ({insights.topTeam.scenes} Szenen, Durchschnitt {insights.teamAverage.toFixed(1)}).
                      </p>
                      <p className={styles.contentHintFollow}>
                        Für mehr Vielfalt könnte als Nächstes ein anderes Team priorisiert werden.
                      </p>
                    </Card>
                  )}

                  <Card className={styles.insightCard}>
                    <h3 className={styles.insightTitle}>Team-Verteilung</h3>
                    <div className={styles.barList}>
                      {insights.teamDistribution.map((row) => (
                        <div key={row.team} className={styles.barRow}>
                          <span className={styles.barLabel}>{row.team}</span>
                          <div className={styles.barTrack}>
                            <div className={styles.barFillTeam} style={{ width: `${Math.max((row.scenes / insights.teamMax) * 100, 2)}%` }} />
                          </div>
                          <span className={styles.barCount}>{row.scenes}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <details className={styles.morePanel}>
                    <summary className={styles.moreSummary}>
                      <span>Weitere Verteilungen & Details</span>
                      <span className={styles.moreChevron} aria-hidden="true" />
                    </summary>
                    <div className={styles.moreBody}>
                      <Card className={styles.insightCard}>
                        <h3 className={styles.insightTitle}>Liga-Verteilung</h3>
                        <div className={styles.barList}>
                          {insights.leagueDistribution.map((row) => (
                            <div key={row.label} className={styles.barRow}>
                              <span className={styles.barLabel}>{row.label}</span>
                              <div className={styles.barTrack}>
                                <div className={styles.barFillLeague} style={{ width: `${Math.max((row.count / insights.leagueMax) * 100, 2)}%` }} />
                              </div>
                              <span className={styles.barCount}>{row.count}</span>
                            </div>
                          ))}
                        </div>
                      </Card>

                      <Card className={styles.insightCard}>
                        <h3 className={styles.insightTitle}>Drill-Verteilung</h3>
                        <div className={styles.barList}>
                          {insights.drillDistribution.map((row) => (
                            <div key={row.label} className={styles.barRow}>
                              <span className={`${styles.barLabel} ${styles.barLabelMono}`}>{row.label}</span>
                              <div className={styles.barTrack}>
                                <div className={styles.barFillDrill} style={{ width: `${Math.max((row.count / insights.drillMax) * 100, 2)}%` }} />
                              </div>
                              <span className={styles.barCount}>{row.count}</span>
                            </div>
                          ))}
                        </div>
                      </Card>

                      <Card className={styles.insightCard}>
                        <h3 className={styles.insightTitle}>Veröffentlichte Szenen</h3>
                        <div className={styles.publishGrid}>
                          <div className={styles.publishTile}>
                            <div className={styles.publishLabel}>Veröffentlicht</div>
                            <div className={styles.publishValue}>{insights.publishedCount}</div>
                          </div>
                          <div className={styles.publishTileMuted}>
                            <div className={styles.publishLabelMuted}>Nicht veröffentlicht</div>
                            <div className={styles.publishValue}>{insights.unpublishedCount}</div>
                          </div>
                        </div>
                        <p className={styles.publishHint}>
                          Veröffentlicht basiert auf dem Szenenstatus Zugeordnet (Episode gesetzt).
                        </p>
                      </Card>

                      <Card className={styles.insightCard}>
                        <h3 className={styles.insightTitle}>Team × Veröffentlicht</h3>
                        <div className={styles.tableWrap}>
                          <table className={styles.table}>
                            <thead>
                              <tr>
                                <th>Team</th>
                                <th>Szenen</th>
                                <th>Veröffentlicht</th>
                              </tr>
                            </thead>
                            <tbody>
                              {insights.teamDistribution.map((row) => (
                                <tr key={`table-${row.team}`}>
                                  <td>{row.team}</td>
                                  <td className={styles.tdStrong}>{row.scenes}</td>
                                  <td className={styles.tdTeal}>{row.published}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Card>
                    </div>
                  </details>
                </>
              )}
            </div>
          )}
        </>
      )}

      {manualFormMode && (
        <ManualSceneForm
          mode={manualFormMode}
          initialScene={manualFormScene}
          onClose={handleManualFormClose}
          onSaved={(scene, options) => {
            handleManualFormSaved(scene, options)
            if (!options?.continueEditing) {
              handleManualFormClose()
            }
          }}
        />
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

function SceneCard({ scene, observedTeam, drillSceneSlugById, onDelete, onEdit, onEnrich, onRatingChange, onPipelineToggle, celebrate = false }: {
  scene: SceneMarker
  observedTeam: string
  drillSceneSlugById: Map<string, string>
  onDelete: (id: string) => void
  onEdit: (scene: SceneMarker) => void
  onEnrich: (scene: SceneMarker) => void
  onRatingChange: (scene: SceneMarker, rating: SceneRatingValue) => void
  onPipelineToggle: (scene: SceneMarker) => void
  celebrate?: boolean
}) {
  const [copyFeedback, setCopyFeedback] = useState<string>('')
  const gameLabel = scene.team_home && scene.team_away
    ? `${scene.team_home} vs ${scene.team_away}`
    : scene.team_home || scene.team_away || '–'

  const competitionContext = formatCompetitionContext(scene)
  const source = getSceneSource(scene)
  const manual = source.type === 'manual'
  const metadataStatus = getSceneMetadataStatus(scene)
  const drillId = source.drill_id || scene.drill_id || null
  const drillSceneSlug = drillId ? drillSceneSlugById.get(drillId) : undefined
  const assetNameResult = generateSceneAssetNameFromScene(scene, {
    sceneSlug: drillSceneSlug || null,
  })
  const canCopyAssetName = assetNameResult.ok
  const missingAssetFields = assetNameResult.ok ? [] : assetNameResult.missing

  // Extract drill number suffix, e.g. "B1_D4" -> "D4", "A1_D1" -> "D1"
  const drillSuffix = scene.drill_id
    ? (scene.drill_id.match(/_(D\d+)$/i)?.[1] ?? scene.drill_id)
    : null
  const seasonCode = sceneSeasonCode(scene)
  const episodeCode = sceneEpisodeCode(scene)
  const episodeLabel = seasonCode && episodeCode
    ? `Staffel ${seasonCode} · Episode ${episodeCode}`
    : null
  const sceneStatus = getSceneStatus(scene)
  const isAssigned = sceneStatus === 'ASSIGNED'
  const isPipeline = sceneStatus === 'PIPELINE'
  const sceneCode = scene.scene_code || scene.internal_scene_id || scene.id

  const borderColor = isAssigned ? '#2dd4bf' : isPipeline ? '#fbbf24' : '#4fc3f7'
  const cardBackground = isAssigned
    ? 'linear-gradient(145deg, rgba(8,47,73,0.74) 0%, rgba(6,78,59,0.38) 48%, rgba(15,23,42,0.92) 100%)'
    : isPipeline
      ? 'linear-gradient(145deg, rgba(69,26,3,0.45) 0%, rgba(15,23,42,0.92) 55%)'
      : undefined

  return (
    <div
      id={`scene-${scene.id}`}
      className="card"
      style={{
        padding: '1rem 1.1rem',
        borderLeft: `3px solid ${borderColor}`,
        borderColor: isAssigned ? 'rgba(45,212,191,0.36)' : isPipeline ? 'rgba(251,191,36,0.28)' : undefined,
        background: cardBackground,
        boxShadow: isAssigned
          ? '0 0 0 1px rgba(45,212,191,0.22), 0 18px 42px rgba(6,78,59,0.16)'
          : isPipeline
            ? '0 0 0 1px rgba(251,191,36,0.16)'
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
        <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button
            type="button"
            disabled={!canCopyAssetName}
            onClick={async () => {
              if (!assetNameResult.ok) {
                setCopyFeedback(`Für den Namen fehlen noch: ${missingAssetFields.join(', ')}`)
                window.setTimeout(() => setCopyFeedback(''), 2800)
                return
              }
              try {
                const ok = await copyTextToClipboard(assetNameResult.name)
                setCopyFeedback(ok ? `✓ ${assetNameResult.name} kopiert` : 'Kopieren fehlgeschlagen')
              } catch {
                setCopyFeedback('Kopieren fehlgeschlagen')
              }
              window.setTimeout(() => setCopyFeedback(''), 3200)
            }}
            title={
              canCopyAssetName
                ? 'Ordner-/Dateinamen in Zwischenablage kopieren'
                : `Für den Namen fehlen noch: ${missingAssetFields.join(', ') || 'Metadaten'}`
            }
            style={{
              background: canCopyAssetName ? 'rgba(125,211,252,0.10)' : 'transparent',
              border: canCopyAssetName ? '1px solid rgba(125,211,252,0.28)' : '1px solid transparent',
              borderRadius: '0.35rem',
              cursor: canCopyAssetName ? 'pointer' : 'not-allowed',
              color: canCopyAssetName ? '#bae6fd' : '#64748b',
              fontSize: '0.72rem',
              padding: '0.2rem 0.45rem',
              lineHeight: 1.2,
              flexShrink: 0,
              fontWeight: 700,
              opacity: canCopyAssetName ? 1 : 0.65,
            }}
            onMouseEnter={(e) => {
              if (!canCopyAssetName) return
              e.currentTarget.style.color = '#e0f2fe'
              e.currentTarget.style.borderColor = 'rgba(125,211,252,0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = canCopyAssetName ? '#bae6fd' : '#64748b'
              e.currentTarget.style.borderColor = canCopyAssetName ? 'rgba(125,211,252,0.28)' : 'transparent'
            }}
          >
            Namen kopieren
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                await shareOrCopy({
                  title: 'Rink Tank Szene',
                  text: [
                    gameLabel,
                    `${scenePeriodLabel(scene.period)} · ${scene.game_time}`,
                    observedTeam !== 'Beobachtetes Team nicht hinterlegt' ? `Beobachtet: ${observedTeam}` : '',
                    scene.note || '',
                  ].filter(Boolean).join('\n'),
                })
              } catch {
                // cancelled
              }
            }}
            title="Szene teilen"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#475569', fontSize: '0.95rem', padding: '0 0.2rem', lineHeight: 1,
              flexShrink: 0, fontWeight: 700,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#7dd3fc')}
            onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
          >
            ↗
          </button>
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

      {copyFeedback && (
        <div style={{
          fontSize: '0.78rem',
          color: copyFeedback.startsWith('✓') ? '#86efac' : '#fde68a',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          wordBreak: 'break-all',
          lineHeight: 1.35,
        }}>
          {copyFeedback}
        </div>
      )}

      {/* Drittel + Spielzeit – prominent zum Wiederfinden */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.45rem 0.55rem',
        borderRadius: '0.5rem',
        background: 'rgba(14,165,233,0.10)',
        border: '1px solid rgba(125,211,252,0.22)',
      }}>
        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#e2e8f0' }}>
          {scenePeriodLabel(scene.period)}
        </span>
        <span style={{
          background: '#0f172a', borderRadius: '0.35rem', padding: '0.22rem 0.7rem',
          fontSize: '1.2rem', fontWeight: 850, color: '#7dd3fc',
          letterSpacing: '0.05em', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        }}>
          {scene.game_time}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
        <span style={{
          background: 'rgba(148,163,184,0.12)',
          color: '#e2e8f0',
          border: '1px solid rgba(148,163,184,0.24)',
          borderRadius: '999px',
          padding: '0.22rem 0.62rem',
          fontSize: '0.76rem',
          fontWeight: 700,
          maxWidth: '100%',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }} title={`Beobachtet: ${observedTeam}`}>
          Beobachtet: {observedTeam}
        </span>
        <span style={{
          background: manual ? 'rgba(251,191,36,0.12)' : 'rgba(99,102,241,0.14)',
          color: manual ? '#fde68a' : '#c7d2fe',
          border: manual ? '1px solid rgba(251,191,36,0.28)' : '1px solid rgba(129,140,248,0.28)',
          borderRadius: '999px',
          padding: '0.18rem 0.55rem',
          fontSize: '0.72rem',
          fontWeight: 700,
        }}>
          {manual ? 'Manuell erfasst' : 'Aus Drill'}
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
        <button
          type="button"
          onClick={() => {
            if (!isAssigned) onPipelineToggle(scene)
          }}
          disabled={isAssigned}
          title={
            isAssigned
              ? 'Bereits einer Episode zugeordnet'
              : isPipeline
                ? 'Aus Pipeline entfernen (zurück auf Neu)'
                : 'In Produktions-Pipeline aufnehmen'
          }
          aria-pressed={isPipeline || isAssigned}
          style={{
            background: isAssigned
              ? 'linear-gradient(135deg, rgba(34,197,94,0.34), rgba(20,184,166,0.24))'
              : isPipeline
                ? 'linear-gradient(135deg, rgba(245,158,11,0.34), rgba(251,191,36,0.22))'
                : 'rgba(255,255,255,0.08)',
            color: isAssigned ? '#d1fae5' : isPipeline ? '#fef3c7' : '#cbd5e1',
            border: isAssigned
              ? '1px solid rgba(134,239,172,0.52)'
              : isPipeline
                ? '1px solid rgba(252,211,77,0.55)'
                : '1px solid rgba(255,255,255,0.14)',
            borderRadius: '0.32rem',
            padding: isAssigned || isPipeline ? '0.18rem 0.58rem' : '0.12rem 0.45rem',
            fontSize: isAssigned || isPipeline ? '0.76rem' : '0.72rem',
            fontWeight: 850,
            boxShadow: isAssigned
              ? '0 0 16px rgba(34,197,94,0.18)'
              : isPipeline
                ? '0 0 14px rgba(245,158,11,0.16)'
                : undefined,
            animation: celebrate ? 'ringAboutBadgeIn 280ms ease-out both' : undefined,
            cursor: isAssigned ? 'default' : 'pointer',
            opacity: isAssigned ? 1 : undefined,
          }}
        >
          {isAssigned ? '✓ Zugeordnet' : isPipeline ? '✓ Pipeline' : '○ Pipeline'}
        </button>
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
      {!manual && (
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
      )}

      {manual && metadataStatus === 'incomplete' && (
        <button
          type="button"
          onClick={() => onEnrich(scene)}
          style={{
            alignSelf: 'flex-start',
            padding: '0.35rem 0.7rem',
            borderRadius: '0.4rem',
            border: '1px solid rgba(148,163,184,0.32)',
            background: 'rgba(148,163,184,0.08)',
            color: '#cbd5e1',
            fontSize: '0.78rem',
            fontWeight: 650,
            cursor: 'pointer',
          }}
        >
          Metadaten ergänzen
        </button>
      )}

      {/* Wettbewerbskontext */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', fontSize: '0.78rem', color: '#94a3b8', marginTop: 'auto', paddingTop: '0.15rem' }}>
        <span style={{ color: '#cbd5e1', fontWeight: 650 }}>{competitionContext || 'Kein Wettbewerbskontext'}</span>
        {scene.session_id ? (
          <a
            href={'/session/' + scene.session_id}
            style={{ color: '#7dd3fc', textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
          >
            Zur Session
          </a>
        ) : (
          <span style={{ color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>Ohne Session</span>
        )}
      </div>
    </div>
  )
}
