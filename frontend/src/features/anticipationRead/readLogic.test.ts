import assert from 'node:assert/strict'
import { appendSidequest } from '../../utils/sessionSidequests.ts'
import {
  OTHER_ACTION_ID,
  NONE_REFLECTION_ID,
  UNCLEAR_REFLECTION_ID,
  actionChoiceOptions,
  canAddCue,
  canAddRead,
  canEvaluate,
  canSaveActualStep,
  canSaveAlternativeStep,
  canSaveBranchReviewStep,
  canSaveCueReviewStep,
  canSaveExpectStep,
  canSavePrioritizeStep,
  canSaveQualityStep,
  canSaveTriggersStep,
  canSaveUpdateDecideStep,
  canSaveUpdateInfoStep,
  canSaveUpdateReviewStep,
  computeAnticipationReadResult,
  draftToObservation,
  emptyAnticipationDraft,
  emptyCue,
  isCompleteRead,
  isOtherActionSelected,
  nextAnticipationStep,
  normalizeCues,
  observationToDraft,
  resolvedAction,
  resultHasAccuracyScore,
  resolveAnticipationReadConfig,
  strongMismatchReads,
  usedCueCategories,
  validateAnticipationReadAnswers,
} from './readLogic.ts'
import type { AnticipationDraft, AnticipationObservation } from './types.ts'

const cfg = resolveAnticipationReadConfig({
  mechanic: 'anticipation_read',
  expectedActionOptions: ['Carry', 'Pass', 'Dump', 'Delay'],
  tracker: {
    minReads: 4,
    recommendedReads: 5,
    maxReads: 6,
    supportsGameClock: true,
    supportsSceneCapture: true,
  },
  minCues: 1,
  maxCues: 3,
})

assert.equal(cfg.minReads, 4)
assert.equal(cfg.recommendedReads, 5)
assert.equal(cfg.maxReads, 6)
assert.equal(cfg.minCues, 1)
assert.equal(cfg.maxCues, 3)
assert.equal(cfg.supportsCuePriority, false)
assert.equal(cfg.supportsScenarioBranches, false)
assert.equal(cfg.supportsPredictionUpdate, false)
assert.equal(cfg.mechanic, 'anticipation_read')
assert.equal(canEvaluate(3, cfg.minReads), false)
assert.equal(canEvaluate(4, cfg.minReads), true)
assert.equal(canEvaluate(5, cfg.minReads), true)
assert.equal(canAddRead(6, cfg.maxReads), false)
assert.equal(canAddRead(7, cfg.maxReads), false)
assert.equal(canAddRead(5, cfg.maxReads), true)
assert.equal(canAddCue(3, cfg.maxCues), false)
assert.equal(canAddCue(2, cfg.maxCues), true)

const freeformCfg = resolveAnticipationReadConfig({ mechanic: 'anticipation_read' })
assert.deepEqual(freeformCfg.expectedActionOptions, [])
assert.equal(actionChoiceOptions(freeformCfg).length, 0)

const options = actionChoiceOptions(cfg)
assert.equal(options.some((item) => item.value === 'Pass'), true)
assert.equal(options.some((item) => item.value === OTHER_ACTION_ID), true)
assert.equal(resolvedAction('Pass', 'ignored', cfg.expectedActionOptions), 'Pass')
assert.equal(resolvedAction(OTHER_ACTION_ID, 'Rim', cfg.expectedActionOptions), 'Rim')
assert.equal(resolvedAction('', 'Skate', []), 'Skate')
assert.equal(isOtherActionSelected(OTHER_ACTION_ID, cfg.expectedActionOptions), true)
assert.equal(isOtherActionSelected('Pass', cfg.expectedActionOptions), false)

function cue(label: string, category = 'support'): ReturnType<typeof emptyCue> {
  return { ...emptyCue(category), label }
}

function baseExpect(patch: Partial<AnticipationDraft> = {}): AnticipationDraft {
  return {
    ...emptyAnticipationDraft(),
    expectedActionOptionId: 'Pass',
    expectedAction: 'Pass',
    confidence: 'medium',
    cues: [cue('Center inside support')],
    ...patch,
  }
}

