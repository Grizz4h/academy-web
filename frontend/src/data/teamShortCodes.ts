/**
 * Central team short-code catalog for scene asset naming.
 * Built from the union of all season rosters — historical names stay resolvable.
 */

import { getAllCatalogTeams, getCatalogTeamsForLeague } from './teamCatalog'

type TeamShortEntry = {
  name: string
  short: string
}

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
  'Augsburger Panther': 'AEV',
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
}

function normalizeTeamKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function collectEntries(): TeamShortEntry[] {
  const entries: TeamShortEntry[] = []
  for (const team of getAllCatalogTeams()) {
    const name = String(team.name || '').trim()
    const short = String(team.short || '').trim().toUpperCase()
    if (!name || !short) continue
    entries.push({ name, short })
  }
  for (const [name, short] of Object.entries(NAME_ALIASES)) {
    entries.push({ name, short: short.toUpperCase() })
  }
  return entries
}

const TEAM_ENTRIES = collectEntries()

const SHORT_BY_EXACT_NAME = new Map(
  TEAM_ENTRIES.map((entry) => [entry.name, entry.short]),
)

const SHORT_BY_NORMALIZED_NAME = new Map(
  TEAM_ENTRIES.map((entry) => [normalizeTeamKey(entry.name), entry.short]),
)

/** Resolve a stored display team name to its canonical short code. */
export function resolveTeamShortCode(teamName: string | null | undefined): string | null {
  const raw = String(teamName || '').trim()
  if (!raw) return null

  const exact = SHORT_BY_EXACT_NAME.get(raw)
  if (exact) return exact

  const normalized = SHORT_BY_NORMALIZED_NAME.get(normalizeTeamKey(raw))
  return normalized || null
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

  const short = resolveTeamShortCode(raw)
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
): string | null {
  const home = resolveTeamShortCode(teamHome)
  const away = resolveTeamShortCode(teamAway)
  if (!home || !away) return null
  return `${home}-${away}`
}
