import assert from 'node:assert/strict'
import {
  applyTemplateById,
  canAddOpportunity,
  canEvaluate,
  computeOpportunityRate,
  emptyCustomDefinition,
  formatRateFraction,
  formatRatePercent,
  formatRateSummary,
  invalidateObservationAt,
  isDefinitionReady,
  removeObservationAt,
  resolveOpportunityRateConfig,
  updateDefinitionLabels,
  validateOpportunityRateAnswers,
} from './rateLogic.ts'
import type { OpportunityObservation, RateDefinition } from './types.ts'
import { appendSidequest } from '../../utils/sessionSidequests.ts'

const cfg = resolveOpportunityRateConfig({
  mechanic: 'opportunity_rate',
  definition: { allowTemplates: true, allowCustomDefinition: true },
  tracker: {
    minObservations: 6,
    recommendedObservations: 8,
    maxObservations: 10,
    supportsGameClock: true,
    supportsSceneCapture: true,
    supportsUnclear: true,
  },
})

assert.equal(cfg.minObservations, 6)
assert.equal(cfg.recommendedObservations, 8)
assert.equal(cfg.maxObservations, 10)
assert.equal(canEvaluate(5, cfg.minObservations), false)
assert.equal(canEvaluate(6, cfg.minObservations), true)
assert.equal(canEvaluate(8, cfg.minObservations), true)
assert.equal(canAddOpportunity(10, cfg.maxObservations), false)
assert.equal(canAddOpportunity(11, cfg.maxObservations), false)
assert.equal(canAddOpportunity(9, cfg.maxObservations), true)

const entries = applyTemplateById('entries')
assert.ok(entries)
assert.ok(/Zone|Zonen/.test(entries.opportunityLabel) || /Eintritt|Entry/i.test(entries.opportunityLabel))
assert.equal(entries.targetOutcomeId, 'controlled')
assert.ok(entries.outcomes.some((item) => item.id === 'unclear'))
assert.ok(String(entries.inclusionRules || '').length > 0)
assert.ok(String(entries.exclusionRules || '').length > 0)
assert.equal(isDefinitionReady(entries), true)

const mutated = applyTemplateById('entries')!
mutated.outcomes[0].label = 'HACK'
assert.notEqual(applyTemplateById('entries')?.outcomes[0].label, 'HACK')

const custom = emptyCustomDefinition()
custom.opportunityLabel = 'klare Forecheck-Situationen'
custom.targetEventLabel = 'Turnover'
custom.outcomes = [
  { id: 'turnover', label: 'Turnover' },
  { id: 'no_turnover', label: 'Kein Turnover' },
  { id: 'unclear', label: 'Unklar' },
]
custom.targetOutcomeId = 'turnover'
const readyCustom = updateDefinitionLabels(custom, {
  opportunityLabel: custom.opportunityLabel,
  targetEventLabel: custom.targetEventLabel,
  questionManual: false,
})
assert.equal(isDefinitionReady(readyCustom), true)
assert.equal(readyCustom.question.includes('Forecheck'), true)

function obs(id: string, outcomeId: string, extra: Partial<OpportunityObservation> = {}): OpportunityObservation {
  return { id, order: Number(id), outcomeId, validOpportunity: true, ...extra }
}

const eight = [
  obs('1', 'controlled'),
  obs('2', 'controlled'),
  obs('3', 'controlled'),
  obs('4', 'controlled'),
  obs('5', 'dump'),
  obs('6', 'dump'),
  obs('7', 'turnover'),
  obs('8', 'unclear'),
]

const rate = computeOpportunityRate(entries, eight)
assert.equal(rate.totalOpportunities, 8)
assert.equal(rate.evaluableCount, 7)
assert.equal(rate.targetCount, 4)
assert.equal(rate.otherCount, 3)
assert.equal(rate.unclearCount, 1)
assert.equal(rate.rateDenominatorBasis, 'evaluable')
assert.equal(rate.rate, 4 / 7)
assert.equal(rate.ratePercent, 57)
assert.equal(formatRateFraction(rate.targetCount, rate.evaluableCount), '4 / 7')
assert.ok(rate.rateSummary.includes('4 Zielereignisse aus 7'))
assert.ok(rate.rateSummary.includes('1 weitere gültige Situation war unklar'))
assert.ok(rate.rateSummary.includes('insgesamt wurden 8'))
assert.equal(formatRatePercent(1 / 3), 33)
assert.notEqual(formatRateFraction(rate.targetCount, rate.evaluableCount), '50 %')

