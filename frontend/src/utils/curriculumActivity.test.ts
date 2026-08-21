import assert from 'node:assert/strict'
import type { Curriculum, Session } from '../api.ts'
import { findTrackForModule, getLastActivityTrackId } from './curriculumActivity.ts'

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
  { id: 'old', module_id: 'T0', created_at: '2026-08-01T10:00:00.000Z', is_dummy: false },
  { id: 'latest', module_id: 'E3', created_at: '2026-08-18T10:00:00.000Z', is_dummy: false },
  { id: 'dummy', module_id: 'A1', created_at: '2026-08-19T10:00:00.000Z', is_dummy: true },
] as unknown as Session[]

assert.equal(getLastActivityTrackId(sessions, curriculum), 'E')
assert.equal(getLastActivityTrackId([], curriculum), null)

const completedOverridesCreated = [
  {
    id: 'recent-create',
    module_id: 'A1',
    created_at: '2026-08-18T12:00:00.000Z',
    post: { completed_at: '2026-08-18T12:05:00.000Z' },
  },
  {
    id: 'later-complete',
    module_id: 'T0',
    created_at: '2026-08-18T11:00:00.000Z',
    post: { completed_at: '2026-08-18T13:00:00.000Z' },
  },
] as unknown as Session[]

assert.equal(getLastActivityTrackId(completedOverridesCreated, curriculum), 'T0')
