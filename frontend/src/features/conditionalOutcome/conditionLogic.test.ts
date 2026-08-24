import assert from 'node:assert/strict'
import { calculatePercentagePointDifference } from '../opportunityRate/rateLogic.ts'
import { appendSidequest } from '../../utils/sessionSidequests.ts'
import {
  buildConditionOutcomeMatrix,
  canEvaluateConditional,
  computeConditionalOutcome,
  definitionFromTemplate,
  isConditionalDefinitionReady,
  resolveConditionalOutcomeConfig,
  updateConditionalDefinition,
  validateConditionalOutcomeAnswers,
} from './conditionLogic.ts'
import type { ConditionalObservation } from './types.ts'

const cfg = resolveConditionalOutcomeConfig({
  mechanic: 'conditional_outcome_compare',
  tracker: {
    minObservations: 10,
    minPresent: 3,
    minAbsent: 3,
    recommendedObservations: 14,
    maxObservations: 20,
  },
})

assert.equal(cfg.minObservations, 10)
assert.equal(cfg.minPresent, 3)
assert.equal(canEvaluateConditional(2, 8, 10, 10, 3, 3), false)
assert.equal(canEvaluateConditional(3, 7, 10, 10, 3, 3), true)

const definition = definitionFromTemplate({
  id: 'weak_side_exit',
  title: 'Weak-Side Support → Exit',
  description: 'test',
  opportunityLabel: 'Exit-Versuche',
  conditionLabel: 'Weak-Side-Support vorhanden',
  targetEventLabel: 'kontrollierter Exit',
})
assert.equal(isConditionalDefinitionReady(definition), true)
assert.equal(definition.question.includes('kontrollierter Exit'), true)

function obs(
  id: string,
  conditionState: ConditionalObservation['conditionState'],
  outcomeState: ConditionalObservation['outcomeState'],
): ConditionalObservation {
  return {
    id,
    order: Number(id),
    conditionState,
    outcomeState,
    outcomeId: outcomeState,
    validOpportunity: true,
  }
}

const presentTarget = [obs('1', 'present', 'target'), obs('2', 'present', 'target'), obs('3', 'present', 'target'), obs('4', 'present', 'target'), obs('5', 'present', 'target'), obs('6', 'present', 'target')]
const presentOther = [obs('7', 'present', 'other'), obs('8', 'present', 'other'), obs('9', 'present', 'other')]
const absentTarget = [obs('10', 'absent', 'target'), obs('11', 'absent', 'target')]
const absentOther = [obs('12', 'absent', 'other'), obs('13', 'absent', 'other'), obs('14', 'absent', 'other'), obs('15', 'absent', 'other'), obs('16', 'absent', 'other'), obs('17', 'absent', 'other')]
const logs = [...presentTarget, ...presentOther, ...absentTarget, ...absentOther]

const result = computeConditionalOutcome(definition, logs, 'target_more_with_condition')
assert.equal(result.withCondition.total, 9)
assert.equal(result.withCondition.evaluableCount, 9)
assert.equal(result.withCondition.targetCount, 6)
assert.equal(result.withCondition.ratePercent, 67)
assert.equal(result.withoutCondition.total, 8)
assert.equal(result.withoutCondition.targetCount, 2)
assert.equal(result.withoutCondition.ratePercent, 25)
assert.equal(result.percentagePointDifference, 42)
assert.equal(calculatePercentagePointDifference(6 / 9, 2 / 8), 42)
assert.equal(result.matrix.presentTarget, 6)
assert.equal(result.matrix.presentOther, 3)
assert.equal(result.matrix.absentTarget, 2)
assert.equal(result.matrix.absentOther, 6)
assert.equal(result.counterexampleCount, 2)
assert.ok(result.counterexampleSummary?.includes('ohne'))

const opposite = computeConditionalOutcome(definition, logs, 'target_more_without_condition')
assert.equal(opposite.counterexampleCount, 6)
assert.ok(opposite.counterexampleSummary?.includes('trotz'))

const noExpectation = computeConditionalOutcome(definition, logs, 'no_expectation')
assert.equal(noExpectation.counterexampleCount, 0)
assert.ok(noExpectation.counterexampleSummary?.includes('kein Gegenfall'))

const withUnclearCondition = computeConditionalOutcome(definition, [
  ...logs,
  obs('18', 'unclear', 'target'),
])
assert.equal(withUnclearCondition.conditionUnclearCount, 1)
assert.equal(withUnclearCondition.withCondition.total, 9)
assert.equal(withUnclearCondition.withoutCondition.total, 8)
assert.equal(withUnclearCondition.matrix.presentTarget, 6)

