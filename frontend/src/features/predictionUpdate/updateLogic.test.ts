import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildPredictionUpdate,
  canSaveUpdateDecision,
  canSaveUpdateTriggers,
  computePredictionUpdateResult,
  isCompletePredictionUpdate,
  resolvePredictionUpdateConfig,
  resultHasUpdateScore,
  usedUpdateTriggerDescriptions,
} from './updateLogic.ts'

assert.equal(resolvePredictionUpdateConfig({ mechanic: 'anticipation_read' }).enabled, false)
assert.equal(resolvePredictionUpdateConfig({ mechanic: 'cue_priority' }).enabled, false)
assert.equal(resolvePredictionUpdateConfig({ mechanic: 'scenario_branches' }).enabled, false)
const cfg = resolvePredictionUpdateConfig({ mechanic: 'prediction_update' })
assert.equal(cfg.enabled, true)
assert.equal(cfg.minUpdateTriggers, 1)
assert.equal(cfg.maxUpdateTriggers, 1)

assert.equal(canSaveUpdateTriggers([], 1, 1), false)
assert.equal(canSaveUpdateTriggers([{ id: 't1', description: 'leichter Druck' }], 1, 1), true)

const keepOk = canSaveUpdateDecision('keep', 'Pass', '', 'Support bleibt verfügbar', {
  enabled: true,
  requireReasonOnKeep: true,
  requireUpdatedPredictionOnChange: true,
})
assert.equal(keepOk, true)
assert.equal(canSaveUpdateDecision('keep', 'Pass', '', '', {
  enabled: true,
  requireReasonOnKeep: true,
  requireUpdatedPredictionOnChange: true,
}), false)

const changeOk = canSaveUpdateDecision('change', 'Pass', 'Carry', '', {
  enabled: true,
  requireReasonOnKeep: true,
  requireUpdatedPredictionOnChange: true,
})
assert.equal(changeOk, true)
assert.equal(canSaveUpdateDecision('change', 'Pass', 'Pass', '', {
  enabled: true,
  requireReasonOnKeep: true,
  requireUpdatedPredictionOnChange: true,
}), false)
assert.equal(canSaveUpdateDecision('maybe', 'Pass', 'Carry', '', {
  enabled: true,
  requireReasonOnKeep: true,
  requireUpdatedPredictionOnChange: true,
}), false)

const keepRead = {
  id: 'r1',
  expectedAction: 'Pass',
  supportingCues: [{ id: 'c1', category: 'support', label: 'Center frei' }],
  updateTriggers: [{ id: 't1', description: 'leichter Druck', cueCategory: 'pressure' }],
  updateDecision: 'keep' as const,
  updateReason: 'Passlinie bleibt offen',
  updateQuality: 'appropriate' as const,
}
assert.equal(isCompletePredictionUpdate(keepRead, cfg), true)
const keepUpdate = buildPredictionUpdate(keepRead)
assert.ok(keepUpdate)
assert.equal(keepUpdate!.updateDecision, 'keep')
assert.equal(keepUpdate!.updatedPrediction, 'Pass')
assert.equal(keepUpdate!.updateTrigger.description, 'leichter Druck')

const changeRead = {
  id: 'r2',
  expectedAction: 'Pass',
  supportingCues: [{ id: 'c1', category: 'support', label: 'Center frei' }],
  updateTriggers: [{ id: 't2', description: 'Passlinie geschlossen', cueCategory: 'pressure' }],
  updateDecision: 'change' as const,
  updatedPrediction: 'Carry',
  updateQuality: 'too_late' as const,
}
assert.equal(isCompletePredictionUpdate(changeRead, cfg), true)
assert.equal(isCompletePredictionUpdate({ ...changeRead, updateTriggers: [] }, cfg), false)
const changeUpdate = buildPredictionUpdate(changeRead)
assert.equal(changeUpdate!.updatedPrediction, 'Carry')

const result = computePredictionUpdateResult([keepRead, changeRead])
assert.equal(result.totalUpdates, 2)
assert.equal(result.keepCount, 1)
assert.equal(result.changeCount, 1)
assert.equal(result.updateQualityDistribution.appropriate, 1)
assert.equal(result.updateQualityDistribution.tooLate, 1)
assert.equal(result.commonUpdateTriggers?.['Passlinie geschlossen'], 1)
assert.equal(resultHasUpdateScore(result), false)
assert.equal(JSON.stringify(result).includes('%'), false)
assert.deepEqual(new Set(usedUpdateTriggerDescriptions([changeRead, keepRead])), new Set(['Passlinie geschlossen', 'leichter Druck']))

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'PredictionUpdatePanel.module.css'), 'utf8')
assert.match(css, /overflow-x:\s*hidden/)
assert.match(css, /min-width:\s*0/)

console.log('predictionUpdate updateLogic tests OK')
