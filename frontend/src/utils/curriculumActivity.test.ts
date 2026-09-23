import assert from 'node:assert/strict'
import type { Curriculum, Session } from '../api.ts'
import {
  findTrackForModule,
  getLastActivityTrackId,
  getLastActivityDrillId,
  getLastActivityModuleId,
  getNextCurriculumFocus,
} from './curriculumActivity.ts'

const curriculum = {
  tracks: [
    { id: 'T0', title: 'Hockey Basics', goal: '', trackType: 'foundation', modules: [{ id: 'T0', drills: [] }] },
    { id: 'A', title: 'Track A', goal: '', modules: [{ id: 'A1', drills: [] }] },
    { id: 'E', title: 'Track E', goal: '', modules: [{ id: 'E3', drills: [] }] },
  ],
} as unknown as Curriculum

assert.equal(findTrackForModule(curriculum, 'E3')?.id, 'E')
assert.equal(findTrackForModule(curriculum, 'T0')?.id, 'T0')
assert.equal(findTrackForModule(curriculum, 'missing'), undefined)

const sessions = [
  { id: 'old', module_id: 'T0', created_at: '2026-08-01T10:00:00.000Z', is_dummy: false, state: 'COMPLETED' },
  { id: 'latest', module_id: 'E3', created_at: '2026-08-18T10:00:00.000Z', is_dummy: false, state: 'COMPLETED' },
  { id: 'dummy', module_id: 'A1', created_at: '2026-08-19T10:00:00.000Z', is_dummy: true, state: 'COMPLETED' },
] as unknown as Session[]

assert.equal(getLastActivityTrackId(sessions, curriculum), 'E')
assert.equal(getLastActivityTrackId([], curriculum), null)

const completedOverridesCreated = [
  {
    id: 'recent-create',
    module_id: 'A1',
    created_at: '2026-08-18T12:00:00.000Z',
    state: 'COMPLETED',
    post: { completed_at: '2026-08-18T12:05:00.000Z' },
  },
  {
    id: 'later-complete',
    module_id: 'T0',
    created_at: '2026-08-18T11:00:00.000Z',
    state: 'COMPLETED',
    post: { completed_at: '2026-08-18T13:00:00.000Z' },
  },
] as unknown as Session[]

assert.equal(getLastActivityTrackId(completedOverridesCreated, curriculum), 'A', 'Verlauf uses created_at, not completed_at')

const sequenced = {
  tracks: [
    {
      id: 'T0',
      title: 'Hockey Basics',
      trackType: 'foundation',
      modules: [{ id: 'T0', title: 'Basics', drills: [{ id: 'T0_D1', title: 'Einstieg' }] }],
    },
    {
      id: 'A',
      title: 'Track A',
      modules: [
        {
          id: 'A1',
          title: 'Beobachten',
          drills: [
            { id: 'A1_D1', title: 'A1 eins' },
            { id: 'A1_D5', title: 'A1 fünf' },
          ],
        },
        {
          id: 'A2',
          title: 'Struktur',
          drills: [
            { id: 'A2_D1', title: 'A2 eins' },
            { id: 'A2_D2', title: 'A2 zwei' },
            { id: 'A2_D5', title: 'Strukturentwicklung erkennen' },
          ],
        },
      ],
    },
    {
      id: 'B',
      title: 'Track B',
      modules: [{ id: 'B1', title: 'B1', drills: [{ id: 'B1_D1', title: 'B1 eins' }] }],
    },
    {
      id: 'M',
      title: 'Cluster 2',
      modules: [{ id: 'M1', title: 'M1', drills: [{ id: 'M1_D1', title: 'M1 eins' }] }],
    },
  ],
} as unknown as Curriculum

{
  const next = getNextCurriculumFocus(sequenced, new Set(), { skipTrackIds: ['M'] })
  assert.equal(next?.drillId, 'T0_D1', 'no history starts at foundation')
}

