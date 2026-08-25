/**
 * Lightweight assert suite for progression foundation.
 * Run: npx --yes tsx src/features/progression/progressionEngine.test.ts
 */

import { buildSessionCompletedEvent, buildSceneCreatedEvent } from './activityEvents'
import { bootstrapProgression, BOOTSTRAP_EVENT_ID } from './bootstrap'
import { getLevelFromXp, getXpProgressForLevel, levelsGainedBetween, xpRequiredForLevel } from './levelSystem'
import { getLevelFromXpLegacy, migrateProgressionCurve, getXpProgressForLevel as progressWithFloor } from './levelCurve'
import { processActivityEvent, processActivityEventBatch } from './progressionEngine'
import { evaluateAchievementProgress } from './achievements/achievementEngine'
import { getTankAchievement } from './achievements/achievementCatalog'
import type { ProgressionStateSlice } from './progressionEngine'
import type { Session } from '../../api'

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const left = JSON.stringify(actual)
  const right = JSON.stringify(expected)
  if (left !== right) {
    throw new Error(`${label}\n  expected: ${right}\n  actual:   ${left}`)
  }
}

function assert(condition: boolean, label: string) {
  if (!condition) throw new Error(label)
}

function emptySlice(): ProgressionStateSlice {
  return {
    xp: 0,
    unlockedAchievements: {},
    unlockedCosmetics: {},
    processedEvents: {},
    activityLog: [],
    unlockHistory: [],
  }
}

// Level curve (capped table v2)
assertEqual(getLevelFromXp(0), 1, 'level at 0 xp')
assertEqual(getLevelFromXp(100), 2, 'level 2 at 100 xp')
assertEqual(getLevelFromXp(1200), 5, 'level 5 at ~12 units')
assertEqual(levelsGainedBetween(0, 500).includes(2), true, 'multi level gain includes 2')
const progress = getXpProgressForLevel(50)
assert(progress.xpToNextLevel > 0, 'xp to next level positive')
assertEqual(xpRequiredForLevel(25), 1000, 'cap 10 units per level from 25')

// Grandfathering keeps displayed level when legacy curve was higher
{
  const xp = 355
  const oldLevel = getLevelFromXpLegacy(xp)
  const newLevel = getLevelFromXp(xp)
  assert(oldLevel > newLevel, 'legacy curve ranks higher at same xp')
  const migrated = migrateProgressionCurve({ xp })
  const view = progressWithFloor(xp, { grandfatherFloor: migrated.levelGrandfatherFloor })
  assertEqual(view.level, oldLevel, 'display level grandfathered')
  assertEqual(view.xpIntoLevel, 0, 'grandfathered users start at 0 progress in held level')
}

// Dummy session grants nothing
{
  const event = buildSessionCompletedEvent({
    sessionId: 'dummy-1',
    drillId: 'C1_D1',
    trackId: 'C1',
    isDummy: true,
  })
  const result = processActivityEvent(emptySlice(), event)
  assertEqual(result.grantedXp, 0, 'dummy xp')
  assertEqual(result.unlockedAchievements.length, 0, 'dummy achievements')
}

// First real session + idempotency
{
  let slice = emptySlice()
  const event = buildSessionCompletedEvent({
    sessionId: 's1',
    drillId: 'C1_D1',
    trackId: 'C1',
    isFirstSessionOfDrill: true,
    observedTeamId: 'team_a',
    leagueId: 'DEL',
  })
  const first = processActivityEvent(slice, event)
  assert(first.grantedXp >= 100, 'session xp')
  assert(first.unlockedAchievements.some((item) => item.achievementId === 'first_shift'), 'first_shift unlock')

  slice = {
    ...slice,
    xp: first.nextXp,
    unlockedAchievements: Object.fromEntries(
      first.unlockedAchievements.map((item) => [
        item.achievementId,
        { id: item.achievementId, unlockedAt: item.unlockedAt, sourceEventId: item.sourceEventId },
      ]),
    ),
    unlockedCosmetics: Object.fromEntries(
      first.unlockedCosmetics.map((item) => [item.cosmeticId, item]),
    ),
    processedEvents: {
      [event.id]: {
        eventId: event.id,
        processedAt: first.evaluatedAt,
        grantedXp: first.grantedXp,
        grantedPux: first.grantedPux,
      },
    },
    activityLog: first.activityEventsAppended,
    unlockHistory: first.unlockHistory,
  }

  const second = processActivityEvent(slice, event)
  assertEqual(second.alreadyProcessed, true, 'idempotent replay')
  assertEqual(second.grantedXp, 0, 'no double xp')
}

