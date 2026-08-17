import delTeamLogos from './delTeamLogos.json'
import { getAllCatalogTeams } from './teamCatalog'
import { resolveTeamShortCode } from './teamShortCodes'

const LOGOS_BY_ID: Record<string, string> = { ...(delTeamLogos as Record<string, string>) }

function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const LOGOS_BY_NAME = new Map<string, string>()
const LOGOS_BY_SHORT = new Map<string, string>()

for (const team of getAllCatalogTeams()) {
  const src = LOGOS_BY_ID[team.id]
  if (!src) continue
  LOGOS_BY_NAME.set(normalizeKey(team.name), src)
  if (team.short) LOGOS_BY_SHORT.set(team.short.toUpperCase(), src)
}

for (const team of getAllCatalogTeams()) {
  const src = LOGOS_BY_ID[team.id] || (team.short ? LOGOS_BY_SHORT.get(team.short.toUpperCase()) : undefined)
  if (!src) continue
  LOGOS_BY_ID[team.id] = src
  LOGOS_BY_NAME.set(normalizeKey(team.name), src)
  if (team.short) LOGOS_BY_SHORT.set(team.short.toUpperCase(), src)
}

export function resolveTeamLogo(nameOrId: string | null | undefined): string | null {
  const raw = String(nameOrId || '').trim()
  if (!raw) return null
  if (LOGOS_BY_ID[raw]) return LOGOS_BY_ID[raw]
  const byName = LOGOS_BY_NAME.get(normalizeKey(raw))
  if (byName) return byName
  const short = resolveTeamShortCode(raw)
  if (short) return LOGOS_BY_SHORT.get(short) || null
  return null
}
