import type { CatalogGame } from '../../../api'
import { isDummyCatalogGame } from '../../schedule/scheduleLayer'
import { filterGamesForDate, localTodayIsoDate } from '../../../components/game/gameCatalogUtils'
import type { MatchdayContext, MatchdayPhase } from './types'

function gameStart(game: CatalogGame): Date {
  const date = game.date || localTodayIsoDate()
  const time = game.time && /^\d{1,2}:\d{2}/.test(game.time) ? game.time.slice(0, 5) : '19:00'
  const parsed = new Date(`${date}T${time}:00`)
  if (Number.isNaN(parsed.getTime())) return new Date(`${date}T19:00:00`)
  return parsed
}

export function resolveMatchdayPhase(game: CatalogGame, now: Date = new Date()): MatchdayPhase {
  const status = String(game.status || '').toLowerCase()
  if (status === 'live') return 'live'
  if (status === 'final' || status === 'finished' || status === 'off') return 'finished'
  const start = gameStart(game)
  const minutes = (now.getTime() - start.getTime()) / 60000
  if (minutes < -90) return 'upcoming'
  if (minutes < 0) return 'pregame'
  if (minutes < 180) return 'live'
  return 'postgame'
}

export function resolveMatchdayContext(
  games: CatalogGame[] | null | undefined,
  now: Date = new Date(),
): MatchdayContext | null {
  const today = localTodayIsoDate(now)
  const realToday = filterGamesForDate(games || [], today).filter((game) => !isDummyCatalogGame(game))
  if (!realToday.length) return null

  const ranked = [...realToday].sort((a, b) => {
    const phaseRank = (game: CatalogGame) => {
      const phase = resolveMatchdayPhase(game, now)
      if (phase === 'live') return 0
      if (phase === 'pregame') return 1
      if (phase === 'upcoming') return 2
      if (phase === 'postgame') return 3
      return 4
    }
    const delta = phaseRank(a) - phaseRank(b)
    if (delta !== 0) return delta
    return gameStart(a).getTime() - gameStart(b).getTime()
  })

  const game = ranked[0]
  const start = gameStart(game)
  return {
    gameId: game.id,
    homeTeamId: game.home_team_id,
    awayTeamId: game.away_team_id,
    homeTeamName: game.home_team_name,
    awayTeamName: game.away_team_name,
    startsAt: start.toISOString(),
    phase: resolveMatchdayPhase(game, now),
    game,
  }
}
