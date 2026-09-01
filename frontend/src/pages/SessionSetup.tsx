import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useState, useEffect, useMemo, useRef } from 'react'
import { useUser } from '../context/UserContext'
import { makeGlossaryRenderer } from '../components/GlossaryTerm'
import { DrillGuideCard } from '../components/DrillGuideCard'
import type { DrillGuide } from '../components/DrillGuideCard'
import { getTeamNamesForLeague } from '../data/teamsByLeague'
import { resolveCatalogTeamName } from '../data/teamShortCodes'
import { getCompetitionConfig, formatCompetitionContext } from '../data/competitionConfig'
import { computeObservedTeamStats, resolveDrillId } from '../stats/exposureStats'
import { DEFAULT_OBSERVATION_SCOPE, type ObservationScope } from '../utils/observationScope'
import {
  defaultDelSetupSeason,
  isSplitSeasonLeague,
  normalizeSeasonValue,
  SEASON_OPTIONS,
  TOURNAMENT_YEAR_OPTIONS,
} from '../stats/seasonNormalization'
import { isDevNavEnabled } from '../config/featureFlags'
import { createDummySessionForDrill } from '../dev/createDummySession'
import { getRealSessions } from '../utils/sessionEligibility'
import { MechanicGlyph, TrackProgressMap, buildDrillProgressNodes } from '../components/visuals'
import { LiveObservationPanel } from '../components/game/LiveObservationPanel'
import ArenaCheckPanel from '../components/game/ArenaCheckPanel'
import { UiActionRow, UiButton, ScrollActionDock, scrollActionDockPageClass } from '../components/ui'
import { useGameCatalogMatch } from '../components/game/useGameCatalogMatch'
import { PastDrillSessions } from '../features/reflection/PastDrillSessions'
import { isDummyCatalogGame } from '../features/schedule/scheduleLayer'
import { readPendingVenuePresence } from '../features/location'
import { TUTORIAL_TARGET } from '../features/tutorial'
import { getFoundationModule, isAcademyLocked } from '../features/foundation/recommendations'
import { isModulePremiumLocked, premiumLockMessage } from '../features/entitlements'
import PremiumCheckoutSheet from '../components/billing/PremiumCheckoutSheet'
import setupStyles from './SessionSetup.module.css'

// NHL Teams mit Division als Metadaten (Fallback falls API nicht lädt)
const NHL_TEAMS: Array<{ name: string; division: string; short?: string }> = [
  // Atlantic Division
  { name: 'Boston Bruins', division: 'Atlantic', short: 'BOS' },
  { name: 'Buffalo Sabres', division: 'Atlantic', short: 'BUF' },
  { name: 'Detroit Red Wings', division: 'Atlantic', short: 'DET' },
  { name: 'Florida Panthers', division: 'Atlantic', short: 'FLA' },
  { name: 'Montreal Canadiens', division: 'Atlantic', short: 'MTL' },
  { name: 'Ottawa Senators', division: 'Atlantic', short: 'OTT' },
  { name: 'Tampa Bay Lightning', division: 'Atlantic', short: 'TBL' },
  { name: 'Toronto Maple Leafs', division: 'Atlantic', short: 'TOR' },
  // Metropolitan Division
  { name: 'Carolina Hurricanes', division: 'Metropolitan', short: 'CAR' },
  { name: 'Columbus Blue Jackets', division: 'Metropolitan', short: 'CBJ' },
  { name: 'New Jersey Devils', division: 'Metropolitan', short: 'NJD' },
  { name: 'New York Islanders', division: 'Metropolitan', short: 'NYI' },
  { name: 'New York Rangers', division: 'Metropolitan', short: 'NYR' },
  { name: 'Philadelphia Flyers', division: 'Metropolitan', short: 'PHI' },
  { name: 'Pittsburgh Penguins', division: 'Metropolitan', short: 'PIT' },
  { name: 'Washington Capitals', division: 'Metropolitan', short: 'WSH' },
  // Central Division
  { name: 'Utah Mammoth', division: 'Central', short: 'UTA' },
  { name: 'Arizona Coyotes', division: 'Central', short: 'ARI' },
  { name: 'Chicago Blackhawks', division: 'Central', short: 'CHI' },
  { name: 'Colorado Avalanche', division: 'Central', short: 'COL' },
  { name: 'Dallas Stars', division: 'Central', short: 'DAL' },
  { name: 'Minnesota Wild', division: 'Central', short: 'MIN' },
  { name: 'Nashville Predators', division: 'Central', short: 'NSH' },
  { name: 'St. Louis Blues', division: 'Central', short: 'STL' },
  { name: 'Winnipeg Jets', division: 'Central', short: 'WPG' },
  // Pacific Division
  { name: 'Anaheim Ducks', division: 'Pacific', short: 'ANA' },
  { name: 'Calgary Flames', division: 'Pacific', short: 'CGY' },
  { name: 'Edmonton Oilers', division: 'Pacific', short: 'EDM' },
  { name: 'Los Angeles Kings', division: 'Pacific', short: 'LAK' },
  { name: 'San Jose Sharks', division: 'Pacific', short: 'SJS' },
  { name: 'Seattle Kraken', division: 'Pacific', short: 'SEA' },
  { name: 'Vancouver Canucks', division: 'Pacific', short: 'VAN' },
  { name: 'Vegas Golden Knights', division: 'Pacific', short: 'VGK' }
]

// Helper: Finde Division für ein Team
const getTeamDivision = (teamName: string): string | undefined => {
  return NHL_TEAMS.find(t => t.name === teamName)?.division
}

