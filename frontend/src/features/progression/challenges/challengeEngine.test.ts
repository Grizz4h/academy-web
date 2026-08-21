/**
 * Challenge engine tests.
 * Run: npx --yes tsx src/features/progression/challenges/challengeEngine.test.ts
 */
import { buildObservationCreatedEvent, buildSceneCreatedEvent, buildSessionCompletedEvent } from '../activityEvents'
import { evaluateChallenges, syncChallengeRotation } from './challengeEngine'
import { eventMatchesRequirement } from './requirementEngine'
import { pickDeterministicIds } from './rotation'
import { getRotationKey } from './time'
import { runContentValidation } from '../../../content/registry'
import { MVP_CHALLENGES } from '../../../content/challenges/mvpChallenges'
import { MVP_CAMPAIGNS, MVP_CHALLENGE_POOLS } from '../../../content/challenges/pools'
import type { ChallengeDefinition } from './types'

function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(label)
}

const daily: ChallengeDefinition = {
  id: 'test_daily_obs',
  type: 'daily',
  title: 'Test Daily',
  description: 'One real observation',
  requirements: [{ id: 'obs', eventType: 'observation_created', target: 1, filters: { requireRealSession: true } }],
  rewards: [{ type: 'pux', amount: 25 }],
  enabled: true,
}

const weekly: ChallengeDefinition = {
  id: 'test_weekly_sessions',
  type: 'weekly',
  title: 'Test Weekly',
  description: 'Three sessions',
  requirements: [{ id: 'sess', eventType: 'session_completed', target: 3, filters: { requireRealSession: true } }],
  rewards: [{ type: 'pux', amount: 100 }, { type: 'xp', amount: 50 }],
  enabled: true,
}

const matchday: ChallengeDefinition = {
  id: 'test_matchday',
  type: 'matchday',
  title: 'Test Matchday',
  description: 'Game A only',
  requirements: [{ id: 'obs', eventType: 'observation_created', target: 1, filters: { gameId: '$matchday', requireRealSession: true } }],
  rewards: [{ type: 'cosmetic', cosmeticId: 'sticker_matchday_first_read' }],
  context: { bindGame: 'today' },
  enabled: true,
}

const pools = [
  { id: 'p_daily', type: 'daily' as const, challengeIds: ['test_daily_obs'], activeCount: 1 },
  { id: 'p_weekly', type: 'weekly' as const, challengeIds: ['test_weekly_sessions'], activeCount: 1 },
]

const now = new Date('2026-08-14T12:00:00')
const matchdayCtx = {
  gameId: 'GAME_A',
  homeTeamId: 'ERC',
  awayTeamId: 'STR',
  startsAt: now.toISOString(),
  phase: 'live' as const,
  game: {
    id: 'GAME_A',
    league_id: 'DEL',
    season_id: '2025/26',
    home_team_id: 'ERC',
    away_team_id: 'STR',
    status: 'live',
    date: '2026-08-14',
  },
}

function evalEvents(events: ReturnType<typeof buildObservationCreatedEvent>[], progress = {}, processed = {}, rotation = undefined as any) {
  return evaluateChallenges({
    events,
    definitions: [daily, weekly, matchday],
    pools,
    progress,
    processedEvents: processed,
    rotation,
    matchday: matchdayCtx,
    unlockedCosmetics: {},
    now,
    userId: 'christoph',
  })
}

{
  const event = buildObservationCreatedEvent({ sessionId: 's1', isDummy: false, occurredAt: now.toISOString() })
  assert(eventMatchesRequirement(event, daily.requirements[0]) === true, 'matching observation counts')
}

{
  const event = buildSceneCreatedEvent({ sceneId: 'sc1', isDummy: false, occurredAt: now.toISOString() })
  assert(eventMatchesRequirement(event, daily.requirements[0]) === false, 'non-matching event ignored')
}

{
  const event = buildObservationCreatedEvent({ sessionId: 'dummy', isDummy: true, occurredAt: now.toISOString() })
  assert(eventMatchesRequirement(event, daily.requirements[0]) === false, 'dummy does not match')
}

