import type { CatalogGame } from '../../api'
import type { CatalogSeasonStats } from './gameCatalogUtils'
import { formatCatalogGameOptionLabel, uniqueMatchdays } from './gameCatalogUtils'
import { LEAGUES } from '../../data/teamsByLeague'
import { getCompetitionConfig } from '../../data/competitionConfig'
import { isSplitSeasonLeague, SEASON_OPTIONS, TOURNAMENT_YEAR_OPTIONS } from '../../stats/seasonNormalization'
import { OBSERVATION_SCOPE_OPTIONS, type ObservationScope } from '../../utils/observationScope'
import { isDevNavEnabled } from '../../config/featureFlags'
import { fieldsFromCatalogGame, isDummyCatalogGame } from '../../features/schedule/scheduleLayer'
import GameContextSummary from './GameContextSummary'
import GameStatsDevPanel from './GameStatsDevPanel'
import TodayMatchdaySlate from './TodayMatchdaySlate'
import setupStyles from '../../pages/SessionSetup.module.css'

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
  const devMode = isDevNavEnabled()
  const dummyFallback = Boolean(catalog.usingDummyFallback)
  const selectedGame = catalog.matchedCatalogGame
  const groupedGames = gamesGroupedByMatchday(catalog.catalogGames)
  const emptySeason = Boolean(league && season && catalog.catalogReady && !catalog.useCatalogFlow)

  const applyGame = (game: CatalogGame) => {
    const next = fieldsFromCatalogGame(game)
    onChange({
      selectedGameId: next.selectedGameId,
      teamHome: next.teamHome,
      teamAway: next.teamAway,
      competitionValue: next.competitionValue || competitionValue,
      competitionPhase: next.competitionPhase || competitionPhase,
      observedTeam: '',
    })
  }

  return (
    <>
      {intro && <p className={setupStyles.setupIntro}>{intro}</p>}

      <label style={{ display: 'block', marginTop: '0.25rem' }}>
        Liga auswählen
        <select
          className="appSelect"
          value={league}
          onChange={(event) => {
            onChange({
              league: event.target.value,
              teamHome: '',
              teamAway: '',
              observedTeam: '',
              competitionPhase: '',
              competitionValue: '',
              selectedGameId: '',
            })
          }}
          style={{ marginTop: '0.35rem' }}
        >
          <option value="">-- Liga wählen --</option>
          {LEAGUES.map((lg) => (
            <option key={lg} value={lg}>{lg.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </label>

      {catalog.useCatalogFlow && catalog.todayCatalogGames.length > 0 ? (
        <section className={`${setupStyles.panel} ${setupStyles.livePanel} ui-flat-panel`}>
          <TodayMatchdaySlate
            league={league}
            games={catalog.catalogGames}
            onSelectGame={applyGame}
            selectable
          />
        </section>
      ) : null}

      <section className={`${setupStyles.panel} ${setupStyles.livePanel} ui-flat-panel`}>
        <div className={setupStyles.panelHeader}>
          <div className={setupStyles.panelTitleRow}>
            <span className={setupStyles.liveBadge}>Live</span>
            <h3 className={setupStyles.panelTitle}>Deine Beobachtung</h3>
          </div>
          <p className={setupStyles.panelLead}>
            Liga → Saison → Spiel. Heim- und Auswärtsteam kommen aus dem Spielplan. Das beobachtete Team wählst du bewusst.
          </p>
        </div>

        <div className={setupStyles.formGrid2}>
          <label style={{ display: 'block' }}>
            Saison
            <select
              className="appSelect"
              value={season}
              onChange={(event) => onChange({
                season: event.target.value,
                competitionValue: '',
                selectedGameId: '',
                teamHome: '',
                teamAway: '',
                observedTeam: '',
              })}
              disabled={!league}
              style={{ marginTop: '0.35rem' }}
            >
              <option value="">-- Saison --</option>
              {seasonOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          {competitionConfig && selectedCompetitionPhase ? (
            <label style={{ display: 'block' }}>
              Phase
              <select
                className="appSelect"
                value={selectedCompetitionPhase.id}
                onChange={(event) => onChange({ competitionPhase: event.target.value, competitionValue: '', selectedGameId: '' })}
                style={{ marginTop: '0.35rem' }}
              >
                {competitionConfig.phases.map((phase) => (
                  <option key={phase.id} value={phase.id}>{phase.label}</option>
                ))}
              </select>
            </label>
          ) : (
            <div />
          )}
        </div>

        {catalog.useCatalogFlow && (
          <label style={{ display: 'block' }}>
            Spiel auswählen
            <select
              className="appSelect"
              value={selectedGameId || selectedGame?.id || ''}
              onChange={(event) => {
                const game = catalog.catalogGames.find((item) => item.id === event.target.value)
                if (game) applyGame(game)
                else onChange({ selectedGameId: '' })
              }}
              style={{ marginTop: '0.35rem' }}
            >
              <option value="">-- Spiel wählen --</option>
              {groupedGames.matchdays.map((group) => (
                <optgroup key={group.matchday} label={`Spieltag ${group.matchday}`}>
                  {group.games.map((game) => (
                    <option key={game.id} value={game.id}>
                      {formatCatalogGameOptionLabel(game)}
                    </option>
                  ))}
                </optgroup>
              ))}
              {groupedGames.ungrouped.map((game) => (
                <option key={game.id} value={game.id}>
                  {formatCatalogGameOptionLabel(game)}
                </option>
              ))}
            </select>
            {dummyFallback && (
              <div style={{ marginTop: '0.35rem', fontSize: '0.78rem', color: '#fcd34d' }}>
                DEV TESTDATEN — keine echten Spiele für diese Saison. Dummy-Spiele nur zur UI-Entwicklung.
              </div>
            )}
          </label>
        )}

        {emptySeason && (
          <p style={{ margin: '0.6rem 0 0', fontSize: '0.88rem', color: 'rgba(226,232,240,0.82)' }}>
            Für diese Saison sind noch keine Spiele verfügbar.
          </p>
        )}

        {competitionConfig && selectedCompetitionPhase && (
          <label style={{ display: 'block' }}>
            {selectedCompetitionPhase.unit.label}
            {catalog.useCatalogFlow && catalog.availableMatchdays.length > 0 ? (
              <select
                className="appSelect"
                value={competitionValue}
                onChange={(event) => onChange({ competitionValue: event.target.value, selectedGameId: '' })}
                style={{ marginTop: '0.35rem' }}
              >
                <option value="">-- Spieltag wählen --</option>
                {catalog.availableMatchdays.map((matchday) => (
                  <option key={matchday} value={String(matchday)}>
                    Spieltag {matchday}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="number"
                value={competitionValue}
                onChange={(event) => onChange({ competitionValue: event.target.value, selectedGameId: '' })}
                min={selectedCompetitionPhase.unit.min}
                max={selectedCompetitionPhase.unit.max}
                placeholder={`${selectedCompetitionPhase.unit.min}–${selectedCompetitionPhase.unit.max}`}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  marginTop: '0.35rem',
                  backgroundColor: '#050712',
                  color: '#f7f7ff',
                  border: '1px solid #5191a2',
                  borderRadius: '4px',
                }}
              />
            )}
            <div style={{ marginTop: '0.3rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.62)' }}>
              {useSplitSeason ? 'Split-Season (z. B. 2025/26)' : 'Turnier-Jahr'}
              {catalog.useCatalogFlow && catalog.availableMatchdays.length > 0
                ? ` · ${catalog.availableMatchdays.length} Spieltage im Spielplan`
                : ''}
            </div>
          </label>
        )}

        <div className={setupStyles.formGrid2}>
          <label style={{ display: 'block' }}>
            Heimteam
            <select
              className="appSelect"
              value={teamHome}
              onChange={(event) => {
                const next = event.target.value
                onChange({
                  teamHome: next,
                  observedTeam: observedTeam === teamHome ? '' : observedTeam,
                  selectedGameId: '',
                })
              }}
              disabled={!league}
              style={{ marginTop: '0.35rem' }}
            >
              <option value="">-- Heimteam --</option>
              {availableTeams.map((team) => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
            <div>
              <input
                type="radio"
                checked={observedTeam === teamHome}
                onChange={() => onChange({ observedTeam: teamHome })}
                disabled={!teamHome}
                id="observe-home"
                name="observed-team"
              />
              <label htmlFor="observe-home" style={{ marginLeft: '0.5rem' }}>Welches Team beobachtest du?</label>
            </div>
          </label>

          <label style={{ display: 'block' }}>
            Auswärtsteam
            <select
              className="appSelect"
              value={teamAway}
              onChange={(event) => {
                const next = event.target.value
                onChange({
                  teamAway: next,
                  observedTeam: observedTeam === teamAway ? '' : observedTeam,
                  selectedGameId: '',
                })
              }}
              disabled={!league}
              style={{ marginTop: '0.35rem' }}
            >
              <option value="">-- Auswärtsteam --</option>
              {availableTeams.map((team) => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
            <div>
              <input
                type="radio"
                checked={observedTeam === teamAway}
                onChange={() => onChange({ observedTeam: teamAway })}
                disabled={!teamAway}
                id="observe-away"
                name="observed-team"
              />
              <label htmlFor="observe-away" style={{ marginLeft: '0.5rem' }}>Welches Team beobachtest du?</label>
            </div>
          </label>
        </div>

        {teamHome && teamAway && !observedTeam && (
          <p className={setupStyles.observedHint}>Bitte das beobachtete Team wählen — Pflicht für die Session.</p>
        )}

        {showObservationScope && (
          <label style={{ display: 'block' }}>
            Beobachtungsumfang
            <select
              className="appSelect"
              value={observationScope}
              onChange={(event) => onChange({ observationScope: event.target.value as ObservationScope })}
              style={{ marginTop: '0.35rem' }}
            >
              {OBSERVATION_SCOPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <div style={{ marginTop: '0.3rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.62)' }}>
              Dein Analyse-Fokus in dieser Session — unabhängig vom Import-Ergebnis.
            </div>
          </label>
        )}
      </section>

      {catalog.useCatalogFlow && catalog.normalizedSeason && (
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
              Katalog {catalog.normalizedSeason}: {catalog.catalogStats.withResult} mit Ergebnis
              {catalog.catalogStats.scheduled > 0 ? ` · ${catalog.catalogStats.scheduled} geplant` : ''}
              {catalog.catalogStats.missingResult > 0 ? (
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
              />
              {devMode && !isDummyCatalogGame(catalog.matchedCatalogGame) && (
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
                <> Diese Paarung im Spielplan: Spieltag {catalog.matchdaysForTeams.join(', ')}.</>
              )}
            </p>
          )}
        </section>
      )}
    </>
  )
}
