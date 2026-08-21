import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deriveMechanicIdsFromSession } from '../progression/buildActivityFromSources.ts'
import { resolveSimpleStructureConfig, validateSimpleStructureAnswers } from '../simpleStructure/structureLogic.ts'
import { resolveRoleIdentificationConfig } from '../roleIdentification/roleLogic.ts'
import {
  canAddObservation,
  canEvaluateObservations,
  computeTacticalObservationResult,
  draftToObservation,
  emptyTacticalDraft,
  findCompletedTacticalAnswers,
  getObservationValue,
  observationToDraft,
  resolveTacticalObservationConfig,
  resultHasNumericScore,
  validateTacticalObservationAnswers,
} from './tacticalLogic.ts'

const off = resolveTacticalObservationConfig({ mechanic: 'period_checkin' })
assert.equal(off.required, false)

const cfg = resolveTacticalObservationConfig({
  mechanic: 'tactical_observation',
  situationLabel: 'Breakout',
  minObservations: 3,
  recommendedObservations: 5,
  maxObservations: 6,
  supportsUnclear: true,
})
assert.equal(cfg.required, true)
assert.equal(cfg.situationLabel, 'Breakout')
assert.equal(cfg.minObservations, 3)
assert.equal(cfg.recommendedObservations, 5)
assert.equal(cfg.maxObservations, 6)
assert.equal(cfg.layers.length, 3)
assert.equal(cfg.layers[0].id, 'initiator_role')
assert.equal(cfg.layers[1].id, 'support_structure')
assert.equal(cfg.layers[2].id, 'structure_type')
assert.equal(cfg.layers[0].options.map((option) => option.id).join(','), 'defense,center,wing,other,unclear')
assert.equal(cfg.layers[1].options.map((option) => option.id).join(','), 'single_support,multiple_options,little_support,unclear')
assert.equal(cfg.layers[2].options.map((option) => option.id).join(','), 'organized,multiple_options,under_pressure,unclear')
assert.equal(canAddObservation(6, 6), false)
assert.equal(canAddObservation(5, 6), true)
assert.equal(canAddObservation(7, 6), false)
assert.equal(canEvaluateObservations(2, 3), false)
assert.equal(canEvaluateObservations(3, 3), true)
assert.equal(canEvaluateObservations(5, 3), true)
assert.equal(canEvaluateObservations(6, 3), true)

assert.equal(draftToObservation(emptyTacticalDraft(cfg), cfg, 0), null)
const saved = draftToObservation({
  initiatorRole: 'defense',
  supportType: 'single_support',
  structureType: 'organized',
}, cfg, 0)
assert.equal(getObservationValue(saved!, 'initiatorRole'), 'defense')
assert.equal(getObservationValue(saved!, 'supportType'), 'single_support')
assert.equal(getObservationValue(saved!, 'structureType'), 'organized')
assert.deepEqual(observationToDraft(saved!, cfg), {
  initiatorRole: 'defense',
  supportType: 'single_support',
  structureType: 'organized',
})

const unclear = draftToObservation({
  initiatorRole: 'unclear',
  supportType: 'unclear',
  structureType: 'unclear',
}, cfg, 1)
assert.equal(getObservationValue(unclear!, 'structureType'), 'unclear')

const observations = [
  { id: '1', order: 1, values: { initiatorRole: 'defense', supportType: 'single_support', structureType: 'organized' } },
  { id: '2', order: 2, values: { initiatorRole: 'center', supportType: 'multiple_options', structureType: 'multiple_options' } },
  { id: '3', order: 3, values: { initiatorRole: 'defense', supportType: 'little_support', structureType: 'under_pressure' } },
  { id: '4', order: 4, values: { initiatorRole: 'wing', supportType: 'single_support', structureType: 'organized' } },
  { id: '5', order: 5, values: { initiatorRole: 'unclear', supportType: 'unclear', structureType: 'unclear' } },
]
const legacyObservations = [
  { id: '1', order: 1, initiatorRole: 'defense', supportType: 'single_support', structureType: 'organized' },
]
const legacyResult = computeTacticalObservationResult(legacyObservations, cfg)
assert.equal(legacyResult.layerCounts.initiatorRole.defense, 1)

