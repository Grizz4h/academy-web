import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import type { Session } from '../api'
import Card from '../components/Card'
import FilterSheet from '../components/FilterSheet'
import { PageSkeleton } from '../components/Skeleton'
import { LEAGUES, getAllTeamNamesForLeague, getTeamNamesForLeague } from '../data/teamsByLeague'
import { useUser } from '../context/UserContext'
import { formatPux, getAchievementProgressItems, useRewards } from '../features/rewards'
import { computeTeamExposure, resolveDrillId } from '../stats/exposureStats'
import { getObservationScopeLabel } from '../utils/observationScope'
import { getAnalysisIntensity, getTealTileSurfaceStyle } from '../utils/tealIntensity'
import {
  isSplitSeasonLeague,
  normalizeSeasonValue,
  SEASON_OPTIONS,
  TOURNAMENT_YEAR_OPTIONS,
} from '../stats/seasonNormalization'
import { getRealSessions } from '../utils/sessionEligibility'
import { computeSessionOverview } from '../stats/sessionOverview'
import { SessionOverviewKpis } from '../components/dashboard/SessionOverviewKpis'
import { RewardOverviewKpis } from '../components/dashboard/RewardOverviewKpis'
import { DrillActivityHeatmap } from '../components/dashboard/DrillActivityHeatmap'
import { buildDrillAttempts } from '../components/dashboard/drillActivity'
import { UiProgress } from '../components/ui'
import { AchievementRevealItem } from '../components/progression/AchievementRevealItem'
import styles from './Progress.module.css'

const CATEGORY_LABELS: Record<string, string> = {
  progression: 'Progression',
  consistency: 'Konstanz',
  exploration: 'Entdeckung',
  behavior: 'Verhalten',
  time: 'Tageszeit',
  device: 'Gerät',
  absurd: 'Absurd',
}

const TIER_COLORS: Record<string, string> = {
  bronze: '#cd7f32',
  silver: '#a0a0b0',
  gold: '#f9c730',
  mastery: '#b46aff',
}

function popupVariantFromTier(tier: string): 'small' | 'popup' | 'hero' {
  if (tier === 'mastery') return 'hero'
  if (tier === 'gold') return 'popup'
  return 'small'
}

function formatLastSeenLabel(value?: string): string {
  if (!value) return '-'
  const ts = new Date(value).getTime()
  if (!Number.isFinite(ts)) return '-'

  const days = Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'heute'
  if (days === 1) return 'vor 1 Tag'
  return `vor ${days} Tagen`
}