assert.equal(canSaveExpectStep(baseExpect(), cfg), true)
assert.equal(canSaveExpectStep(baseExpect({ cues: [] }), cfg), false)
assert.equal(canSaveExpectStep(baseExpect({ expectedActionOptionId: '', expectedAction: '' }), cfg), false)
assert.equal(canSaveExpectStep(baseExpect({ confidence: '' }), cfg), false)
assert.equal(
  canSaveExpectStep(baseExpect({
    cues: [cue('a'), cue('b'), cue('c'), cue('d')],
  }), cfg),
  true,
)
assert.equal(normalizeCues([cue('a'), cue('b'), cue('c'), cue('d')], 3).length, 3)
assert.equal(normalizeCues([cue('a'), { id: 'x', label: '  ' }], 3).length, 1)

const actualReady = baseExpect({
  step: 'actual',
  actualActionOptionId: 'Dump',
  actualAction: 'Dump',
  outcomeMatch: 'different',
})
assert.equal(canSaveActualStep(actualReady, cfg), true)
assert.equal(canSaveActualStep(baseExpect({ actualAction: '', outcomeMatch: 'matched' }), cfg), false)
assert.equal(canSaveQualityStep(baseExpect({ readQuality: 'well_supported' })), true)
assert.equal(canSaveQualityStep(baseExpect()), false)

const matchedWell = draftToObservation(
  baseExpect({
    actualActionOptionId: 'Pass',
    actualAction: 'Pass',
    outcomeMatch: 'matched',
    readQuality: 'well_supported',
    period: 'P1',
    gameClock: '12:10',
    sceneId: 'sc-1',
  }),
  cfg,
  null,
  1,
)
assert.ok(matchedWell)
assert.equal(matchedWell!.expectedAction, 'Pass')
assert.equal(matchedWell!.actualAction, 'Pass')
assert.equal(matchedWell!.outcomeMatch, 'matched')
assert.equal(matchedWell!.readQuality, 'well_supported')
assert.equal(matchedWell!.confidence, 'medium')
assert.equal(matchedWell!.sceneId, 'sc-1')
assert.equal(isCompleteRead(matchedWell!, 1), true)

const goodDespiteDifferent = draftToObservation(
  baseExpect({
    actualActionOptionId: 'Dump',
    actualAction: 'Dump',
    outcomeMatch: 'different',
    readQuality: 'well_supported',
    cues: [cue('Center klar frei'), cue('Carrier zur Mitte geöffnet', 'body_orientation')],
  }),
  cfg,
  null,
  2,
)
assert.ok(goodDespiteDifferent)
assert.equal(goodDespiteDifferent!.outcomeMatch, 'different')
assert.equal(goodDespiteDifferent!.readQuality, 'well_supported')

const hitDespiteWeak = draftToObservation(
  baseExpect({
    expectedActionOptionId: 'Dump',
    expectedAction: 'Dump',
    confidence: 'high',
    cues: [cue('Gefühl', 'other')],
    actualActionOptionId: 'Dump',
    actualAction: 'Dump',
    outcomeMatch: 'matched',
    readQuality: 'weakly_supported',
  }),
  cfg,
  null,
  3,
)
assert.ok(hitDespiteWeak)
assert.equal(hitDespiteWeak!.outcomeMatch, 'matched')
assert.equal(hitDespiteWeak!.readQuality, 'weakly_supported')

const otherAction = draftToObservation(
  baseExpect({
    expectedActionOptionId: OTHER_ACTION_ID,
    expectedAction: 'Reverse',
    actualActionOptionId: OTHER_ACTION_ID,
    actualAction: 'Reverse',
    outcomeMatch: 'matched',
    readQuality: 'partly_supported',
  }),
  cfg,
  null,
  4,
)
assert.ok(otherAction)
assert.equal(otherAction!.expectedAction, 'Reverse')
assert.equal(otherAction!.actualAction, 'Reverse')

const freeformRead = draftToObservation(
  {
    ...emptyAnticipationDraft(),
    expectedAction: 'First Pass',
    confidence: 'low',
    cues: [cue('D unter Druck an der Wand', 'pressure')],
    actualAction: 'Rim',
    outcomeMatch: 'different',
    readQuality: 'partly_supported',
  },
  freeformCfg,
  null,
  1,
)
assert.ok(freeformRead)
assert.equal(freeformRead!.expectedAction, 'First Pass')
assert.equal(freeformRead!.actualAction, 'Rim')

