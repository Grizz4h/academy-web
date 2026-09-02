import nationalTeams from './teams_national.json'
import { getAllCatalogTeams } from './teamCatalog'

/** IIHF / catalog alpha-3 → ISO 3166-1 alpha-2 for regional indicator flags. */
const ISO3_TO_ISO2: Record<string, string> = {
  GER: 'DE',
  SWE: 'SE',
  FIN: 'FI',
  NOR: 'NO',
  RUS: 'RU',
  CZE: 'CZ',
  SVK: 'SK',
  HUN: 'HU',
  CAN: 'CA',
  USA: 'US',
  SUI: 'CH',
  FRA: 'FR',
  AUT: 'AT',
  ITA: 'IT',
  LAT: 'LV',
  SLO: 'SI',
  DEN: 'DK',
  GBR: 'GB',
  JPN: 'JP',
  KOR: 'KR',
}

function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function iso2ToFlagEmoji(iso2: string): string {
  const code = iso2.toUpperCase()
  if (code.length !== 2) return ''
  return [...code]
    .map((char) => String.fromCodePoint(0x1f1e6 - 65 + char.charCodeAt(0)))
    .join('')
}

const NATIONAL_IDS = new Set<string>()
const FLAG_BY_ID = new Map<string, string>()
const FLAG_BY_NAME = new Map<string, string>()
const FLAG_BY_SHORT = new Map<string, string>()

for (const teams of Object.values(nationalTeams.seasons || {})) {
  for (const team of teams) {
    NATIONAL_IDS.add(team.id)
    const iso2 = ISO3_TO_ISO2[(team.short || '').toUpperCase()]
    if (!iso2) continue
    const flag = iso2ToFlagEmoji(iso2)
    if (!flag) continue
    FLAG_BY_ID.set(team.id, flag)
    FLAG_BY_NAME.set(normalizeKey(team.name), flag)
    FLAG_BY_SHORT.set(team.short.toUpperCase(), flag)
  }
}

/** Club short codes (e.g. FRA = Löwen Frankfurt) must not resolve to national flags. */
const CLUB_SHORT_CODES = new Set<string>()
for (const team of getAllCatalogTeams()) {
  if (NATIONAL_IDS.has(team.id)) continue
  const short = String(team.short || '').trim().toUpperCase()
  if (short) CLUB_SHORT_CODES.add(short)
}

/** Flag emoji for national teams (catalog id or national team name only). */
export function resolveNationalTeamFlag(nameOrId: string | null | undefined): string | null {
  const raw = String(nameOrId || '').trim()
  if (!raw) return null
  if (FLAG_BY_ID.has(raw)) return FLAG_BY_ID.get(raw) || null
  const byName = FLAG_BY_NAME.get(normalizeKey(raw))
  if (byName) return byName
  const upper = raw.toUpperCase()
  if (FLAG_BY_SHORT.has(upper) && !CLUB_SHORT_CODES.has(upper)) {
    return FLAG_BY_SHORT.get(upper) || null
  }
  return null
}
