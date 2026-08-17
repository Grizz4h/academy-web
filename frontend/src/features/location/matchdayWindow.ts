import type { CatalogGame } from '../../api'
import { localTodayIsoDate } from '../../components/game/gameCatalogUtils'
import { isDummyCatalogGame } from '../schedule/scheduleLayer'

export const ARENA_MATCHDAY_WINDOW = {
  /** 3 hours before faceoff */
  startOffsetMinutes: -180,
  /** Typical DEL game length until expected end */
  expectedDurationMinutes: 150,
  /** 3 hours after expected end */
  endAfterFinishMinutes: 180,
}

function gameStart(game: CatalogGame): Date {
  const date = game.date || localTodayIsoDate()
  const time = game.time && /^\d{1,2}:\d{2}/.test(game.time) ? game.time.slice(0, 5) : '19:00'
  const parsed = new Date(`${date}T${time}:00`)
  if (Number.isNaN(parsed.getTime())) return new Date(`${date}T19:00:00`)
  return parsed
}

export function expectedGameEnd(game: CatalogGame): Date {
  return new Date(gameStart(game).getTime() + ARENA_MATCHDAY_WINDOW.expectedDurationMinutes * 60_000)
}

export function arenaWindowBounds(game: CatalogGame): { start: Date; end: Date } {
  const start = new Date(gameStart(game).getTime() + ARENA_MATCHDAY_WINDOW.startOffsetMinutes * 60_000)
  const end = new Date(expectedGameEnd(game).getTime() + ARENA_MATCHDAY_WINDOW.endAfterFinishMinutes * 60_000)
  return { start, end }
}

export function isWithinArenaMatchdayWindow(game: CatalogGame, now: Date = new Date()): boolean {
  if (isDummyCatalogGame(game)) return false
  const status = String(game.status || '').toLowerCase()
  if (status === 'live') return true
  const { start, end } = arenaWindowBounds(game)
  const ts = now.getTime()
  return ts >= start.getTime() && ts <= end.getTime()
}