const roundtrip = observationToDraft(matchedWell!, cfg.expectedActionOptions)
assert.equal(roundtrip.expectedAction, 'Pass')
assert.equal(roundtrip.expectedActionOptionId, 'Pass')
assert.equal(roundtrip.outcomeMatch, 'matched')
assert.equal(roundtrip.readQuality, 'well_supported')
assert.equal(roundtrip.sceneId, 'sc-1')
assert.equal(roundtrip.gameClock, '12:10')

const reads: AnticipationObservation[] = [
  matchedWell!,
  goodDespiteDifferent!,
  hitDespiteWeak!,
  otherAction!,
  {
    ...goodDespiteDifferent!,
    id: 'read-5',
    order: 5,
    expectedAction: 'Carry',
    actualAction: 'Delay',
    outcomeMatch: 'partly_matched',
    readQuality: 'well_supported',
    confidence: 'high',
    supportingCues: [cue('Raum nach innen', 'available_space')],
  },
]

assert.equal(validateAnticipationReadAnswers(cfg, { [cfg.logsKey]: reads.slice(0, 3) }), 'Bitte erfasse mindestens 4 Reads.')
assert.match(
  String(validateAnticipationReadAnswers(cfg, {
    [cfg.logsKey]: [...reads, { ...matchedWell!, id: 'extra-1' }, { ...matchedWell!, id: 'extra-2' }],
  })),
  /Maximal 6/,
)

const completeAnswers = {
  [cfg.logsKey]: reads,
  [cfg.strongMismatchKey]: goodDespiteDifferent!.id,
  [cfg.helpfulCueKey]: 'support',
  [cfg.overconfidenceKey]: 'single',
}
assert.equal(validateAnticipationReadAnswers(cfg, completeAnswers), null)
assert.ok(cfg.resultKey)

const result = computeAnticipationReadResult(reads, {
  selectedStrongReadDespiteMismatchId: goodDespiteDifferent!.id,
  mostHelpfulCueCategory: 'support',
  overconfidenceAssessment: 'single',
})
assert.equal(result.totalReads, 5)
assert.equal(result.outcomeMatchDistribution.matched, 3)
assert.equal(result.outcomeMatchDistribution.partlyMatched, 1)
assert.equal(result.outcomeMatchDistribution.different, 1)
assert.equal(result.readQualityDistribution.wellSupported, 3)
assert.equal(result.readQualityDistribution.partlySupported, 1)
assert.equal(result.readQualityDistribution.weaklySupported, 1)
assert.equal(result.readQualityDistribution.unclear, 0)
assert.equal(resultHasAccuracyScore(result), false)
assert.equal('accuracyPercent' in result, false)
assert.equal(JSON.stringify(result).includes('predictionAccuracy'), false)
assert.equal(JSON.stringify(result).includes('%'), false)
assert.ok(result.cueCategoryCounts.support >= 1)
assert.equal(strongMismatchReads(reads).length >= 1, true)
assert.equal(usedCueCategories(reads).includes('support'), true)
assert.equal(result.highConfidenceDifferentCount, 0)

const highConfDifferent = computeAnticipationReadResult([{
  ...goodDespiteDifferent!,
  confidence: 'high',
  outcomeMatch: 'different',
}])
assert.equal(highConfDifferent.highConfidenceDifferentCount, 1)

assert.equal(
  validateAnticipationReadAnswers(cfg, {
    ...completeAnswers,
    [cfg.strongMismatchKey]: '',
  }),
  'Bitte markiere einen gut begründeten Read, der anders ausging – oder wähle keiner / unklar.',
)
assert.equal(
  validateAnticipationReadAnswers(cfg, {
    ...completeAnswers,
    [cfg.strongMismatchKey]: NONE_REFLECTION_ID,
  }),
  null,
)
assert.equal(
  validateAnticipationReadAnswers(cfg, {
    ...completeAnswers,
    [cfg.strongMismatchKey]: UNCLEAR_REFLECTION_ID,
  }),
  null,
)

