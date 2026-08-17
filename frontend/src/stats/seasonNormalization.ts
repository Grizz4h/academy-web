const SPLIT_SEASON_LEAGUES = new Set(['DEL', 'DEL2', 'NHL', 'CHL', 'U20_DNL'])
const TOURNAMENT_YEAR_LEAGUES = new Set(['WM', 'OLYMPIA', 'NATIONALMANNSCHAFTEN'])

export const SEASON_OPTIONS = ['2025/26', '2026/27', '2027/28']
export const TOURNAMENT_YEAR_OPTIONS = ['2024', '2025', '2026', '2027', '2028']

/** Session-Setup: DEL startet auf der aktuellen Saison, nicht auf dem Archiv. */
export const DEFAULT_DEL_SETUP_SEASON = '2026/27'

export function defaultDelSetupSeason(seasonOptions: string[] = SEASON_OPTIONS): string {
  if (seasonOptions.includes(DEFAULT_DEL_SETUP_SEASON)) return DEFAULT_DEL_SETUP_SEASON
  const inferred = inferSplitSeasonLabelForDate()
  if (seasonOptions.includes(inferred)) return inferred
  return seasonOptions[0] || DEFAULT_DEL_SETUP_SEASON
}

/** Split-Saison (z. B. DEL): Jul–Jun → „2025/26“. */
export function inferSplitSeasonLabelForDate(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const startYear = month >= 7 ? year : year - 1
  const endTwo = String((startYear + 1) % 100).padStart(2, '0')
  return `${startYear}/${endTwo}`
}

function parseYearToken(token?: string): number | null {
  if (!token) return null
  const clean = token.trim()
  if (!clean) return null
  if (!/^\d{2,4}$/.test(clean)) return null

  const numeric = Number.parseInt(clean, 10)
  if (!Number.isFinite(numeric)) return null

  if (clean.length === 4) {
    return numeric >= 1900 && numeric <= 2100 ? numeric : null
  }

  if (clean.length === 2) {
    return numeric <= 69 ? 2000 + numeric : 1900 + numeric
  }

  return null
}

function extractYear(raw: string): number | null {
  const fourDigit = raw.match(/(?:19|20)\d{2}/)
  if (fourDigit) return parseYearToken(fourDigit[0])

  const twoDigit = raw.match(/\d{2}/)
  if (twoDigit) return parseYearToken(twoDigit[0])

  return null
}

export function isSplitSeasonLeague(league?: string): boolean {
  return SPLIT_SEASON_LEAGUES.has((league || '').trim().toUpperCase())
}

export function normalizeSeasonValue(rawSeason?: string, league?: string): string | null {
  if (!rawSeason) return null
  const raw = rawSeason.trim()
  if (!raw) return null

  const upperLeague = (league || '').trim().toUpperCase()
  const upperRaw = raw.toUpperCase()
  const shouldUseYearOnly =
    TOURNAMENT_YEAR_LEAGUES.has(upperLeague) ||
    upperRaw.includes('WM') ||
    upperRaw.includes('OLYMPIA')

  if (shouldUseYearOnly) {
    const year = extractYear(raw)
    return year ? String(year) : null
  }

  const range = raw.match(/(\d{2,4})\s*[\-/]\s*(\d{2,4})/)
  if (range) {
    const startYear = parseYearToken(range[1])
    const endYearRaw = parseYearToken(range[2])
    if (!startYear) return null

    const endYear = endYearRaw ?? startYear + 1
    const endTwoDigits = String(endYear % 100).padStart(2, '0')
    return `${startYear}/${endTwoDigits}`
  }

  // Fallback for values like "2026" in split-season leagues.
  if (isSplitSeasonLeague(league)) {
    const year = extractYear(raw)
    if (!year) return null
    return `${year}/${String((year + 1) % 100).padStart(2, '0')}`
  }

  const year = extractYear(raw)
  return year ? String(year) : null
}
