import assert from 'node:assert/strict'
import { getPredictionTemplateById, PRED_PRESSURE_CARRIER_SOLUTION, predictionTemplates } from './config.ts'

const pressure = getPredictionTemplateById(PRED_PRESSURE_CARRIER_SOLUTION)
assert.ok(pressure)
assert.equal(pressure.title, 'Wie löst der Puckführer den Druck?')
assert.equal(pressure.shortTitle, 'Drucklösung')
assert.equal(pressure.resolution.compareMode, 'exact')
assert.equal(pressure.predictionOptions.length, pressure.resolution.actualOutcomeOptions.length)
assert.deepEqual(
  pressure.predictionOptions.map((option) => option.value),
  pressure.resolution.actualOutcomeOptions.map((option) => option.value),
)
assert.ok(pressure.contextFields?.some((field) => field.id === 'pressureSource'))
assert.ok(pressure.cueField)
assert.equal(pressure.cueField?.maxSelect, 2)
assert.ok(pressure.resolution.outcomeField)
assert.ok(pressure.reflectionGuidance?.length)
assert.ok(!predictionTemplates.some((template) => template.id === 'pressure_escape'))
assert.equal(predictionTemplates[0].id, PRED_PRESSURE_CARRIER_SOLUTION)

console.log('predictTemplates.test.ts ok')
