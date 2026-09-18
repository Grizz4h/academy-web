/**
 * Central team short-code catalog.
 * Naming lookups must be league-aware. Global last-write-wins maps are forbidden.
 */

import {
  getAllCatalogTeams,
  getCatalogTeamsForLeague,
  getCatalogTeamsForLeagueLookup,
  TEAM_CATALOG_LEAGUES,
} from './teamCatalog'
import type { CatalogTeam } from './teamCatalog'

/** Alternate display names that should resolve to an existing catalog short. */
const NAME_ALIASES: Record<string, string> = {
  'Fischtown Pinguins': 'BRE',
  'Fischtown Pinguins Bremerhaven': 'BRE',
  'Pinguins Bremerhaven': 'BRE',
  BHV: 'BRE',
  'EHC München': 'MUC',
  'EHC Red Bull Muenchen': 'MUC',
  'Utah Hockey Club': 'UTA',
  'EC Kassel': 'KAS',
  'Kassel Huskies': 'KAS',
  'Steinbach Black Wings Linz': 'SBW',
  'Black Wings Linz': 'SBW',
  // Legacy U20 names (pre "… U20" catalog rename)
  'ERC Ingolstadt U20': 'ING',
  'EV Landshut U20': 'EVL',
  'Düsseldorfer EG U20': 'DEG',
  'ESV Kaufbeuren U20': 'ESV',
  'Starbulls Rosenheim U20': 'SBR',
  'ESC Dresden U20': 'ESD',
  'Iserlohner EC U20': 'IEC',
  'Krefelder EV 81 U20': 'KEV',
  'Augsburger EV U20': 'AEV',
  'Schwenninger ERC U20': 'SWW',
  'EC Bad Tölz U20': 'TOL',
  'SC Bietigheim-Bissingen U20': 'SBB',
  'EV Füssen U20': 'EVF',
  'EV Füssen': 'EVF',
}

export type TeamShortResolveOptions = {
  league?: string | null
  season?: string | null
  teamId?: string | null
}

function normalizeTeamKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function catalogIdKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

function poolsForLookup(options?: TeamShortResolveOptions): CatalogTeam[][] {
  const league = (options?.league || '').trim()
  if (league) return [getCatalogTeamsForLeagueLookup(league, options?.season)]
  return TEAM_CATALOG_LEAGUES.map((key) => getCatalogTeamsForLeagueLookup(key, options?.season))
}

function shortFromTeam(team: CatalogTeam | undefined): string | null {
  const short = String(team?.short || '').trim().toUpperCase()
  return short || null
}

function findInPool(pool: CatalogTeam[], predicate: (team: CatalogTeam) => boolean): CatalogTeam | undefined {
  return pool.find(predicate)
}

/** Resolve a stored display team name / catalog id to its canonical short code. */
export function resolveTeamShortCode(
  teamName: string | null | undefined,
  options?: TeamShortResolveOptions,
): string | null {
  const pools = poolsForLookup(options)
  const teamId = catalogIdKey(options?.teamId || '')
  const raw = String(teamName || '').trim()
  const rawId = catalogIdKey(raw)

  for (const pool of pools) {
    if (teamId) {
      const byOptionId = findInPool(pool, (team) => catalogIdKey(team.id) === teamId)
      const fromId = shortFromTeam(byOptionId)
      if (fromId) return fromId
    }
    if (rawId) {
      const byValueId = findInPool(pool, (team) => catalogIdKey(team.id) === rawId)
      const fromValueId = shortFromTeam(byValueId)
      if (fromValueId) return fromValueId
    }
    if (raw) {
      const exact = findInPool(pool, (team) => team.name === raw)
      const fromExact = shortFromTeam(exact)
      if (fromExact) return fromExact
      const key = normalizeTeamKey(raw)
      const normalized = findInPool(pool, (team) => normalizeTeamKey(team.name) === key)
      const fromNormalized = shortFromTeam(normalized)
      if (fromNormalized) return fromNormalized
    }
    if (leagueScopedAlias(raw, pool)) {
      return leagueScopedAlias(raw, pool)
    }
    if ((options?.league || '').trim()) break
  }
  return null
}

