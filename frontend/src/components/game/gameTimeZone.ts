/** Catalog game clocks are stored as Europe/Berlin wall time (DEL/DEL2/CHL/NHL). */

export const CATALOG_TIME_ZONE = 'Europe/Berlin'

export function resolveViewerTimeZone(): string {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
    return zone || CATALOG_TIME_ZONE
  } catch {
    return CATALOG_TIME_ZONE
  }
}

function parseClock(time?: string): { hours: string; minutes: string } | null {
  const raw = String(time || '').trim().replace(/\s*Uhr$/i, '')
  const match = raw.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null
  return { hours: match[1].padStart(2, '0'), minutes: match[2] }
}

function partsInTimeZone(ms: number, timeZone: string): Record<string, string> {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
  const bag: Record<string, string> = {}
  for (const part of fmt.formatToParts(new Date(ms))) {
    if (part.type !== 'literal') bag[part.type] = part.value
  }
  return bag
}

/**
 * Convert a Europe/Berlin (or other zone) wall clock to absolute UTC ms.
 * Uses Intl iteration so CET/CEST transitions stay correct.
 */
export function wallTimeInZoneToUtcMs(
  date: string,
  time: string,
  timeZone: string = CATALOG_TIME_ZONE,
): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const clock = parseClock(time)
  if (!clock) return null
  const year = Number(date.slice(0, 4))
  const month = Number(date.slice(5, 7))
  const day = Number(date.slice(8, 10))
  const hour = Number(clock.hours)
  const minute = Number(clock.minutes)
  if (![year, month, day, hour, minute].every(Number.isFinite)) return null

  const wantedAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0)
  let ms = wantedAsUtc
  for (let i = 0; i < 4; i += 1) {
    const bag = partsInTimeZone(ms, timeZone)
    const asWallUtc = Date.UTC(
      Number(bag.year),
      Number(bag.month) - 1,
      Number(bag.day),
      Number(bag.hour),
      Number(bag.minute),
      Number(bag.second || '0'),
    )
    const diff = wantedAsUtc - asWallUtc
    if (diff === 0) return ms
    ms += diff
  }
  return ms
}

export function formatClockInTimeZone(
  utcMs: number,
  timeZone: string,
): string {
  return new Intl.DateTimeFormat('de-DE', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(utcMs))
}