const afterSidequest = appendSidequest({
  [cfg.logsKey]: reads.slice(0, 3),
  [cfg.draftKey]: {
    ...baseExpect(),
    step: 'actual',
    actualAction: '',
    period: 'P2',
    gameClock: '08:12',
    sceneId: 'open-scene',
  },
  [cfg.stageKey]: 'observe',
}, {
  id: 'sq1',
  type: 'special_teams_sidequest',
  category: 'special_teams',
  gameState: 'power_play',
  miniDrillId: 'mini',
  phase: 'P1',
  answers: { note: 'pp' },
  createdAt: '2026-08-18T00:00:00.000Z',
})
assert.equal(afterSidequest[cfg.logsKey].length, 3)
assert.equal(afterSidequest[cfg.draftKey].step, 'actual')
assert.equal(afterSidequest[cfg.draftKey].expectedAction, 'Pass')
assert.equal(afterSidequest[cfg.draftKey].gameClock, '08:12')
assert.equal(afterSidequest[cfg.draftKey].sceneId, 'open-scene')
assert.equal(afterSidequest[cfg.stageKey], 'observe')

const reloadBeforeActual = afterSidequest[cfg.draftKey]
assert.equal(reloadBeforeActual.expectedActionOptionId, 'Pass')
assert.equal(reloadBeforeActual.actualAction, '')
assert.equal(canSaveActualStep(reloadBeforeActual, cfg), false)

const d2 = resolveAnticipationReadConfig({
  mechanic: 'cue_priority',
  expectedActionOptions: ['Pass', 'Dump'],
  minCues: 1,
  recommendedCues: 3,
  maxCues: 5,
})
assert.equal(d2.supportsCuePriority, true)
assert.equal(d2.supportsScenarioBranches, false)
assert.equal(d2.supportsPredictionUpdate, false)
assert.equal(d2.mechanic, 'cue_priority')
assert.equal(d2.maxCues, 5)
assert.equal(canAddCue(5, d2.maxCues), false)
assert.equal(canAddCue(4, d2.maxCues), true)

const prioritized = baseExpect({
  cues: [
    { ...cue('Center öffnet Raum', 'support'), priority: 'primary' },
    { ...cue('Wall wird geschlossen', 'pressure'), priority: 'supporting' },
    { ...cue('Defender tief', 'timing'), priority: 'secondary' },
  ],
  actualActionOptionId: 'Dump',
  actualAction: 'Dump',
  outcomeMatch: 'different',
  readQuality: 'well_supported',
  cueReview: 'yes',
})
assert.equal(canSavePrioritizeStep(prioritized, d2), true)
assert.equal(canSaveCueReviewStep(prioritized, d2), true)
const d2obs = draftToObservation(prioritized, d2, null, 1)
assert.ok(d2obs)
assert.equal(d2obs!.supportingCues.find((item) => item.category === 'support')?.priority, 'primary')
assert.equal(d2obs!.cueReview, 'yes')
assert.equal(d2obs!.outcomeMatch, 'different')
assert.equal(d2obs!.readQuality, 'well_supported')

assert.equal(draftToObservation(baseExpect({
  actualActionOptionId: 'Pass',
  actualAction: 'Pass',
  outcomeMatch: 'matched',
  readQuality: 'well_supported',
  cueReview: 'yes',
}), d2, null, 1), null)

assert.equal(draftToObservation({ ...prioritized, cueReview: '' }, d2, null, 1), null)

const persistPriority = observationToDraft(d2obs!, d2.expectedActionOptions)
assert.equal(persistPriority.cues.find((item) => item.category === 'support')?.priority, 'primary')
assert.equal(persistPriority.cueReview, 'yes')

const d2reads = [0, 1, 2, 3].map((index) => ({ ...d2obs!, id: `d2-${index}`, order: index + 1 }))
assert.equal(validateAnticipationReadAnswers(d2, {
  [d2.logsKey]: d2reads,
  [d2.helpfulCueKey]: 'support',
  [d2.overweightedCueKey]: NONE_REFLECTION_ID,
  [d2.futureCueKey]: 'body_orientation',
}), null)

const d2result = computeAnticipationReadResult(d2reads)
assert.ok(d2result.cuePriority)
assert.equal(d2result.cuePriority?.primaryCueDistribution.support, 4)
assert.equal(resultHasAccuracyScore(d2result), false)
assert.equal(d2result.scenarioBranches, undefined)

