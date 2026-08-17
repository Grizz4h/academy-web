import assert from 'node:assert/strict'
import { pickRendererVersion, usesV2DrillRenderer } from './drillRendererRouting.ts'

assert.equal(
  pickRendererVersion('E2', { drill_type: 'adjustment_profile' }),
  'v2',
)

assert.equal(
  pickRendererVersion('E2', { drill_type: 'interaction_chain' }),
  'v2',
)

assert.equal(
  pickRendererVersion('E2', { drill_type: 'trigger_hypothesis' }),
  'v2',
)

assert.equal(
  pickRendererVersion('E2', { drill_type: 'change_timeline' }),
  'v2',
)

assert.equal(
  pickRendererVersion('E2', { drill_type: 'before_after_compare', config: { mechanic: 'before_after_compare' } }),
  'v2',
)

assert.equal(
  pickRendererVersion('E2', { drill_type: 'period_checkin', config: {} }),
  'v2',
)

assert.equal(
  pickRendererVersion('E1', { drill_type: 'pattern_log' }),
  'v2',
)

assert.equal(
  pickRendererVersion('E3', { drill_type: 'period_checkin' }),
  'v2',
)

assert.equal(
  pickRendererVersion('E3', { drill_type: 'opportunity_rate', config: { mechanic: 'opportunity_rate' } }),
  'v2',
)

assert.equal(usesV2DrillRenderer({ drill_type: 'opportunity_rate' }), true)

assert.equal(
  pickRendererVersion('E3', { drill_type: 'cohort_rate_compare', config: { mechanic: 'cohort_rate_compare' } }),
  'v2',
)
assert.equal(usesV2DrillRenderer({ drill_type: 'cohort_rate_compare' }), true)

assert.equal(
  pickRendererVersion('E3', { drill_type: 'conditional_outcome_compare', config: { mechanic: 'conditional_outcome_compare' } }),
  'v2',
)
assert.equal(usesV2DrillRenderer({ drill_type: 'conditional_outcome_compare' }), true)

assert.equal(
  pickRendererVersion('E3', { drill_type: 'evidence_assessment', config: { mechanic: 'evidence_assessment' } }),
  'v2',
)
assert.equal(usesV2DrillRenderer({ drill_type: 'evidence_assessment' }), true)

assert.equal(
  pickRendererVersion('E3', { drill_type: 'claim_ladder', config: { mechanic: 'claim_ladder' } }),
  'v2',
)
assert.equal(usesV2DrillRenderer({ drill_type: 'claim_ladder' }), true)

assert.equal(
  pickRendererVersion('A1', { drill_type: 'period_checkin' }),
  'v1',
)

assert.equal(
  pickRendererVersion('M1', { drill_type: 'meta_scan' }),
  'v4',
)

assert.equal(usesV2DrillRenderer({ drill_type: 'before_after_compare' }), true)
assert.equal(usesV2DrillRenderer({ drill_type: 'period_checkin' }), true)

console.log('drillRendererRouting tests OK')
