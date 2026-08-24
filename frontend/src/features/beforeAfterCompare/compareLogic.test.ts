import assert from 'node:assert/strict'
import {
  compareFieldValues,
  compareTextValues,
  isCompareStateComplete,
  resolveBeforeAfterCompareConfig,
  summarizeBeforeAfterCompare,
  validateBeforeAfterCompareAnswers,
} from './compareLogic.ts'

const cfg = resolveBeforeAfterCompareConfig({ mechanic: 'before_after_compare' })

assert.equal(compareFieldValues('middle', 'middle'), 'same')
assert.equal(compareFieldValues('middle', 'outside'), 'changed')
assert.equal(compareFieldValues('unclear', 'middle'), 'unclear')
assert.equal(compareFieldValues('not_relevant', 'not_relevant'), 'not_relevant')
assert.equal(compareTextValues('Früh pressen', 'Später pressen'), 'changed')

const before = {
  spacePriority: 'middle',
  pressureBehavior: 'early_aggressive',
  positioning: 'compact',
  decisionBehavior: 'direct',
  description: 'Früher Druck an der Blue Line',
}
const after = {
  spacePriority: 'middle',
  pressureBehavior: 'delayed_pressure',
  positioning: 'deep',
  decisionBehavior: 'patient',
  description: 'Später tiefer und geduldiger',
}

const summary = summarizeBeforeAfterCompare(cfg, before, after)
assert.equal(summary.changedFieldIds.includes('pressureBehavior'), true)
assert.equal(summary.stableFieldIds.includes('spacePriority'), true)
assert.equal(summary.hasClearChange, true)

assert.equal(isCompareStateComplete(before, cfg.stateFields), true)
assert.equal(
  validateBeforeAfterCompareAnswers(cfg, {
    before,
    after,
    __before_after_compare_stage: 'complete',
    comparabilityRating: 'well_comparable',
    primaryChange: 'pressureBehavior',
    stableDimensions: ['spacePriority'],
    changeMagnitude: 'clear',
    changeSummary: 'Vorher früher Druck, später verzögert und tiefer.',
    confidence: 'medium',
  }),
  null,
)

console.log('beforeAfterCompare compareLogic tests OK')
