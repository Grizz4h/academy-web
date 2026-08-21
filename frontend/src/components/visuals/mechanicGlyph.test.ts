import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MECHANIC_INFO, resolveMechanicKind } from './mechanicGlyphKind.ts'

assert.equal(resolveMechanicKind('opportunity_rate'), 'log')
assert.equal(resolveMechanicKind('cohort_rate_compare'), 'log')
assert.equal(resolveMechanicKind('conditional_outcome_compare'), 'log')
assert.equal(resolveMechanicKind('evidence_assessment'), 'choice')
assert.equal(resolveMechanicKind(undefined, undefined, 'evidence_assessment'), 'choice')
assert.equal(resolveMechanicKind('claim_ladder'), 'profile')
assert.equal(resolveMechanicKind('evidence_profile'), 'profile')
assert.equal(resolveMechanicKind('period_checkin'), 'choice')
assert.notEqual(resolveMechanicKind('period_checkin'), 'generic')

// A1 observation stack — must never fall back to generic "Drill-Mechanik"
assert.equal(resolveMechanicKind('role_identification'), 'choice')
assert.equal(resolveMechanicKind('role_identification', null, 'role_identification'), 'choice')
assert.equal(resolveMechanicKind('shift_tracker'), 'log')
assert.equal(resolveMechanicKind(null, null, 'shift_tracker'), 'log')
assert.equal(resolveMechanicKind('player_relation'), 'log')
assert.equal(resolveMechanicKind('player_relation', null, 'player_relation'), 'log')
assert.equal(resolveMechanicKind('simple_structure'), 'log')
assert.equal(resolveMechanicKind('simple_structure', null, 'simple_structure'), 'log')
assert.equal(resolveMechanicKind('tactical_observation'), 'log')
assert.equal(resolveMechanicKind(null, null, 'tactical_observation'), 'log')
assert.equal(resolveMechanicKind('period_checkin', 'pressure_diagnosis', 'decision_analysis'), 'log')
assert.equal(resolveMechanicKind(null, null, 'decision_analysis'), 'log')
assert.equal(resolveMechanicKind(null, null, 'defensive_observation'), 'log')
assert.equal(resolveMechanicKind(null, null, 'system_observation'), 'log')
assert.equal(resolveMechanicKind('impact_classification_observation'), 'log')
assert.equal(resolveMechanicKind('paintable_rink_observation'), 'paint')

assert.equal(resolveMechanicKind('empathy_pathology'), 'generic') // no bare "path" false positive
assert.equal(resolveMechanicKind('directional_path'), 'path')
assert.equal(resolveMechanicKind('unknown_thing'), 'generic')
assert.equal(MECHANIC_INFO.generic.summary.includes('Drill-Mechanik'), true)
assert.equal(MECHANIC_INFO.log.label, 'Beobachtung')

const curriculum = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../../data/academy/curriculum.json'), 'utf8'),
)
const a1 = curriculum.tracks[0].modules.find((module: { id: string }) => module.id === 'A1')
assert.ok(a1)
for (const drill of a1.drills) {
  const kind = resolveMechanicKind(drill.drill_type, drill.config?.mode, drill.config?.mechanic)
  assert.notEqual(kind, 'generic', `${drill.id} (${drill.drill_type}) must not resolve to generic`)
}

const a2 = curriculum.tracks[0].modules.find((module: { id: string }) => module.id === 'A2')
for (const drill of a2.drills.slice(0, 4)) {
  const kind = resolveMechanicKind(drill.drill_type, drill.config?.mode, drill.config?.mechanic)
  assert.notEqual(kind, 'generic', `${drill.id} (${drill.drill_type}) must not resolve to generic`)
}

for (const drill of a2.drills) {
  if (drill.config?.mechanic === 'tactical_observation') {
    const kind = resolveMechanicKind(drill.drill_type, drill.config?.mode, drill.config?.mechanic)
    assert.equal(kind, 'log', `${drill.id} tactical_observation should map to Beobachtung glyph`)
  }
}

console.log('mechanicGlyphKind tests OK')
