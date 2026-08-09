/**
 * League display names + season-aware team pickers.
 * Prefer getTeamNamesForLeague(league, season) over the flat map.
 */

import {
  getAllTeamNamesForLeague,
  getTeamNamesForLeague,
  TEAM_CATALOG_LEAGUES,
  getDefaultSeasonForLeague,
} from './teamCatalog'

export { getTeamNamesForLeague, getAllTeamNamesForLeague, getDefaultSeasonForLeague }

/** @deprecated Prefer getTeamNamesForLeague(league, season). Default = 2025/26 roster. */
export const teamsByLeague: Record<string, string[]> = Object.fromEntries(
  TEAM_CATALOG_LEAGUES.map((league) => [
    league,
    getTeamNamesForLeague(league, getDefaultSeasonForLeague(league)),
  ]),
)

export const LEAGUES = TEAM_CATALOG_LEAGUES
