import assert from 'node:assert/strict'
import type { Session } from '../../api.ts'
import type { StoredAiReflection } from './types.ts'
import {
  buildPastDrillRecap,
  findPastSessionsForDrill,
  formatSessionMatchup,
  isSameMatchup,
} from './pastDrillSessions.ts'

function reflection(focus: string, cautions: string[] = []): StoredAiReflection {
  return {
    id: `ref-${focus}`,
    sessionId: 's',
    createdAt: '2026-03-12T18:00:00.000Z',
    provider: 'openai',
    model: 'test',
    promptVersion: 'v1',
    content: {
      strengths: [],
      cautions,
      nextObservationFocus: focus,
      summary: 'summary',
    },
  }
}

function session(overrides: Partial<Session> & { id: string; created_at: string }): Session {
  return {
    user: 'Christoph',
    module_id: 'm1',
    goal: '',
    confidence: 3,
    state: 'COMPLETED',
    drills: [],
    progress: { current_drill_index: 0, completed_drills: [] },
    checkins: [],
    drill_id: 'nz_gap_read',
    ...overrides,
  } as Session
}

const older = session({
  id: 'older',
  created_at: '2026-01-10T18:00:00.000Z',
  drill_id: 'nz_gap_read',
  ai_reflection: reflection('Support früher lesen', ['Outcome mit Prediction vermischt']),
  game_info: { team_home: 'ERC Ingolstadt', team_away: 'Augsburger Panther' } as Session['game_info'],
})

const latest = session({
  id: 'latest',
  created_at: '2026-03-12T18:00:00.000Z',
  drill_id: 'nz_gap_read',
  game_info: { team_home: 'ERC Ingolstadt', team_away: 'Kölner Haie' } as Session['game_info'],
})

const otherDrill = session({
  id: 'other',
  created_at: '2026-04-01T18:00:00.000Z',
  drill_id: 'other_drill',
})

const dummy = session({
  id: 'dummy',
  created_at: '2026-05-01T18:00:00.000Z',
  drill_id: 'nz_gap_read',
  is_dummy: true,
})

const open = session({
  id: 'open',
  created_at: '2026-06-01T18:00:00.000Z',
  drill_id: 'nz_gap_read',
  state: 'IN_PROGRESS',
})

const past = findPastSessionsForDrill([dummy, open, otherDrill, older, latest], 'nz_gap_read')
assert.deepEqual(past.map((item) => item.id), ['latest', 'older'])

const recap = buildPastDrillRecap([dummy, open, otherDrill, older, latest], 'nz_gap_read')
assert.equal(recap?.latest.id, 'latest')
assert.equal(recap?.count, 2)
assert.equal(recap?.older[0]?.id, 'older')
assert.equal(recap?.reflectionIsFromLatest, false)
assert.equal(recap?.reflection?.content.nextObservationFocus, 'Support früher lesen')

const latestWithTip = session({
  ...latest,
  ai_reflection: reflection('Erst den Puckträger, dann den Support'),
})
const latestRecap = buildPastDrillRecap([older, latestWithTip], 'nz_gap_read')
assert.equal(latestRecap?.reflectionIsFromLatest, true)
assert.equal(latestRecap?.reflection?.content.nextObservationFocus, 'Erst den Puckträger, dann den Support')

assert.equal(buildPastDrillRecap([otherDrill], 'nz_gap_read'), null)
assert.deepEqual(findPastSessionsForDrill([], 'nz_gap_read'), [])

assert.equal(formatSessionMatchup(latest), 'ERC Ingolstadt vs Kölner Haie')
assert.equal(isSameMatchup(older, 'ERC Ingolstadt', 'Augsburger Panther'), true)
assert.equal(isSameMatchup(older, 'Augsburger Panther', 'ERC Ingolstadt'), true)
assert.equal(isSameMatchup(older, 'ERC Ingolstadt', 'Kölner Haie'), false)
