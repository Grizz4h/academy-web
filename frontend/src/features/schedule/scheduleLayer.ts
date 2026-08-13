import type { CatalogGame } from '../../api'
import { buildDevFixtureGames, DEV_FIXTURE_PROVIDER } from '../../dev/devFixtures/games'

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
  if (phaseId === 'hauptrunde') return 'regular_season'
  return phaseId
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
    teamHome: game.home_team_name || '',
    teamAway: game.away_team_name || '',
    competitionValue: game.matchday != null ? String(game.matchday) : '',
    competitionPhase: catalogPhaseToCompetitionPhase(game.phase_id),
    observedTeam: '',
  }
}
