import assert from 'node:assert/strict'
import type { Curriculum, Session } from '../api.ts'
import { sessionExpectsPeriodMicrofeedback } from './sessionMicrofeedback.ts'

const curriculum = {
  tracks: [
    {
      id: 'T0',
      title: 'Hockey Basics',
      goal: '',
      trackType: 'foundation',
      requiresMicrofeedback: false,
      modules: [{ id: 'T0', drills: [] }],
    },
    { id: 'A', title: 'Track A', goal: '', modules: [{ id: 'A1', drills: [] }] },
  ],
} as unknown as Curriculum

const lesson = {
  observation_scope: 'LESSON',
  module_id: 'T0',
  drills: [{ id: 'T0_D1', drill_type: 'foundation_lesson' }],
} as unknown as Session

const live = {
  observation_scope: 'P1',
  module_id: 'A1',
  drills: [{ id: 'A1_D1', drill_type: 'select' }],
} as unknown as Session

assert.equal(sessionExpectsPeriodMicrofeedback(lesson, curriculum), false)
assert.equal(sessionExpectsPeriodMicrofeedback(live, curriculum), true)
assert.equal(
  sessionExpectsPeriodMicrofeedback({ observation_scope: 'P1', module_id: 'T0', drills: [] } as unknown as Session, curriculum),
  false,
)
assert.equal(
  sessionExpectsPeriodMicrofeedback({ observation_scope: 'P1', module_id: 'T0', drills: [] } as unknown as Session, null),
  false,
)
assert.equal(
  sessionExpectsPeriodMicrofeedback(
    { observation_scope: 'FULL_GAME', module_id: 'A1', drills: [{ drill_type: 'foundation_lesson' }] } as unknown as Session,
    curriculum,
  ),
  false,
)
