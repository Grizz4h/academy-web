import type { CatalogGame } from '../../api'

export type HomeAwayRole = 'home' | 'away' | 'unknown'

function normalize(value: string | null | undefined): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function matchesTeam(observed: string, id?: string, name?: string): boolean {
  const needle = normalize(observed)
  if (!needle) return false
  const idNorm = normalize(id)
  const nameNorm = normalize(name)
  return Boolean((idNorm && (needle === idNorm || needle.replace(/ /g, '_') === idNorm)) || (nameNorm && needle === nameNorm))
}

/** Observed/favorite team vs this game — never a global favorite-only guess. */
export function resolveHomeAwayRole(
  game: Pick<CatalogGame, 'home_team_id' | 'away_team_id' | 'home_team_name' | 'away_team_name'>,
  observedTeamId?: string | null,
): HomeAwayRole {
  if (!observedTeamId) return 'unknown'
  if (matchesTeam(observedTeamId, game.home_team_id, game.home_team_name)) return 'home'
  if (matchesTeam(observedTeamId, game.away_team_id, game.away_team_name)) return 'away'
  return 'unknown'
}
