import assert from 'node:assert/strict'
import { formatGameStatusLabel } from './gameCatalogUtils.ts'
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

console.log('gameCatalogUtils status label tests OK')
