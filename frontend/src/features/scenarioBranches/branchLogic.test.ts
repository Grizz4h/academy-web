import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  alternativeDiffersFromPrimary,
  buildScenarioBranches,
  canSaveAlternative,
  canSaveTriggers,
  computeScenarioBranchResult,
  emptyTrigger,
  formatTriggerSummary,
  isCompleteScenarioBranchRead,
  mostFrequentValue,
  normalizeTriggers,
  resolveScenarioBranchConfig,
  resultHasProbabilityScore,
  usedTriggerDescriptions,
} from './branchLogic.ts'

assert.equal(resolveScenarioBranchConfig({ mechanic: 'anticipation_read' }).enabled, false)
assert.equal(resolveScenarioBranchConfig({ mechanic: 'cue_priority' }).enabled, false)
assert.equal(resolveScenarioBranchConfig({ mechanic: 'prediction_update' }).enabled, false)
const cfg = resolveScenarioBranchConfig({
  mechanic: 'scenario_branches',
  minTriggers: 1,
  maxTriggers: 3,
  expectedActionOptions: ['Pass', 'Carry'],
  triggerSuggestions: ['Passlinie wird geschlossen'],
})
assert.equal(cfg.enabled, true)
assert.equal(cfg.allowAlternative, true)
assert.equal(cfg.minTriggers, 1)
assert.equal(cfg.maxTriggers, 3)
assert.deepEqual(cfg.actionOptions, ['Pass', 'Carry'])

assert.equal(alternativeDiffersFromPrimary('Pass', 'Carry'), true)
assert.equal(alternativeDiffersFromPrimary('Pass', 'pass'), false)
assert.equal(canSaveAlternative('Pass', 'Carry', true), true)
assert.equal(canSaveAlternative('Pass', 'Pass', true), false)
assert.equal(canSaveAlternative('', 'Carry', false), true)

assert.equal(canSaveTriggers([], 1, 3), false)
assert.equal(canSaveTriggers([{ ...emptyTrigger(), description: 'Mitte geschlossen' }], 1, 3), true)
assert.equal(normalizeTriggers([
  { id: '1', description: 'a' },
  { id: '2', description: '  ' },
  { id: '3', description: 'b' },
  { id: '4', description: 'c' },
  { id: '5', description: 'd' },
], 3).map((item) => item.description).join(','), 'a,b,c')

const read = {
  id: 'r1',
  expectedAction: 'Pass',
  alternativeAction: 'Carry',
  branchTriggers: [
    { id: 't1', description: 'Center geschlossen' },
    { id: 't2', description: 'Raum vor Carrier frei' },
  ],
  alternativeOccurred: 'yes' as const,
  triggerRelevant: 'yes' as const,
  supportingCues: [{ label: 'Support inside' }],
}
const branches = buildScenarioBranches(read)
assert.equal(branches[0]?.role, 'primary')
assert.equal(branches[0]?.action, 'Pass')
assert.equal(branches[1]?.role, 'alternative')
assert.equal(branches[1]?.action, 'Carry')
assert.deepEqual(branches[1]?.triggerConditions, ['Center geschlossen', 'Raum vor Carrier frei'])
assert.equal(isCompleteScenarioBranchRead(read, cfg), true)
assert.equal(isCompleteScenarioBranchRead({ ...read, branchTriggers: [] }, cfg), false)

const result = computeScenarioBranchResult([read, { ...read, id: 'r2', alternativeOccurred: 'no', triggerRelevant: 'partly' }])
assert.deepEqual(result.primaryActions, ['Pass'])
assert.deepEqual(result.alternativeActions, ['Carry'])
assert.equal(result.branchTriggeredCount, 1)
assert.equal(result.triggerRecognizedCount, 1)
assert.equal(result.commonAlternativePatterns?.Carry, 2)
assert.equal(mostFrequentValue(result.commonTriggerPatterns), 'Center geschlossen')
assert.equal(formatTriggerSummary(result), 'Wenn: Center geschlossen')
assert.equal(resultHasProbabilityScore(result), false)
assert.equal('branchAccuracy' in result, false)
assert.equal(JSON.stringify(result).includes('%'), false)
assert.deepEqual(usedTriggerDescriptions([read]), ['Center geschlossen', 'Raum vor Carrier frei'])

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'ScenarioBranchMap.module.css'), 'utf8')
assert.match(css, /overflow-x:\s*hidden/)
assert.match(css, /@media \(max-width: 768px\)/)
assert.match(css, /grid-template-columns:\s*1fr/)
assert.equal(css.includes('70 %'), false)
assert.equal(css.includes('% Pass'), false)

const panelCss = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'ScenarioBranchPanel.module.css'), 'utf8')
assert.match(panelCss, /overflow-x:\s*hidden/)
assert.match(panelCss, /flex-wrap:\s*wrap/)

console.log('scenarioBranches branchLogic tests OK')
