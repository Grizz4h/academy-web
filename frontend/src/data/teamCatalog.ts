/**
 * Season-aware team catalog access.
 * Source: mirrored JSON under src/data (synced from data/academy).
 */

import delTeams from './teams_del.json'
import del2Teams from './teams_del2.json'
import testspieleTeams from './teams_testspiele.json'
import nationalTeams from './teams_national.json'
import nhlTeams from './teams_nhl.json'
import chlTeams from './teams_chl.json'
import u20DnlTeams from './teams_u20_dnl.json'
import { normalizeSeasonValue, SEASON_OPTIONS } from '../stats/seasonNormalization'

export type CatalogTeam = {
  id: string
  name: string
  short: string
  city?: string
  country?: string
  division?: string
}

export type SeasonTeamCatalog = {
  league: string
  default_season?: string
  seasons?: Record<string, CatalogTeam[]>
  /** Legacy flat shape */
  season?: string
  teams?: CatalogTeam[]
}

const CATALOGS: Record<string, SeasonTeamCatalog> = {
  DEL: delTeams as SeasonTeamCatalog,
  Testspiele: testspieleTeams as SeasonTeamCatalog,
  DEL2: del2Teams as SeasonTeamCatalog,
  NHL: nhlTeams as SeasonTeamCatalog,
  CHL: chlTeams as SeasonTeamCatalog,
  U20_DNL: u20DnlTeams as SeasonTeamCatalog,
  Nationalmannschaften: nationalTeams as SeasonTeamCatalog,
}

/** Liga-Reihenfolge in Session-Setup / Beobachtungsmaske */
export const TEAM_CATALOG_LEAGUES = [
  'DEL',
  'DEL2',
  'CHL',
  'U20_DNL',
  'NHL',
  'Nationalmannschaften',
  'Testspiele',
]

export function resolveCatalogSeasonKey(
  league: string | null | undefined,
  season: string | null | undefined,
): string | null {
  const catalog = CATALOGS[(league || '').trim()]
  if (!catalog) return null

  const normalized = normalizeSeasonValue(season || undefined, league || undefined)
  const available = Object.keys(catalog.seasons || {})

  if (normalized && available.includes(normalized)) return normalized
  if (season && available.includes(season.trim())) return season.trim()

  const fallback = catalog.default_season || available[0] || null
  if (fallback && available.includes(fallback)) return fallback
  return fallback
}

export function getCatalogTeamsForLeague(
  league: string | null | undefined,
  season?: string | null,
): CatalogTeam[] {
  const key = (league || '').trim()
  const catalog = CATALOGS[key]
  if (!catalog) return []

  // Legacy flat catalogs
  if (!catalog.seasons) {
    return Array.isArray(catalog.teams) ? catalog.teams : []
  }

  const seasonKey = resolveCatalogSeasonKey(key, season)
  if (seasonKey && catalog.seasons[seasonKey]) {
    return catalog.seasons[seasonKey]
  }

  const fallback = catalog.default_season
  if (fallback && catalog.seasons[fallback]) {
    return catalog.seasons[fallback]
  }

  const first = Object.values(catalog.seasons)[0]
  return first || []
}

export function getTeamNamesForLeague(
  league: string | null | undefined,
  season?: string | null,
): string[] {
  return getCatalogTeamsForLeague(league, season).map((team) => team.name)
}

/** Union of all season rosters for a league (useful for Progress / history). */
export function getAllTeamNamesForLeague(league: string | null | undefined): string[] {
  const key = (league || '').trim()
  const catalog = CATALOGS[key]
  if (!catalog) return []
  if (!catalog.seasons) {
    return (catalog.teams || []).map((team) => team.name)
  }
  const names = new Set<string>()
  for (const teams of Object.values(catalog.seasons)) {
    for (const team of teams) names.add(team.name)
  }
  return Array.from(names)
}

/** Flatten every catalog/season for short-code resolution. */
export function getAllCatalogTeams(): CatalogTeam[] {
  const out: CatalogTeam[] = []
  for (const catalog of Object.values(CATALOGS)) {
    if (catalog.seasons) {
      for (const teams of Object.values(catalog.seasons)) out.push(...teams)
    } else if (catalog.teams) {
      out.push(...catalog.teams)
    }
  }
  return out
}

export function getDefaultSeasonForLeague(league?: string | null): string {
  const catalog = CATALOGS[(league || '').trim()]
  if (catalog?.default_season) return catalog.default_season
  return SEASON_OPTIONS[0] || '2025/26'
}
