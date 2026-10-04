import assert from 'node:assert/strict'
import { formatGameStatusLabel, inferCurrentMatchday } from './gameCatalogUtils.ts'
import type { CatalogGame } from '../../api'

const pastScheduled: CatalogGame = {
  id: 'del:2026_2027:stub',
  league_id: 'DEL',
  season_id: '2026/27',
  date: '2026-09-17',
  time: '19:30',
  home_team_id: 'eisbaren_berlin',
  away_team_id: 'straubing_tigers',
  home_team_name: 'Eisbären Berlin',
  away_team_name: 'Straubing Tigers',
  status: 'scheduled',
  matchday: 1,
}

assert.equal(formatGameStatusLabel(pastScheduled, false), 'Beendet')
assert.equal(formatGameStatusLabel(pastScheduled, true), 'Gespielt')

const withScore: CatalogGame = {
  ...pastScheduled,
  status: 'final',
  score: { home: 4, away: 2 },
}
assert.equal(formatGameStatusLabel(withScore, false), '4:2')
assert.equal(formatGameStatusLabel(withScore, true), 'Gespielt')

// TEMPORARY DEL 2026/27: vorgezogener Spieltag 31 darf Current-Matchday nicht kapern.
const delGames: CatalogGame[] = [
  { ...pastScheduled, id: 'md5', matchday: 5, date: '2026-10-02' },
  { ...pastScheduled, id: 'md6', matchday: 6, date: '2026-10-04' },
  { ...pastScheduled, id: 'md31-early', matchday: 31, date: '2026-09-22' },
]
assert.equal(inferCurrentMatchday(delGames, { today: '2026-10-03' }), 5)
assert.equal(inferCurrentMatchday(delGames, { today: '2026-10-05' }), 6)

const otherSeason: CatalogGame[] = delGames.map((game) => ({ ...game, season_id: '2025/26' }))
assert.equal(inferCurrentMatchday(otherSeason, { today: '2026-10-03' }), 31)

console.log('gameCatalogUtils status label tests OK')
