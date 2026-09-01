import { useEffect, useMemo, useRef, useState } from 'react'
import type { CatalogGame } from '../../api'
import type { CatalogSeasonStats } from './gameCatalogUtils'
import {
  formatGameStatusLabel,
  formatGameTimeLabel,
  groupPlayoffSeries,
  inferCurrentMatchday,
  playoffSlotHasDate,
  seriesMatchesTeams,
  seriesWinCounts,
  uniqueMatchdays,
} from './gameCatalogUtils'
import { LEAGUES } from '../../data/teamsByLeague'
import { getCompetitionConfig } from '../../data/competitionConfig'
import { isSplitSeasonLeague, SEASON_OPTIONS, TOURNAMENT_YEAR_OPTIONS } from '../../stats/seasonNormalization'
import { OBSERVATION_SCOPE_OPTIONS, type ObservationScope } from '../../utils/observationScope'
import { useDevNavEnabled } from '../../config/featureFlags'
import {
  fieldsFromCatalogGame,
  gamesForCompetitionPhase,
  isDummyCatalogGame,
} from '../../features/schedule/scheduleLayer'
import { resolveTeamShortCode } from '../../data/teamShortCodes'
import { UiButton, UiChip, UiSheet, UiSheetActions, UiSheetChoice, UiSheetChoiceList } from '../ui'
import GameContextSummary from './GameContextSummary'
import GameStatsDevPanel from './GameStatsDevPanel'
import { TeamCrest } from './TeamCrest'
import setupStyles from '../../pages/SessionSetup.module.css'
import styles from './LiveObservationPanel.module.css'

export type LiveObservationFields = {
  league: string
  season: string
  competitionPhase: string
  competitionValue: string
  teamHome: string
  teamAway: string
  observedTeam: string
  observationScope: ObservationScope
  selectedGameId?: string
}

type CatalogSlice = {
  normalizedSeason: string
  catalogGames: CatalogGame[]
  useCatalogFlow: boolean
  catalogReady?: boolean
  catalogStats: CatalogSeasonStats
  todayCatalogGames: CatalogGame[]
  gamesWithStatsInSeason: CatalogGame[]
  availableMatchdays: number[]
  matchdaysForTeams: number[]
  selectedMatchday: number | null
  matchedCatalogGame: CatalogGame | null
  usingDummyFallback?: boolean
}

type Props = {
  fields: LiveObservationFields
  onChange: (patch: Partial<LiveObservationFields>) => void
  availableTeams: string[]
  catalog: CatalogSlice
  showObservationScope?: boolean
  intro?: string
}

type TeamPicker = 'home' | 'away' | null

function gamesGroupedByMatchday(games: CatalogGame[]) {
  const matchdays = uniqueMatchdays(games)
  const ungrouped = games.filter((game) => game.matchday == null)
  return {
    matchdays: matchdays.map((matchday) => ({
      matchday,
      games: games.filter((game) => game.matchday === matchday),
    })),
    ungrouped,
  }
}

function formatGameDate(value?: string): string {
  if (!value) return ''
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}


