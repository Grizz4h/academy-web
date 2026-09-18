import raw from './delTeamColors.json' with { type: 'json' }

export type DelTeamColors = {
  primaryColor: string
  secondaryColor: string
}

const HEX = /^#[0-9A-Fa-f]{6}$/

function catalogKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

function asColors(value: unknown): DelTeamColors | null {
  if (!value || typeof value !== 'object') return null
  const primaryColor = (value as { primaryColor?: unknown }).primaryColor
  const secondaryColor = (value as { secondaryColor?: unknown }).secondaryColor
  if (typeof primaryColor !== 'string' || typeof secondaryColor !== 'string') return null
  if (!HEX.test(primaryColor) || !HEX.test(secondaryColor)) return null
  return {
    primaryColor: primaryColor.toUpperCase(),
    secondaryColor: secondaryColor.toUpperCase(),
  }
}

const PALETTE: Record<string, DelTeamColors> = {}
for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
  if (key.startsWith('_')) continue
  const colors = asColors(value)
  if (colors) PALETTE[catalogKey(key)] = colors
}

export const DEL_TEAM_COLORS = PALETTE

export function getDelTeamColors(teamId: string | null | undefined): DelTeamColors | null {
  if (!teamId) return null
  return PALETTE[catalogKey(teamId)] || null
}
