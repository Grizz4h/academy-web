import { useMemo } from 'react'
import { buildDevTodayShowcaseByLeague } from '../../dev/devFixtures/games'
import { useDevTodaySlatePreview } from '../../dev/devTodaySlatePreview'
import { SCHEDULE_LEAGUES } from './scheduleLeagues'
import { useTodayGamesSchedule } from './useTodayGamesSchedule'

/** Real today slate + optional dev dummy overlay (same toggle as DevLab). */
export function useTodayGamesDisplay(options?: {
  date?: string
  enabled?: boolean
}) {
  const devPreview = useDevTodaySlatePreview()
  const schedule = useTodayGamesSchedule(options)

  const gamesByLeague = useMemo(() => {
    if (!devPreview) return schedule.gamesByLeague
    return buildDevTodayShowcaseByLeague(schedule.date)
  }, [devPreview, schedule.gamesByLeague, schedule.date])

  const leaguesWithGames = useMemo(
    () => SCHEDULE_LEAGUES.filter((league) => (gamesByLeague[league]?.length ?? 0) > 0),
    [gamesByLeague],
  )

  return {
    ...schedule,
    gamesByLeague,
    leaguesWithGames,
    devPreview,
  }
}
