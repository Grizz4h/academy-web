import assert from 'node:assert/strict'
import {
  formatContinueObservationLabel,
  formatObservationProgressCount,
  formatObservationQuotaChoice,
  formatObservationQuotaStatus,
  observationSlotsLeft,
} from './observationQuota.ts'

const base = {
  min: 3,
  recommended: 5,
  max: 6,
  nounPlural: 'Situationen',
  nounSingular: 'Situation',
}

assert.equal(observationSlotsLeft({ count: 3, max: 6 }), 3)
assert.equal(observationSlotsLeft({ count: 6, max: 6 }), 0)

assert.ok(formatObservationQuotaStatus({ ...base, count: 1 }).includes('noch 2'))
assert.ok(formatObservationQuotaStatus({ ...base, count: 1 }).includes('mind. 3'))
assert.ok(formatObservationQuotaStatus({ ...base, count: 3 }).includes('Minimum erreicht'))
assert.ok(formatObservationQuotaStatus({ ...base, count: 3 }).includes('noch bis zu 3'))
assert.ok(formatObservationQuotaStatus({ ...base, count: 3 }).includes('empfohlen 5'))
assert.ok(formatObservationQuotaStatus({ ...base, count: 5 }).includes('Minimum erreicht'))
assert.ok(!formatObservationQuotaStatus({ ...base, count: 5 }).includes('empfohlen 5'))
assert.ok(formatObservationQuotaStatus({ ...base, count: 6 }).includes('Maximum erreicht'))

assert.equal(formatObservationQuotaChoice({ ...base, count: 2 }), null)
assert.ok(formatObservationQuotaChoice({ ...base, count: 3 })?.includes('abschließen'))
assert.ok(formatObservationQuotaChoice({ ...base, count: 3 })?.includes('maximal noch 3'))
assert.ok(formatObservationQuotaChoice({ ...base, count: 5 })?.includes('noch bis zu 1'))
assert.ok(formatObservationQuotaChoice({ ...base, count: 6 })?.includes('Maximum erreicht'))

assert.equal(
  formatContinueObservationLabel({ ...base, count: 3 }, '+ Situation'),
  '+ Situation · noch 3 möglich',
)
assert.equal(
  formatContinueObservationLabel({ ...base, count: 5 }),
  'Weitere Situation · noch 1 möglich',
)
assert.equal(formatObservationProgressCount({ ...base, count: 3 }), '3 / 6 Situationen')

console.log('observationQuota tests OK')