const five = observations.slice(0, 5)
const result = computeTacticalObservationResult(five, cfg)
assert.equal(result.observationCount, 5)
assert.equal(result.layerCounts.initiatorRole.defense, 2)
assert.equal(result.layerCounts.supportType.single_support, 2)
assert.equal(result.layerCounts.structureType.organized, 2)
assert.equal(result.unclearCount, 1)
assert.equal(JSON.stringify(result).includes('häufig'), false)
assert.equal(JSON.stringify(result).includes('guter'), false)
assert.equal(JSON.stringify(result).includes('schlecht'), false)
assert.equal(resultHasNumericScore(result), false)

assert.equal(validateTacticalObservationAnswers(cfg, { [cfg.logsKey]: observations.slice(0, 2) }), 'Bitte mache mindestens 3 Situationen.')
assert.equal(
  validateTacticalObservationAnswers(cfg, {
    [cfg.logsKey]: observations.slice(0, 3),
    [cfg.stageKey]: 'complete',
  }),
  'Bitte beantworte, was dir geholfen hat, die Struktur zu erkennen.',
)
assert.equal(
  validateTacticalObservationAnswers(cfg, {
    [cfg.logsKey]: observations.slice(0, 3),
    [cfg.patternKey]: 'positions',
    [cfg.stageKey]: 'complete',
  }),
  null,
)

const periodCheckinAnswers = {
  structure_rating: 'klar aufgebaut',
  first_option: 'Center',
}
assert.equal(findCompletedTacticalAnswers(cfg, periodCheckinAnswers, { drafts: { P1: periodCheckinAnswers }, checkins: [] }), null)

const a1Structure = resolveSimpleStructureConfig({ mechanic: 'simple_structure', minObservations: 3 })
const a1Answers = {
  [a1Structure.logsKey]: [
    { id: 'a', order: 1, structureType: 'triangle', focalRole: 'center' },
    { id: 'b', order: 2, structureType: 'single_option', focalRole: 'center' },
    { id: 'c', order: 3, structureType: 'unclear', focalRole: 'center' },
  ],
  [a1Structure.patternKey]: 'triangle',
  [a1Structure.stageKey]: 'complete',
}
assert.equal(validateSimpleStructureAnswers(a1Structure, a1Answers), null)
assert.equal(findCompletedTacticalAnswers(cfg, a1Answers, { drafts: { P1: a1Answers }, checkins: [] }), null)

const completed = {
  [cfg.logsKey]: observations.slice(0, 3),
  [cfg.patternKey]: 'spacing',
  [cfg.stageKey]: 'complete',
}
assert.equal(
  findCompletedTacticalAnswers(cfg, {}, { drafts: { P1: completed }, checkins: [] })?.[cfg.stageKey],
  'complete',
)

assert.equal(
  deriveMechanicIdsFromSession({
    id: 's1',
    user: 'tobi',
    created_at: '2026-08-20T00:00:00Z',
    state: 'COMPLETED',
    module_id: 'A2',
    drill_id: 'A2_D1',
    drills: [{ id: 'A2_D1', drill_type: 'tactical_observation' }],
    checkins: [{ phase: 'P1', answers: { tactical_observation_observations: five, tactical_observation_result: result } }],
  } as any).includes('tactical_observation'),
  true,
)