const withUnclearOutcome = computeConditionalOutcome(definition, [
  ...presentTarget,
  ...presentOther,
  obs('19', 'present', 'unclear'),
  ...absentTarget,
  ...absentOther,
])
assert.equal(withUnclearOutcome.withCondition.total, 10)
assert.equal(withUnclearOutcome.withCondition.evaluableCount, 9)
assert.equal(withUnclearOutcome.withCondition.targetCount, 6)
assert.equal(withUnclearOutcome.withCondition.ratePercent, 67)
assert.equal(withUnclearOutcome.outcomeUnclearCount, 1)
assert.equal(withUnclearOutcome.matrix.presentOther, 3)

const matrix = buildConditionOutcomeMatrix([
  ...logs,
  obs('20', 'unclear', 'other'),
  obs('21', 'present', 'unclear'),
])
assert.equal(matrix.conditionUnclear, 1)
assert.equal(matrix.presentOutcomeUnclear, 1)
assert.equal(matrix.presentTarget, 6)

const removed = logs.filter((item) => item.id !== '1')
const afterRemove = computeConditionalOutcome(definition, removed)
assert.equal(afterRemove.withCondition.total, 8)
assert.equal(afterRemove.withCondition.targetCount, 5)

const invalidated = logs.map((item) => item.id === '10' ? { ...item, validOpportunity: false } : item)
const afterInvalidate = computeConditionalOutcome(definition, invalidated)
assert.equal(afterInvalidate.withoutCondition.total, 7)
assert.equal(afterInvalidate.withoutCondition.targetCount, 1)

assert.notEqual(
  validateConditionalOutcomeAnswers(cfg, {
    [cfg.definitionKey]: definition,
    [cfg.hypothesisKey]: 'target_more_with_condition',
    [cfg.logsKey]: [...presentTarget.slice(0, 2), ...absentOther],
  }),
  null,
)

assert.equal(
  validateConditionalOutcomeAnswers(cfg, {
    [cfg.definitionKey]: definition,
    [cfg.hypothesisKey]: 'target_more_with_condition',
    [cfg.logsKey]: logs,
    [cfg.comparabilityKey]: 'mostly_comparable',
    [cfg.hypothesisAssessmentKey]: 'confirmed',
    [cfg.counterexampleKey]: 'some',
    [cfg.alternativeKey]: 'Support entstand häufiger bei geringerem Druck.',
    [cfg.conclusionKey]: 'In meinen beobachteten Exit-Versuchen trat ein kontrollierter Exit bei vorhandenem Support häufiger auf.',
  }),
  null,
)

for (const value of ['target_more_with_condition', 'target_more_without_condition', 'roughly_equal', 'no_expectation'] as const) {
  const stored = { [cfg.hypothesisKey]: value }
  assert.equal(stored[cfg.hypothesisKey], value)
}

const persisted = JSON.parse(JSON.stringify({
  [cfg.definitionKey]: definition,
  [cfg.hypothesisKey]: 'target_more_with_condition',
  [cfg.logsKey]: logs.slice(0, 8),
  [cfg.draftKey]: { conditionState: 'absent', outcomeState: 'target', period: 'P2', gameClock: '08:14', description: '', sceneId: 'scene_1' },
  [cfg.stageKey]: 'observe',
}))
assert.equal(persisted[cfg.hypothesisKey], 'target_more_with_condition')
assert.equal(persisted[cfg.logsKey].length, 8)
assert.equal(persisted[cfg.draftKey].sceneId, 'scene_1')

const afterSidequest = appendSidequest(persisted, {
  id: 'sq1',
  type: 'special_teams_sidequest',
  category: 'special_teams',
  gameState: 'power_play',
  miniDrillId: 'mini',
  phase: 'P1',
  answers: { note: 'pp' },
  createdAt: '2026-08-17T00:00:00.000Z',
})
assert.equal(afterSidequest[cfg.logsKey].length, 8)
assert.equal(afterSidequest[cfg.draftKey].conditionState, 'absent')
assert.equal(afterSidequest[cfg.definitionKey].condition.label, 'Weak-Side-Support vorhanden')

const edited = updateConditionalDefinition(definition, { conditionLabel: 'früher F1-Druck' })
assert.equal(edited.question.includes('früher F1-Druck'), true)
assert.notEqual(edited.condition.label, definition.condition.label)

console.log('conditionalOutcome conditionLogic tests OK')