const d3 = resolveAnticipationReadConfig({
  mechanic: 'scenario_branches',
  expectedActionOptions: ['Pass', 'Carry', 'Dump', 'Shot'],
  minTriggers: 1,
  maxTriggers: 3,
  triggerSuggestions: ['Passlinie wird geschlossen', 'Raum vor Carrier öffnet sich'],
})
assert.equal(d3.mechanic, 'scenario_branches')
assert.equal(d3.supportsScenarioBranches, true)
assert.equal(d3.supportsCuePriority, false)
assert.equal(d3.supportsPredictionUpdate, false)
assert.equal(d3.minTriggers, 1)
assert.equal(d3.maxTriggers, 3)
assert.equal(nextAnticipationStep('expect', d3), 'alternative')
assert.equal(nextAnticipationStep('alternative', d3), 'triggers')
assert.equal(nextAnticipationStep('triggers', d3), 'actual')
assert.equal(nextAnticipationStep('quality', d3), 'branchReview')
assert.equal(nextAnticipationStep('branchReview', d3), 'save')
assert.equal(nextAnticipationStep('expect', cfg), 'actual')
assert.equal(nextAnticipationStep('quality', cfg), 'save')
assert.equal(nextAnticipationStep('expect', d2), 'prioritize')
assert.equal(nextAnticipationStep('quality', d2), 'cueReview')
assert.equal(nextAnticipationStep('cueReview', d2), 'save')

const d3draft = {
  ...baseExpect(),
  alternativeActionOptionId: 'Carry',
  alternativeAction: 'Carry',
  triggers: [{ id: 't1', description: 'Center geschlossen', cueCategory: 'pressure' }],
  actualActionOptionId: 'Carry',
  actualAction: 'Carry',
  outcomeMatch: 'different',
  readQuality: 'well_supported',
  alternativeOccurred: 'yes' as const,
  triggerRelevant: 'yes' as const,
}
assert.equal(canSaveAlternativeStep(d3draft, d3), true)
assert.equal(canSaveAlternativeStep({ ...d3draft, alternativeActionOptionId: 'Pass', alternativeAction: 'Pass' }, d3), false)
assert.equal(canSaveTriggersStep(d3draft, d3), true)
assert.equal(canSaveTriggersStep({ ...d3draft, triggers: [] }, d3), false)
assert.equal(canSaveTriggersStep({
  ...d3draft,
  triggers: [
    { id: 'a', description: 'one' },
    { id: 'b', description: 'two' },
    { id: 'c', description: 'three' },
    { id: 'd', description: 'four' },
  ],
}, d3), false)
assert.equal(canSaveBranchReviewStep(d3draft, d3), true)
assert.equal(canSaveBranchReviewStep({ ...d3draft, triggerRelevant: '' }, d3), false)
assert.equal(canSaveAlternativeStep(baseExpect(), cfg), true)
assert.equal(canSaveTriggersStep(baseExpect(), cfg), true)

const d3obs = draftToObservation(d3draft, d3, null, 1)
assert.ok(d3obs)
assert.equal(d3obs!.expectedAction, 'Pass')
assert.equal(d3obs!.alternativeAction, 'Carry')
assert.equal(d3obs!.branchTriggers?.[0]?.description, 'Center geschlossen')
assert.equal(d3obs!.alternativeOccurred, 'yes')
assert.equal(d3obs!.triggerRelevant, 'yes')
assert.equal(d3obs!.scenarioBranches?.find((item) => item.role === 'primary')?.action, 'Pass')
assert.equal(d3obs!.scenarioBranches?.find((item) => item.role === 'alternative')?.action, 'Carry')
assert.deepEqual(d3obs!.scenarioBranches?.find((item) => item.role === 'alternative')?.triggerConditions, ['Center geschlossen'])
assert.equal(isCompleteRead(d3obs!, 1, false, true), true)
assert.equal(isCompleteRead(matchedWell!, 1, false, true), false)

assert.equal(draftToObservation({ ...d3draft, triggers: [] }, d3, null, 1), null)
assert.equal(draftToObservation({ ...d3draft, alternativeOccurred: '', triggerRelevant: 'yes' }, d3, null, 1), null)