{
  const event = buildObservationCreatedEvent({ sessionId: 's1', isDummy: false, occurredAt: now.toISOString() })
  const result = evalEvents([event])
  const item = Object.values(result.progress).find((entry) => entry.challengeId === 'test_daily_obs')
  assert(item?.requirements[0].completed === true, 'target reached completes requirement')
  assert(item?.status === 'completed', 'challenge completed')
  assert(result.grantedPux === 25, 'reward granted once')
}

{
  const first = buildSessionCompletedEvent({
    sessionId: 'a',
    drillId: 'D1',
    trackId: 'C1',
    isDummy: false,
    occurredAt: now.toISOString(),
  })
  const second = buildSessionCompletedEvent({
    sessionId: 'b',
    drillId: 'D2',
    trackId: 'C1',
    isDummy: false,
    occurredAt: now.toISOString(),
  })
  const result = evalEvents([first, second])
  const item = Object.values(result.progress).find((entry) => entry.challengeId === 'test_weekly_sessions')
  assert(item?.status !== 'completed', '2/3 not complete')
  assert(item?.requirements[0].current === 2, 'weekly progress 2')
}

{
  const events = [1, 2, 3].map((n) =>
    buildSessionCompletedEvent({
      sessionId: `s${n}`,
      drillId: `D${n}`,
      trackId: 'C1',
      isDummy: false,
      occurredAt: now.toISOString(),
    }),
  )
  const first = evalEvents(events)
  const item = Object.values(first.progress).find((entry) => entry.challengeId === 'test_weekly_sessions')
  assert(item?.status === 'completed', '3/3 completes weekly')
  const second = evalEvents(events, first.progress, Object.fromEntries(first.processedEventIds.map((id) => [id, true])), first.rotation)
  assert(second.grantedPux === 0 && second.grantedXp === 0, 'reload does not double grant')
}

{
  const event = buildObservationCreatedEvent({ sessionId: 's1', isDummy: false, occurredAt: now.toISOString() })
  const first = evalEvents([event])
  const replay = evalEvents([event], first.progress, Object.fromEntries(first.processedEventIds.map((id) => [id, true])), first.rotation)
  assert(replay.grantedPux === 0, 'event replay does not double grant')
}

{
  const key = getRotationKey('daily', now)
  const a = pickDeterministicIds({ poolId: 'p', rotationKey: key, candidateIds: ['a', 'b', 'c'], count: 2, userId: 'u' })
  const b = pickDeterministicIds({ poolId: 'p', rotationKey: key, candidateIds: ['a', 'b', 'c'], count: 2, userId: 'u' })
  assert(a.join() === b.join(), 'same day same rotation')
  const nextDay = pickDeterministicIds({
    poolId: 'p',
    rotationKey: getRotationKey('daily', new Date('2026-08-15T12:00:00')),
    candidateIds: ['a', 'b', 'c'],
    count: 2,
    userId: 'u',
  })
  assert(Array.isArray(nextDay) && nextDay.length === 2, 'new day still selects')
}

{
  const weekA = pickDeterministicIds({
    poolId: 'w',
    rotationKey: getRotationKey('weekly', new Date('2026-08-10T12:00:00')),
    candidateIds: ['a', 'b', 'c'],
    count: 2,
    userId: 'u',
  })
  const weekB = pickDeterministicIds({
    poolId: 'w',
    rotationKey: getRotationKey('weekly', new Date('2026-08-12T12:00:00')),
    candidateIds: ['a', 'b', 'c'],
    count: 2,
    userId: 'u',
  })
  assert(weekA.join() === weekB.join(), 'same ISO week same weekly rotation')
}

