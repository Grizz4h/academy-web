import { RINQ_CONTACT_EMAIL } from '../legal'
import type { SharePayload } from '../../utils/share'
import { wannIstManZuAltUmAnfaengerZuSein } from './columns/wann-ist-man-zu-alt-um-anfaenger-zu-sein'
import { OFF_THE_RINK_SUBTITLE, OFF_THE_RINK_TITLE, type OffTheRinkColumn } from './types'

export type { OffTheRinkBlock, OffTheRinkColumn } from './types'
export {
  OFF_THE_RINK_ABOUT,
  OFF_THE_RINK_AUTHOR,
  OFF_THE_RINK_PATH,
  OFF_THE_RINK_SUBTITLE,
  OFF_THE_RINK_TITLE,
} from './types'

/** Add new columns here. Newest first is derived from `date` / `number`. */
const OFF_THE_RINK_COLUMNS: OffTheRinkColumn[] = [wannIstManZuAltUmAnfaengerZuSein]

export type OffTheRinkYearGroup = {
  year: string
  columns: OffTheRinkColumn[]
}

export function getOffTheRinkColumns(): OffTheRinkColumn[] {
  return [...OFF_THE_RINK_COLUMNS].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return b.number - a.number
  })
}

export function getOffTheRinkColumn(slug: string): OffTheRinkColumn | undefined {
  return OFF_THE_RINK_COLUMNS.find((column) => column.slug === slug)
}

export function offTheRinkColumnPath(slug: string): string {
  return `/off-the-rink/${slug}`
}

export function formatColumnNumber(number: number): string {
  return `#${String(number).padStart(3, '0')}`
}

export function formatColumnDate(isoDate: string): string {
  const parsed = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return isoDate
  return parsed.toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatReadingTime(minutes: number): string {
  return `${minutes} Min. Lesezeit`
}

export function groupColumnsByYear(
  columns: OffTheRinkColumn[] = getOffTheRinkColumns(),
): OffTheRinkYearGroup[] {
  const groups = new Map<string, OffTheRinkColumn[]>()
  for (const column of columns) {
    const year = column.date.slice(0, 4)
    const bucket = groups.get(year) ?? []
    bucket.push(column)
    groups.set(year, bucket)
  }
  return [...groups.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([year, items]) => ({ year, columns: items }))
}

export function getAdjacentColumns(
  slug: string,
  columns: OffTheRinkColumn[] = getOffTheRinkColumns(),
): { older?: OffTheRinkColumn; newer?: OffTheRinkColumn } {
  const index = columns.findIndex((column) => column.slug === slug)
  if (index < 0) return {}
  return {
    newer: columns[index - 1],
    older: columns[index + 1],
  }
}

export function isLatestColumn(
  slug: string,
  columns: OffTheRinkColumn[] = getOffTheRinkColumns(),
): boolean {
  return columns[0]?.slug === slug
}

export function offTheRinkAbsoluteUrl(path: string, origin?: string): string {
  const base =
    origin ||
    (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base}${path}`
}

export function buildHubSharePayload(url: string): SharePayload {
  return {
    title: OFF_THE_RINK_TITLE,
    text: OFF_THE_RINK_SUBTITLE,
    url,
  }
}

export function buildColumnSharePayload(column: OffTheRinkColumn, url: string): SharePayload {
  return {
    title: `${column.title} · ${OFF_THE_RINK_TITLE}`,
    text: column.teaser,
    url,
  }
}

export function buildHubMailto(): string {
  const subject = encodeURIComponent(OFF_THE_RINK_TITLE)
  return `mailto:${RINQ_CONTACT_EMAIL}?subject=${subject}`
}

export function buildColumnMailto(column: Pick<OffTheRinkColumn, 'number' | 'title'>): string {
  const subject = encodeURIComponent(
    `${OFF_THE_RINK_TITLE} · ${formatColumnNumber(column.number)} · ${column.title}`,
  )
  const body = encodeURIComponent(`Zu dieser Kolumne:\n${column.title}\n\n`)
  return `mailto:${RINQ_CONTACT_EMAIL}?subject=${subject}&body=${body}`
}

export function resolveColumnImageUrl(column: OffTheRinkColumn, origin?: string): string | undefined {
  if (!column.image) return undefined
  if (/^https?:\/\//i.test(column.image)) return column.image
  return offTheRinkAbsoluteUrl(column.image, origin)
}
