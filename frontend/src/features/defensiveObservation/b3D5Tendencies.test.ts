import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const curriculum = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../../data/academy/curriculum.json'), 'utf8'),
)
const b3 = curriculum.tracks.find((track: { id: string }) => track.id === 'B').modules.find((m: { id: string }) => m.id === 'B3')
const d5 = b3.drills.find((d: { id: string }) => d.id === 'B3_D5')

const dims = d5.config.tendencies.dimensions.map((d: { id: string }) => d.id)
const freqs = d5.config.tendencies.frequency_options.map((o: { value: string }) => o.value)

assert.equal(d5.config.tendencies.key, 'observedDefensiveTendencies')
assert.deepEqual(dims, [
  'early_pressure',
  'outside_guiding',
  'center_protection',
  'pressure_support',
  'sequence_structure',
])
assert.deepEqual(freqs, ['frequent', 'partial', 'rare', 'unclear'])

// Completion requires all five + changedDuringObservation
const completeAnswers = {
  observedDefensiveTendencies: Object.fromEntries(dims.map((id: string) => [id, 'partial'])),
  changedDuringObservation: 'no',
}
assert.ok(dims.every((id: string) => completeAnswers.observedDefensiveTendencies[id]))
assert.ok(completeAnswers.changedDuringObservation)

// Legacy single identity must not satisfy new completion
const legacyOnly = { patternIdentity: 'aggressive_pressure', supportingObservations: ['early_pressure'], changedDuringObservation: 'yes' }
assert.ok(!legacyOnly.observedDefensiveTendencies)

// MiniFeedback is dimensions-based, not patternIdentity
const whenBlob = JSON.stringify(d5.miniFeedback)
assert.ok(!/patternIdentity/.test(whenBlob))
assert.ok(/tendencyPrimarySignal/.test(whenBlob))
assert.ok(!/\bReaktive Defensive\b|Aggressiver Zugriff|Kompakte Raumverteidigung/i.test(JSON.stringify(d5)))
assert.ok(/keine.*Identität/i.test(JSON.stringify(d5.didactics)))

// B3_D3 center role layer still present
const d3 = b3.drills.find((d: { id: string }) => d.id === 'B3_D3')
assert.ok(d3.config.role_decision?.options?.includes('Zentrum schützen'))

console.log('b3D5Tendencies.test.ts: all assertions passed')
