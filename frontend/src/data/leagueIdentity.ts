/**
 * Canonical Tank league / competition identity.
 *
 * Domain/API: DNL
 * Age context: U20 (team names, not the league string)
 * Internal catalog/files: U20_DNL, teams_u20_dnl.json, u20_dnl_* game files
 *
 * Consumers look up by DNL. Legacy U20_DNL is accepted as an alias.
 */

export const DOMAIN_LEAGUE_DNL = 'DNL'
export const CATALOG_LEAGUE_DNL = 'U20_DNL'

const DNL_FOLDED = new Set(['DNL', 'U20DNL', 'U20'])

export function foldLeagueToken(value?: string | null): string {
  return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '')
}

export function isDnlLeague(value?: string | null): boolean {
  return DNL_FOLDED.has(foldLeagueToken(value))
}

export function domainLeague(value?: string | null): string {
  const text = String(value || '').trim()
  if (isDnlLeague(text)) return DOMAIN_LEAGUE_DNL
  return text
}

export function catalogLeague(value?: string | null): string {
  const text = String(value || '').trim()
  if (isDnlLeague(text)) return CATALOG_LEAGUE_DNL
  return text
}

export function leaguesEquivalent(left?: string | null, right?: string | null): boolean {
  const a = domainLeague(left)
  const b = domainLeague(right)
  if (!a || !b) return false
  return a === b || foldLeagueToken(a) === foldLeagueToken(b)
}