// Scene creation
{
  const event = buildSceneCreatedEvent({ sceneId: 'scene-1' })
  const result = processActivityEvent(emptySlice(), event)
  assert(result.grantedXp >= 20, 'scene xp')
  assert(result.unlockedAchievements.some((item) => item.achievementId === 'first_clip'), 'first_clip')
}

// Mixed real + dummy batch
{
  const events = [
    buildSessionCompletedEvent({
      sessionId: 'real-1',
      drillId: 'D3_D1',
      trackId: 'D3',
      tags: ['blue_line'],
      mechanicIds: ['rink_corridor_observation'],
      isFirstSessionOfDrill: true,
    }),
    buildSessionCompletedEvent({
      sessionId: 'dummy-2',
      drillId: 'D3_D1',
      trackId: 'D3',
      isDummy: true,
    }),
  ]
  const { aggregate } = processActivityEventBatch(emptySlice(), events)
  assert(aggregate.grantedXp > 0, 'mixed batch grants from real only')
  assertEqual(
    aggregate.activityEventsAppended.some((event) => event.id.includes('dummy-2')),
    false,
    'dummy not appended as rewarded activity',
  )
}

// Secret achievement progress hidden until unlock conceptually (engine still computes)
{
  const def = getTankAchievement('no_idea_yet')!
  const events = Array.from({ length: 5 }, (_, index) =>
    buildSessionCompletedEvent({
      sessionId: `unclear-${index}`,
      drillId: `D2_D${index}`,
      trackId: 'D2',
      tags: ['unclear'],
    }),
  )
  const progressSecret = evaluateAchievementProgress(def, events)
  assertEqual(progressSecret.met, true, 'unclear achievement met')
}

{
  const def = getTankAchievement('ice_reader')!
  assert(Boolean(def), 'ice_reader catalog entry exists')
  const locked = evaluateAchievementProgress(def, [
    buildSessionCompletedEvent({
      sessionId: 'e4-d1',
      drillId: 'E4_D1',
      trackId: 'E4',
      mechanicIds: ['anticipation_read'],
    }),
  ])
  assertEqual(locked.met, false, 'ice_reader locked without profile mechanic')
  const unlocked = evaluateAchievementProgress(def, [
    buildSessionCompletedEvent({
      sessionId: 'e4-d5',
      drillId: 'E4_D5',
      trackId: 'E4',
      mechanicIds: ['anticipation_profile'],
    }),
  ])
  assertEqual(unlocked.met, true, 'ice_reader unlocks from anticipation_profile')
}

// Bootstrap from historical sessions excludes dummy
{
  const sessions = [
    {
      id: 'hist-1',
      user: 't',
      module_id: 'C1_D1',
      goal: '',
      confidence: 1,
      state: 'COMPLETED',
      created_at: '2026-01-01T10:00:00.000Z',
      drills: [],
      progress: { current_drill_index: 0, completed_drills: [] },
      checkins: [],
      post: { summary: '', helpfulness: 0, completed_at: '2026-01-01T11:00:00.000Z' },
      game_info: { team_home: 'A', team_away: 'B', date: '2026-01-01', league: 'DEL' },
    },
    {
      id: 'hist-dummy',
      user: 't',
      module_id: 'C1_D1',
      goal: '',
      confidence: 1,
      state: 'COMPLETED',
      created_at: '2026-01-02T10:00:00.000Z',
      drills: [],
      progress: { current_drill_index: 0, completed_drills: [] },
      checkins: [],
      post: { summary: '', helpfulness: 0, completed_at: '2026-01-02T11:00:00.000Z' },
      game_info: { team_home: 'A', team_away: 'B', date: '2026-01-02', league: 'DEL' },
      is_dummy: true,
    },
  ] as Session[]

  const result = bootstrapProgression({
    sessions,
    scenes: [],
    existing: emptySlice(),
  })
  assertEqual(result.skipped, false, 'bootstrap runs')
  assert(result.state.xp >= 100, 'retroactive xp')
  assert(Boolean(result.state.processedEvents[BOOTSTRAP_EVENT_ID]), 'bootstrap marked')
  assertEqual(result.state.activityLog.some((event) => event.id.includes('hist-dummy')), false, 'no dummy in log')

  const again = bootstrapProgression({
    sessions,
    scenes: [],
    existing: result.state,
  })
  assertEqual(again.skipped, true, 'bootstrap idempotent')
}

console.log('progressionEngine.test.ts: all assertions passed')