const ALIAS_BY_NORMALIZED = new Map(
  Object.entries(NAME_ALIASES).map(([name, short]) => [normalizeTeamKey(name), short.toUpperCase()]),
)

function leagueScopedAlias(raw: string, pool: CatalogTeam[]): string | null {
  if (!raw) return null
  const aliasShort = NAME_ALIASES[raw] || ALIAS_BY_NORMALIZED.get(normalizeTeamKey(raw))
  if (!aliasShort) return null
  const wanted = aliasShort.toUpperCase()
  const hit = findInPool(pool, (team) => String(team.short || '').toUpperCase() === wanted)
  return shortFromTeam(hit)
}

/** Map PENNY-/Alias-Namen auf den Katalognamen der Liga. */
export function resolveCatalogTeamName(
  nameOrId: string | null | undefined,
  league?: string | null,
  season?: string | null,
): string {
  const raw = String(nameOrId || '').trim()
  if (!raw) return raw

  const pool = league
    ? getCatalogTeamsForLeague(league, season)
    : getAllCatalogTeams()

  const exact = pool.find((team) => team.name === raw || team.id === raw)
  if (exact) return exact.name

  const short = resolveTeamShortCode(raw, { league, season })
  if (short) {
    const byShort = pool.find((team) => String(team.short || '').toUpperCase() === short)
    if (byShort) return byShort.name
  }

  const key = normalizeTeamKey(raw)
  const tokens = key.split(' ').filter((token) => token.length > 2)
  const fuzzy = pool.find((team) => {
    const nameKey = normalizeTeamKey(team.name)
    if (nameKey === key) return true
    return tokens.length >= 2 && tokens.every((token) => nameKey.includes(token))
  })
  return fuzzy?.name || raw
}

export function isListedTeam(
  name: string,
  listed: string[],
  league?: string | null,
  season?: string | null,
): boolean {
  if (listed.includes(name)) return true
  return listed.includes(resolveCatalogTeamName(name, league, season))
}

export function formatMatchupShortCodes(
  teamHome: string | null | undefined,
  teamAway: string | null | undefined,
  options?: {
    league?: string | null
    season?: string | null
    homeTeamId?: string | null
    awayTeamId?: string | null
  },
): string | null {
  const home = resolveTeamShortCode(teamHome, {
    league: options?.league,
    season: options?.season,
    teamId: options?.homeTeamId,
  })
  const away = resolveTeamShortCode(teamAway, {
    league: options?.league,
    season: options?.season,
    teamId: options?.awayTeamId,
  })
  if (!home || !away) return null
  return `${home}-${away}`
}

function fallbackShortCode(raw: string): string {
  return raw.replace(/[^A-Za-zÄÖÜäöüß0-9]/g, '').slice(0, 3).toUpperCase() || '???'
}

/** Resolve catalog game team id/name to a display short code (STR, AEV, BOS, …). */
export function resolveGameTeamShortCode(
  nameOrId: string | null | undefined,
  league?: string | null,
  season?: string | null,
): string {
  const raw = String(nameOrId || '').trim()
  if (!raw) return '???'

  const direct = resolveTeamShortCode(raw, { league, season, teamId: raw })
  if (direct) return direct

  const catalogName = resolveCatalogTeamName(raw, league, season)
  const fromCatalog = resolveTeamShortCode(catalogName, { league, season })
  if (fromCatalog) return fromCatalog

  return fallbackShortCode(catalogName || raw)
}

export function formatGamePairingShortCodes(
  game: {
    home_team_name?: string | null
    home_team_id?: string | null
    away_team_name?: string | null
    away_team_id?: string | null
    league_id?: string | null
    season_id?: string | null
  },
  separator = ' – ',
): string {
  const home = resolveGameTeamShortCode(game.home_team_name || game.home_team_id, game.league_id, game.season_id)
  const away = resolveGameTeamShortCode(game.away_team_name || game.away_team_id, game.league_id, game.season_id)
  return `${home}${separator}${away}`
}