const d3roundtrip = observationToDraft(d3obs!, d3.expectedActionOptions)
assert.equal(d3roundtrip.expectedAction, 'Pass')
assert.equal(d3roundtrip.alternativeAction, 'Carry')
assert.equal(d3roundtrip.triggers[0]?.description, 'Center geschlossen')
assert.equal(d3roundtrip.alternativeOccurred, 'yes')
assert.equal(d3roundtrip.triggerRelevant, 'yes')

const d3reads = [0, 1, 2, 3].map((index) => ({
  ...d3obs!,
  id: `d3-${index}`,
  order: index + 1,
}))
assert.equal(validateAnticipationReadAnswers(d3, {
  [d3.logsKey]: d3reads,
}), 'Bitte markiere, bei welchem Read die Alternative besonders wichtig war – oder keiner / unklar.')
assert.equal(validateAnticipationReadAnswers(d3, {
  [d3.logsKey]: d3reads,
  [d3.importantAlternativeKey]: d3reads[0].id,
  [d3.strongestTriggerKey]: 'Center geschlossen',
  [d3.linearThinkingKey]: 'sometimes',
}), null)

const d3result = computeAnticipationReadResult(d3reads, {
  importantAlternativeReadId: d3reads[0].id,
  strongestTriggerDescription: 'Center geschlossen',
  linearThinkingAssessment: 'sometimes',
})
assert.ok(d3result.scenarioBranches)
assert.equal(d3result.scenarioBranches?.primaryActions[0], 'Pass')
assert.equal(d3result.scenarioBranches?.alternativeActions[0], 'Carry')
assert.equal(d3result.scenarioBranches?.branchTriggeredCount, 4)
assert.equal(d3result.scenarioBranches?.triggerRecognizedCount, 4)
assert.equal(d3result.scenarioBranches?.commonTriggerPatterns?.['Center geschlossen'], 4)
assert.equal(resultHasAccuracyScore(d3result), false)
assert.equal('branchAccuracy' in d3result, false)
assert.equal(JSON.stringify(d3result.scenarioBranches).includes('%'), false)
assert.equal(d3result.cuePriority, undefined)

const both = resolveAnticipationReadConfig({
  mechanic: 'scenario_branches',
  supportsCuePriority: true,
})
assert.equal(both.mechanic, 'scenario_branches')
assert.equal(both.supportsScenarioBranches, true)
assert.equal(both.supportsCuePriority, true)
assert.equal(nextAnticipationStep('expect', both), 'prioritize')
assert.equal(nextAnticipationStep('prioritize', both), 'alternative')
assert.equal(nextAnticipationStep('quality', both), 'cueReview')
assert.equal(nextAnticipationStep('cueReview', both), 'branchReview')

const d4 = resolveAnticipationReadConfig({
  mechanic: 'prediction_update',
  expectedActionOptions: ['Pass', 'Carry', 'Dump', 'Shot'],
  minUpdateTriggers: 1,
  maxUpdateTriggers: 1,
})
assert.equal(d4.mechanic, 'prediction_update')
assert.equal(d4.supportsPredictionUpdate, true)
assert.equal(d4.supportsScenarioBranches, false)
assert.equal(d4.supportsCuePriority, false)
assert.equal(d4.minReads, 4)
assert.equal(d4.recommendedReads, 4)
assert.equal(d4.maxReads, 5)
assert.equal(nextAnticipationStep('expect', d4), 'updateInfo')
assert.equal(nextAnticipationStep('updateInfo', d4), 'updateDecide')
assert.equal(nextAnticipationStep('updateDecide', d4), 'actual')
assert.equal(nextAnticipationStep('quality', d4), 'updateReview')
assert.equal(nextAnticipationStep('updateReview', d4), 'save')
assert.equal(nextAnticipationStep('expect', d3), 'alternative')
assert.equal(nextAnticipationStep('expect', cfg), 'actual')

const keepDraft = {
  ...baseExpect(),
  updateTriggers: [{ id: 'u1', description: 'leichter Druck', cueCategory: 'pressure' }],
  updateDecision: 'keep' as const,
  updateReason: 'Passlinie bleibt offen',
  actualActionOptionId: 'Pass',
  actualAction: 'Pass',
  outcomeMatch: 'matched',
  readQuality: 'well_supported',
  updateQuality: 'appropriate' as const,
}
assert.equal(canSaveUpdateInfoStep(keepDraft, d4), true)
assert.equal(canSaveUpdateInfoStep({ ...keepDraft, updateTriggers: [] }, d4), false)
assert.equal(canSaveUpdateDecideStep(keepDraft, d4), true)
assert.equal(canSaveUpdateDecideStep({ ...keepDraft, updateReason: '' }, d4), false)
assert.equal(canSaveUpdateReviewStep(keepDraft, d4), true)
assert.equal(canSaveUpdateInfoStep(baseExpect(), cfg), true)
assert.equal(canSaveUpdateDecideStep(baseExpect(), cfg), true)