const curriculum = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../../data/academy/curriculum.json'), 'utf8'))
const a1 = curriculum.tracks[0].modules.find((module: { id: string }) => module.id === 'A1')
const a2 = curriculum.tracks[0].modules.find((module: { id: string }) => module.id === 'A2')
const a3 = curriculum.tracks[0].modules.find((module: { id: string }) => module.id === 'A3')
const a1d5 = a1.drills.find((drill: { id: string }) => drill.id === 'A1_D5')
const a2d1 = a2.drills.find((drill: { id: string }) => drill.id === 'A2_D1')
const a2d2 = a2.drills.find((drill: { id: string }) => drill.id === 'A2_D2')
const a2d3 = a2.drills.find((drill: { id: string }) => drill.id === 'A2_D3')
assert.equal(resolveRoleIdentificationConfig(a1.drills[0].config).required, true)
assert.equal(a1d5.config.mechanic, 'simple_structure')
assert.equal(a2d1.drill_type, 'tactical_observation')
assert.equal(a2d1.config.mechanic, 'tactical_observation')
assert.equal(a2d1.config.minObservations, 3)
assert.equal(a2d1.config.recommendedObservations, 5)
assert.equal(a2d1.config.maxObservations, 6)
assert.equal(a2d2.drill_type, 'tactical_observation')
assert.equal(a2d2.config.mechanic, 'tactical_observation')
assert.equal(a2d2.title, 'Optionen erkennen')
assert.equal(a2d2.config.observations_key, 'tactical_option_observations')
assert.notEqual(a2d2.config.observations_key, a2d1.config.observations_key)
assert.ok(a2d1.didactics.observation_guide.ignore.some((item: string) => item.includes('Transition')))
assert.ok(a2d1.didactics.observation_guide.ignore.some((item: string) => item.includes('Qualität')))
assert.ok(a2d2.didactics.observation_guide.ignore.some((item: string) => item.includes('Transition')))
assert.ok(a2d2.didactics.observation_guide.ignore.some((item: string) => item.includes('beste')))
assert.equal(a2d1.config.structureOptions.map((option: { id: string }) => option.id).join(','), 'organized,multiple_options,under_pressure,unclear')
assert.equal(a2d1.config.structureOptions.some((option: { id: string }) => ['good', 'bad', 'quality'].includes(option.id)), false)
assert.ok(a3.learningGoals.length > 0)

const d2Cfg = resolveTacticalObservationConfig(a2d2.config)
assert.equal(d2Cfg.layers.map((layer) => layer.id).join(','), 'available_option,option_type,option_count')
assert.equal(d2Cfg.layers[1].options.map((option) => option.id).join(','), 'direct_option,next_option,safety_option,unclear')
assert.equal(d2Cfg.logsKey, 'tactical_option_observations')

const d1Completed = {
  [a2d1.config.observations_key]: observations.slice(0, 3),
  [a2d1.config.patternKey]: 'positions',
  [a2d1.config.stageKey]: 'complete',
}
assert.equal(findCompletedTacticalAnswers(d2Cfg, d1Completed, { drafts: { P1: d1Completed }, checkins: [] }), null)

const d2Observation = draftToObservation({
  availableOption: 'center',
  optionType: 'direct_option',
  optionCount: 'one_clear',
}, d2Cfg, 0)
assert.ok(d2Observation)
const d2Completed = {
  [d2Cfg.logsKey]: [d2Observation, d2Observation, d2Observation],
  [d2Cfg.patternKey]: 'position',
  [d2Cfg.stageKey]: 'complete',
}
assert.equal(findCompletedTacticalAnswers(d2Cfg, d2Completed, { drafts: { P1: d2Completed }, checkins: [] })?.[d2Cfg.stageKey], 'complete')
assert.equal(findCompletedTacticalAnswers(d2Cfg, {}, { drafts: { P1: d1Completed }, checkins: [] }), null)

