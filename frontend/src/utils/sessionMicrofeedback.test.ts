import assert from 'node:assert/strict'
import type { Curriculum, Session } from '../api.ts'
import {
  checkinHasObservationPayload,
  missingPeriodMicrofeedbackLabels,
  periodsRequiringMicrofeedback,
  sessionDrillDefinesMiniFeedback,
  sessionExpectsPeriodMicrofeedback,
} from './sessionMicrofeedback.ts'

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

assert.equal(checkinHasObservationPayload({ answers: {} }), false)
assert.equal(checkinHasObservationPayload({ answers: { __draft: { a: 1 } } }), false)
assert.equal(checkinHasObservationPayload({ answers: { samples: [{ id: 1 }] } }), true)

const withMini = {
  id: 's1',
  state: 'COMPLETED',
  observation_scope: 'P1',
  module_id: 'A1',
  drills: [
    {
      id: 'A1_D1',
      drill_type: 'select',
      miniFeedback: { groups: [{ questions: ['Woran hast du X erkannt?'] }] },
    },
  ],
  checkins: [{ phase: 'P1', answers: {} }],
  microfeedback: {
    P1: { done: false, text: '' },
    P2: { done: false, text: '' },
    P3: { done: false, text: '' },
  },
  game_info: { team_home: 'A', team_away: 'B' },
} as unknown as Session

assert.equal(sessionDrillDefinesMiniFeedback(withMini), true)
// Empty check-in shell must not require microfeedback.
assert.deepEqual(periodsRequiringMicrofeedback(withMini, curriculum), [])
assert.deepEqual(missingPeriodMicrofeedbackLabels(withMini, curriculum), [])

const withPayloadMissingMf = {
  ...withMini,
  checkins: [{ phase: 'P1', answers: { samples: [{ role: 'center' }] } }],
} as unknown as Session
assert.deepEqual(periodsRequiringMicrofeedback(withPayloadMissingMf, curriculum), ['P1'])
assert.deepEqual(missingPeriodMicrofeedbackLabels(withPayloadMissingMf, curriculum), [
  'A vs B: Microfeedback fehlt in P1',
])

const noMiniButPayload = {
  ...withPayloadMissingMf,
  drills: [{ id: 'C1_D4', drill_type: 'clickable_rink_observation' }],
} as unknown as Session
assert.equal(sessionDrillDefinesMiniFeedback(noMiniButPayload), false)
assert.deepEqual(missingPeriodMicrofeedbackLabels(noMiniButPayload, curriculum), [])

console.log('sessionMicrofeedback tests OK')
