import assert from 'node:assert/strict'
import { comparePrediction, comparePredictionForTemplate, isPredictionLocked, matchToResolution } from './predictCompare.ts'
import {
  calculatePredictionSessionSummary,
  createPredictionEntry,
  evaluableAccuracyText,
  resolvePredictionEntry,
  resolvePredictionEntryForTemplate,
} from './predictService.ts'
import type { PredictionTemplate } from './types.ts'
import type { PredictionEntry, Session } from '../../api.ts'

const exactTemplate = {
  id: 'pressure_carrier_solution',
  resolution: {
    compareMode: 'exact',
    hideManualEvaluation: true,
    unjudgeableActualValues: ['unclear'],
    evaluationOptions: [],
    actualOutcomeOptions: [],
    actualOutcomePrompt: '',
    evaluationPrompt: '',
  },
} as unknown as PredictionTemplate

assert.equal(comparePrediction({ predictedValue: 'reverse', actualValue: 'reverse' }), 'exact')
assert.equal(comparePrediction({ predictedValue: 'short_pass', actualValue: 'wall_pass' }), 'different')
assert.equal(comparePrediction({ predictedValue: 'carry', actualValue: 'unclear' }), 'unjudgeable')
assert.equal(comparePredictionForTemplate(exactTemplate, 'carry', 'unclear'), 'unjudgeable')
assert.equal(matchToResolution('exact'), 'correct')
assert.equal(matchToResolution('different'), 'incorrect')
assert.equal(matchToResolution('unjudgeable'), 'unjudgeable')

const session = { id: 's1', game_info: { observed_team: 'Augsburg' } } as Session
const locked = createPredictionEntry({
  session,
  templateId: 'pressure_carrier_solution',
  categoryId: 'pressure_solution',
  predictedValue: 'reverse',
  confidence: 'medium',
  period: 2,
  order: 1,
  gameTime: '11:34',
  context: { pressureSource: 'behind', pressureWindow: 'limited_time', supportState: 'one_clear_option' },
  predictionCues: ['body_orientation', 'support_position'],
})

assert.equal(isPredictionLocked(locked), true)
assert.equal(locked.predictedValue, 'reverse')
assert.ok(locked.lockedAt)

const afterReload: PredictionEntry = JSON.parse(JSON.stringify(locked))
assert.equal(isPredictionLocked(afterReload), true)
assert.equal(afterReload.predictedValue, 'reverse')
assert.equal(afterReload.context?.pressureSource, 'behind')

const resolved = resolvePredictionEntryForTemplate({
  template: exactTemplate,
  entry: afterReload,
  actualValue: 'reverse',
  outcome: { pressureResolution: 'possession_lost' },
  reflectionReads: ['support_read'],
})

assert.equal(resolved.predictedValue, 'reverse')
assert.equal(resolved.lockedAt, afterReload.lockedAt)
assert.equal(resolved.resolution, 'correct')
assert.equal(resolved.outcome?.pressureResolution, 'possession_lost')

const missed = resolvePredictionEntryForTemplate({
  template: exactTemplate,
  entry: { ...afterReload, id: 'p2', predictedValue: 'carry' },
  actualValue: 'wall_pass',
  outcome: { pressureResolution: 'cleanly_resolved' },
})
assert.equal(missed.resolution, 'incorrect')
assert.equal(missed.outcome?.pressureResolution, 'cleanly_resolved')

const unclear = resolvePredictionEntryForTemplate({
  template: exactTemplate,
  entry: { ...afterReload, id: 'p3', predictedValue: 'dump' },
  actualValue: 'unclear',
})
assert.equal(unclear.resolution, 'unjudgeable')

const summary = calculatePredictionSessionSummary([resolved, missed, unclear])
assert.equal(summary.total, 3)
assert.equal(summary.correct, 1)
assert.equal(summary.incorrect, 1)
assert.equal(summary.unjudgeable, 1)
assert.equal(summary.evaluable, 2)
assert.equal(evaluableAccuracyText(summary), '1 von 2 auswertbaren Predictions entsprachen der tatsächlichen Lösung.')
assert.equal(summary.actualValueCounts?.reverse, 1)
assert.equal(summary.actualValueCounts?.wall_pass, 1)
assert.equal(summary.actualValueCounts?.unclear, undefined)
assert.equal(summary.cueCounts?.body_orientation, 3)
assert.equal(summary.reflectionReadCounts?.support_read, 1)

const manualResolved = resolvePredictionEntry({
  entry: locked,
  actualValue: 'tempo',
  resolution: 'partial',
})
assert.equal(manualResolved.resolution, 'partial')
assert.equal(manualResolved.predictedValue, 'reverse')

console.log('predictService.test.ts ok')
