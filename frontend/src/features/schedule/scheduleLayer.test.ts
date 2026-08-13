import assert from 'node:assert/strict'
import { buildDevFixtureGames, DEV_FIXTURE_PROVIDER } from '../../dev/devFixtures/games.ts'
import {
  isDummyCatalogGame,
  realCatalogGames,
  resolveScheduleGames,
} from './scheduleLayer.ts'
import type { CatalogGame } from '../../api.ts'

const realGame: CatalogGame = {
  id: 'del:2026_2027:real_ing_aev',
  league_id: 'DEL',
  season_id: '2026/27',
  home_team_id: 'erc_ingolstadt',
  away_team_id: 'augsburger_panther',
  home_team_name: 'ERC Ingolstadt',
  away_team_name: 'Augsburger Panther',
  status: 'scheduled',
  source: { provider: 'penny_del', external_id: '12092026_ing_aev' },
}

const mixed = resolveScheduleGames({
  league: 'DEL',
  season: '2026/27',
  realGames: [realGame],
  devMode: true,
})
assert.equal(mixed.source, 'catalog')
assert.equal(mixed.usingDummyFallback, false)
assert.equal(mixed.games[0].id, realGame.id)
assert.equal(isDummyCatalogGame(mixed.games[0]), false)

const emptyProd = resolveScheduleGames({
  league: 'DEL',
  season: '2027/28',
  realGames: [],
  devMode: false,
  catalogReady: true,
})
assert.equal(emptyProd.source, 'empty')
assert.equal(emptyProd.games.length, 0)

const dummyDev = resolveScheduleGames({
  league: 'DEL',
  season: '2027/28',
  realGames: [],
  devMode: true,
  catalogReady: true,
})
assert.equal(dummyDev.source, 'dev_fixture')
assert.equal(dummyDev.usingDummyFallback, true)
assert.ok(dummyDev.games.length >= 5)
assert.ok(dummyDev.games.every(isDummyCatalogGame))
assert.ok(dummyDev.games.every((game) => game.source?.provider === DEV_FIXTURE_PROVIDER))
assert.ok(dummyDev.games.every((game) => !game.source?.external_id))
assert.ok(dummyDev.games.every((game) => game.id.startsWith('dev:')))

const statuses = new Set(dummyDev.games.map((game) => game.status))
assert.equal(statuses.has('scheduled'), true)
assert.equal(statuses.has('final'), true)
assert.ok(dummyDev.games.some((game) => game.score && game.score.home > game.score.away))
assert.ok(dummyDev.games.some((game) => game.score && game.score.away > game.score.home))
assert.ok(dummyDev.games.some((game) => (game.score?.periods?.length || 0) > 3))
assert.ok(dummyDev.games.some((game) => Boolean(game.stats?.team)))

const leakedDummy: CatalogGame = {
  ...buildDevFixtureGames({ league: 'DEL', season: '2026/27' })[0],
}
assert.equal(realCatalogGames([realGame, leakedDummy]).length, 1)
assert.equal(
  resolveScheduleGames({
    league: 'DEL',
    season: '2026/27',
    realGames: [realGame, leakedDummy],
    devMode: true,
    catalogReady: true,
  }).source,
  'catalog',
)
assert.equal(
  resolveScheduleGames({
    league: 'DEL',
    season: '2027/28',
    realGames: [],
    devMode: true,
    catalogReady: false,
  }).usingDummyFallback,
  false,
)

console.log('scheduleLayer.test.ts ok')
