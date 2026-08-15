/** Local calendar helpers — same convention as gameCatalogUtils. Storage stays UTC ISO. */

export function localDateKey(now: Date = new Date()): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isoWeekKey(now: Date = new Date()): string {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7))
  const week1 = new Date(date.getFullYear(), 0, 4)
  const week = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  return `${date.getFullYear()}-W${String(week).padStart(2, '0')}`
}

export function getRotationKey(kind: 'daily' | 'weekly', now: Date = new Date()): string {
  return kind === 'daily' ? `daily:${localDateKey(now)}` : `weekly:${isoWeekKey(now)}`
}

export function isWithinWindow(startsAt: string | undefined, endsAt: string | undefined, now: Date): boolean {
  const ts = now.getTime()
  if (startsAt) {
    const start = Date.parse(startsAt)
    if (!Number.isNaN(start) && ts < start) return false
  }
  if (endsAt) {
    const end = Date.parse(endsAt)
    if (!Number.isNaN(end) && ts > end) return false
  }
  return true
}

export function eventLocalDateKey(occurredAt: string): string {
  const parsed = new Date(occurredAt)
  if (Number.isNaN(parsed.getTime())) return occurredAt.slice(0, 10)
  return localDateKey(parsed)
}

export function eventIsoWeekKey(occurredAt: string): string {
  const parsed = new Date(occurredAt)
  if (Number.isNaN(parsed.getTime())) return isoWeekKey(new Date())
  return isoWeekKey(parsed)
}
