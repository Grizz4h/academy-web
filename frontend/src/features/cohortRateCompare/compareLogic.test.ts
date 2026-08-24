import assert from 'node:assert/strict'
import { applyTemplateById, calculatePercentagePointDifference } from '../opportunityRate/rateLogic.ts'
import { appendSidequest } from '../../utils/sessionSidequests.ts'
import {
  canEvaluateCompare,
  computeCohortRateCompare,
  emptyComparison,
  isComparisonReady,
  observationsForCohort,
  resolveCohortRateCompareConfig,
  updateComparisonQuestion,
  usesSharedMetricDefinition,
  validateCohortRateCompareAnswers,
} from './compareLogic.ts'
import type { CohortOpportunityObservation } from './types.ts'

const cfg = resolveCohortRateCompareConfig({
  mechanic: 'cohort_rate_compare',
  tracker: {
    minObservations: 8,
    minPerGroup: 3,
    recommendedObservations: 12,
    maxObservations: 16,
  },
})

assert.equal(cfg.minObservations, 8)
assert.equal(cfg.minPerGroup, 3)
assert.equal(cfg.maxObservations, 16)

assert.equal(canEvaluateCompare(3, 3, 8, 3), false)
assert.equal(canEvaluateCompare(5, 3, 8, 3), true)
assert.equal(canEvaluateCompare(8, 2, 8, 3), false)
assert.equal(canEvaluateCompare(9, 3, 8, 3), true)

const definition = applyTemplateById('entries')
assert.ok(definition)

function obs(
  id: string,
  cohortId: 'A' | 'B',
  outcomeId: string,
  extra: Partial<CohortOpportunityObservation> = {},
): CohortOpportunityObservation {
  return { id, order: Number(id), cohortId, outcomeId, validOpportunity: true, ...extra }
}

const comparison = updateComparisonQuestion(emptyComparison(), definition, {
  dimensionLabel: 'Entry-Seite',
  groupA: { id: 'A', label: 'Links' },
  groupB: { id: 'B', label: 'Rechts' },
})
assert.equal(isComparisonReady(comparison), true)
assert.equal(comparison.question.includes('Links'), true)

const left = [
  obs('1', 'A', 'controlled'),
  obs('2', 'A', 'controlled'),
  obs('3', 'A', 'controlled'),
  obs('4', 'A', 'controlled'),
  obs('5', 'A', 'controlled'),
  obs('6', 'A', 'dump'),
  obs('7', 'A', 'dump'),
  obs('8', 'A', 'unclear'),
]
const right = [
  obs('9', 'B', 'controlled'),
  obs('10', 'B', 'controlled'),
  obs('11', 'B', 'dump'),
  obs('12', 'B', 'dump'),
  obs('13', 'B', 'dump'),
  obs('14', 'B', 'turnover'),
  obs('15', 'B', 'unclear'),
]
const logs = [...left, ...right]
const result = computeCohortRateCompare(definition, comparison, logs)

assert.equal(result.groupA.totalOpportunities, 8)
assert.equal(result.groupA.evaluableCount, 7)
assert.equal(result.groupA.targetCount, 5)
assert.equal(result.groupA.unclearCount, 1)
assert.equal(result.groupA.ratePercent, 71)
assert.equal(result.groupB.totalOpportunities, 7)
assert.equal(result.groupB.evaluableCount, 6)
assert.equal(result.groupB.targetCount, 2)
assert.equal(result.groupB.unclearCount, 1)
assert.equal(result.groupB.ratePercent, 33)
assert.equal(result.percentagePointDifference, 38)
assert.equal(calculatePercentagePointDifference(5 / 7, 2 / 6), 38)
assert.equal(usesSharedMetricDefinition(definition, logs), true)
assert.equal(result.groupA.outcomeDistribution.controlled, 5)
assert.equal(result.groupB.outcomeDistribution.controlled, 2)