{
  const next = getNextCurriculumFocus(sequenced, new Set(['T0_D1', 'A1_D1', 'A1_D5']), {
    skipTrackIds: ['M'],
    lastCompletedDrillId: 'A1_D5',
  })
  assert.equal(next?.trackId, 'A')
  assert.equal(next?.moduleId, 'A2')
  assert.equal(next?.drillId, 'A2_D1', 'last drill of A1 advances to A2 D1')
}

{
  const next = getNextCurriculumFocus(sequenced, new Set(['T0_D1', 'A1_D1']), {
    skipTrackIds: ['M'],
    lastCompletedDrillId: 'A1_D1',
  })
  assert.equal(next?.drillId, 'A1_D5', 'next after last completed in same module')
}

{
  const done = new Set(['T0_D1', 'A1_D1', 'A1_D5', 'A2_D1', 'A2_D2', 'A2_D5'])
  const next = getNextCurriculumFocus(sequenced, done, {
    skipTrackIds: ['M'],
    lastCompletedDrillId: 'A2_D5',
  })
  assert.equal(next?.trackId, 'B')
  assert.equal(next?.drillId, 'B1_D1', 'cross-track after finishing A')
}

{
  const next = getNextCurriculumFocus(sequenced, new Set(['T0_D1']), {
    skipTrackIds: ['M'],
    lastCompletedDrillId: 'A1_D5',
    restrictToFoundation: true,
  })
  assert.equal(next?.drillId, 'T0_D1', 'unknown last drill in foundation-only sequence starts at T0')
}

{
  const all = new Set(['T0_D1', 'A1_D1', 'A1_D5', 'A2_D1', 'A2_D2', 'A2_D5', 'B1_D1'])
  const next = getNextCurriculumFocus(sequenced, all, {
    skipTrackIds: ['M'],
    lastCompletedDrillId: 'B1_D1',
  })
  assert.equal(next, null, 'last drill of curriculum has no successor')
}

{
  const wrap = new Set(['T0_D1', 'A1_D1', 'A1_D5', 'A2_D1', 'A2_D2', 'A2_D5', 'B1_D1'])
  wrap.delete('A1_D1')
  const next = getNextCurriculumFocus(sequenced, wrap, {
    skipTrackIds: ['M'],
    lastCompletedDrillId: 'B1_D1',
  })
  assert.equal(next, null, 'does not wrap back to earlier gaps')
}

{
  const next = getNextCurriculumFocus(sequenced, new Set(['T0_D1', 'A1_D1']), {
    skipTrackIds: ['M'],
    lastModuleId: 'A1',
  })
  assert.equal(next?.drillId, 'A1_D1', 'module-only pointer stays on that module')
}

{
  const overallAhead = new Set(['T0_D1', 'A1_D1', 'A1_D5', 'A2_D1', 'A2_D2', 'A2_D5', 'B1_D1'])
  const next = getNextCurriculumFocus(sequenced, overallAhead, {
    skipTrackIds: ['M'],
    lastCompletedDrillId: 'A2_D1',
  })
  assert.equal(next?.moduleId, 'A2')
  assert.equal(next?.drillId, 'A2_D2', 'A2 D1 in Verlauf increments to A2 D2, not the overall next gap')
}

assert.equal(
  getLastActivityDrillId([
    { id: 'done', module_id: 'A2', drill_id: 'A2_D1', created_at: '2026-09-02T10:00:00.000Z', is_dummy: false, state: 'COMPLETED' },
    { id: 'open', module_id: 'C2', drill_id: 'C2_D1', created_at: '2026-09-03T10:00:00.000Z', is_dummy: false, state: 'ACTIVE' },
  ] as unknown as Session[]),
  'A2_D1',
  'open later sessions do not beat the last completed observation',
)
assert.equal(
  getLastActivityModuleId([
    { id: 'latest', module_id: 'A2', created_at: '2026-09-02T10:00:00.000Z', is_dummy: false, state: 'COMPLETED' },
  ] as unknown as Session[]),
  'A2',
)

console.log('curriculumActivity.test.ts: all assertions passed')
