import assert from 'node:assert/strict'
import {
  createObservationId,
  readActiveObservationDraft,
  withActiveObservationDraft,
} from './activeObservation.ts'

const id = createObservationId('obs')
assert.ok(id.startsWith('obs_'))
assert.notEqual(createObservationId('obs'), createObservationId('obs'))

const draft = {
  id,
  sessionId: 'sess-1',
  phase: 'P1',
  drillId: 'B1_D1',
  drillTitle: 'Unterstützung unter dem Puck',
  collectionKey: 'support_samples',
  label: 'Unterstützungsmoment',
  sceneId: null,
  sceneCode: null,
}

const answers = withActiveObservationDraft({}, draft)
assert.deepEqual(readActiveObservationDraft(answers), draft)

const cleared = withActiveObservationDraft(answers, null)
assert.equal(readActiveObservationDraft(cleared), null)
assert.ok(!('__active_observation_draft' in cleared))

assert.equal(readActiveObservationDraft({ __active_observation_draft: { id: 'x' } }), null)

console.log('activeObservation tests OK')