{
  const hit = buildObservationCreatedEvent({ sessionId: 's1', gameId: 'GAME_A', isDummy: false, occurredAt: now.toISOString() })
  const miss = buildObservationCreatedEvent({ sessionId: 's2', gameId: 'GAME_B', isDummy: false, occurredAt: now.toISOString() })
  const first = evalEvents([miss])
  const matchItem = Object.values(first.progress).find((entry) => entry.challengeId === 'test_matchday')
  assert((matchItem?.requirements[0].current || 0) === 0, 'other game does not count')
  const second = evalEvents([hit], first.progress, {}, first.rotation)
  const after = Object.values(second.progress).find((entry) => entry.challengeId === 'test_matchday')
  assert(after?.requirements[0].completed === true, 'matching gameId counts')
}

{
  const synced = syncChallengeRotation({
    definitions: [daily],
    pools,
    progress: {},
    matchday: null,
    now,
    userId: 'u',
  })
  const instance = Object.values(synced.progress)[0]
  const expired = evaluateChallenges({
    events: [buildObservationCreatedEvent({ sessionId: 'late', isDummy: false, occurredAt: now.toISOString() })],
    definitions: [daily],
    pools,
    progress: { [instance.instanceKey]: { ...instance, status: 'expired' } },
    processedEvents: {},
    rotation: synced.rotation,
    matchday: null,
    unlockedCosmetics: {},
    now,
    userId: 'u',
  })
  const after = expired.progress[instance.instanceKey]
  assert(after.status === 'expired', 'expired stays expired')
  assert(after.requirements[0].current === 0, 'expired gets no progress')
}

{
  const issues = runContentValidation()
  const errors = issues.filter((item) => item.severity === 'error')
  assert(errors.length === 0, `mvp content has no errors: ${errors.map((item) => item.message).join('; ')}`)
  assert(MVP_CHALLENGES.length >= 5, 'mvp challenges exist')
  assert(MVP_CHALLENGE_POOLS.length === 2, 'daily and weekly pools')
  assert(MVP_CAMPAIGNS.some((item) => item.enabled === false), 'campaign stub is inactive')
  const wasteland = MVP_CHALLENGES.find((item) => item.id === 'challenge_collection_survive_the_shift')
  assert(Boolean(wasteland), 'wasteland collection challenge exists')
  assert(wasteland?.enabled === false, 'wasteland collection is parked until the set is redesigned')
  const iceCut = MVP_CHALLENGES.find((item) => item.id === 'challenge_collection_ice_cut')
  assert(Boolean(iceCut), 'zamboni ice cut challenge exists')
  assert(iceCut?.enabled === true, 'zamboni ice cut is live')
  assert(iceCut?.collectionId === 'zamboni', 'ice cut belongs to zamboni')
}

const homeIce = MVP_CHALLENGES.find((item) => item.id === 'challenge_matchday_home_ice')
const onTheRoad = MVP_CHALLENGES.find((item) => item.id === 'challenge_matchday_on_the_road')
const firstVisit = MVP_CHALLENGES.find((item) => item.id === 'challenge_matchday_first_visit')
assert(Boolean(homeIce && onTheRoad && firstVisit), 'location matchday challenges exist')

function evalLocation(events: ReturnType<typeof buildSessionCompletedEvent>[], progress = {}, processed = {}, rotation = undefined as any) {
  return evaluateChallenges({
    events,
    definitions: [homeIce!, onTheRoad!, firstVisit!],
    pools: [],
    progress,
    processedEvents: processed,
    rotation,
    matchday: matchdayCtx,
    unlockedCosmetics: {},
    now,
    userId: 'christoph',
  })
}

{
  const homeEvent = buildSessionCompletedEvent({
    sessionId: 'loc-home',
    drillId: 'D1',
    trackId: 'C1',
    gameId: 'GAME_A',
    venueId: 'venue.del.saturn_arena',
    venueVerified: true,
    homeAwayRole: 'home',
    isFirstVenueVisit: true,
    isDummy: false,
    occurredAt: now.toISOString(),
  })
  const result = evalLocation([homeEvent])
  const home = Object.values(result.progress).find((entry) => entry.challengeId === 'challenge_matchday_home_ice')
  const away = Object.values(result.progress).find((entry) => entry.challengeId === 'challenge_matchday_on_the_road')
  const first = Object.values(result.progress).find((entry) => entry.challengeId === 'challenge_matchday_first_visit')
  assert(home?.status === 'completed', 'home role completes HOME ICE')
  assert(away?.status !== 'completed', 'home role does not complete ON THE ROAD')
  assert(first?.status === 'completed', 'first verified visit completes FIRST VISIT')
}