assert.equal(a2d3.drill_type, 'tactical_observation')
assert.equal(a2d3.config.mechanic, 'tactical_observation')
assert.equal(a2d3.title, 'Entscheidung erkennen')
assert.equal(a2d3.config.observations_key, 'tactical_decision_observations')
assert.notEqual(a2d3.config.observations_key, a2d1.config.observations_key)
assert.notEqual(a2d3.config.observations_key, a2d2.config.observations_key)
assert.ok(a2d3.didactics.observation_guide.ignore.some((item: string) => item.includes('Transition')))
assert.ok(a2d3.didactics.observation_guide.ignore.some((item: string) => item.includes('beste')))
assert.ok(a2d3.didactics.observation_guide.ignore.some((item: string) => item.includes('Raum')))

const d3Cfg = resolveTacticalObservationConfig(a2d3.config)
assert.equal(d3Cfg.layers.map((layer) => layer.id).join(','), 'available_option,executed_action,option_visibility')
assert.equal(d3Cfg.layers[1].options.map((option) => option.id).join(','), 'pass,carry,dump,reset,unclear')
assert.equal(d3Cfg.layers[2].options.map((option) => option.id).join(','), 'clearly_visible,partially_visible,surprising,unclear')
assert.equal(d3Cfg.logsKey, 'tactical_decision_observations')
assert.equal(canEvaluateObservations(2, d3Cfg.minObservations), false)
assert.equal(canEvaluateObservations(3, d3Cfg.minObservations), true)
assert.equal(canAddObservation(6, d3Cfg.maxObservations), false)
assert.equal(canAddObservation(7, d3Cfg.maxObservations), false)

assert.equal(findCompletedTacticalAnswers(d3Cfg, d1Completed, { drafts: { P1: d1Completed }, checkins: [] }), null)
assert.equal(findCompletedTacticalAnswers(d3Cfg, d2Completed, { drafts: { P1: d2Completed }, checkins: [] }), null)

const d3Unclear = draftToObservation({
  availableOption: 'unclear',
  executedAction: 'unclear',
  optionVisibility: 'unclear',
}, d3Cfg, 0)
assert.ok(d3Unclear)
const d3Observation = draftToObservation({
  availableOption: 'wing',
  executedAction: 'pass',
  optionVisibility: 'clearly_visible',
}, d3Cfg, 0)
assert.ok(d3Observation)
const d3Completed = {
  [d3Cfg.logsKey]: [d3Observation, d3Observation, d3Observation],
  [d3Cfg.patternKey]: 'positioning',
  [d3Cfg.stageKey]: 'complete',
}
assert.equal(findCompletedTacticalAnswers(d3Cfg, d3Completed, { drafts: { P1: d3Completed }, checkins: [] })?.[d3Cfg.stageKey], 'complete')
assert.equal(findCompletedTacticalAnswers(d3Cfg, {}, { drafts: { P1: d1Completed }, checkins: [] }), null)
assert.equal(findCompletedTacticalAnswers(d3Cfg, {}, { drafts: { P1: d2Completed }, checkins: [] }), null)

const a2d4 = a2.drills.find((drill: { id: string }) => drill.id === 'A2_D4')
const a2d5 = a2.drills.find((drill: { id: string }) => drill.id === 'A2_D5')
assert.equal(a2d4.drill_type, 'tactical_observation')
assert.equal(a2d4.config.mechanic, 'tactical_observation')
assert.equal(a2d4.title, 'Raum & Zeit erkennen')
assert.equal(a2d4.config.observations_key, 'tactical_space_time_observations')
assert.notEqual(a2d4.config.observations_key, a2d1.config.observations_key)
assert.notEqual(a2d4.config.observations_key, a2d2.config.observations_key)
assert.notEqual(a2d4.config.observations_key, a2d3.config.observations_key)
assert.ok(a2d4.didactics.observation_guide.ignore.some((item: string) => item.includes('Transition')))
assert.ok(a2d4.didactics.observation_guide.ignore.some((item: string) => item.includes('richtige')))
assert.ok(a2d4.didactics.observation_guide.ignore.some((item: string) => item.includes('Stabilität')))