const uneven = computeCohortRateCompare(definition, comparison, [
  ...left,
  obs('16', 'B', 'controlled'),
  obs('17', 'B', 'dump'),
  obs('18', 'B', 'turnover'),
])
assert.equal(uneven.sampleImbalance, true)
assert.equal(uneven.groupA.totalOpportunities, 8)
assert.equal(uneven.groupB.totalOpportunities, 3)

const differentSizes = computeCohortRateCompare(definition, comparison, [
  obs('1', 'A', 'controlled'),
  obs('2', 'A', 'controlled'),
  obs('3', 'A', 'controlled'),
  obs('4', 'A', 'dump'),
  obs('5', 'A', 'dump'),
  obs('6', 'B', 'controlled'),
  obs('7', 'B', 'controlled'),
  obs('8', 'B', 'controlled'),
  obs('9', 'B', 'controlled'),
  obs('10', 'B', 'dump'),
  obs('11', 'B', 'dump'),
  obs('12', 'B', 'dump'),
  obs('13', 'B', 'dump'),
  obs('14', 'B', 'turnover'),
])
assert.equal(differentSizes.groupA.totalOpportunities, 5)
assert.equal(differentSizes.groupA.targetCount, 3)
assert.equal(differentSizes.groupB.totalOpportunities, 9)
assert.equal(differentSizes.groupB.targetCount, 4)

const removedRight = logs.filter((item) => item.id !== '9')
const afterRemove = computeCohortRateCompare(definition, comparison, removedRight)
assert.equal(afterRemove.groupB.totalOpportunities, 6)
assert.equal(afterRemove.groupB.targetCount, 1)
assert.notEqual(afterRemove.percentagePointDifference, result.percentagePointDifference)

const invalidated = logs.map((item) => item.id === '1' ? { ...item, validOpportunity: false } : item)
const afterInvalidate = computeCohortRateCompare(definition, comparison, invalidated)
assert.equal(afterInvalidate.groupA.totalOpportunities, 7)
assert.equal(afterInvalidate.groupA.targetCount, 4)

assert.equal(observationsForCohort(logs, 'A').length, 8)
assert.equal(observationsForCohort(logs, 'B').length, 7)

assert.notEqual(
  validateCohortRateCompareAnswers(cfg, {
    [cfg.definitionKey]: definition,
    [cfg.comparisonKey]: comparison,
    [cfg.logsKey]: [...left.slice(0, 3), ...right.slice(0, 3)],
  }),
  null,
)

assert.equal(
  validateCohortRateCompareAnswers(cfg, {
    [cfg.definitionKey]: definition,
    [cfg.comparisonKey]: comparison,
    [cfg.logsKey]: logs,
    [cfg.comparabilityKey]: 'mostly_comparable',
    [cfg.differenceKey]: 'clear',
    [cfg.conclusionKey]: 'In meinen beobachteten Entries lag die Rate kontrollierter Entries über links höher.',
  }),
  null,
)

const persisted = JSON.parse(JSON.stringify({
  [cfg.definitionKey]: definition,
  [cfg.comparisonKey]: comparison,
  [cfg.logsKey]: [...left.slice(0, 4), ...right.slice(0, 3)],
  [cfg.draftKey]: { cohortId: 'B', outcomeId: 'dump', period: 'P2', gameClock: '08:14', description: '', sceneId: 'scene_1' },
  [cfg.stageKey]: 'observe',
}))
assert.equal(persisted[cfg.definitionKey].targetOutcomeId, 'controlled')
assert.equal(persisted[cfg.comparisonKey].dimensionLabel, 'Entry-Seite')
assert.equal(persisted[cfg.logsKey].filter((item: CohortOpportunityObservation) => item.cohortId === 'A').length, 4)
assert.equal(persisted[cfg.logsKey].filter((item: CohortOpportunityObservation) => item.cohortId === 'B').length, 3)
assert.equal(persisted[cfg.draftKey].gameClock, '08:14')

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
assert.equal(afterSidequest[cfg.logsKey].length, 7)
assert.equal(afterSidequest[cfg.draftKey].cohortId, 'B')
assert.equal(afterSidequest[cfg.comparisonKey].groupA.label, 'Links')

console.log('cohortRateCompare compareLogic tests OK')
