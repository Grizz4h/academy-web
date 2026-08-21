import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
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
  pickRendererVersion('E4', { drill_type: 'anticipation_read', config: { mechanic: 'anticipation_read' } }),
  'v2',
)
assert.equal(usesV2DrillRenderer({ drill_type: 'anticipation_read' }), true)

assert.equal(
  pickRendererVersion('E4', { drill_type: 'cue_priority', config: { mechanic: 'cue_priority' } }),
  'v2',
)
assert.equal(usesV2DrillRenderer({ drill_type: 'cue_priority' }), true)

assert.equal(
  pickRendererVersion('E4', { drill_type: 'scenario_branches', config: { mechanic: 'scenario_branches' } }),
  'v2',
)
assert.equal(usesV2DrillRenderer({ drill_type: 'scenario_branches' }), true)

assert.equal(
  pickRendererVersion('E4', { drill_type: 'prediction_update', config: { mechanic: 'prediction_update' } }),
  'v2',
)
assert.equal(usesV2DrillRenderer({ drill_type: 'prediction_update' }), true)

assert.equal(
  pickRendererVersion('E4', { drill_type: 'anticipation_profile', config: { mechanic: 'anticipation_profile' } }),
  'v2',
)
assert.equal(usesV2DrillRenderer({ drill_type: 'anticipation_profile' }), true)

assert.equal(
  pickRendererVersion('A1', { drill_type: 'period_checkin' }),
  'v2',
)

assert.equal(
  pickRendererVersion('A1', { drill_type: 'role_identification' }),
  'v2',
)

assert.equal(
  pickRendererVersion('A1', { drill_type: 'role_identification', config: { mechanic: 'role_identification' } }),
  'v2',
)

assert.equal(
  pickRendererVersion('A1', { drill_type: 'shift_tracker' }),
  'v2',
)

assert.equal(
  pickRendererVersion('A1', { drill_type: 'shift_tracker', config: { mechanic: 'shift_tracker' } }),
  'v2',
)

assert.equal(
  pickRendererVersion('A2', { drill_type: 'period_checkin' }),
  'v2',
)

assert.equal(
  pickRendererVersion('T0', { drill_type: 'foundation_lesson' }),
  'v2',
)

const curriculum = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../data/academy/curriculum.json'), 'utf8'))
const a1 = curriculum.tracks[0].modules.find((module: { id: string }) => module.id === 'A1')
const a2 = curriculum.tracks[0].modules.find((module: { id: string }) => module.id === 'A2')
const a1ById = Object.fromEntries((a1.drills || []).map((drill: { id: string }) => [drill.id, drill]))
assert.equal(pickRendererVersion('A1', a1ById.A1_D1), 'v2')
assert.equal(pickRendererVersion('A1', a1ById.A1_D2), 'v2')
assert.equal(pickRendererVersion('A1', a1ById.A1_D3), 'v2')
assert.equal(pickRendererVersion('A1', a1ById.A1_D4), 'v2')
assert.equal(pickRendererVersion('A1', a1ById.A1_D5), 'v2')
for (const drill of a2.drills || []) {
  assert.equal(pickRendererVersion('A2', drill), 'v2', `${drill.id} must render on V2`)
}

assert.equal(
  pickRendererVersion('A1', { drill_type: 'simple_structure', config: { mechanic: 'simple_structure' } }),
  'v2',
)
assert.equal(usesV2DrillRenderer({ drill_type: 'simple_structure', config: { mechanic: 'simple_structure' } }), true)

assert.equal(
  pickRendererVersion('A1', { drill_type: 'player_relation', config: { mechanic: 'player_relation' } }),
  'v2',
)
assert.equal(usesV2DrillRenderer({ drill_type: 'player_relation', config: { mechanic: 'player_relation' } }), true)

assert.equal(
  pickRendererVersion('A2', { drill_type: 'tactical_observation', config: { mechanic: 'tactical_observation' } }),
  'v2',
)
assert.equal(usesV2DrillRenderer({ drill_type: 'tactical_observation', config: { mechanic: 'tactical_observation' } }), true)

assert.equal(
  pickRendererVersion('M1', { drill_type: 'meta_scan' }),
  'v4',
)

assert.equal(usesV2DrillRenderer({ drill_type: 'before_after_compare' }), true)
assert.equal(usesV2DrillRenderer({ drill_type: 'period_checkin' }), true)

console.log('drillRendererRouting tests OK')
