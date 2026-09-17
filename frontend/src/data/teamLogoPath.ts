/** Catalog paths like `/teams/del/foo.png` — not public URLs. */
const TEAM_LOGO_LOGICAL = /^\/teams\/(del|del2|chl|nhl|u20_dnl)\/([A-Za-z0-9_-]+\.(?:png|svg|jpe?g|webp|gif))$/i

export function parseTeamLogoLogicalPath(
  logicalSrc: string | null | undefined,
): { league: string; filename: string } | null {
  const raw = String(logicalSrc || '').trim().split('?')[0]
  const match = TEAM_LOGO_LOGICAL.exec(raw)
  if (!match) return null
  return { league: match[1].toLowerCase(), filename: match[2] }
}