const d4Cfg = resolveTacticalObservationConfig(a2d4.config)
assert.equal(d4Cfg.layers.map((layer) => layer.id).join(','), 'space_available,time_available,influencing_factor')
assert.equal(d4Cfg.layers[0].options.map((option) => option.id).join(','), 'much_space,limited_space,little_space,unclear')
assert.equal(d4Cfg.layers[1].options.map((option) => option.id).join(','), 'much_time,short_window,under_pressure,unclear')
assert.equal(d4Cfg.layers[2].options.map((option) => option.id).join(','), 'space,time,opponent_pressure,support,unclear')
assert.equal(d4Cfg.logsKey, 'tactical_space_time_observations')
assert.equal(canEvaluateObservations(2, d4Cfg.minObservations), false)
assert.equal(canEvaluateObservations(3, d4Cfg.minObservations), true)
assert.equal(canEvaluateObservations(5, d4Cfg.minObservations), true)
assert.equal(canAddObservation(6, d4Cfg.maxObservations), false)
assert.equal(canAddObservation(7, d4Cfg.maxObservations), false)

assert.equal(findCompletedTacticalAnswers(d4Cfg, d1Completed, { drafts: { P1: d1Completed }, checkins: [] }), null)
assert.equal(findCompletedTacticalAnswers(d4Cfg, d2Completed, { drafts: { P1: d2Completed }, checkins: [] }), null)
assert.equal(findCompletedTacticalAnswers(d4Cfg, d3Completed, { drafts: { P1: d3Completed }, checkins: [] }), null)

const d4Unclear = draftToObservation({
  spaceAvailable: 'unclear',
  timeAvailable: 'unclear',
  influencingFactor: 'unclear',
}, d4Cfg, 0)
assert.ok(d4Unclear)
const d4Observation = draftToObservation({
  spaceAvailable: 'much_space',
  timeAvailable: 'short_window',
  influencingFactor: 'opponent_pressure',
}, d4Cfg, 0)
assert.ok(d4Observation)
const d4Completed = {
  [d4Cfg.logsKey]: [d4Observation, d4Observation, d4Observation],
  [d4Cfg.patternKey]: 'spacing',
  [d4Cfg.stageKey]: 'complete',
}
assert.equal(findCompletedTacticalAnswers(d4Cfg, d4Completed, { drafts: { P1: d4Completed }, checkins: [] })?.[d4Cfg.stageKey], 'complete')
assert.equal(findCompletedTacticalAnswers(d4Cfg, {}, { drafts: { P1: d1Completed }, checkins: [] }), null)
assert.equal(findCompletedTacticalAnswers(d4Cfg, {}, { drafts: { P1: d3Completed }, checkins: [] }), null)

assert.equal(a2d5.drill_type, 'tactical_observation')
assert.equal(a2d5.config.mechanic, 'tactical_observation')
assert.equal(a2d5.title, 'Strukturentwicklung erkennen')
assert.equal(a2d5.config.observations_key, 'tactical_structure_dev_observations')
assert.notEqual(a2d5.config.observations_key, a2d1.config.observations_key)
assert.notEqual(a2d5.config.observations_key, a2d2.config.observations_key)
assert.notEqual(a2d5.config.observations_key, a2d3.config.observations_key)
assert.notEqual(a2d5.config.observations_key, a2d4.config.observations_key)
assert.ok(a2d5.didactics.observation_guide.ignore.some((item: string) => item.includes('Transition')))
assert.ok(a2d5.didactics.observation_guide.ignore.some((item: string) => item.includes('gute')))
assert.equal(JSON.stringify(a2d5).toLowerCase().includes('strukturqualität'), false)

