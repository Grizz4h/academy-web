import { parseTeamLogoLogicalPath } from './teamLogoPath.ts'

export function normalizeClubLogoId(value: string | null | undefined): string {
  return String(value || '').trim().toLowerCase().replace(/-/g, '_')
}

export function catalogIdFromLogoPath(logicalSrc: string | null | undefined): string | null {
  const parsed = parseTeamLogoLogicalPath(logicalSrc)
  if (!parsed) return null
  const stem = parsed.filename.replace(/\.[^.]+$/, '')
  return normalizeClubLogoId(stem) || null
}

/** True when catalog ID or the file stem (CHL/U20 reuse of a DEL crest) is cleared. */
export function isClubLogoPublic(
  clearedIds: ReadonlySet<string>,
  options: { teamId?: string | null; logicalSrc?: string | null } = {},
): boolean {
  const teamId = normalizeClubLogoId(options.teamId)
  if (teamId && clearedIds.has(teamId)) return true
  const fromPath = catalogIdFromLogoPath(options.logicalSrc)
  return Boolean(fromPath && clearedIds.has(fromPath))
}
