import type { CatalogGame } from '../../api'
import { formatGameTimeLabel } from '../../components/game/gameCatalogUtils'
import { formatGamePairingShortCodes } from '../../data/teamShortCodes'
import { SCHEDULE_LEAGUES, type ScheduleLeague } from './scheduleLeagues'

const LEAGUE_SHORT: Record<ScheduleLeague, string> = {
  DEL: 'DEL',
  DEL2: 'DEL2',
  CHL: 'CHL',
  U20_DNL: 'U20',
  NHL: 'NHL',
}

export function leagueStripLabel(leagueId: string): string {
  return LEAGUE_SHORT[leagueId as ScheduleLeague] || leagueId.replace(/_/g, ' ')
}

export function pairingStripLabel(game: CatalogGame): string {
  return formatGamePairingShortCodes(game)
}

export function flattenTodayGames(
  gamesByLeague: Partial<Record<ScheduleLeague, CatalogGame[]>>,
): CatalogGame[] {
  return SCHEDULE_LEAGUES.flatMap((league) => gamesByLeague[league] || []).sort((a, b) => {
    const timeA = formatGameTimeLabel(a.time, { omitSuffix: true }) || '99:99'
    const timeB = formatGameTimeLabel(b.time, { omitSuffix: true }) || '99:99'
    if (timeA !== timeB) return timeA.localeCompare(timeB)
    return String(a.league_id).localeCompare(String(b.league_id))
  })
}
