import assert from 'node:assert/strict'
import {
  DEFAULT_OBSERVATION_SCOPE,
  getActivePeriodsForScope,
  getNextPhaseForScope,
  getPreviousPhaseForScope,
} from './observationScope.ts'

assert.deepEqual(getActivePeriodsForScope('P1'), ['P1'])
assert.deepEqual(getActivePeriodsForScope('FULL_GAME'), ['P1', 'P2', 'P3'])
assert.equal(DEFAULT_OBSERVATION_SCOPE, 'P1')

assert.equal(getNextPhaseForScope('P1', 'P1'), 'POST')
assert.equal(getNextPhaseForScope('P1', 'FULL_GAME'), 'P2')
assert.equal(getNextPhaseForScope('P2', 'FULL_GAME'), 'P3')
assert.equal(getNextPhaseForScope('P3', 'FULL_GAME'), 'POST')
assert.equal(getNextPhaseForScope('P2', 'P1'), 'P1')
assert.equal(getPreviousPhaseForScope('P1', 'P1'), null)
assert.equal(getPreviousPhaseForScope('P2', 'FULL_GAME'), 'P1')
assert.equal(getNextPhaseForScope('POST', 'P1'), null)

console.log('observationScope tests OK')
