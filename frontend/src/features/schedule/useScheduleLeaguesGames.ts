import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { api, type CatalogGame } from '../../api'
import { filterCatalogGamesForSeason } from '../../components/game/gameCatalogUtils'
import { inferSplitSeasonLabelForDate, normalizeSeasonValue } from '../../stats/seasonNormalization'
import { isDummyCatalogGame } from './scheduleLayer'
import { SCHEDULE_LEAGUES, type ScheduleLeague } from './scheduleLeagues'

export function seasonForScheduleLeague(
  league: ScheduleLeague,
  referenceDate: Date = new Date(),
): string {
  return normalizeSeasonValue(inferSplitSeasonLabelForDate(referenceDate), league)
    || inferSplitSeasonLabelForDate(referenceDate)
}

export function useScheduleLeaguesGames(options?: {
  referenceDate?: Date
  enabled?: boolean
}) {
  const referenceDate = options?.referenceDate ?? new Date()
  const enabled = options?.enabled ?? true

  const seasons = useMemo(
    () => SCHEDULE_LEAGUES.map((league) => seasonForScheduleLeague(league, referenceDate)),
    [referenceDate],
  )

  const queries = useQueries({
    queries: SCHEDULE_LEAGUES.map((league, index) => ({
      queryKey: ['games', league, seasons[index], 'schedule-leagues'],
      queryFn: () => api.getGames({ league, season: seasons[index] }),
      enabled: enabled && Boolean(seasons[index]),
      staleTime: 60_000,
    })),
  })

  const gamesByLeague = useMemo(() => {
    const out: Partial<Record<ScheduleLeague, CatalogGame[]>> = {}
    SCHEDULE_LEAGUES.forEach((league, index) => {
      const season = seasons[index]
      const games = filterCatalogGamesForSeason(queries[index].data?.games || [], season)
      out[league] = games.filter((game) => !isDummyCatalogGame(game))
    })
    return out as Record<ScheduleLeague, CatalogGame[]>
  }, [queries, seasons])

  const allGames = useMemo(
    () => SCHEDULE_LEAGUES.flatMap((league) => gamesByLeague[league] || []),
    [gamesByLeague],
  )

  const isLoading = queries.some((query) => query.isLoading)
  const isError = queries.some((query) => query.isError)

  return {
    gamesByLeague,
    allGames,
    seasons,
    isLoading,
    isError,
  }
}
