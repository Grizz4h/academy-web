import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, type CatalogGame } from '../../api'
import { useDevNavEnabled } from '../../config/featureFlags'
import {
  fieldsFromCatalogGame,
  isDummyCatalogGame,
  resolveScheduleGames,
} from '../../features/schedule/scheduleLayer'
import {
  filterCatalogGamesForSeason,
  filterGamesForDate,
  findCatalogGameForPairing,
  findGamesForTeams,
  getCatalogSeasonStats,
  localTodayIsoDate,
  uniqueMatchdays,
} from './gameCatalogUtils'
import { normalizeSeasonValue } from '../../stats/seasonNormalization'

export function useGameCatalogMatch(params: {
  league: string
  season: string
  teamHome: string
  teamAway: string
  competitionValue: string
  selectedGameId?: string
}) {
  const devMode = useDevNavEnabled()
  const normalizedSeason = normalizeSeasonValue(params.season, params.league) || ''

  const { data: gamesData, isFetched } = useQuery({
    queryKey: ['games', params.league, normalizedSeason],
    queryFn: () => api.getGames({ league: params.league, season: normalizedSeason }),
    enabled: Boolean(params.league && normalizedSeason),
    staleTime: 60_000,
  })

  const importedGames = useMemo(
    () => filterCatalogGamesForSeason(gamesData?.games || [], normalizedSeason),
    [gamesData?.games, normalizedSeason],
  )

  const resolved = useMemo(
    () => resolveScheduleGames({
      league: params.league,
      season: normalizedSeason,
      realGames: importedGames,
      devMode,
      catalogReady: isFetched,
    }),
    [params.league, normalizedSeason, importedGames, devMode, isFetched],
  )

  const catalogGames = resolved.games
  const usingDummyFallback = resolved.usingDummyFallback
  const catalogReady = Boolean(params.league && normalizedSeason) && (isFetched || usingDummyFallback)
  const useCatalogFlow = Boolean(normalizedSeason) && catalogGames.length > 0
  const catalogStats = useMemo(() => getCatalogSeasonStats(catalogGames), [catalogGames])
  const todayCatalogGames = useMemo(
    () => filterGamesForDate(catalogGames, localTodayIsoDate()),
    [catalogGames],
  )
  const gamesWithStatsInSeason = useMemo(
    () => catalogGames.filter((game) => Boolean(game.stats?.imported_at) && !isDummyCatalogGame(game)),
    [catalogGames],
  )
  const availableMatchdays = useMemo(() => uniqueMatchdays(catalogGames), [catalogGames])

  const gamesForTeams = useMemo(() => {
    if (!params.teamHome || !params.teamAway) return []
    return findGamesForTeams(catalogGames, params.teamHome, params.teamAway)
  }, [catalogGames, params.teamHome, params.teamAway])

  const matchdaysForTeams = useMemo(() => uniqueMatchdays(gamesForTeams), [gamesForTeams])

  const selectedMatchday = useMemo(() => {
    const parsed = Number(params.competitionValue)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }, [params.competitionValue])

  const matchedCatalogGame = useMemo<CatalogGame | null>(() => {
    if (!useCatalogFlow) return null
    if (params.selectedGameId) {
      const byId = catalogGames.find((game) => game.id === params.selectedGameId)
      if (byId) return byId
    }
    if (!params.teamHome || !params.teamAway || !selectedMatchday) return null
    return findCatalogGameForPairing(
      catalogGames,
      params.teamHome,
      params.teamAway,
      selectedMatchday,
      normalizedSeason,
    ) || null
  }, [useCatalogFlow, params.selectedGameId, params.teamHome, params.teamAway, selectedMatchday, catalogGames, normalizedSeason])

  return {
    normalizedSeason,
    catalogGames,
    useCatalogFlow,
    catalogReady,
    catalogStats,
    todayCatalogGames,
    gamesWithStatsInSeason,
    availableMatchdays,
    matchdaysForTeams,
    selectedMatchday,
    matchedCatalogGame,
    usingDummyFallback,
    scheduleSource: resolved.source,
    applyCatalogGame: fieldsFromCatalogGame,
  }
}
