import { useMemo } from 'react'
import { type CatalogGame } from '../../api'
import { filterGamesForDate, localTodayIsoDate } from '../../components/game/gameCatalogUtils'
import { SCHEDULE_LEAGUES, type ScheduleLeague } from './scheduleLeagues'
import { useScheduleLeaguesGames } from './useScheduleLeaguesGames'

export function useTodayGamesSchedule(options?: {
  date?: string
  enabled?: boolean
}) {
  const date = options?.date ?? localTodayIsoDate()
  const referenceDate = useMemo(() => new Date(`${date}T12:00:00`), [date])
  const enabled = options?.enabled ?? true

  const schedule = useScheduleLeaguesGames({ referenceDate, enabled })

  const todayByLeague = useMemo(() => {
    const out: Partial<Record<ScheduleLeague, CatalogGame[]>> = {}
    SCHEDULE_LEAGUES.forEach((league) => {
      out[league] = filterGamesForDate(schedule.gamesByLeague[league] || [], date)
    })
    return out as Record<ScheduleLeague, CatalogGame[]>
  }, [schedule.gamesByLeague, date])

  const leaguesWithGames = useMemo(
    () => SCHEDULE_LEAGUES.filter((league) => (todayByLeague[league]?.length ?? 0) > 0),
    [todayByLeague],
  )

  const allTodayGames = useMemo(
    () => leaguesWithGames.flatMap((league) => todayByLeague[league] || []),
    [leaguesWithGames, todayByLeague],
  )

  return {
    date,
    gamesByLeague: todayByLeague,
    leaguesWithGames,
    allTodayGames,
    isLoading: schedule.isLoading,
    isError: schedule.isError,
  }
}