export default function Progress() {
  const { user } = useUser()
  const { rewardState, enqueueReward } = useRewards()
  const [selectedLeague, setSelectedLeague] = useState<string>('DEL')
  const [selectedSeason, setSelectedSeason] = useState<string>('')
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [selectedMatchupKey, setSelectedMatchupKey] = useState<string>('')
  const [shouldScrollToDetails, setShouldScrollToDetails] = useState<boolean>(false)
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const detailRef = useRef<HTMLDivElement | null>(null)
  const scrollAnimationRef = useRef<number | null>(null)
  const useSplitSeason = isSplitSeasonLeague(selectedLeague)
  const seasonOptions = useSplitSeason ? SEASON_OPTIONS : TOURNAMENT_YEAR_OPTIONS

  useEffect(() => {
    if (!selectedSeason) return
    if (!seasonOptions.includes(selectedSeason)) {
      setSelectedSeason('')
    }
  }, [selectedLeague, selectedSeason, seasonOptions, useSplitSeason])

  const cancelScrollAnimation = () => {
    if (scrollAnimationRef.current !== null) {
      window.cancelAnimationFrame(scrollAnimationRef.current)
      scrollAnimationRef.current = null
    }
  }

  const getTeamDetailTargetTop = () => {
    if (!detailRef.current) return null

    const topNav = document.querySelector('[data-top-nav="true"]') as HTMLElement | null
    const topNavHeight = topNav?.getBoundingClientRect().height ?? 0
    const top = detailRef.current.getBoundingClientRect().top + window.scrollY
    return Math.max(top - topNavHeight - 8, 0)
  }

  const scrollToTeamDetails = () => {
    const targetTop = getTeamDetailTargetTop()
    if (targetTop === null) return null

    cancelScrollAnimation()

    const startTop = window.scrollY
    const delta = targetTop - startTop
    if (Math.abs(delta) < 2) {
      window.scrollTo({ top: targetTop })
      return targetTop
    }

    const duration = 780
    const startTime = performance.now()
    const easeInOutQuart = (t: number) =>
      t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeInOutQuart(progress)
      window.scrollTo({ top: startTop + delta * eased })

      if (progress < 1) {
        scrollAnimationRef.current = window.requestAnimationFrame(animate)
      } else {
        scrollAnimationRef.current = null
      }
    }

    scrollAnimationRef.current = window.requestAnimationFrame(animate)
    return targetTop
  }

  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ['sessions', user],
    queryFn: () => api.getSessions(user || undefined),
    enabled: Boolean(user)
  })

  const { data: curriculum } = useQuery({
    queryKey: ['curriculum'],
    queryFn: () => api.getCurriculum()
  })

  const sessionList = getRealSessions(sessions || [])

  // Berechne Fortschritt pro Modul
  const moduleProgress = new Map<string, {
    total: number
    completed: number
    aborted: number
    lastSession?: Session
  }>()

  sessionList.forEach(session => {
    if (!moduleProgress.has(session.module_id)) {
      moduleProgress.set(session.module_id, {
        total: 0,
        completed: 0,
        aborted: 0
      })
    }
    const progress = moduleProgress.get(session.module_id)!
    progress.total++

    if (session.state === 'COMPLETED') {
      progress.completed++
    } else if (session.state === 'ABORTED') {
      progress.aborted++
    }

    // Track letzte Session
    if (!progress.lastSession ||
        new Date(session.created_at) > new Date(progress.lastSession.created_at)) {
      progress.lastSession = session
    }
  })

  const sessionsForLeague = useMemo(() => {
    const normalizedSelectedSeason = normalizeSeasonValue(selectedSeason, selectedLeague)
    return sessionList.filter((session) => {
      const gameInfo = session.game_info
      if (!gameInfo || gameInfo.league !== selectedLeague) return false

      if (!normalizedSelectedSeason) return true

      const normalizedSessionSeason = normalizeSeasonValue(gameInfo.season, gameInfo.league)
      return normalizedSessionSeason === normalizedSelectedSeason
    })
  }, [sessionList, selectedLeague, selectedSeason])

  const teamExposureForLeague = useMemo(
    () => computeTeamExposure(sessionsForLeague),
    [sessionsForLeague]
  )

  const teamExposureMap = useMemo(
    () => new Map(teamExposureForLeague.map((item) => [item.team, item])),
    [teamExposureForLeague]
  )

  const teamStats = teamExposureForLeague.reduce<Record<string, number>>((acc, team) => {
    acc[team.team] = team.sessionCount
    return acc
  }, {})

  const allTeamsForLeague = selectedSeason
    ? getTeamNamesForLeague(selectedLeague, selectedSeason)
    : getAllTeamNamesForLeague(selectedLeague)
  const extraTeams = Object.keys(teamStats).filter((team) => !allTeamsForLeague.includes(team))

  const teamData = [...allTeamsForLeague, ...extraTeams]
    .map(team => ({
      name: team,
      count: teamStats[team] || 0,
      completed: teamExposureMap.get(team)?.completedCount || 0,
      lastSeen: teamExposureMap.get(team)?.lastSeen,
    }))
    .sort((a, b) => b.count - a.count)

  useEffect(() => {
    if (!selectedTeam) return
    if (!teamData.some((team) => team.name === selectedTeam)) {
      setSelectedTeam('')
      setSelectedMatchupKey('')
    }
  }, [selectedTeam, teamData])

  const selectedTeamExposure = selectedTeam ? teamExposureMap.get(selectedTeam) : undefined

  const topModuleEntries = Object.entries(selectedTeamExposure?.modules || {})
    .sort((a, b) => b[1] - a[1])

  const topDrillEntries = Object.entries(selectedTeamExposure?.drills || {})
    .sort((a, b) => b[1] - a[1])

  useEffect(() => {
    if (!shouldScrollToDetails || !selectedTeamExposure) return

    requestAnimationFrame(() => {
      scrollToTeamDetails()

      setShouldScrollToDetails(false)
    })
  }, [shouldScrollToDetails, selectedTeamExposure])

  useEffect(() => {
    return () => {
      cancelScrollAnimation()
    }
  }, [])

  const getModuleTitle = (moduleId: string) => {
    for (const track of curriculum?.tracks || []) {
      for (const module of track.modules) {
        if (module.id === moduleId) {
          return module.title
        }
      }
    }
    return moduleId
  }

  const nearAchievements = getAchievementProgressItems(sessionList, rewardState)
  const allProgress = nearAchievements
  const byCategory = allProgress.reduce<Record<string, typeof allProgress>>((acc, item) => {
    const cat = item.achievement.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})
  const categoryOrder = ['progression', 'consistency', 'exploration', 'behavior', 'time', 'device', 'absurd']
  const sortedCategories = [
    ...categoryOrder.filter((c) => byCategory[c]),
    ...Object.keys(byCategory).filter((c) => !categoryOrder.includes(c)),
  ]
  const totalAchievements = allProgress.length
  const unlockedAchievementsCount = allProgress.filter((i) => i.isUnlocked).length
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sortedCategories.map((c) => [c, false])),
  )
  const toggleCategory = (cat: string) =>
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }))
  const unlockedMasteriesCount = Object.keys(rewardState.unlockedMasteries || {}).length

  const overview = useMemo(
    () => computeSessionOverview(sessionList),
    [sessionList],
  )
  const drillAttempts = useMemo(
    () => buildDrillAttempts(sessionList, curriculum),
    [sessionList, curriculum],
  )

  const analyzedTeamCount = teamData.filter((team) => team.count > 0).length

  const replayAchievementAnimation = (item: (typeof allProgress)[number]) => {
    const tier = item.achievement.reward.visualTier || item.achievement.tier
    enqueueReward({
      kind: 'achievement',
      title: item.achievement.hidden ? 'Geheimer Erfolg' : item.achievement.title,
      description: item.achievement.hidden ? 'Neuer versteckter Unlock.' : item.achievement.description,
      amountPux: item.achievement.reward.PUX,
      visualTier: tier,
      icon: item.achievement.reward.icon,
      achievementId: item.achievement.id,
      variant: popupVariantFromTier(tier),
      autoCloseMs: item.achievement.tier === 'mastery' ? 4200 : 3400,
      meta: { replay: true, category: item.achievement.category, hidden: item.achievement.hidden },
    })
  }

  if (!user) {
    return (
      <div className={styles.page}>
        <header className="ui-page-header">
          <h1 className="ui-page-title">Stats</h1>
          <p className="ui-page-lead">Melde dich an, um Fortschritt, Teams und Belohnungen zu sehen.</p>
        </header>
        <Card>Bitte oben anmelden, dann zeigen wir dir deine Stats.</Card>
      </div>
    )
  }
  if (isLoading) return <PageSkeleton />
  if (error) return <Card>Fehler beim Laden: {(error as Error).message}</Card>

  return (
    <div className={`${styles.page} ui-page-shell`}>
      <header className="ui-page-header">
        <h1 className="ui-page-title">Stats</h1>
        <p className="ui-page-lead">
          Sessions, Team-Abdeckung und Belohnungen — zuerst der Überblick, Details bei Bedarf.
        </p>
      </header>

      <SessionOverviewKpis overview={overview} className={styles.kpiGrid} />

      <RewardOverviewKpis
        className={styles.kpiGridSecondary}
        unlockedAchievementsCount={unlockedAchievementsCount}
        totalAchievements={totalAchievements}
        unlockedMasteriesCount={unlockedMasteriesCount}
        puxBalance={rewardState.currency.PUX || 0}
        analyzedTeamCount={analyzedTeamCount}
      />

      <Card surface="section" className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className="ui-section-title">Team-Übersicht</h2>
            <p className={styles.sectionLead}>Wie oft wurde jedes Team analysiert?</p>
          </div>
          <div className={styles.teamFilterSelectsDesktop}>
            <div className={styles.teamLeagueSelectWrap}>
              <label htmlFor="league-select" className={styles.teamLeagueLabel}>Liga</label>
              <select
                id="league-select"
                className="appSelect"
                value={selectedLeague}
                onChange={(e) => setSelectedLeague(e.target.value)}
              >
                {LEAGUES.map((league) => (
                  <option key={league} value={league}>{league.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div className={styles.teamLeagueSelectWrap}>
              <label htmlFor="season-select" className={styles.teamLeagueLabel}>Saison</label>
              <select
                id="season-select"
                className="appSelect"
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
              >
                <option value="">Alle Saisons</option>
                {seasonOptions.map((season) => (
                  <option key={season} value={season}>{season}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="button"
            className={styles.filterOpenBtn}
            onClick={() => setFilterSheetOpen(true)}
          >
            Liga / Saison
            {selectedSeason ? ` · ${selectedSeason}` : ` · ${selectedLeague}`}
          </button>
        </div>

        <FilterSheet
          open={filterSheetOpen}
          title="Team-Filter"
          onClose={() => setFilterSheetOpen(false)}
          onReset={() => {
            setSelectedLeague('DEL')
            setSelectedSeason('')
          }}
        >
          <div className="stack">
            <div className="sheetSection">
              <div className="sheetSectionTitle">Liga</div>
              <select className="appSelect" value={selectedLeague} onChange={(e) => setSelectedLeague(e.target.value)} aria-label="Liga">
                {LEAGUES.map((league) => (
                  <option key={league} value={league}>{league.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div className="sheetSection">
              <div className="sheetSectionTitle">Saison</div>
              <select className="appSelect" value={selectedSeason} onChange={(e) => setSelectedSeason(e.target.value)} aria-label="Saison">
                <option value="">Alle Saisons</option>
                {seasonOptions.map((season) => (
                  <option key={season} value={season}>{season}</option>
                ))}
              </select>
            </div>
          </div>
        </FilterSheet>

        <div className={styles.teamGrid}>
          {teamData.map(team => {
            const intensity = getAnalysisIntensity(team.count)
            const tealSurface = getTealTileSurfaceStyle(team.count)
            return (
              <button
                key={team.name}
                type="button"
                className={`${styles.teamTile}${selectedTeam === team.name ? ` ${styles.teamTileSelected}` : ''}`}
                data-intensity={intensity}
                style={tealSurface || undefined}
                onClick={() => {
                  setSelectedTeam(team.name)
                  setSelectedMatchupKey('')
                  setShouldScrollToDetails(true)
                }}
              >
                <div className={styles.teamName}>{team.name}</div>
                <div className={styles.teamCount}>{team.count} Analysen</div>
                {team.lastSeen && (
                  <div className={styles.teamNeverSeen}>Zuletzt: {new Date(team.lastSeen).toLocaleDateString('de-DE')}</div>
                )}
                {team.count === 0 && (
                  <div className={styles.teamNeverSeen}>Noch nie analysiert</div>
                )}
              </button>
            )
          })}
        </div>
      </Card>

      {selectedTeamExposure && (
        <Card surface="nested" className={styles.detailCard}>
          <div ref={detailRef} className={styles.detailAnchor}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className="ui-section-title">Team-Detail: {selectedTeamExposure.team}</h2>
                <p className={styles.sectionLead}>
                  <strong>{selectedTeamExposure.sessionCount} Analysen</strong>
                  {' '}({selectedTeamExposure.completedCount} abgeschlossen)
                  {' · '}zuletzt {selectedTeamExposure.lastSeen ? new Date(selectedTeamExposure.lastSeen).toLocaleDateString('de-DE') : '-'}
                </p>
              </div>
              <button
                type="button"
                className={styles.clearDetailBtn}
                onClick={() => {
                  setSelectedTeam('')
                  setSelectedMatchupKey('')
                }}
              >
                Schließen
              </button>
            </div>

            <div className={styles.detailBlock}>
              <h3 className={styles.detailBlockTitle}>Gegner / Paarungen</h3>
              <p className={styles.matchupIntro}>Welche Gegner wurden wie tief analysiert?</p>
              {selectedTeamExposure.matchups.length === 0 ? (
                <p className={styles.mutedText}>Keine Gegnerpaarungen für dieses Team in der gewählten Liga.</p>
              ) : (
                <div className={styles.matchupGrid}>
                  {selectedTeamExposure.matchups.map((matchup) => {
                    const opponent = matchup.homeTeam === selectedTeamExposure.team
                      ? matchup.awayTeam
                      : matchup.awayTeam === selectedTeamExposure.team
                        ? matchup.homeTeam
                        : `${matchup.homeTeam} vs ${matchup.awayTeam}`

                    const topModules = Object.entries(matchup.modules || {})
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 4)
                    const hiddenModules = Math.max(Object.keys(matchup.modules || {}).length - topModules.length, 0)
                    const isSelected = selectedMatchupKey === matchup.key

                    return (
                      <button
                        key={matchup.key}
                        type="button"
                        onClick={() => setSelectedMatchupKey((prev) => prev === matchup.key ? '' : matchup.key)}
                        className={`${styles.matchupCard} ${isSelected ? styles.matchupCardActive : ''}`}
                      >
                        <div className={styles.matchupHeaderRow}>
                          <span className={styles.matchupOpponent}>vs {opponent}</span>
                          <span className={styles.matchupCount}>{matchup.sessionCount} Analysen</span>
                        </div>

                        <div className={styles.matchupMetaRow}>
                          <span>Zuletzt: {formatLastSeenLabel(matchup.lastSeen)}</span>
                          <span>{matchup.completedCount}/{matchup.sessionCount} abgeschlossen</span>
                        </div>

                        <div className={styles.matchupModulesLabel}>Bisher analysiert</div>
                        <div className={styles.matchupModuleChips}>
                          {topModules.length === 0 ? (
                            <span className={styles.matchupEmptyChip}>keine Module</span>
                          ) : (
                            topModules.map(([moduleId]) => (
                              <span key={`${matchup.key}-${moduleId}`} className={styles.matchupModuleChip}>{moduleId}</span>
                            ))
                          )}
                          {hiddenModules > 0 && (
                            <span className={styles.matchupExtraChip}>+{hiddenModules}</span>
                          )}
                        </div>

                        {isSelected && (
                          <div className={styles.matchupExpandedMeta}>
                            Drills: {Object.keys(matchup.drills || {}).join(', ') || '-'}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <details className={styles.inlineMore}>
              <summary className={styles.inlineMoreSummary}>
                <span>Module, Drills & letzte Sessions</span>
                <span className={styles.moreChevron} aria-hidden="true" />
              </summary>
              <div className={styles.inlineMoreBody}>
                <div className={styles.detailBlock}>
                  <h3 className={styles.detailBlockTitle}>Module</h3>
                  {topModuleEntries.length === 0 ? (
                    <p className={styles.mutedText}>Keine Modul-Daten.</p>
                  ) : (
                    <ul className={styles.detailList}>
                      {topModuleEntries.map(([moduleId, count]) => (
                        <li key={moduleId}>{moduleId} ({getModuleTitle(moduleId)}) — {count}×</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className={styles.detailBlock}>
                  <h3 className={styles.detailBlockTitle}>Drills</h3>
                  {topDrillEntries.length === 0 ? (
                    <p className={styles.mutedText}>Keine Drill-Daten.</p>
                  ) : (
                    <ul className={styles.detailList}>
                      {topDrillEntries.map(([drillId, count]) => (
                        <li key={drillId}>{drillId} — {count}×</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className={styles.detailBlock}>
                  <h3 className={styles.detailBlockTitle}>Letzte Sessions</h3>
                  {(selectedTeamExposure.sessions || []).slice(0, 5).length === 0 ? (
                    <p className={styles.mutedText}>Keine Sessions vorhanden.</p>
                  ) : (
                    <ul className={styles.detailList}>
                      {selectedTeamExposure.sessions.slice(0, 5).map((session) => {
                        const gameInfo = session.game_info
                        const drillId = resolveDrillId(session) || '-'
                        const matchup = gameInfo?.team_home && gameInfo?.team_away
                          ? `${gameInfo.team_home} vs ${gameInfo.team_away}`
                          : 'ohne Gegnerpaarung'
                        return (
                          <li key={session.id}>
                            {new Date(session.created_at).toLocaleDateString('de-DE')} — {matchup} — {session.module_id} / {drillId} — {session.state}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </details>
          </div>
        </Card>
      )}

      <details className={styles.morePanel}>
        <summary className={styles.moreSummary}>
          <span>Belohnungen · {unlockedAchievementsCount}/{totalAchievements} · {formatPux(rewardState.currency.PUX || 0)} PUX</span>
          <span className={styles.moreChevron} aria-hidden="true" />
        </summary>
        <div className={styles.moreBody}>
          <div className={styles.rewardSummaryRow}>
            <span><strong>PUX! Gesamt:</strong> {formatPux(rewardState.currency.PUX || 0)}</span>
            <span><strong>Erfolge:</strong> {unlockedAchievementsCount}/{totalAchievements}</span>
            <span><strong>Meisterschaften:</strong> {unlockedMasteriesCount}</span>
          </div>

          <div className={styles.achievementGroups}>
            {sortedCategories.map((cat) => {
              const items = byCategory[cat]
              const unlockedInCat = items.filter((i) => i.isUnlocked).length
              const isOpen = openCategories[cat] ?? false
              return (
                <div key={cat} className={styles.achievementGroup}>
                  <button
                    type="button"
                    className={styles.achievementGroupHeader}
                    onClick={() => toggleCategory(cat)}
                    aria-expanded={isOpen}
                  >
                    <span className={styles.achievementGroupLabel}>
                      {CATEGORY_LABELS[cat] ?? cat}
                    </span>
                    <span className={styles.achievementGroupCount}>
                      {unlockedInCat}/{items.length}
                    </span>
                    <span className={`${styles.achievementChevron} ${isOpen ? styles.achievementChevronOpen : ''}`}>
                      ›
                    </span>
                  </button>
                  <div className={`${styles.achievementGroupBody} ${isOpen ? styles.achievementGroupBodyOpen : ''}`}>
                    <ul className={styles.achievementGroupInner}>
                      {items.map((item) => {
                        const unlocked = rewardState.unlockedAchievements[item.achievement.id]
                        return (
                          <li key={item.achievement.id}>
                            <AchievementRevealItem
                              item={item}
                              tierColor={TIER_COLORS[item.achievement.tier] ?? '#888'}
                              unlockedAt={unlocked?.unlockedAt}
                              onReplay={item.isUnlocked ? () => replayAchievementAnimation(item) : undefined}
                            />
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </details>

      <details className={styles.morePanel}>
        <summary className={styles.moreSummary}>
          <span>Modul-Fortschritt · {moduleProgress.size} Module</span>
          <span className={styles.moreChevron} aria-hidden="true" />
        </summary>
        <div className={styles.moreBody}>
          {moduleProgress.size === 0 ? (
            <Card surface="section" className={styles.emptyCard}>
              <p className={styles.mutedText}>Noch keine Sessions vorhanden. Starte in der Akademie!</p>
            </Card>
          ) : (
            <div className={styles.grid}>
              {Array.from(moduleProgress.entries()).map(([moduleId, progress]) => (
                <Card key={moduleId} surface="nested" className={styles.moduleCard}>
                  <h3 className={styles.moduleTitle}>{getModuleTitle(moduleId)}</h3>

                  <div className={styles.progressSection}>
                    <div className={styles.progressHeader}>
                      <span>Fortschritt</span>
                      <span className={styles.completionCount}>{progress.completed}/{progress.total}</span>
                    </div>
                    <UiProgress
                      value={progress.completed}
                      max={progress.total || 1}
                      label={`Fortschritt ${getModuleTitle(moduleId)}`}
                    />
                  </div>

                  <p className={styles.moduleMeta}><strong>Abgebrochen:</strong> {progress.aborted}</p>

                  {progress.lastSession && (
                    <div className={styles.lastSessionCard}>
                      <p><strong>Letzte Session:</strong></p>
                      <p>{new Date(progress.lastSession.created_at).toLocaleDateString('de-DE')}</p>
                      <p>Beobachtungsumfang: {getObservationScopeLabel(progress.lastSession.observation_scope)}</p>
                      <p>
                        Status:{' '}
                        <span className={styles.statusBadge}>
                          {progress.lastSession.state.replace(/_/g, ' ')}
                        </span>
                      </p>
                      {progress.lastSession.abort && (
                        <p>Abbruch: {progress.lastSession.abort.reason}</p>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </details>

      <div id="learning-progress" className={styles.learningProgress}>
        <DrillActivityHeatmap attempts={drillAttempts} days={56} />
      </div>
    </div>
  )
}