export default function SessionSetup() {
  const { moduleId } = useParams<{ moduleId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useUser()
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [setupDocked, setSetupDocked] = useState(true)
  const [goal, setGoal] = useState<string>('')
  const [observedTeam, setObservedTeam] = useState<string>('')
  const [confidence, setConfidence] = useState<number>(3)
  const [selectedDrill, setSelectedDrill] = useState<string>('')
  const appliedQueryDrillRef = useRef<string | null>(null)
  const [league, setLeague] = useState<string>('DEL')
  const [teamHome, setTeamHome] = useState<string>('')
  const [teamAway, setTeamAway] = useState<string>('')
  const [season, setSeason] = useState<string>(() => defaultDelSetupSeason())
  const [competitionPhase, setCompetitionPhase] = useState<string>('')
  const [competitionValue, setCompetitionValue] = useState<string>('')
  const [observationScope, setObservationScope] = useState<ObservationScope>(DEFAULT_OBSERVATION_SCOPE)
  const [selectedGameId, setSelectedGameId] = useState<string>('')
  const [devMode, setDevMode] = useState(() => isDevNavEnabled())
  const [dummyError, setDummyError] = useState('')
  const draftKey = user ? `academy.sessionDraft.${user}.${moduleId}` : null
  const useSplitSeason = isSplitSeasonLeague(league)
  const seasonOptions = useSplitSeason ? SEASON_OPTIONS : TOURNAMENT_YEAR_OPTIONS
  const competitionConfig = getCompetitionConfig(league)
  const selectedCompetitionPhase = competitionConfig?.phases.find((phase) => phase.id === competitionPhase) || competitionConfig?.phases[0]

  const setupDockHint = useMemo(() => {
    if (!user) return 'Bitte zuerst anmelden'
    if (!league) return 'Liga wählen'
    if (!teamHome || !teamAway) return 'Paarung wählen'
    if (teamHome === teamAway) return 'Teams müssen unterschiedlich sein'
    if (!observedTeam) return 'Beobachtetes Team wählen'
    if (competitionConfig && !selectedCompetitionPhase) return 'Wettbewerbsphase wählen'
    if (selectedCompetitionPhase) {
      const numericValue = Number(competitionValue)
      if (
        !competitionValue
        || !Number.isFinite(numericValue)
        || numericValue < selectedCompetitionPhase.unit.min
        || numericValue > selectedCompetitionPhase.unit.max
      ) {
        return `${selectedCompetitionPhase.unit.label} ${selectedCompetitionPhase.unit.min}–${selectedCompetitionPhase.unit.max}`
      }
    }
    return 'Bereit zum Start'
  }, [
    user,
    league,
    teamHome,
    teamAway,
    observedTeam,
    competitionConfig,
    selectedCompetitionPhase,
    competitionValue,
  ])

  useEffect(() => {
    const syncDevMode = () => setDevMode(isDevNavEnabled())
    window.addEventListener('academy-dev-nav', syncDevMode)
    window.addEventListener('storage', syncDevMode)
    return () => {
      window.removeEventListener('academy-dev-nav', syncDevMode)
      window.removeEventListener('storage', syncDevMode)
    }
  }, [])

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (league !== 'DEL' || season) return
    const next = defaultDelSetupSeason(seasonOptions)
    if (seasonOptions.includes(next)) setSeason(next)
  }, [league, season, seasonOptions])

  // Draft laden
  useEffect(() => {
    if (!draftKey) return
    const saved = localStorage.getItem(draftKey)
    if (!saved) return
    try {
      const parsed = JSON.parse(saved)
      if (parsed.goal) setGoal(parsed.goal)
      if (parsed.confidence) setConfidence(parsed.confidence)
      if (parsed.league) setLeague(parsed.league)
      if (parsed.teamHome) setTeamHome(parsed.teamHome)
      if (parsed.teamAway) setTeamAway(parsed.teamAway)
      if (parsed.season) setSeason(parsed.season)
      if (parsed.competitionPhase) setCompetitionPhase(parsed.competitionPhase)
      if (parsed.competitionValue) setCompetitionValue(parsed.competitionValue)
      if (!parsed.competitionValue && parsed.matchday) setCompetitionValue(parsed.matchday)
      // URL ?drill= wins over draft when deep-linking from Home / Drills
      const queryDrill = (searchParams.get('drill') || '').trim()
      if (parsed.selectedDrill && !queryDrill) setSelectedDrill(parsed.selectedDrill)
      if (parsed.selectedGameId) setSelectedGameId(parsed.selectedGameId)
    } catch (e) {
      console.warn('Draft konnte nicht geladen werden', e)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey])

  // Reset query-apply marker when module changes
  useEffect(() => {
    appliedQueryDrillRef.current = null
  }, [moduleId])

  // Draft speichern bei Änderungen
  useEffect(() => {
    if (!draftKey) return
    const draft = {
      goal,
      confidence,
      league,
      teamHome,
      teamAway,
      season,
      competitionPhase,
      competitionValue,
      selectedDrill,
      observationScope,
      observedTeam,
      selectedGameId,
    }
    localStorage.setItem(draftKey, JSON.stringify(draft))
  }, [draftKey, goal, confidence, league, teamHome, teamAway, season, competitionPhase, competitionValue, selectedDrill, observationScope, observedTeam, selectedGameId])

  const { data: curriculum, isLoading: curriculumLoading, isError: curriculumError } = useQuery({
    queryKey: ['curriculum', user],
    queryFn: () => api.getCurriculum()
  })

  const { data: account } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.getMe(),
    enabled: Boolean(user),
  })

  const { data: teamsResp } = useQuery({
    queryKey: ['teams', league, season],
    queryFn: () => api.getTeams(league, season || undefined),
    enabled: Boolean(league),
    staleTime: 0,
    gcTime: 0
  })

  const catalog = useGameCatalogMatch({
    league,
    season,
    teamHome,
    teamAway,
    competitionValue,
    selectedGameId,
    competitionPhase,
  })
  const {
    matchedCatalogGame,
  } = catalog

  const { data: sessions } = useQuery({
    queryKey: ['sessions', user],
    queryFn: () => api.getSessions(user || undefined),
    enabled: Boolean(user)
  })

  // Debug: Log teams response
  useEffect(() => {
    console.log('DEBUG teamsResp:', { league, teamsResp })
  }, [league, teamsResp])

  const [createError, setCreateError] = useState<string>('')
  const lastPayloadRef = useRef<Parameters<typeof api.createSession>[0] | null>(null)
  const creatingSessionRef = useRef(false)

  const createSessionMutation = useMutation({
    mutationFn: (data: Parameters<typeof api.createSession>[0]) => api.createSession(data),
    retry: false,
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', user] })
      if (draftKey) localStorage.removeItem(draftKey)
      setCreateError('')
      navigate(`/session/${session.id}`)
    },
    onError: (error: any) => {
      creatingSessionRef.current = false
      const status = Number(error?.status || 0)
      const msg = String(error?.message || 'Unbekannter Fehler')
      if (status === 403) {
        setCreateError(premiumLockMessage(moduleId))
        return
      }
      setCreateError(msg)
    }
  })


  // Finde aktuelles Modul
  const currentModule = curriculum?.tracks.flatMap(t => t.modules).find(m => m.id === moduleId)
  const foundationTrack = curriculum?.tracks?.find(
    (track) => track.trackType === 'foundation' && (track.modules || []).some((m) => m.id === moduleId),
  )
  const isFoundationModule = Boolean(foundationTrack)

  const foundationDockHint = useMemo(() => {
    if (!user) return 'Bitte zuerst anmelden'
    if (!selectedDrill) return 'Lektion wählen'
    const drill = currentModule?.drills?.find((item) => item.id === selectedDrill)
    return drill?.title ? `Lektion: ${drill.title}` : 'Bereit zum Start'
  }, [user, selectedDrill, currentModule?.drills])

  const premiumLocked = isModulePremiumLocked(currentModule)
  const moduleInactive = currentModule?.active === false
  const moduleDeprecationNote = currentModule?.deprecation_note
    || 'Dieses Modul ist nicht mehr als regulärer Track aktiv.'

  useEffect(() => {
    if (isFoundationModule) setObservationScope('LESSON')
  }, [isFoundationModule])

  const dummySessionMutation = useMutation({
    mutationFn: async () => {
      if (!user?.trim()) throw new Error('Bitte zuerst anmelden.')
      const drillId = selectedDrill || currentModule?.drills?.[0]?.id
      if (!drillId) throw new Error('Bitte zuerst einen Drill auswählen.')
      return createDummySessionForDrill({
        user: user.trim(),
        drillId,
        moduleId: moduleId || undefined,
        curriculum,
      })
    },
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', user] })
      if (draftKey) localStorage.removeItem(draftKey)
      setDummyError('')
      navigate(`/session/${session.id}`)
    },
    onError: (error: any) => {
      setDummyError(String(error?.message || 'Dummy-Session konnte nicht gestartet werden.'))
    },
  })

  const realSessions = useMemo(() => getRealSessions(sessions || []), [sessions])

  const drillHistoryById = useMemo(() => {
    const history: Record<string, { count: number; lastSeen?: string }> = {}
    for (const session of realSessions) {
      if (session.state !== 'COMPLETED') continue
      const drillId = resolveDrillId(session)
      if (!drillId) continue

      const existing = history[drillId] || { count: 0, lastSeen: undefined }
      existing.count += 1
      if (!existing.lastSeen || new Date(session.created_at).getTime() > new Date(existing.lastSeen).getTime()) {
        existing.lastSeen = session.created_at
      }
      history[drillId] = existing
    }
    return history
  }, [realSessions])

  const selectedDrillHistory = selectedDrill ? drillHistoryById[selectedDrill] : undefined
  const selectedDrillConfig = selectedDrill ? currentModule?.drills.find((drill) => drill.id === selectedDrill) : undefined

  const matchupPanelData = useMemo(() => {
    if (!currentModule) return null
    if (!league || !teamHome || !teamAway) return null

    const seasonFilter = normalizeSeasonValue(season, league) || ''
    const allSessions = realSessions
    const matchupSessions = allSessions.filter((session) => {
      const gameInfo = session.game_info
      if (!gameInfo) return false
      if (gameInfo.league !== league) return false
      if (gameInfo.team_home !== teamHome || gameInfo.team_away !== teamAway) return false
      const normalizedSessionSeason = normalizeSeasonValue(gameInfo.season, gameInfo.league)
      if (seasonFilter && normalizedSessionSeason !== seasonFilter) return false
      return true
    })

    const contextSessions = allSessions.filter((session) => {
      const gameInfo = session.game_info
      if (!gameInfo) return false
      if (gameInfo.league !== league) return false
      const normalizedSessionSeason = normalizeSeasonValue(gameInfo.season, gameInfo.league)
      if (seasonFilter && normalizedSessionSeason !== seasonFilter) return false
      return true
    })
    const observedTeamStats = computeObservedTeamStats(contextSessions)
    const teamHistory = [teamHome, teamAway].filter(Boolean).map((team) => ({
      team,
      sessionCount: observedTeamStats.find((row) => row.team === team)?.sessionCount || 0
    }))

    const currentDrillId = selectedDrill || currentModule.drills?.[0]?.id
    const currentDrillUses = currentDrillId
      ? matchupSessions.filter((session) => resolveDrillId(session) === currentDrillId).length
      : 0

    const moduleDrillIds = currentModule.drills.map((drill) => drill.id)
    const moduleMatchupSessions = matchupSessions.filter((session) => session.module_id === currentModule.id)
    const moduleDrillUsageCounts = moduleMatchupSessions.reduce<Record<string, number>>((acc, session) => {
      const drillId = resolveDrillId(session)
      if (!drillId || !moduleDrillIds.includes(drillId)) return acc
      acc[drillId] = (acc[drillId] || 0) + 1
      return acc
    }, {})

    const usedModuleDrills = new Set(Object.keys(moduleDrillUsageCounts))

    const moduleDrillProgress = currentModule.drills.map((drill) => ({
      id: drill.id,
      title: drill.title,
      used: usedModuleDrills.has(drill.id),
      usageCount: moduleDrillUsageCounts[drill.id] || 0
    }))

    const lastSeen = [...matchupSessions]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.created_at
    const knownMatchup = matchupSessions.length > 0
    const drillAlreadyUsed = currentDrillUses > 0
    const level: 'neutral' | 'amber' | 'danger' = !knownMatchup
      ? 'neutral'
      : drillAlreadyUsed
        ? 'danger'
        : 'amber'

    const moduleSessionsCount = moduleMatchupSessions.length

    return {
      level,
      knownMatchup,
      sessionCount: matchupSessions.length,
      currentDrillUses,
      lastSeen,
      usedModuleDrills,
      moduleDrillProgress,
      moduleSessionsCount,
      currentDrillId,
      seasonFilter,
      teamHistory
    }
  }, [currentModule, league, season, teamHome, teamAway, realSessions, selectedDrill])

  // Debug-Ausgaben: immer ganz oben, niemals nach einem return!
  useEffect(() => {
    console.log('SessionSetup Debug:', {
      moduleId,
      currentModule,
      drills: currentModule?.drills,
      selectedDrill
    })
  }, [moduleId, currentModule, selectedDrill])

  // Drill vorauswählen: ?drill= (Home/Drills) > Draft > erster Drill
  useEffect(() => {
    if (!currentModule?.drills?.length) return
    const queryDrill = (searchParams.get('drill') || '').trim()
    const queryValid = Boolean(
      queryDrill && currentModule.drills.some((drill) => drill.id === queryDrill),
    )

    if (queryValid && queryDrill !== appliedQueryDrillRef.current) {
      appliedQueryDrillRef.current = queryDrill
      setSelectedDrill(queryDrill)
      return
    }

    setSelectedDrill((prev) => prev || currentModule.drills[0].id)
  }, [currentModule, searchParams])

  const availableTeams = (() => {
    if (!league) return []
    const apiTeams = teamsResp?.teams?.map(t => t.name) || []
    if (apiTeams.length > 0) return apiTeams
    return getTeamNamesForLeague(league, season || undefined)
  })()

  // Reset Teams wenn sie bei League-Wechsel nicht mehr in der Liste sind
  useEffect(() => {
    if (!availableTeams.length) return

    if (teamHome && !availableTeams.includes(teamHome)) {
      const resolved = resolveCatalogTeamName(teamHome, league, season)
      setTeamHome(availableTeams.includes(resolved) ? resolved : '')
    }
    if (teamAway && !availableTeams.includes(teamAway)) {
      const resolved = resolveCatalogTeamName(teamAway, league, season)
      setTeamAway(availableTeams.includes(resolved) ? resolved : '')
    }
    if (observedTeam && !availableTeams.includes(observedTeam)) {
      const resolved = resolveCatalogTeamName(observedTeam, league, season)
      setObservedTeam(availableTeams.includes(resolved) ? resolved : '')
    }
  }, [league, season, availableTeams, teamHome, teamAway, observedTeam])

  useEffect(() => {
    if (competitionConfig && !competitionPhase) {
      setCompetitionPhase(competitionConfig.phases[0]?.id || '')
      setCompetitionValue('')
    }
    if (!competitionConfig && competitionPhase) {
      setCompetitionPhase('')
      setCompetitionValue('')
    }
  }, [competitionConfig, competitionPhase])

  useEffect(() => {
    if (!selectedCompetitionPhase || !competitionValue) return
    const numericValue = Number(competitionValue)
    if (!Number.isFinite(numericValue) || numericValue < selectedCompetitionPhase.unit.min || numericValue > selectedCompetitionPhase.unit.max) {
      setCompetitionValue('')
    }
  }, [selectedCompetitionPhase, competitionValue])

  useEffect(() => {
    if (!season) return
    const normalized = normalizeSeasonValue(season, league)
    if (!normalized || !seasonOptions.includes(normalized)) {
      setSeason('')
      return
    }
    if (normalized !== season) {
      setSeason(normalized)
    }
  }, [league, season, seasonOptions])

  if (curriculumLoading || !curriculum) {
    return <div className="card">Lade Modul…</div>
  }

  if (curriculumError) {
    return <div className="card">Lehrplan konnte nicht geladen werden.</div>
  }

  if (!currentModule) {
    return <div className="card">Modul nicht gefunden</div>
  }

  const completedDrillIds = new Set<string>()
  for (const session of realSessions) {
    if (String(session.state || '').toUpperCase() !== 'COMPLETED') continue
    for (const drill of session.drills || []) {
      if (drill?.id) completedDrillIds.add(drill.id)
    }
    if (session.drill_id) completedDrillIds.add(session.drill_id)
  }
  const hasUsedAcademy = realSessions.some((session) => {
    const id = String(session.module_id || '')
    return id && id !== 'T0' && !id.startsWith('T0')
  })
  const academyLocked = isAcademyLocked(curriculum, completedDrillIds, {
    devMode,
    hasUsedAcademy,
    completedModuleIds: realSessions
      .filter((session) => String(session.state || '').toUpperCase() === 'COMPLETED')
      .map((session) => String(session.module_id || ''))
      .filter(Boolean),
    hockeyExperience: account?.profile?.hockeyExperience,
  })
  const foundationModule = getFoundationModule(curriculum)

  if (academyLocked && !isFoundationModule) {
    return (
      <div className="ui-page-shell" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <header className="ui-page-header">
          <h1 className="ui-page-title">Zuerst Track 0</h1>
          <p className="ui-page-lead">
            Starte mit der Einstiegs-Lektion. Danach ist Track A1 freigeschaltet.
          </p>
        </header>
        <button
          type="button"
          className="btn"
          onClick={() => navigate(`/setup/${foundationModule?.id || 'T0'}`)}
        >
          Track 0 starten
        </button>
      </div>
    )
  }

  if (premiumLocked && !account?.is_admin) {
    return (
      <div className="ui-page-shell" style={{ maxWidth: '640px', margin: '0 auto' }}>
        <header className="ui-page-header">
          <h1 className="ui-page-title">{currentModule.title}</h1>
          <p className="ui-page-lead">{premiumLockMessage(moduleId)}</p>
        </header>
        <UiActionRow>
          {user ? (
            <UiButton
              type="button"
              variant="primary"
              onClick={() => setCheckoutOpen(true)}
            >
              Premium freischalten
            </UiButton>
          ) : null}
          <UiButton type="button" variant="ghost" onClick={() => navigate('/curriculum')}>
            Zurück zum Lehrplan
          </UiButton>
        </UiActionRow>
        <PremiumCheckoutSheet open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
      </div>
    )
  }

  if (moduleInactive) {
    return (
      <div className="card" style={{ maxWidth: 640 }}>
        <h2 style={{ marginTop: 0 }}>{currentModule.title}</h2>
        <p style={{ color: 'rgba(255,255,255,0.82)', lineHeight: 1.45 }}>
          {moduleDeprecationNote}
        </p>
        <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.45 }}>
          Starte einen normalen Track-Drill und nutze während der Session{' '}
          <strong>⚡ Special Teams → Numerical Situation</strong>, wenn die Sondersituation im Spiel auftaucht.
        </p>
        <button type="button" className="btn" onClick={() => navigate('/curriculum')}>
          Zurück zum Lehrplan
        </button>
      </div>
    )
  }

  const handleCreateSession = () => {
    if (creatingSessionRef.current || createSessionMutation.isPending) return
    if (premiumLocked && !account?.is_admin) {
      setCreateError(premiumLockMessage(moduleId))
      return
    }
    if (!user?.trim()) {
      alert('Bitte oben im Login einen Namen speichern, damit wir die Session zuordnen können.')
      return
    }

    // Foundation / Track 0: no live matchup required
    if (isFoundationModule) {
      const effectiveGoal = goal.trim() || `Foundation: ${currentModule.title}`
      const chosenDrill = selectedDrill || currentModule.drills[0]?.id
      const payload = {
        user: user.trim(),
        module_id: moduleId!,
        goal: effectiveGoal,
        confidence,
        observation_scope: 'LESSON' as const,
        focus: currentModule.defaultFocus,
        session_method: 'self_paced',
        drill_id: chosenDrill || undefined,
        game_info: undefined,
        game_id: undefined,
      }
      lastPayloadRef.current = payload
      creatingSessionRef.current = true
      createSessionMutation.mutate(payload)
      return
    }

    if (!league) {
      alert('Bitte eine Liga wählen (z.B. NHL oder DEL).')
      return
    }
    if (!teamHome || !teamAway) {
      alert('Bitte beide Teams auswählen, die du dir anschaust.')
      return
    }
    if (teamHome === teamAway) {
      alert('Home- und Auswärtsteam müssen unterschiedlich sein.')
      return
    }
    if (!observedTeam) {
      alert('Bitte wähle das beobachtete Team aus (Pflichtfeld).')
      return
    }
    if (competitionConfig && !selectedCompetitionPhase) {
      alert('Bitte eine Wettbewerbsphase wählen.')
      return
    }
    if (selectedCompetitionPhase) {
      const numericValue = Number(competitionValue)
      if (!competitionValue || !Number.isFinite(numericValue) || numericValue < selectedCompetitionPhase.unit.min || numericValue > selectedCompetitionPhase.unit.max) {
        alert('Bitte ' + selectedCompetitionPhase.unit.label + ' ' + selectedCompetitionPhase.unit.min + '-' + selectedCompetitionPhase.unit.max + ' eingeben.')
        return
      }
    }
    // Drill optional auswählen – Standard: erster Drill des Moduls

    const gameInfo: any = {
      league,
      team_home: teamHome,
      team_away: teamAway,
      observed_team: observedTeam,
      date: new Date().toISOString()
    }
    const normalizedSeason = normalizeSeasonValue(season, league)
    if (normalizedSeason) gameInfo.season = normalizedSeason
    const dummyGame = isDummyCatalogGame(matchedCatalogGame)
    if (matchedCatalogGame?.id && !dummyGame) {
      gameInfo.game_id = matchedCatalogGame.id
      gameInfo.home_team_id = matchedCatalogGame.home_team_id
      gameInfo.away_team_id = matchedCatalogGame.away_team_id
    }
    if (dummyGame) {
      gameInfo.is_dummy = true
    }
    if (matchedCatalogGame?.date) {
      gameInfo.date = `${matchedCatalogGame.date}T${matchedCatalogGame.time || '19:00'}:00`
    }
    if (selectedCompetitionPhase) {
      const unitValue = competitionValue.trim()
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
    // Hinweis: Divisionen NICHT an Backend senden, nur intern nutzen

    const effectiveGoal = goal.trim() || `Auto: ${currentModule.title}`
    const chosenDrill = selectedDrill || currentModule.drills[0]?.id

    const observedTeamId =
      matchedCatalogGame && observedTeam === (matchedCatalogGame.home_team_name || matchedCatalogGame.home_team_id)
        ? matchedCatalogGame.home_team_id
        : matchedCatalogGame && observedTeam === (matchedCatalogGame.away_team_name || matchedCatalogGame.away_team_id)
          ? matchedCatalogGame.away_team_id
          : undefined
    if (observedTeamId) {
      gameInfo.observed_team_id = observedTeamId
    }
    const locationVerification = dummyGame || !matchedCatalogGame?.id
      ? undefined
      : readPendingVenuePresence(matchedCatalogGame.id) || undefined

    const payload = {
      user: user.trim(),
      module_id: moduleId!,
      goal: effectiveGoal,
      confidence,
      observation_scope: observationScope,
      focus: currentModule.defaultFocus,
      session_method: currentModule.recommendedSessionMethod || 'live_watch',
      drill_id: chosenDrill || undefined,
      game_info: gameInfo,
      game_id: dummyGame ? undefined : (matchedCatalogGame?.id || undefined),
      observed_team: observedTeam,
      observed_team_id: observedTeamId,
      observed_team_name: observedTeam,
      location_verification: locationVerification,
    }
    lastPayloadRef.current = payload
    creatingSessionRef.current = true
    createSessionMutation.mutate(payload)
  }

  const rwg = makeGlossaryRenderer();

  if (isFoundationModule) {
    const drills = currentModule.drills || []
    return (
      <div className={`ui-page-shell ${scrollActionDockPageClass(true, setupDocked)}`} style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <header className="ui-page-header">
          <p className={setupStyles.foundationEyebrow}>
            {foundationTrack?.foundationLabel || 'FOUNDATION · TRACK 0'}
          </p>
          <h1 className="ui-page-title">{currentModule.title}</h1>
          <p className="ui-page-lead">
            {currentModule.summary || 'Spielfeld, Regeln, Rollen und Begriffe — ohne Live-Spiel.'}
          </p>
        </header>

        {!user && (
          <div className="card ui-surface ui-surface--section ui-flat-mobile" style={{ border: '1px solid #ffc107' }}>
            <strong>Anmeldung nötig:</strong> Bitte oben in der Navigation deinen Namen speichern.
          </div>
        )}

        <div
          className={`card ui-surface ui-surface--primary primary-card ${setupStyles.foundationCard}`}
          data-tutorial-id={TUTORIAL_TARGET.setupMain}
        >
          <h2 className="ui-section-title">Welche Lektion?</h2>
          <p className={setupStyles.setupIntro}>
            Keine Paarung, kein Spieltag — einfach eine Lektion wählen und starten.
          </p>
          <div className={setupStyles.foundationDrillList}>
            {drills.map((drill, index) => (
              <label
                key={drill.id}
                className={[
                  setupStyles.foundationDrill,
                  selectedDrill === drill.id ? setupStyles.foundationDrillActive : '',
                ].filter(Boolean).join(' ')}
              >
                <input
                  type="radio"
                  name="foundation-drill"
                  value={drill.id}
                  checked={selectedDrill === drill.id}
                  onChange={(e) => setSelectedDrill(e.target.value)}
                />
                <span className={setupStyles.foundationStep}>{index + 1}/5</span>
                <span className={setupStyles.foundationDrillText}>
                  <strong>{drill.title}</strong>
                  {drill.description && <span>{drill.description}</span>}
                </span>
              </label>
            ))}
          </div>

          {createError && (
            <div style={{ marginTop: '0.75rem', color: '#ff8e8e', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
              {createError}
            </div>
          )}
        </div>

        <details className={setupStyles.foundationMore}>
          <summary>Mehr zur Foundation</summary>
          <p>{rwg(currentModule.description ?? '')}</p>
          {currentModule.learningGoals && currentModule.learningGoals.length > 0 && (
            <>
              <strong>Lernziele</strong>
              <ul>
                {currentModule.learningGoals.map((item, i) => (
                  <li key={i}>{rwg(item)}</li>
                ))}
              </ul>
            </>
          )}
        </details>

        <ScrollActionDock
          enabled
          resetKey={`${selectedDrill}-${createSessionMutation.isPending}`}
          onDockedChange={setSetupDocked}
          hint={foundationDockHint}
          htmlAttrs={{ 'data-session-sticky': 'true' }}
        >
          <UiButton type="button" variant="ghost" size="sm" onClick={() => navigate('/curriculum')}>
            Abbrechen
          </UiButton>
          <UiButton
            type="button"
            variant="primary"
            size="sm"
            data-tutorial-id={TUTORIAL_TARGET.setupStart}
            onClick={handleCreateSession}
            disabled={!user || !selectedDrill || createSessionMutation.isPending}
          >
            {createSessionMutation.isPending ? 'Starte Lektion…' : 'Lektion starten'}
          </UiButton>
        </ScrollActionDock>
      </div>
    )
  }

  return (
    <div className={`ui-page-shell ${scrollActionDockPageClass(true, setupDocked)}`} style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <header className="ui-page-header">
        <h1 className="ui-page-title">Session Setup</h1>
        <p className="ui-section-title-content" style={{ margin: 0 }}>{currentModule.title}</p>
      </header>

      {!user && (
        <div className="card ui-surface ui-surface--section ui-flat-mobile" style={{ border: '1px solid #ffc107' }}>
          <strong>Anmeldung nötig:</strong> Bitte oben in der Navigation deinen Namen speichern. Wir merken ihn im Browser, damit Sessions dir zugeordnet sind.
        </div>
      )}

      <div className="card ui-surface ui-surface--section ui-flat-mobile">
        <h2 className="ui-section-title">Modul Info</h2>
        <p style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{rwg(currentModule.description ?? '')}</p>
        <div style={{ marginTop: '1rem' }}>
          <strong>Lernziele:</strong>
          <ul style={{ marginTop: '0.5rem' }}>
            {currentModule.learningGoals?.map((goal, i) => (
              <li key={i}>{rwg(goal)}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card ui-surface ui-surface--primary primary-card" data-tutorial-id={TUTORIAL_TARGET.setupMain}>
        <h2 className="ui-section-title">Session vorbereiten</h2>
        <LiveObservationPanel
          intro="Liga und Saison wählen, dann ein Spiel. Heim-/Auswärtsteam, Datum und Spieltag kommen aus dem Spielplan. Welches Team du beobachtest, bleibt deine Auswahl."
          fields={{
            league,
            season,
            competitionPhase,
            competitionValue,
            teamHome,
            teamAway,
            observedTeam,
            observationScope,
            selectedGameId,
          }}
          onChange={(patch) => {
            if (patch.league !== undefined) setLeague(patch.league)
            if (patch.season !== undefined) setSeason(patch.season)
            if (patch.competitionPhase !== undefined) setCompetitionPhase(patch.competitionPhase)
            if (patch.competitionValue !== undefined) setCompetitionValue(patch.competitionValue)
            if (patch.teamHome !== undefined) setTeamHome(patch.teamHome)
            if (patch.teamAway !== undefined) setTeamAway(patch.teamAway)
            if (patch.observedTeam !== undefined) setObservedTeam(patch.observedTeam)
            if (patch.observationScope !== undefined) setObservationScope(patch.observationScope)
            if (patch.selectedGameId !== undefined) setSelectedGameId(patch.selectedGameId)
          }}
          availableTeams={availableTeams}
          catalog={catalog}
        />

        {league === 'NHL' && teamHome && teamAway && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.75rem', 
            backgroundColor: 'rgba(81,145,162,0.1)', 
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#5191a2' }}>Spiel-Kontext</div>
            <div>{teamHome} <span style={{ color: 'rgba(255,255,255,0.5)' }}>({getTeamDivision(teamHome)})</span></div>
            <div style={{ textAlign: 'center', margin: '0.25rem 0', color: 'rgba(255,255,255,0.5)' }}>vs</div>
            <div>{teamAway} <span style={{ color: 'rgba(255,255,255,0.5)' }}>({getTeamDivision(teamAway)})</span></div>
          </div>
        )}
      </div>

      {matchupPanelData && (
        <div
          className="card"
          style={{
            border:
              matchupPanelData.level === 'danger'
                ? '1px solid rgba(255, 99, 132, 0.65)'
                : matchupPanelData.level === 'amber'
                  ? '1px solid rgba(255, 191, 64, 0.65)'
                  : '1px solid rgba(90, 210, 255, 0.65)',
            background:
              matchupPanelData.level === 'danger'
                ? 'linear-gradient(140deg, rgba(255, 62, 124, 0.12), rgba(8, 16, 35, 0.8))'
                : matchupPanelData.level === 'amber'
                  ? 'linear-gradient(140deg, rgba(255, 192, 64, 0.12), rgba(8, 16, 35, 0.8))'
                  : 'linear-gradient(140deg, rgba(90, 210, 255, 0.12), rgba(8, 16, 35, 0.8))'
          }}
        >
          <h2 style={{ marginBottom: '0.35rem' }}>Deine Session-Historie · Paarung</h2>
          <p style={{ margin: '0 0 0.35rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.62)' }}>
            Bisherige Academy-Sessions zu dieser Paarung — nicht der PENNY-Import.
          </p>
          <div style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.85)' }}>
            {teamHome} vs {teamAway}
          </div>
          {!matchupPanelData.seasonFilter && (
            <div style={{ marginTop: '0.35rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)' }}>
              Saison nicht gesetzt - Auswertung über alle Saisons.
            </div>
          )}


          <div style={{ marginTop: '0.85rem', display: 'grid', gap: '0.75rem' }}>
            <div>
              <div style={{ fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>Paarung:</div>
              <div style={{ marginTop: '0.2rem', color: 'rgba(255,255,255,0.82)' }}>{matchupPanelData.sessionCount}x analysiert</div>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>Team-Verlauf:</div>
              <div style={{ display: 'grid', gap: '0.35rem', marginTop: '0.35rem' }}>
                {matchupPanelData.teamHistory.map((row) => (
                  <div key={row.team} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', color: 'rgba(255,255,255,0.82)' }}>
                    <span>{row.team}:</span>
                    <strong>{row.sessionCount} Sessions</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {!matchupPanelData.knownMatchup && (
            <p style={{ marginTop: '0.75rem', color: '#9fe9ff' }}>
              Noch keine Analyse für diese Paarung.
            </p>
          )}

          {matchupPanelData.knownMatchup && matchupPanelData.currentDrillUses === 0 && (
            <>
              <p style={{ marginTop: '0.75rem', color: '#ffd17c' }}>
                Dieser Drill wurde für diese Paarung noch nicht genutzt.
              </p>
            </>
          )}

          {matchupPanelData.knownMatchup && matchupPanelData.currentDrillUses > 0 && (
            <>
              <p style={{ marginTop: '0.75rem', color: '#ff9fbe' }}>
                Achtung: Diesen Drill hast du auf diese Paarung bereits {matchupPanelData.currentDrillUses}-mal gemacht.
              </p>
              {matchupPanelData.lastSeen && (
                <p style={{ marginTop: '0.35rem', color: 'rgba(255,255,255,0.75)' }}>
                  Zuletzt: {new Date(matchupPanelData.lastSeen).toLocaleDateString('de-DE')}
                </p>
              )}
            </>
          )}

          <div style={{ marginTop: '0.95rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
            <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{currentModule.id}-Fortschritt für diese Paarung</div>
            <TrackProgressMap
              nodes={buildDrillProgressNodes(
                matchupPanelData.moduleDrillProgress.map((drill) => ({ id: drill.id, title: drill.title })),
                {
                  completedIds: matchupPanelData.moduleDrillProgress.filter((d) => d.used).map((d) => d.id),
                  currentId: selectedDrill || null,
                },
              )}
            />
            <p style={{ marginTop: '0.6rem', color: 'rgba(255,255,255,0.8)' }}>
              Bereits {matchupPanelData.moduleSessionsCount} Sessions in diesem Modul.
            </p>
          </div>
        </div>
      )}

      {currentModule.drills && currentModule.drills.length > 0 && (
        <div className="card">
          <h2>Wähle deine Übung</h2>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
            Alle Übungen trainieren das gleiche Modul – wähle je nach Situation und Fokus.
          </p>

          {selectedDrillConfig && (
            <div style={{ marginTop: '0.75rem', padding: '0.65rem 0.75rem', border: '1px solid rgba(90, 210, 255, 0.3)', borderRadius: '6px', background: 'rgba(90, 210, 255, 0.08)' }}>
              <div style={{ fontWeight: 700 }}>{selectedDrillConfig.id} - {selectedDrillConfig.title}</div>
              <div style={{ marginTop: '0.25rem', color: 'rgba(255,255,255,0.78)' }}>
                {(selectedDrillHistory?.count || 0)}x durchgeführt
                {selectedDrillHistory?.lastSeen && (
                  <span style={{ color: 'rgba(255,255,255,0.62)' }}> · zuletzt {new Date(selectedDrillHistory.lastSeen).toLocaleDateString('de-DE')}</span>
                )}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            {currentModule.drills.map((drill) => {
              const drillHistory = drillHistoryById[drill.id] || { count: 0, lastSeen: undefined }
              const usageCount = matchupPanelData?.knownMatchup
                ? (matchupPanelData.moduleDrillProgress.find((item) => item.id === drill.id)?.usageCount || 0)
                : 0
              const isDoneForMatchup = usageCount > 0
              const badgeStyles = usageCount >= 2
                ? {
                    border: '1px solid rgba(94, 234, 212, 0.65)',
                    color: '#8ef4d7',
                    background: 'rgba(22, 163, 74, 0.18)'
                  }
                : usageCount === 1
                  ? {
                      border: '1px solid rgba(255, 191, 64, 0.65)',
                      color: '#ffd17c',
                      background: 'rgba(255, 191, 64, 0.12)'
                    }
                  : {
                      border: '1px solid rgba(90, 210, 255, 0.65)',
                      color: '#9fe9ff',
                      background: 'rgba(90, 210, 255, 0.12)'
                    }
              return (
              <label key={drill.id} style={{ display: 'flex', alignItems: 'center', padding: '0.5rem', border: selectedDrill === drill.id ? '2px solid #5191a2' : '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', cursor: 'pointer', backgroundColor: selectedDrill === drill.id ? 'rgba(81,145,162,0.1)' : 'transparent', overflow: 'hidden' }}>
                <input
                  type="radio"
                  name="drill"
                  value={drill.id}
                  checked={selectedDrill === drill.id}
                  onChange={(e) => setSelectedDrill(e.target.value)}
                  style={{ marginRight: '0.5rem', cursor: 'pointer', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <MechanicGlyph
                      drillType={drill.drill_type}
                      mode={drill.config?.mode}
                      mechanic={drill.config?.mechanic}
                    />
                    <div style={{ fontWeight: 'bold', wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>{drill.title}</div>
                    <span
                      title={drillHistory.lastSeen ? `Zuletzt ${new Date(drillHistory.lastSeen).toLocaleDateString('de-DE')}` : 'Noch nicht durchgeführt'}
                      style={{
                        padding: '0.15rem 0.45rem',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        border: '1px solid rgba(255,255,255,0.22)',
                        color: 'rgba(255,255,255,0.82)',
                        background: 'rgba(15, 23, 42, 0.55)'
                      }}
                    >
                      {drillHistory.count}x
                    </span>
                    {matchupPanelData?.knownMatchup && (
                      <span
                        style={{
                          padding: '0.15rem 0.45rem',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          ...badgeStyles
                        }}
                      >
                        {isDoneForMatchup ? `${usageCount}x gemacht` : 'neu für Paarung'}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>{drill.description}</div>
                </div>
              </label>
            )})}
          </div>
        </div>
      )}

      {selectedDrill && (
        <PastDrillSessions
          sessions={realSessions}
          drillId={selectedDrill}
          homeTeam={teamHome}
          awayTeam={teamAway}
        />
      )}

      {selectedDrill && (() => {
        const drill = currentModule.drills.find(d => d.id === selectedDrill)
        const didactics = drill?.didactics
        if (!didactics) return null

        // Neue Struktur: explanation, observation_guide, coaching_rules, evaluation_metrics, learning_hint
        // Alte Struktur: goal, watch_for, how_to, learning_hint

        // Extend didactics type to include coaching_rules and evaluation_metrics
        type Didactics = {
          explanation?: string
          observation_guide?: { what_to_watch?: string[]; how_to_decide?: string[]; ignore?: string[] } | string[]
          glossary?: { [key: string]: string }
          goal?: string
          watch_for?: string | string[]
          how_to?: string | string[]
          learning_hint?: string
          coaching_rules?: string | string[]
          evaluation_metrics?: string | string[]
          ignore_list?: string[]
        }

        const didacticsTyped = drill?.didactics as Didactics | undefined
        const hasOld = didacticsTyped?.goal || didacticsTyped?.watch_for || didacticsTyped?.how_to
        const hasNew = didacticsTyped?.explanation || didacticsTyped?.observation_guide || didacticsTyped?.coaching_rules || didacticsTyped?.evaluation_metrics

        return (
          <div className="card">
            <h2>Drill-Erklärung</h2>
            {/* Neue Struktur */}
            {hasNew && (
              <>
                {didactics.explanation && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <strong>Erklärung</strong>
                    <p style={{ marginTop: '0.35rem' }}>{rwg(didactics.explanation)}</p>
                  </div>
                )}
                {/* observation_guide als Objekt oder Array */}
                {didactics.observation_guide && (typeof didactics.observation_guide === 'object') && !Array.isArray(didactics.observation_guide) ? (
                  <div style={{ marginTop: '0.75rem' }}>
                    <DrillGuideCard guide={didactics.observation_guide as DrillGuide} />
                  </div>
                ) : didactics.observation_guide && Array.isArray(didactics.observation_guide) ? (
                  <div style={{ marginTop: '0.75rem' }}>
                    <strong>Beobachtungsleitfaden</strong>
                    <ul style={{ marginTop: '0.35rem' }}>
                      {didactics.observation_guide.map((t: string, i: number) => (
                        <li key={i}>{rwg(t)}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {(didacticsTyped?.coaching_rules) && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <strong>Coaching-Regeln</strong>
                    <ul style={{ marginTop: '0.35rem' }}>
                      {Array.isArray(didacticsTyped.coaching_rules) ? didacticsTyped.coaching_rules.map((t, i) => (
                        <li key={i}>{rwg(t)}</li>
                      )) : <li>{rwg(didacticsTyped.coaching_rules)}</li>}
                    </ul>
                  </div>
                )}
                {(didacticsTyped?.evaluation_metrics) && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <strong>Bewertungskriterien</strong>
                    <ul style={{ marginTop: '0.35rem' }}>
                      {Array.isArray(didacticsTyped.evaluation_metrics) ? didacticsTyped.evaluation_metrics.map((t, i) => (
                        <li key={i}>{rwg(t)}</li>
                      )) : <li>{rwg(didacticsTyped.evaluation_metrics)}</li>}
                    </ul>
                  </div>
                )}
              </>
            )}
            {/* Alte Struktur */}
            {hasOld && (
              <>
                {didactics.goal && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <strong>Worum geht es?</strong>
                    <p style={{ marginTop: '0.35rem' }}>{rwg(didactics.goal)}</p>
                  </div>
                )}
                {didactics.watch_for && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <strong>Worauf achten?</strong>
                    <ul style={{ marginTop: '0.35rem' }}>
                      {Array.isArray(didactics.watch_for) ? didactics.watch_for.map((t, i) => (
                        <li key={i}>{rwg(t)}</li>
                      )) : <li>{rwg(didactics.watch_for)}</li>}
                    </ul>
                  </div>
                )}
                {didactics.how_to && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <strong>Wie ausfüllen?</strong>
                    <ul style={{ marginTop: '0.35rem' }}>
                      {Array.isArray(didactics.how_to) ? didactics.how_to.map((t, i) => (
                        <li key={i}>{rwg(t)}</li>
                      )) : <li>{rwg(didactics.how_to)}</li>}
                    </ul>
                  </div>
                )}
              </>
            )}
            {/* Lernhinweis (gemeinsam) */}
            {didactics.learning_hint && (
              <div style={{ marginTop: '0.75rem' }}>
                <strong>Lernhinweis</strong>
                <p style={{ marginTop: '0.35rem', color: 'rgba(255,255,255,0.8)' }}>
                  {rwg(didactics.learning_hint)}
                </p>
              </div>
            )}
          </div>
        )
      })()}

      <div className="card">
        <h2>Lernziel für diese Session (optional)</h2>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="z.B. 'Heute fokussiere ich auf Center-Positionen in der Offensive'"
          style={{
            width: '100%',
            padding: '0.5rem',
            marginTop: '0.5rem',
            backgroundColor: '#050712',
            color: '#f7f7ff',
            border: '1px solid #5191a2',
            borderRadius: '4px',
            minHeight: '100px',
            fontFamily: 'inherit'
          }}
        />
      </div>

      <div className="card">
        <h2>Wie selbstbewusst bist du?</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
          <input
            type="range"
            min="1"
            max="5"
            value={confidence}
            onChange={(e) => setConfidence(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
            {confidence}/5
          </span>
        </div>
        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.5rem' }}>
          1 = sehr unsicher, 5 = sehr selbstbewusst
        </p>
      </div>

      <ArenaCheckPanel game={isDummyCatalogGame(matchedCatalogGame) ? null : matchedCatalogGame} />

      {devMode && (
        <div
          className="card"
          style={{
            marginTop: '0.75rem',
            border: '1px dashed rgba(245, 158, 11, 0.55)',
            background: 'rgba(245, 158, 11, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
            <span style={{ fontWeight: 700 }}>🛠 DEV TOOLS</span>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                padding: '0.15rem 0.4rem',
                borderRadius: '4px',
                border: '1px solid rgba(245, 158, 11, 0.5)',
                color: 'rgba(253, 186, 116, 1)',
              }}
            >
              DEV
            </span>
          </div>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setDummyError('')
              dummySessionMutation.mutate()
            }}
            disabled={!selectedDrill || dummySessionMutation.isPending || createSessionMutation.isPending}
            style={{
              width: '100%',
              padding: '0.85rem 1rem',
              fontSize: '1rem',
              backgroundColor: 'rgba(245, 158, 11, 0.25)',
              border: '1px solid rgba(245, 158, 11, 0.55)',
              color: '#fff7ed',
              opacity: !selectedDrill || dummySessionMutation.isPending ? 0.55 : 1,
            }}
          >
            {dummySessionMutation.isPending ? 'Starte Dummy-Session…' : '⚡ Dummy-Session starten'}
          </button>
          <p style={{ margin: '0.55rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.72)' }}>
            Startet diesen Drill sofort mit Testdaten. Zählt nicht in Stats oder Fortschritt.
          </p>
          {dummyError && (
            <div style={{ marginTop: '0.65rem', color: '#ff8e8e', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
              {dummyError}
            </div>
          )}
        </div>
      )}

      {createError && (
        <div className="card" style={{ border: '1px solid #dc3545', background: 'rgba(220,53,69,0.08)' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#ff8e8e' }}>Session konnte nicht erstellt werden</div>
          <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)' }}>{createError}</div>
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn"
              onClick={() => {
                if (creatingSessionRef.current || createSessionMutation.isPending) return
                if (lastPayloadRef.current) {
                  setCreateError('')
                  creatingSessionRef.current = true
                  createSessionMutation.mutate(lastPayloadRef.current)
                }
              }}
              disabled={createSessionMutation.isPending}
            >
              Erneut versuchen
            </button>
            {!navigator.onLine && (
              <span style={{ alignSelf: 'center', color: 'rgba(255,255,255,0.7)' }}>Offline erkannt – bitte Internet prüfen</span>
            )}
          </div>
        </div>
      )}

      <ScrollActionDock
        enabled
        resetKey={`${league}-${teamHome}-${teamAway}-${observedTeam}-${selectedDrill}-${competitionPhase}-${competitionValue}`}
        onDockedChange={setSetupDocked}
        hint={setupDockHint}
        htmlAttrs={{ 'data-session-sticky': 'true' }}
      >
        <UiButton type="button" variant="ghost" size="sm" onClick={() => navigate('/curriculum')}>
          Abbrechen
        </UiButton>
        <UiButton
          type="button"
          variant="primary"
          size="sm"
          data-tutorial-id={TUTORIAL_TARGET.setupStart}
          onClick={handleCreateSession}
          disabled={createSessionMutation.isPending || !user}
        >
          {createSessionMutation.isPending ? 'Erstelle Session…' : 'Session starten'}
        </UiButton>
      </ScrollActionDock>
    </div>
  )
}