export function LiveObservationPanel({
  fields,
  onChange,
  availableTeams,
  catalog,
  showObservationScope = true,
  intro,
}: Props) {
  const {
    league,
    season,
    competitionPhase,
    competitionValue,
    teamHome,
    teamAway,
    observedTeam,
    observationScope,
    selectedGameId,
  } = fields
  const competitionConfig = getCompetitionConfig(league)
  const selectedCompetitionPhase =
    competitionConfig?.phases.find((phase) => phase.id === competitionPhase) || competitionConfig?.phases[0]
  const useSplitSeason = isSplitSeasonLeague(league)
  const seasonOptions = useSplitSeason ? SEASON_OPTIONS : TOURNAMENT_YEAR_OPTIONS
  const devMode = useDevNavEnabled()
  const dummyFallback = Boolean(catalog.usingDummyFallback)
  const selectedGame = catalog.matchedCatalogGame
  const isSeriesPhase = selectedCompetitionPhase?.unit.type === 'series_game'
  const phaseGames = useMemo(
    () => gamesForCompetitionPhase(catalog.catalogGames, selectedCompetitionPhase?.id),
    [catalog.catalogGames, selectedCompetitionPhase?.id],
  )
  const groupedGames = useMemo(() => gamesGroupedByMatchday(phaseGames), [phaseGames])
  const playoffSeries = useMemo(
    () => (isSeriesPhase ? groupPlayoffSeries(phaseGames) : []),
    [isSeriesPhase, phaseGames],
  )
  const selectedSeries = useMemo(
    () => playoffSeries.find((series) => seriesMatchesTeams(series, teamHome, teamAway)) || null,
    [playoffSeries, teamHome, teamAway],
  )
  const seriesSlots = useMemo(() => {
    if (!isSeriesPhase || !selectedCompetitionPhase) return []
    const { min, max } = selectedCompetitionPhase.unit
    return Array.from({ length: max - min + 1 }, (_, index) => min + index)
  }, [isSeriesPhase, selectedCompetitionPhase])
  const emptySeason = Boolean(league && season && catalog.catalogReady && !catalog.useCatalogFlow)
  const isTestspiele = league === 'Testspiele'
  const [browseMatchday, setBrowseMatchday] = useState<number | 'other' | null>(null)
  const [hideSpoilers, setHideSpoilers] = useState(true)
  const [teamPicker, setTeamPicker] = useState<TeamPicker>(null)
  const matchdayRowRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setBrowseMatchday(null)
  }, [selectedCompetitionPhase?.id, selectedSeries?.key])

  const seriesGames = selectedSeries?.games || []
  const focusPool = isSeriesPhase ? seriesGames : phaseGames
  const inferredMatchday =
    selectedGame && focusPool.some((game) => game.id === selectedGame.id)
      ? selectedGame.matchday ?? (isSeriesPhase ? selectedCompetitionPhase?.unit.min ?? 1 : null)
      : inferCurrentMatchday(focusPool)
  const activeMatchday =
    browseMatchday ??
    inferredMatchday ??
    (isSeriesPhase && selectedSeries ? selectedCompetitionPhase?.unit.min ?? 1 : null)

  useEffect(() => {
    const row = matchdayRowRef.current
    const active = row?.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (!row || !active) return
    const left = active.offsetLeft - row.clientWidth / 2 + active.clientWidth / 2
    row.scrollTo({ left: Math.max(0, left), behavior: 'smooth' })
  }, [activeMatchday, catalog.useCatalogFlow, selectedCompetitionPhase?.id, selectedSeries?.key])
  const visibleGames = catalog.useCatalogFlow
    ? isSeriesPhase
      ? seriesGames.filter((game) => game.matchday === activeMatchday)
      : activeMatchday === 'other'
        ? groupedGames.ungrouped
        : groupedGames.matchdays.find((group) => group.matchday === activeMatchday)?.games || []
    : []
  const showUnitChips = catalog.useCatalogFlow && (
    isSeriesPhase ? Boolean(selectedSeries) : groupedGames.matchdays.length > 0
  )
  const unitChipValues = isSeriesPhase ? seriesSlots : groupedGames.matchdays.map((group) => group.matchday)

  const applyGame = (game: CatalogGame) => {
    const next = fieldsFromCatalogGame(game)
    if (game.matchday != null) setBrowseMatchday(game.matchday)
    onChange({
      selectedGameId: next.selectedGameId,
      teamHome: next.teamHome,
      teamAway: next.teamAway,
      competitionValue: next.competitionValue || competitionValue,
      competitionPhase: next.competitionPhase || competitionPhase,
      observedTeam: '',
    })
  }

  const applySeries = (series: (typeof playoffSeries)[number]) => {
    const focus = inferCurrentMatchday(series.games)
    const game =
      (typeof focus === 'number' ? series.games.find((item) => item.matchday === focus) : null)
      || series.games.find((item) => Boolean(item.date))
      || series.games[0]
    if (game) {
      applyGame(game)
      return
    }
    if (!devMode) return
    setBrowseMatchday(selectedCompetitionPhase?.unit.min ?? 1)
    onChange({
      teamHome: series.homeName,
      teamAway: series.awayName,
      selectedGameId: '',
      competitionValue: String(selectedCompetitionPhase?.unit.min ?? 1),
      observedTeam: '',
    })
  }

  const applySeriesSlot = (slot: number) => {
    const dated = playoffSlotHasDate(seriesGames, slot)
    if (!dated && !devMode) return
    setBrowseMatchday(slot)
    const game = seriesGames.find((item) => item.matchday === slot)
    if (game) {
      applyGame(game)
      return
    }
    onChange({
      competitionValue: String(slot),
      selectedGameId: '',
    })
  }

  const resetFromLeague = (nextLeague: string) => {
    setBrowseMatchday(null)
    onChange({
      league: nextLeague,
      teamHome: '',
      teamAway: '',
      observedTeam: '',
      competitionPhase: '',
      competitionValue: '',
      selectedGameId: '',
    })
  }

  const stepMatchday = (delta: number) => {
    if (!selectedCompetitionPhase) return
    const current = Number(competitionValue)
    const fallback = selectedCompetitionPhase.unit.min
    const next = Number.isFinite(current) ? current + delta : fallback
    const clamped = Math.min(selectedCompetitionPhase.unit.max, Math.max(selectedCompetitionPhase.unit.min, next))
    onChange({ competitionValue: String(clamped), selectedGameId: '' })
  }

  const pickTeam = (side: 'home' | 'away', team: string) => {
    if (side === 'home') {
      onChange({
        teamHome: team,
        observedTeam: observedTeam === teamHome ? '' : observedTeam,
        selectedGameId: '',
      })
    } else {
      onChange({
        teamAway: team,
        observedTeam: observedTeam === teamAway ? '' : observedTeam,
        selectedGameId: '',
      })
    }
    setTeamPicker(null)
  }

  return (
    <>
      {intro ? <p className={styles.intro}>{intro}</p> : null}

      <section className={styles.stage}>
        <header className={styles.header}>
          <div className={styles.titleRow}>
            <span className={styles.livePulse}>Live</span>
            <h3 className={styles.title}>Deine Beobachtung</h3>
          </div>
          <button
            type="button"
            className={`${styles.spoilerToggle} ${hideSpoilers ? styles.spoilerOn : ''}`}
            onClick={() => setHideSpoilers((current) => !current)}
            aria-pressed={hideSpoilers}
            title={hideSpoilers ? 'Ergebnisse sind ausgeblendet — antippen zum Anzeigen' : 'Ergebnisse sichtbar — antippen zum Ausblenden'}
          >
            <span className={styles.spoilerMark} aria-hidden="true" />
            <span className={styles.spoilerLabel}>{hideSpoilers ? 'Spoiler-Schutz an' : 'Spoiler-Schutz aus'}</span>
            <span className={styles.spoilerHint}>
              {hideSpoilers ? 'Ergebnisse ausgeblendet' : 'Ergebnisse sichtbar'}
            </span>
          </button>
          <p className={styles.lead}>
            {isSeriesPhase
              ? 'Serie wählen, dann das Spiel dieser Paarung.'
              : 'Spiel wählen, dann das Team antippen, das du liest.'}
          </p>
        </header>

        <div className={styles.block}>
          <span className={styles.kicker}>Liga</span>
          <div className={styles.chipRow}>
            {LEAGUES.map((item) => (
              <UiChip
                key={item}
                size="sm"
                active={league === item}
                onClick={() => resetFromLeague(item)}
              >
                {item.replace(/_/g, ' ')}
              </UiChip>
            ))}
          </div>
        </div>

        {league ? (
          <div className={styles.metaGrid}>
            <div className={styles.block}>
              <span className={styles.kicker}>Saison</span>
              <div className={styles.chipRow}>
                {seasonOptions.map((option) => (
                  <UiChip
                    key={option}
                    size="sm"
                    active={season === option}
                    onClick={() => {
                      setBrowseMatchday(null)
                      onChange({
                        season: option,
                        competitionValue: '',
                        selectedGameId: '',
                        teamHome: '',
                        teamAway: '',
                        observedTeam: '',
                      })
                    }}
                  >
                    {option}
                  </UiChip>
                ))}
              </div>
            </div>
            {competitionConfig && selectedCompetitionPhase ? (
              <div className={styles.block}>
                <span className={styles.kicker}>Phase</span>
                <div className={styles.chipRow}>
                  {competitionConfig.phases.map((phase) => (
                    <UiChip
                      key={phase.id}
                      size="sm"
                      active={selectedCompetitionPhase.id === phase.id}
                      onClick={() => {
                        setBrowseMatchday(null)
                        onChange({
                          competitionPhase: phase.id,
                          competitionValue: '',
                          selectedGameId: '',
                          teamHome: '',
                          teamAway: '',
                          observedTeam: '',
                        })
                      }}
                    >
                      {phase.label}
                    </UiChip>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {catalog.useCatalogFlow ? (
          <div className={styles.block}>
            {isSeriesPhase ? (
              <>
                <span className={styles.kicker}>Serie</span>
                <div className={styles.gameList}>
                  {playoffSeries.map((series) => {
                    const selected = selectedSeries?.key === series.key
                    const record = seriesWinCounts(series)
                    return (
                      <button
                        key={series.key}
                        type="button"
                        className={`${styles.gameCard}${selected ? ` ${styles.gameCardActive}` : ''}`}
                        onClick={() => applySeries(series)}
                      >
                        <TeamCrest name={series.homeName} teamId={series.homeId} size="sm" />
                        <span className={styles.gameMid}>
                          <strong>
                            <span className={styles.nameFull}>{series.homeName} – {series.awayName}</span>
                            <span className={styles.nameShort}>
                              {resolveTeamShortCode(series.homeName) || series.homeName}
                              {' – '}
                              {resolveTeamShortCode(series.awayName) || series.awayName}
                            </span>
                          </strong>
                          <span className={styles.gameMeta}>
                            {record.played > 0 && !hideSpoilers
                              ? `Serie ${record.home}:${record.away}`
                              : 'Serie'}
                          </span>
                        </span>
                        <TeamCrest name={series.awayName} teamId={series.awayId} size="sm" />
                      </button>
                    )
                  })}
                </div>
                {playoffSeries.length === 0 ? (
                  <p className={styles.emptyNote}>
                    {selectedCompetitionPhase?.label || 'Playoffs'} — noch keine Serien im Spielplan.
                  </p>
                ) : null}
              </>
            ) : null}
            {showUnitChips ? (
              <>
                <span className={styles.kicker}>{selectedCompetitionPhase?.unit.label || 'Spieltag'}</span>
                <div className={styles.chipRow} ref={matchdayRowRef}>
                  {unitChipValues.map((slot) => {
                    const playoffLocked = Boolean(isSeriesPhase && !devMode && !playoffSlotHasDate(seriesGames, slot))
                    return (
                    <UiChip
                      key={slot}
                      size="sm"
                      active={activeMatchday === slot}
                      disabled={playoffLocked}
                      title={playoffLocked ? 'Noch kein Termin' : undefined}
                      onClick={() => (isSeriesPhase ? applySeriesSlot(slot) : setBrowseMatchday(slot))}
                    >
                      {slot}
                    </UiChip>
                    )
                  })}
                  {!isSeriesPhase && groupedGames.ungrouped.length > 0 ? (
                    <UiChip
                      size="sm"
                      active={activeMatchday === 'other'}
                      onClick={() => setBrowseMatchday('other')}
                    >
                      Weitere
                    </UiChip>
                  ) : null}
                </div>
              </>
            ) : null}
            {!isSeriesPhase || selectedSeries ? (
            <div className={styles.gameList}>
              {visibleGames.map((game) => {
                const home = game.home_team_name || game.home_team_id
                const away = game.away_team_name || game.away_team_id
                const selected = (selectedGameId || selectedGame?.id) === game.id
                const status = formatGameStatusLabel(game, hideSpoilers)
                const live = String(game.status || '').toLowerCase() === 'live'
                return (
                  <button
                    key={game.id}
                    type="button"
                    className={`${styles.gameCard}${selected ? ` ${styles.gameCardActive}` : ''}`}
                    onClick={() => applyGame(game)}
                  >
                    <TeamCrest name={home} teamId={game.home_team_id} size="sm" />
                    <span className={styles.gameMid}>
                      <strong>
                        <span className={styles.nameFull}>{home} – {away}</span>
                        <span className={styles.nameShort}>
                          {resolveTeamShortCode(home) || home}
                          {' – '}
                          {resolveTeamShortCode(away) || away}
                        </span>
                      </strong>
                      <span className={`${styles.gameMeta}${live ? ` ${styles.gameLive}` : ''}`}>
                        {[formatGameDate(game.date), formatGameTimeLabel(game.time), status].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                    <TeamCrest name={away} teamId={game.away_team_id} size="sm" />
                  </button>
                )
              })}
            </div>
            ) : null}
            {isSeriesPhase && selectedSeries && visibleGames.length === 0 ? (
              <p className={styles.emptyNote}>
                {selectedCompetitionPhase?.label || 'Playoffs'}
                {typeof activeMatchday === 'number' ? ` · Spiel ${activeMatchday}` : ''}
                {' — in dieser Serie noch kein Termin.'}
              </p>
            ) : null}
            {dummyFallback ? (
              <p className={styles.devNote}>DEV TESTDATEN — Dummy-Spiele nur zur UI-Entwicklung.</p>
            ) : null}
          </div>
        ) : null}

        {emptySeason ? (
          <p className={styles.emptyNote}>
            {isTestspiele
              ? 'Testspiel — kein Spielplan. Heim- und Auswärtsteam unten wählen.'
              : 'Für diese Saison sind noch keine Spiele verfügbar.'}
          </p>
        ) : null}

        {catalog.catalogReady && !catalog.useCatalogFlow && competitionConfig && selectedCompetitionPhase ? (
          <div className={styles.block}>
            <span className={styles.kicker}>{selectedCompetitionPhase.unit.label}</span>
            <div className={styles.stepper}>
              <button
                type="button"
                className={styles.stepBtn}
                onClick={() => stepMatchday(-1)}
                aria-label={`${selectedCompetitionPhase.unit.label} verringern`}
              >
                −
              </button>
              <div className={styles.stepValue}>
                <span className={styles.kicker}>{selectedCompetitionPhase.unit.label}</span>
                <strong>{competitionValue || '—'}</strong>
              </div>
              <button
                type="button"
                className={styles.stepBtn}
                onClick={() => stepMatchday(1)}
                aria-label={`${selectedCompetitionPhase.unit.label} erhöhen`}
              >
                +
              </button>
            </div>
            <p className={styles.emptyNote}>
              {isTestspiele
                ? 'Testspiel — Teams selbst wählen (kein importierter Spielplan).'
                : `${useSplitSeason ? 'Split-Season' : 'Turnier-Jahr'} · kein Spielplan — Teams selbst wählen`}
            </p>
          </div>
        ) : null}

        <div className={styles.arena} key={`${teamHome}-${teamAway}-${selectedGame?.id || 'open'}`}>
          <div className={styles.tileWrap}>
            <button
              type="button"
              className={[
                styles.tile,
                !teamHome ? styles.tileEmpty : '',
                observedTeam === teamHome && teamHome ? styles.tileObserved : '',
              ].filter(Boolean).join(' ')}
              disabled={!league || (catalog.useCatalogFlow && !teamHome)}
              onClick={() => {
                if (!teamHome && !catalog.useCatalogFlow) setTeamPicker('home')
                else if (teamHome) onChange({ observedTeam: teamHome })
              }}
            >
              <span className={styles.sideLabel}>Heim</span>
              {teamHome ? (
                <TeamCrest
                  name={teamHome}
                  teamId={selectedGame?.home_team_id}
                  size="lg"
                />
              ) : <span className={styles.crestGhost}>?</span>}
              <span className={styles.tileName}>
                <span className={styles.nameFull}>
                  {teamHome || (catalog.useCatalogFlow ? 'Spiel wählen' : 'Team wählen')}
                </span>
                <span className={styles.nameShort}>
                  {teamHome ? (resolveTeamShortCode(teamHome) || teamHome) : (catalog.useCatalogFlow ? 'Spiel' : 'Team')}
                </span>
              </span>
              {teamHome ? (
                <span className={styles.observeCue}>
                  {observedTeam === teamHome ? 'Beobachtest du' : 'Tippen: beobachten'}
                </span>
              ) : null}
            </button>
            {!catalog.useCatalogFlow ? (
              <button type="button" className={styles.changeBtn} onClick={() => setTeamPicker('home')} disabled={!league}>
                {teamHome ? 'anderes Heimteam' : 'Heimteam wählen'}
              </button>
            ) : null}
          </div>

          <div className={styles.vs} aria-hidden="true">
            <span className={styles.vsMark}>VS</span>
          </div>

          <div className={styles.tileWrap}>
            <button
              type="button"
              className={[
                styles.tile,
                !teamAway ? styles.tileEmpty : '',
                observedTeam === teamAway && teamAway ? styles.tileObserved : '',
              ].filter(Boolean).join(' ')}
              disabled={!league || (catalog.useCatalogFlow && !teamAway)}
              onClick={() => {
                if (!teamAway && !catalog.useCatalogFlow) setTeamPicker('away')
                else if (teamAway) onChange({ observedTeam: teamAway })
              }}
            >
              <span className={styles.sideLabel}>Auswärts</span>
              {teamAway ? (
                <TeamCrest
                  name={teamAway}
                  teamId={selectedGame?.away_team_id}
                  size="lg"
                />
              ) : <span className={styles.crestGhost}>?</span>}
              <span className={styles.tileName}>
                <span className={styles.nameFull}>
                  {teamAway || (catalog.useCatalogFlow ? 'Spiel wählen' : 'Team wählen')}
                </span>
                <span className={styles.nameShort}>
                  {teamAway ? (resolveTeamShortCode(teamAway) || teamAway) : (catalog.useCatalogFlow ? 'Spiel' : 'Team')}
                </span>
              </span>
              {teamAway ? (
                <span className={styles.observeCue}>
                  {observedTeam === teamAway ? 'Beobachtest du' : 'Tippen: beobachten'}
                </span>
              ) : null}
            </button>
            {!catalog.useCatalogFlow ? (
              <button type="button" className={styles.changeBtn} onClick={() => setTeamPicker('away')} disabled={!league}>
                {teamAway ? 'anderes Auswärtsteam' : 'Auswärtsteam wählen'}
              </button>
            ) : null}
          </div>
        </div>

        {teamHome && teamAway && !observedTeam ? (
          <p className={styles.hint}>Tippe das Team, das du beobachtest — Pflicht für die Session.</p>
        ) : null}

        {showObservationScope ? (
          <div className={styles.block}>
            <span className={styles.kicker}>Umfang</span>
            <div className={styles.chipRow}>
              {OBSERVATION_SCOPE_OPTIONS.map((option) => (
                <UiChip
                  key={option.value}
                  size="sm"
                  active={observationScope === option.value}
                  onClick={() => onChange({ observationScope: option.value })}
                >
                  {option.label}
                </UiChip>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {catalog.useCatalogFlow && catalog.normalizedSeason ? (
        <section className={`${setupStyles.panel} ${setupStyles.importPanel} ui-flat-panel`}>
          <div className={setupStyles.panelHeader}>
            <div className={setupStyles.panelTitleRow}>
              <span className={setupStyles.importBadge}>{dummyFallback ? 'DEV' : 'Import'}</span>
              <h3 className={setupStyles.panelTitle}>
                {dummyFallback ? 'Spielkontext · Testdaten' : 'Spielkontext · PENNY DEL'}
              </h3>
            </div>
            <p className={setupStyles.panelLead}>
              {dummyFallback
                ? 'Dummy-Spiele nur für die UI-Entwicklung. Sie sind keine importierten Spielplandaten.'
                : 'Nur Anzeige — reagiert auf das ausgewählte Spiel. Du musst hier nichts auswählen.'}
            </p>
            <p className={setupStyles.catalogStats}>
              Katalog {catalog.normalizedSeason}
              {hideSpoilers
                ? catalog.catalogStats.scheduled > 0
                  ? `: ${catalog.catalogStats.scheduled} geplant`
                  : ''
                : `: ${catalog.catalogStats.withResult} mit Ergebnis${catalog.catalogStats.scheduled > 0 ? ` · ${catalog.catalogStats.scheduled} geplant` : ''}`}
              {!hideSpoilers && catalog.catalogStats.missingResult > 0 ? (
                <span className={setupStyles.catalogStatsWarn}>
                  {` · ${catalog.catalogStats.missingResult} ohne Ergebnis`}
                </span>
              ) : null}
            </p>
          </div>

          {!season || !catalog.selectedMatchday || !teamHome || !teamAway ? (
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.62)' }}>
              Spiel wählen — dann erscheinen Heimteam, Auswärtsteam, Datum und Spieltag.
            </p>
          ) : catalog.matchedCatalogGame ? (
            <>
              <GameContextSummary
                game={catalog.matchedCatalogGame}
                compact
                embedded
                catalogGames={catalog.catalogGames}
                perspectiveTeam={observedTeam || teamHome}
                showImportChrome
                hideSpoilers={hideSpoilers}
              />
              {devMode && !hideSpoilers && !isDummyCatalogGame(catalog.matchedCatalogGame) && (
                <GameStatsDevPanel
                  game={catalog.matchedCatalogGame}
                  catalogGames={catalog.catalogGames}
                  compact
                  embedded
                  perspectiveTeam={observedTeam || teamHome}
                  exampleGamesWithStats={catalog.gamesWithStatsInSeason}
                />
              )}
            </>
          ) : (
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255, 193, 7, 0.95)' }}>
              Kein Spielplan-Treffer für {teamHome} vs {teamAway}, Spieltag {competitionValue}, Saison {catalog.normalizedSeason}.
              {catalog.matchdaysForTeams.length > 0 && (
                <> Diese Paarung im Spielplan: {selectedCompetitionPhase?.unit.label || 'Spieltag'} {catalog.matchdaysForTeams.join(', ')}.</>
              )}
            </p>
          )}
        </section>
      ) : null}

      <UiSheet
        open={teamPicker !== null}
        onClose={() => setTeamPicker(null)}
        title={teamPicker === 'away' ? 'Auswärtsteam' : 'Heimteam'}
        meta="Tippe ein Team"
      >
        <UiSheetChoiceList>
          {availableTeams.map((team) => (
            <UiSheetChoice
              key={team}
              title={team}
              hint={resolveTeamShortCode(team) || undefined}
              onClick={() => teamPicker && pickTeam(teamPicker, team)}
            />
          ))}
        </UiSheetChoiceList>
        <UiSheetActions
          secondary={
            <UiButton variant="secondary" onClick={() => setTeamPicker(null)}>
              Abbrechen
            </UiButton>
          }
        />
      </UiSheet>
    </>
  )
}