const keepObs = draftToObservation(keepDraft, d4, null, 1)
assert.ok(keepObs)
assert.equal(keepObs!.expectedAction, 'Pass')
assert.equal(keepObs!.updateDecision, 'keep')
assert.equal(keepObs!.updatedPrediction, 'Pass')
assert.equal(keepObs!.updateTriggers?.[0]?.description, 'leichter Druck')
assert.equal(keepObs!.predictionUpdate?.updateDecision, 'keep')
assert.equal(isCompleteRead(keepObs!, 1, false, false, true), true)

const changeDraft = {
  ...baseExpect(),
  updateTriggers: [{ id: 'u2', description: 'Passlinie geschlossen' }],
  updateDecision: 'change' as const,
  updatedPredictionOptionId: 'Carry',
  updatedPrediction: 'Carry',
  actualActionOptionId: 'Carry',
  actualAction: 'Carry',
  outcomeMatch: 'different',
  readQuality: 'partly_supported',
  updateQuality: 'too_late' as const,
}
assert.equal(canSaveUpdateDecideStep(changeDraft, d4), true)
assert.equal(canSaveUpdateDecideStep({ ...changeDraft, updatedPredictionOptionId: 'Pass', updatedPrediction: 'Pass' }, d4), false)
const changeObs = draftToObservation(changeDraft, d4, null, 2)
assert.ok(changeObs)
assert.equal(changeObs!.updateDecision, 'change')
assert.equal(changeObs!.updatedPrediction, 'Carry')
assert.equal(changeObs!.predictionUpdate?.updatedPrediction, 'Carry')

const d4roundtrip = observationToDraft(changeObs!, d4.expectedActionOptions)
assert.equal(d4roundtrip.expectedAction, 'Pass')
assert.equal(d4roundtrip.updateTriggers[0]?.description, 'Passlinie geschlossen')
assert.equal(d4roundtrip.updateDecision, 'change')
assert.equal(d4roundtrip.updatedPrediction, 'Carry')
assert.equal(d4roundtrip.updateQuality, 'too_late')

assert.equal(draftToObservation({ ...keepDraft, updateTriggers: [] }, d4, null, 1), null)

const d4reads = [
  { ...keepObs!, id: 'd4-0', order: 1 },
  { ...changeObs!, id: 'd4-1', order: 2 },
  { ...keepObs!, id: 'd4-2', order: 3 },
  { ...changeObs!, id: 'd4-3', order: 4 },
]
assert.equal(validateAnticipationReadAnswers(d4, { [d4.logsKey]: d4reads }), 'Bitte markiere, bei welchem Read du deine Einschätzung erfolgreich angepasst hast – oder keiner / unklar.')
assert.equal(validateAnticipationReadAnswers(d4, {
  [d4.logsKey]: d4reads,
  [d4.successfulUpdateKey]: d4reads[1].id,
  [d4.heldTooLongKey]: d4reads[0].id,
  [d4.strongestUpdateInfoKey]: 'Passlinie geschlossen',
}), null)

const d4result = computeAnticipationReadResult(d4reads)
assert.ok(d4result.predictionUpdates)
assert.equal(d4result.predictionUpdates?.keepCount, 2)
assert.equal(d4result.predictionUpdates?.changeCount, 2)
assert.equal(d4result.predictionUpdates?.updateQualityDistribution.appropriate, 2)
assert.equal(d4result.predictionUpdates?.updateQualityDistribution.tooLate, 2)
assert.equal(resultHasAccuracyScore(d4result), false)
assert.equal(JSON.stringify(d4result.predictionUpdates).includes('%'), false)
assert.equal(d4result.scenarioBranches, undefined)
assert.equal(d4result.cuePriority, undefined)

console.log('anticipationRead readLogic tests OK')