const removed = removeObservationAt(eight, 7)
const afterRemove = computeOpportunityRate(entries, removed)
assert.equal(afterRemove.totalOpportunities, 7)
assert.equal(afterRemove.targetCount, 4)
assert.equal(afterRemove.unclearCount, 0)

const invalidated = invalidateObservationAt(eight, 0)
const afterInvalidate = computeOpportunityRate(entries, invalidated)
assert.equal(afterInvalidate.totalOpportunities, 7)
assert.equal(afterInvalidate.targetCount, 3)

const persisted = JSON.parse(JSON.stringify({
  [cfg.definitionKey]: entries,
  [cfg.logsKey]: eight.slice(0, 5),
  [cfg.draftKey]: { outcomeId: 'dump', period: 'P2', gameClock: '08:14', description: '', sceneId: 'scene_1' },
  [cfg.stageKey]: 'observe',
}))
assert.equal(persisted[cfg.definitionKey].targetOutcomeId, 'controlled')
assert.equal(persisted[cfg.logsKey].length, 5)
assert.equal(persisted[cfg.draftKey].gameClock, '08:14')
assert.equal(persisted[cfg.draftKey].sceneId, 'scene_1')

const exits = applyTemplateById('exits')
const pp = applyTemplateById('pp_entries')
const stops = applyTemplateById('entry_stops')
assert.ok(exits && pp && stops)
assert.equal(exits.targetOutcomeId, 'controlled_exit')
assert.equal(pp.targetOutcomeId, 'controlled_possession')
assert.equal(stops.targetOutcomeId, 'early_stop')

const editedTemplate: RateDefinition = {
  ...entries,
  opportunityLabel: 'eigene Entry-Versuche',
  targetEventLabel: 'kontrollierter Entry',
}
const edited = updateDefinitionLabels(editedTemplate, {
  opportunityLabel: 'eigene Entry-Versuche',
  targetEventLabel: 'kontrollierter Entry',
  questionManual: false,
})
assert.equal(edited.question.includes('eigene Entry-Versuche'), true)
assert.equal(isDefinitionReady(edited), true)

assert.equal(
  validateOpportunityRateAnswers(cfg, {
    [cfg.definitionKey]: entries,
    [cfg.logsKey]: eight.slice(0, 5),
  }),
  'Bitte erfasse mindestens 6 gültige Ausgangssituationen (Übungsumfang).',
)

assert.equal(
  validateOpportunityRateAnswers(cfg, {
    [cfg.definitionKey]: entries,
    [cfg.logsKey]: eight,
    [cfg.countOnlyKey]: 'missing_relative_frequency',
    [cfg.clarityKey]: 'yes',
    [cfg.conclusionKey]: 'In meinen acht beobachteten Entry-Versuchen waren vier kontrolliert.',
  }),
  null,
)

const tooMany = [...eight, obs('9', 'dump'), obs('10', 'dump'), obs('11', 'dump')]
assert.notEqual(
  validateOpportunityRateAnswers(cfg, {
    [cfg.definitionKey]: entries,
    [cfg.logsKey]: tooMany,
    [cfg.countOnlyKey]: 'missing_relative_frequency',
    [cfg.clarityKey]: 'yes',
    [cfg.conclusionKey]: 'In meinen beobachteten Situationen waren vier kontrolliert.',
  }),
  null,
)

const afterSidequest = appendSidequest({
  [cfg.definitionKey]: entries,
  [cfg.logsKey]: eight.slice(0, 5),
  [cfg.draftKey]: { outcomeId: 'controlled', period: 'P1', gameClock: '12:10', description: 'draft', sceneId: '' },
  [cfg.stageKey]: 'observe',
}, {
  id: 'sq1',
  type: 'special_teams_sidequest',
  category: 'special_teams',
  gameState: 'power_play',
  miniDrillId: 'mini',
  phase: 'P1',
  answers: { note: 'pp' },
  createdAt: '2026-08-17T00:00:00.000Z',
})
assert.equal(afterSidequest[cfg.definitionKey].targetOutcomeId, 'controlled')
assert.equal(afterSidequest[cfg.logsKey].length, 5)
assert.equal(afterSidequest[cfg.draftKey].gameClock, '12:10')
assert.equal(afterSidequest[cfg.stageKey], 'observe')

console.log('opportunityRate rateLogic tests OK')