const d5Cfg = resolveTacticalObservationConfig(a2d5.config)
assert.equal(d5Cfg.layers.map((layer) => layer.id).join(','), 'support_continuity,option_continuity,structure_state')
assert.equal(d5Cfg.layers[0].options.map((option) => option.id).join(','), 'maintained,partial,lost,unclear')
assert.equal(d5Cfg.layers[1].options.map((option) => option.id).join(','), 'multiple_remain,one_remains,few_options,unclear')
assert.equal(d5Cfg.layers[2].options.map((option) => option.id).join(','), 'stable,changing,breaking_down,unclear')
assert.equal(d5Cfg.logsKey, 'tactical_structure_dev_observations')
assert.equal(canEvaluateObservations(2, d5Cfg.minObservations), false)
assert.equal(canEvaluateObservations(3, d5Cfg.minObservations), true)
assert.equal(canEvaluateObservations(5, d5Cfg.minObservations), true)
assert.equal(canAddObservation(6, d5Cfg.maxObservations), false)
assert.equal(canAddObservation(7, d5Cfg.maxObservations), false)

assert.equal(findCompletedTacticalAnswers(d5Cfg, d1Completed, { drafts: { P1: d1Completed }, checkins: [] }), null)
assert.equal(findCompletedTacticalAnswers(d5Cfg, d2Completed, { drafts: { P1: d2Completed }, checkins: [] }), null)
assert.equal(findCompletedTacticalAnswers(d5Cfg, d3Completed, { drafts: { P1: d3Completed }, checkins: [] }), null)
assert.equal(findCompletedTacticalAnswers(d5Cfg, d4Completed, { drafts: { P1: d4Completed }, checkins: [] }), null)

const d5Unclear = draftToObservation({
  supportContinuity: 'unclear',
  optionContinuity: 'unclear',
  structureState: 'unclear',
}, d5Cfg, 0)
assert.ok(d5Unclear)
const d5Observation = draftToObservation({
  supportContinuity: 'maintained',
  optionContinuity: 'multiple_remain',
  structureState: 'stable',
}, d5Cfg, 0)
assert.ok(d5Observation)
const d5Completed = {
  [d5Cfg.logsKey]: [d5Observation, d5Observation, d5Observation],
  [d5Cfg.patternKey]: 'support',
  [d5Cfg.stageKey]: 'complete',
}
assert.equal(findCompletedTacticalAnswers(d5Cfg, d5Completed, { drafts: { P1: d5Completed }, checkins: [] })?.[d5Cfg.stageKey], 'complete')
assert.equal(findCompletedTacticalAnswers(d5Cfg, {}, { drafts: { P1: d1Completed }, checkins: [] }), null)
assert.equal(findCompletedTacticalAnswers(d5Cfg, {}, { drafts: { P1: d4Completed }, checkins: [] }), null)
assert.equal(d5Completed.space_feel, undefined)

const d2Result = computeTacticalObservationResult([
  { id: '1', order: 1, values: { availableOption: 'center', optionType: 'direct_option', optionCount: 'one_clear' } },
  { id: '2', order: 2, values: { availableOption: 'wing', optionType: 'next_option', optionCount: 'multiple' } },
  { id: '3', order: 3, values: { availableOption: 'defense', optionType: 'safety_option', optionCount: 'multiple' } },
  { id: '4', order: 4, values: { availableOption: 'center', optionType: 'direct_option', optionCount: 'one_clear' } },
], d2Cfg)
assert.equal(d2Result.layerCounts.optionType.direct_option, 2)
assert.equal(d2Result.layerCounts.optionType.next_option, 1)
assert.equal(d2Result.layerCounts.optionType.safety_option, 1)
assert.equal(resultHasNumericScore(d2Result), false)

