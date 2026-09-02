import type { CatalogGame } from '../../api'
import { buildDevFixtureGames, DEV_FIXTURE_PROVIDER } from '../../dev/devFixtures/games'
import { resolveCatalogTeamName } from '../../data/teamShortCodes'

export type ScheduleSourceKind = 'catalog' | 'dev_fixture' | 'empty'

export type ResolvedSchedule = {
  games: CatalogGame[]
  source: ScheduleSourceKind
  usingDummyFallback: boolean
}

export function isDummyCatalogGame(game?: CatalogGame | null): boolean {
  if (!game) return false
  if (game.isDummy === true || game.is_dummy === true) return true
  if (game.source?.provider === DEV_FIXTURE_PROVIDER) return true
  return String(game.id || '').startsWith('dev:')
}

export function realCatalogGames(games: CatalogGame[] | null | undefined): CatalogGame[] {
  return (games || []).filter((game) => !isDummyCatalogGame(game))
}

export function resolveScheduleGames(params: {
  league: string
  season: string
  realGames: CatalogGame[]
  devMode: boolean
  catalogReady?: boolean
}): ResolvedSchedule {
  const real = realCatalogGames(params.realGames)
  if (real.length > 0) {
    return { games: real, source: 'catalog', usingDummyFallback: false }
  }
  if (params.catalogReady === false) {
    return { games: [], source: 'empty', usingDummyFallback: false }
  }
  if (params.devMode && params.league && params.season) {
    return {
      games: buildDevFixtureGames({ league: params.league, season: params.season }),
      source: 'dev_fixture',
      usingDummyFallback: true,
    }
  }
  return { games: [], source: 'empty', usingDummyFallback: false }
}

export function catalogPhaseToCompetitionPhase(phaseId?: string): string | undefined {
  if (!phaseId) return undefined
  if (phaseId === 'hauptrunde' || phaseId === 'upcoming') return 'regular_season'
  // Legacy U20 DNL import before Gruppe 1/2 split
  if (phaseId === 'finding_a') return 'finding_a_g1'
  return phaseId
}

export function gamesForCompetitionPhase(
  games: CatalogGame[],
  competitionPhase?: string,
): CatalogGame[] {
  if (!competitionPhase || competitionPhase === 'regular_season') {
    return games.filter((game) => {
      const mapped = catalogPhaseToCompetitionPhase(game.phase_id)
      return !mapped || mapped === 'regular_season'
    })
  }
  return games.filter((game) => catalogPhaseToCompetitionPhase(game.phase_id) === competitionPhase)
}

export function fieldsFromCatalogGame(game: CatalogGame): {
  selectedGameId: string
  teamHome: string
  teamAway: string
  competitionValue: string
  competitionPhase?: string
  observedTeam: string
} {
  return {
    selectedGameId: game.id,
    teamHome: resolveCatalogTeamName(game.home_team_name || game.home_team_id, game.league_id, game.season_id),
    teamAway: resolveCatalogTeamName(game.away_team_name || game.away_team_id, game.league_id, game.season_id),
    competitionValue: game.matchday != null ? String(game.matchday) : '',
    competitionPhase: catalogPhaseToCompetitionPhase(game.phase_id),
    observedTeam: '',
  }
}
