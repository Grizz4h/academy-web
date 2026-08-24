import assert from 'node:assert/strict'
import {
  assignCuePriority,
  canSaveCuePriorities,
  computeCuePriorityResult,
  cuePriorityLabel,
  cuePriorityOptions,
  cuesHavePriorities,
  resolveCuePriorityConfig,
  resultHasNumericCueScore,
} from './cueLogic.ts'
import type { PrioritizableCue } from './types.ts'

assert.equal(resolveCuePriorityConfig({ mechanic: 'anticipation_read' }).required, false)
assert.equal(resolveCuePriorityConfig({ mechanic: 'cue_priority' }).required, true)
assert.equal(resolveCuePriorityConfig({ mechanic: 'cue_ranking' }).required, true)
assert.equal(resolveCuePriorityConfig({ mechanic: 'scenario_branches' }).required, false)
assert.equal(resolveCuePriorityConfig({ mechanic: 'prediction_update' }).required, false)
assert.equal(resolveCuePriorityConfig({ supportsCuePriority: true }).required, true)

const options = cuePriorityOptions()
assert.deepEqual(options.map((item) => item.value), ['primary', 'supporting', 'secondary'])
assert.equal(options.some((item) => /[0-9]|%|punkt/i.test(item.label)), false)
assert.equal(cuePriorityLabel('primary'), 'Haupthinweis')

let cues: PrioritizableCue[] = [
  { id: 'c1', category: 'support', label: 'Center öffnet Raum' },
  { id: 'c2', category: 'pressure', label: 'Wall wird geschlossen' },
  { id: 'c3', category: 'timing', label: 'Defender steht tief' },
]
assert.equal(cuesHavePriorities(cues), false)
assert.equal(canSaveCuePriorities(cues), false)

cues = assignCuePriority(cues, 'c1', 'primary')
cues = assignCuePriority(cues, 'c2', 'supporting')
cues = assignCuePriority(cues, 'c3', 'secondary')
assert.equal(cuesHavePriorities(cues), true)
assert.equal(canSaveCuePriorities(cues), true)
assert.equal(cues.find((item) => item.id === 'c1')?.priority, 'primary')
assert.equal(cues.find((item) => item.id === 'c2')?.priority, 'supporting')
assert.equal(cues.find((item) => item.id === 'c3')?.priority, 'secondary')

const result = computeCuePriorityResult([
  {
    supportingCues: cues,
    cueReview: 'yes',
  },
  {
    supportingCues: [
      { id: 'd1', category: 'support', label: 'Support bleibt', priority: 'primary' },
      { id: 'd2', category: 'positioning', label: 'Position', priority: 'secondary' },
    ],
    cueReview: 'no',
  },
])
assert.equal(result.primaryCueDistribution.support, 2)
assert.equal(result.supportingCueDistribution.pressure, 1)
assert.equal(result.secondaryCueDistribution.timing, 1)
assert.equal(result.cueReviewAgreement.matched, 1)
assert.equal(result.cueReviewAgreement.different, 1)
assert.equal(resultHasNumericCueScore(result), false)
assert.equal('cueAccuracy' in result, false)
assert.equal(JSON.stringify(result).includes('%'), false)

console.log('cuePriority cueLogic tests OK')