const d3Result = computeTacticalObservationResult([
  { id: '1', order: 1, values: { availableOption: 'wing', executedAction: 'pass', optionVisibility: 'clearly_visible' } },
  { id: '2', order: 2, values: { availableOption: 'center', executedAction: 'carry', optionVisibility: 'partially_visible' } },
  { id: '3', order: 3, values: { availableOption: 'defense', executedAction: 'reset', optionVisibility: 'surprising' } },
  { id: '4', order: 4, values: { availableOption: 'unclear', executedAction: 'unclear', optionVisibility: 'unclear' } },
], d3Cfg)
assert.equal(d3Result.layerCounts.executedAction.pass, 1)
assert.equal(d3Result.layerCounts.executedAction.carry, 1)
assert.equal(d3Result.layerCounts.optionVisibility.clearly_visible, 1)
assert.equal(d3Result.unclearCount, 1)
assert.equal(resultHasNumericScore(d3Result), false)
assert.equal(JSON.stringify(d3Result).includes('gute'), false)
assert.equal(JSON.stringify(d3Result).includes('falsche'), false)

const d4Result = computeTacticalObservationResult([
  { id: '1', order: 1, values: { spaceAvailable: 'much_space', timeAvailable: 'short_window', influencingFactor: 'opponent_pressure' } },
  { id: '2', order: 2, values: { spaceAvailable: 'limited_space', timeAvailable: 'much_time', influencingFactor: 'space' } },
  { id: '3', order: 3, values: { spaceAvailable: 'little_space', timeAvailable: 'under_pressure', influencingFactor: 'support' } },
  { id: '4', order: 4, values: { spaceAvailable: 'unclear', timeAvailable: 'unclear', influencingFactor: 'unclear' } },
], d4Cfg)
assert.equal(d4Result.layerCounts.spaceAvailable.much_space, 1)
assert.equal(d4Result.layerCounts.timeAvailable.short_window, 1)
assert.equal(d4Result.layerCounts.influencingFactor.opponent_pressure, 1)
assert.equal(d4Result.unclearCount, 1)
assert.equal(resultHasNumericScore(d4Result), false)
assert.equal(JSON.stringify(d4Result).includes('gute'), false)
assert.equal(JSON.stringify(d4Result).includes('falsche'), false)

const d5Result = computeTacticalObservationResult([
  { id: '1', order: 1, values: { supportContinuity: 'maintained', optionContinuity: 'multiple_remain', structureState: 'stable' } },
  { id: '2', order: 2, values: { supportContinuity: 'partial', optionContinuity: 'one_remains', structureState: 'changing' } },
  { id: '3', order: 3, values: { supportContinuity: 'lost', optionContinuity: 'few_options', structureState: 'breaking_down' } },
  { id: '4', order: 4, values: { supportContinuity: 'unclear', optionContinuity: 'unclear', structureState: 'unclear' } },
], d5Cfg)
assert.equal(d5Result.layerCounts.supportContinuity.maintained, 1)
assert.equal(d5Result.layerCounts.optionContinuity.multiple_remain, 1)
assert.equal(d5Result.layerCounts.structureState.stable, 1)
assert.equal(d5Result.unclearCount, 1)
assert.equal(resultHasNumericScore(d5Result), false)
assert.equal(JSON.stringify(d5Result).includes('gute'), false)
assert.equal(JSON.stringify(d5Result).includes('schlecht'), false)

const mechanicDir = dirname(fileURLToPath(import.meta.url))
for (const file of ['tacticalLogic.ts', 'TacticalObservationDrill.tsx', 'TacticalObservationSummary.tsx', 'types.ts']) {
  const src = readFileSync(join(mechanicDir, file), 'utf8')
  assert.equal(src.includes('A2_D'), false, `${file} must not special-case A2 drills`)
  assert.equal(src.includes('A1_D'), false, `${file} must not special-case A1 drills`)
}

const css = readFileSync(join(mechanicDir, 'TacticalObservationSummary.module.css'), 'utf8')
assert.match(css, /overflow-x:\s*hidden/)
const drillCss = readFileSync(join(mechanicDir, 'TacticalObservationDrill.module.css'), 'utf8')
assert.match(drillCss, /overflow-x:\s*hidden/)
assert.match(drillCss, /hover: hover/)
assert.match(drillCss, /min-height: 44px/)

console.log('tacticalObservation tacticalLogic tests OK')
