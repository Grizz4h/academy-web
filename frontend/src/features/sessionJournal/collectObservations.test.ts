import assert from 'node:assert/strict'
import type { Session } from '../../api'
import { collectSessionObservations, countSessionObservations } from './collectObservations.ts'

const sampleSession = {
  id: 'sess-1',
  user: 'u1',
  module_id: 'B1W',
  goal: '',
  confidence: 3,
  state: 'COMPLETED',
  created_at: '2026-10-01T12:00:00',
  drill_id: 'B1W_D1',
  drills: [
    {
      id: 'B1W_D1',
      title: 'Winger im Spiel lesen',
      drill_type: 'sample_log',
      config: {
        sample_key: 'winger_function_samples',
        sample_label: 'Winger-Moment',
        state_key: 'puck_relation',
        state_label: 'Puckbezug',
        factor_key: 'visible_function',
        factor_label: 'Funktion',
        note_key: 'note',
        note_label: 'Notiz',
        state_options: ['pucknah', 'puckfern'],
        factors_by_state: {
          puckfern: ['bietet Unterstützung', 'attackiert freien Raum'],
        },
      },
    },
  ],
  progress: { current_drill_index: 0, completed_drills: ['B1W_D1'] },
  checkins: [
    {
      phase: 'P1',
      timestamp: '2026-10-01T12:10:00',
      answers: {
        winger_function_samples: [
          {
            id: 'sample_1',
            puck_relation: 'puckfern',
            visible_function: 'bietet Unterstützung',
            note: 'Winger löst sich nach außen und bleibt anspielbar.',
            sceneId: 'scene_a',
            sceneCode: 'SC100',
          },
          {
            id: 'sample_2',
            puck_relation: 'pucknah',
            visible_function: 'attackiert freien Raum',
            note: '',
          },
        ],
      },
    },
  ],
} as unknown as Session

const observations = collectSessionObservations(sampleSession, [
  {
    id: 'scene_a',
    game_time: '12:34',
    period: 'P1',
    created_at: '2026-10-01T12:11:00',
    scene_code: 'SC100',
    observation_id: 'sample_1',
  },
])

assert.equal(observations.length, 2)
assert.equal(countSessionObservations(sampleSession), 2)
assert.equal(observations[0].collectionKey, 'winger_function_samples')
assert.equal(observations[0].phase, 'P1')
assert.equal(observations[0].phaseLabel, '1. Drittel')
assert.ok(observations[0].fields.some((f) => f.label === 'Puckbezug' && f.value.toLowerCase().includes('puckfern')))
assert.equal(observations[0].sceneId, 'scene_a')
assert.equal(observations[0].sceneUnavailable, false)
assert.ok(observations[0].fields.some((f) => f.label === 'Funktion'))
assert.equal(observations[0].note, 'Winger löst sich nach außen und bleibt anspielbar.')
assert.equal(observations[0].sceneTime, '12:34')
assert.equal(observations[0].sceneCode, 'SC100')
assert.equal(observations[1].note, null)
assert.equal(observations[1].sceneId, null)
assert.equal(observations[1].sceneUnavailable, false)

// Dangling scene reference → no link target, flagged unavailable
const missingSceneObs = collectSessionObservations(sampleSession, [])
assert.equal(missingSceneObs[0].sceneId, null)
assert.equal(missingSceneObs[0].sceneUnavailable, true)
assert.equal(missingSceneObs[0].sceneCode, 'SC100')

// Zeitmarke without scene id stays unlinkable
const timeMarkSession = {
  ...sampleSession,
  checkins: [
    {
      phase: 'P1',
      timestamp: '2026-10-01T12:10:00',
      answers: {
        winger_function_samples: [
          {
            id: 'sample_time',
            puck_relation: 'puckfern',
            visible_function: 'bietet Unterstützung',
            game_time: '08:12',
          },
        ],
      },
    },
  ],
} as unknown as Session
const timeMarkObs = collectSessionObservations(timeMarkSession, [])
assert.equal(timeMarkObs[0].sceneId, null)
assert.equal(timeMarkObs[0].sceneUnavailable, false)
assert.equal(timeMarkObs[0].sceneTime, '08:12')

// Existing note wins — empty observation without choices/spatial/scene skipped? sample_2 has choices
assert.ok(observations[1].fields.length >= 1)

// Rink observation with coordinates
const rinkSession = {
  ...sampleSession,
  drill_id: 'B1W_D2',
  drills: [
    {
      id: 'B1W_D2',
      title: 'Breite und Tiefe',
      drill_type: 'draggable_rink_observation',
      config: {
        observations_key: 'winger_space_observations',
        observation_fields: [
          {
            key: 'spatialFunction',
            label: 'Räumliche Funktion',
            options: [
              { value: 'width', label: 'Breite' },
              { value: 'depth', label: 'Tiefe' },
            ],
          },
        ],
      },
    },
  ],
  checkins: [
    {
      phase: 'P2',
      timestamp: '2026-10-01T13:00:00',
      answers: {
        winger_space_observations: [
          {
            id: 'obs_rink',
            spatialFunction: 'width',
            wingerLocation: { x: 0.4, y: 0.5 },
          },
        ],
      },
    },
  ],
} as unknown as Session

const rinkObs = collectSessionObservations(rinkSession)
assert.equal(rinkObs.length, 1)
assert.equal(rinkObs[0].fields[0]?.value, 'Breite')
assert.ok(rinkObs[0].spatial, 'spatial snapshot when marker present')

console.log('collectObservations tests OK')
