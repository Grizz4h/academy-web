/**
 * Central team short-code catalog for scene asset naming.
 * Built from the union of all season rosters — historical names stay resolvable.
 */

import { getAllCatalogTeams } from './teamCatalog'

type TeamShortEntry = {
  name: string
  short: string
}

/** Alternate display names that should resolve to an existing catalog short. */
const NAME_ALIASES: Record<string, string> = {
  'Fischtown Pinguins': 'BRE',
  'Fischtown Pinguins Bremerhaven': 'BRE',
  'Pinguins Bremerhaven': 'BRE',
  'EHC München': 'MUC',
  'EHC Red Bull Muenchen': 'MUC',
  'Utah Hockey Club': 'UTA',
  'EC Kassel': 'KAS',
  'Kassel Huskies': 'KAS',
  'Augsburger Panther': 'AEV',
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

export function formatMatchupShortCodes(
  teamHome: string | null | undefined,
  teamAway: string | null | undefined,
): string | null {
  const home = resolveTeamShortCode(teamHome)
  const away = resolveTeamShortCode(teamAway)
  if (!home || !away) return null
  return `${home}-${away}`
}