{
  const awayEvent = buildSessionCompletedEvent({
    sessionId: 'loc-away',
    drillId: 'D1',
    trackId: 'C1',
    gameId: 'GAME_A',
    venueId: 'venue.del.saturn_arena',
    venueVerified: true,
    homeAwayRole: 'away',
    isFirstVenueVisit: false,
    isDummy: false,
    occurredAt: now.toISOString(),
  })
  const result = evalLocation([awayEvent])
  const home = Object.values(result.progress).find((entry) => entry.challengeId === 'challenge_matchday_home_ice')
  const away = Object.values(result.progress).find((entry) => entry.challengeId === 'challenge_matchday_on_the_road')
  assert(away?.status === 'completed', 'away role completes ON THE ROAD')
  assert(home?.status !== 'completed', 'away role does not complete HOME ICE')
}

{
  const insideNoGame = buildSessionCompletedEvent({
    sessionId: 'no-game',
    drillId: 'D1',
    trackId: 'C1',
    venueId: 'venue.del.saturn_arena',
    venueVerified: true,
    homeAwayRole: 'home',
    isDummy: false,
    occurredAt: now.toISOString(),
  })
  const result = evalLocation([insideNoGame])
  const home = Object.values(result.progress).find((entry) => entry.challengeId === 'challenge_matchday_home_ice')
  assert(home?.status !== 'completed', 'inside venue without game context does not grant')
}

{
  const wrongGame = buildSessionCompletedEvent({
    sessionId: 'wrong-game',
    drillId: 'D1',
    trackId: 'C1',
    gameId: 'GAME_B',
    venueId: 'venue.del.saturn_arena',
    venueVerified: true,
    homeAwayRole: 'home',
    isDummy: false,
    occurredAt: now.toISOString(),
  })
  const result = evalLocation([wrongGame])
  const home = Object.values(result.progress).find((entry) => entry.challengeId === 'challenge_matchday_home_ice')
  assert(home?.status !== 'completed', 'wrong game does not grant')
}

{
  const event = buildSessionCompletedEvent({
    sessionId: 'idem',
    drillId: 'D1',
    trackId: 'C1',
    gameId: 'GAME_A',
    venueId: 'venue.del.saturn_arena',
    venueVerified: true,
    homeAwayRole: 'home',
    isDummy: false,
    occurredAt: now.toISOString(),
  })
  const first = evalLocation([event])
  const replay = evalLocation(
    [event],
    first.progress,
    Object.fromEntries(first.processedEventIds.map((id) => [id, true])),
    first.rotation,
  )
  assert(first.grantedPux > 0, 'first grant pays')
  assert(replay.grantedPux === 0, 'same user+game does not double grant')
}

{
  const dummy = buildSessionCompletedEvent({
    sessionId: 'dummy-loc',
    drillId: 'D1',
    trackId: 'C1',
    gameId: 'GAME_A',
    venueId: 'venue.del.saturn_arena',
    venueVerified: true,
    homeAwayRole: 'home',
    isDummy: true,
    occurredAt: now.toISOString(),
  })
  const result = evalLocation([dummy])
  assert(result.grantedPux === 0, 'dummy session does not earn location rewards')
}

{
  const unverified = buildSessionCompletedEvent({
    sessionId: 'denied',
    drillId: 'D1',
    trackId: 'C1',
    gameId: 'GAME_A',
    homeAwayRole: 'home',
    venueVerified: false,
    isDummy: false,
    occurredAt: now.toISOString(),
  })
  const result = evalLocation([unverified])
  const home = Object.values(result.progress).find((entry) => entry.challengeId === 'challenge_matchday_home_ice')
  assert(home?.status !== 'completed', 'permission denied / unverified still allows the drill but no location reward')
}

console.log('challengeEngine.test.ts: all assertions passed')
