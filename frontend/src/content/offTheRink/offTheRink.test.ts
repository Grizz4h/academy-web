import assert from 'node:assert/strict'
import { getPublicNavTabs } from '../../config/featureFlags.ts'
import { RINQ_CONTACT_EMAIL } from '../legal.ts'
import {
  buildColumnMailto,
  buildColumnSharePayload,
  buildHubMailto,
  buildHubSharePayload,
  formatColumnDate,
  formatColumnNumber,
  formatReadingTime,
  getAdjacentColumns,
  getOffTheRinkColumn,
  getOffTheRinkColumns,
  groupColumnsByYear,
  isLatestColumn,
  offTheRinkAbsoluteUrl,
  offTheRinkColumnPath,
  resolveColumnImageUrl,
} from './index.ts'
import type { OffTheRinkColumn } from './types.ts'

const columns = getOffTheRinkColumns()
assert.ok(columns.length >= 1, 'at least one column')

const first = columns[0]
assert.equal(first.slug, 'wann-ist-man-zu-alt-um-anfaenger-zu-sein')
assert.equal(first.number, 1)
assert.equal(first.date, '2026-08-31')
assert.equal(first.readingTime, 6)
assert.ok(first.teaser.length > 40, 'teaser present')
assert.ok(first.content.length > 4, 'article body present')
assert.ok(
  first.content.every((block) => block.text.trim().length > 0),
  'no empty blocks',
)
if (first.image) {
  assert.ok(first.imageAlt && first.imageAlt.trim().length > 0, 'image needs alt text')
}

assert.equal(formatColumnNumber(1), '#001')
assert.equal(formatColumnDate('2026-08-31'), '31. August 2026')
assert.equal(formatReadingTime(6), '6 Min. Lesezeit')
assert.equal(
  offTheRinkColumnPath(first.slug),
  '/off-the-rink/wann-ist-man-zu-alt-um-anfaenger-zu-sein',
)
assert.equal(getOffTheRinkColumn(first.slug)?.title, first.title)
assert.equal(getOffTheRinkColumn('does-not-exist'), undefined)

const slugs = new Set(columns.map((column) => column.slug))
assert.equal(slugs.size, columns.length, 'unique slugs')

assert.equal(isLatestColumn(first.slug), true)
assert.equal(isLatestColumn('missing'), false)

const years = groupColumnsByYear(columns)
assert.equal(years[0]?.year, '2026')
assert.ok(years[0]?.columns.some((column) => column.slug === first.slug))

const alone = getAdjacentColumns(first.slug, columns)
assert.equal(alone.older, undefined)
assert.equal(alone.newer, undefined)

const older: OffTheRinkColumn = {
  ...first,
  slug: 'aeltere-kolumne',
  number: 0,
  title: 'Ältere',
  date: '2025-01-01',
}
const newer: OffTheRinkColumn = {
  ...first,
  slug: 'neuere-kolumne',
  number: 2,
  title: 'Neuere',
  date: '2026-09-01',
}
const ordered = [newer, first, older]
const mid = getAdjacentColumns(first.slug, ordered)
assert.equal(mid.newer?.slug, 'neuere-kolumne')
assert.equal(mid.older?.slug, 'aeltere-kolumne')

const yearGroups = groupColumnsByYear(ordered)
assert.deepEqual(
  yearGroups.map((group) => group.year),
  ['2026', '2025'],
)

assert.equal(offTheRinkAbsoluteUrl('/off-the-rink', 'https://rinq-tank.de'), 'https://rinq-tank.de/off-the-rink')
assert.equal(
  resolveColumnImageUrl({ ...first, image: '/img.jpg' }, 'https://rinq-tank.de'),
  'https://rinq-tank.de/img.jpg',
)
assert.equal(
  resolveColumnImageUrl({ ...first, image: 'https://cdn.example/a.jpg' }, 'https://rinq-tank.de'),
  'https://cdn.example/a.jpg',
)

const hubShare = buildHubSharePayload('https://rinq-tank.de/off-the-rink')
assert.equal(hubShare.title, 'OFF THE RINK')
assert.ok(hubShare.url?.includes('/off-the-rink'))

const columnShare = buildColumnSharePayload(first, 'https://rinq-tank.de/off-the-rink/x')
assert.ok(columnShare.title.includes(first.title))
assert.equal(columnShare.text, first.teaser)

const hubMail = buildHubMailto()
assert.ok(hubMail.startsWith(`mailto:${RINQ_CONTACT_EMAIL}`))
assert.ok(hubMail.includes('OFF%20THE%20RINK') || hubMail.includes('OFF THE RINK') || hubMail.includes('subject='))

const columnMail = buildColumnMailto(first)
assert.ok(columnMail.startsWith(`mailto:${RINQ_CONTACT_EMAIL}`))
assert.ok(columnMail.includes('001'))

const publicTabs = getPublicNavTabs()
assert.equal(
  publicTabs.some((tab) => tab.to === '/off-the-rink'),
  false,
  'hidden without creator mode',
)
const creatorTabs = getPublicNavTabs({ creatorMode: true })
assert.equal(
  creatorTabs.some((tab) => tab.to === '/off-the-rink'),
  true,
  'visible with creator mode',
)
assert.equal(
  creatorTabs.some((tab) => tab.to === '/ringabout'),
  true,
  'rink about it still visible with creator mode',
)
