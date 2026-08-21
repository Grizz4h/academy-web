import type { CueReviewJudgement } from '../cuePriority/types'
import {
  canSaveCuePriorities,
  computeCuePriorityResult,
  resolveCuePriorityConfig,
} from '../cuePriority/cueLogic'
import type { PatternLogOption } from '../patternLog/types'
import {
  buildScenarioBranches,
  canSaveAlternative,
  canSaveBranchReview,
  canSaveTriggers,
  computeScenarioBranchResult,
  emptyTrigger,
  isCompleteScenarioBranchRead,
  isLinearThinkingAssessment,
  normalizeTriggers,
  resolveScenarioBranchConfig,
  usedTriggerDescriptions,
} from '../scenarioBranches/branchLogic'
import {
  buildPredictionUpdate,
  canSaveUpdateDecision,
  canSaveUpdateQuality,
  canSaveUpdateTriggers,
  computePredictionUpdateResult,
  isCompletePredictionUpdate,
  resolvePredictionUpdateConfig,
  usedUpdateTriggerDescriptions,
} from '../predictionUpdate/updateLogic'
import type {
  AnticipationConfidence,
  AnticipationCue,
  AnticipationCueCategory,
  AnticipationDraft,
  AnticipationDraftStep,
  AnticipationExamplesHelp,
  AnticipationObservation,
  AnticipationOutcomeMatch,
  AnticipationReadConfig,
  AnticipationReadQuality,
  AnticipationReadResult,
  AnticipationReadStage,
  AnticipationSceneExample,
  OverconfidenceAssessment,
} from './types'
import {
  DEFAULT_CUE_CATEGORIES,
  NONE_REFLECTION_ID,
  OTHER_ACTION_ID,
  UNCLEAR_REFLECTION_ID,
} from './types'

export { NONE_REFLECTION_ID, OTHER_ACTION_ID, UNCLEAR_REFLECTION_ID }

const CUE_CATEGORY_SET = new Set<string>(DEFAULT_CUE_CATEGORIES)

export const CUE_CATEGORY_LABELS: Record<AnticipationCueCategory, string> = {
  positioning: 'Positionierung',
  pressure: 'Druck',
  support: 'Support',
  puck_orientation: 'Puck-/Stick-Ausrichtung',
  available_space: 'verfügbarer Raum',
  body_orientation: 'Körperorientierung',
  timing: 'Timing',
  player_movement: 'Spielerbewegung',
  other: 'andere',
}

export function cueCategoryLabel(category?: string | null): string {
  const key = String(category || '').trim()
  if (!key) return CUE_CATEGORY_LABELS.other
  if (key in CUE_CATEGORY_LABELS) return CUE_CATEGORY_LABELS[key as AnticipationCueCategory]
  return key
}

export function emptyAnticipationDraft(): AnticipationDraft {
  return {
    step: 'expect',
    situationLabel: '',
    expectedActionOptionId: '',
    expectedAction: '',
    confidence: '',
    cues: [emptyCue()],
    alternativeActionOptionId: '',
    alternativeAction: '',
    triggers: [emptyTrigger()],
    alternativeOccurred: '',
    triggerRelevant: '',
    updateTriggers: [emptyTrigger()],
    updateDecision: '',
    updatedPredictionOptionId: '',
    updatedPrediction: '',
    updateReason: '',
    updateQuality: '',
    actualActionOptionId: '',
    actualAction: '',
    outcomeMatch: '',
    readQuality: '',
    cueReview: '',
    period: '',
    gameClock: '',
    note: '',
    sceneId: '',
  }
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item || '').trim()).filter(Boolean)
}

function resolveCueCategories(raw: Record<string, unknown>): AnticipationCueCategory[] {
  const source = Array.isArray(raw.cueCategories)
    ? raw.cueCategories
    : Array.isArray(raw.cue_categories)
      ? raw.cue_categories
      : DEFAULT_CUE_CATEGORIES
  const next = source
    .map((item) => String(item || '').trim())
    .filter((item): item is AnticipationCueCategory => CUE_CATEGORY_SET.has(item))
  return next.length ? next : [...DEFAULT_CUE_CATEGORIES]
}

function resolveExamplesHelp(raw: Record<string, unknown>): AnticipationExamplesHelp | null {
  const source = (raw.scene_examples || raw.sceneExamples || raw.examples || null) as Record<string, unknown> | null
  if (!source || typeof source !== 'object') return null

  const suitableRaw = Array.isArray(source.suitable) ? source.suitable : []
  const suitable: AnticipationSceneExample[] = suitableRaw
    .map((item: any) => ({
      title: String(item?.title || '').trim(),
      description: String(item?.description || item?.text || '').trim(),
    }))
    .filter((item) => item.title && item.description)

  const unsuitableRaw = Array.isArray(source.unsuitable)
    ? source.unsuitable
    : Array.isArray(source.unsuitable_examples)
      ? source.unsuitable_examples
      : []
  const unsuitable = unsuitableRaw.map((item: any) => String(item || '').trim()).filter(Boolean)

  if (suitable.length === 0 && unsuitable.length === 0) return null

  return {
    title: String(source.title || 'Welche Szenen eignen sich?'),
    intro: source.intro ? String(source.intro) : undefined,
    suitable,
    unsuitableTitle: String(source.unsuitable_title || source.unsuitableTitle || 'Weniger geeignet'),
    unsuitable,
    footer: source.footer ? String(source.footer) : undefined,
  }
}

export function resolveAnticipationReadConfig(raw: Record<string, unknown> = {}): AnticipationReadConfig {
  const trackerBlock = (raw.tracker && typeof raw.tracker === 'object'
    ? (raw.tracker as Record<string, unknown>)
    : {})
  const cuePriority = resolveCuePriorityConfig(raw)
  const scenarioBranches = resolveScenarioBranchConfig(raw)
  const predictionUpdate = resolvePredictionUpdateConfig(raw)
  const supportsCuePriority = cuePriority.required
  const supportsScenarioBranches = scenarioBranches.enabled
  const supportsPredictionUpdate = predictionUpdate.enabled
  const defaultMaxCues = supportsCuePriority ? 5 : 3
  const defaultRecommendedCues = supportsCuePriority ? 3 : 2
  const defaultRecommendedReads = supportsPredictionUpdate ? 4 : 5
  const defaultMaxReads = supportsPredictionUpdate ? 5 : 6

  const minReads = Math.max(1, Number(trackerBlock.minReads || trackerBlock.minObservations || raw.minReads || raw.min_reads || 4))
  const recommendedReads = Math.max(
    minReads,
    Number(trackerBlock.recommendedReads || trackerBlock.recommendedObservations || raw.recommendedReads || raw.recommended_reads || defaultRecommendedReads),
  )
  const maxReads = Math.max(
    recommendedReads,
    Number(trackerBlock.maxReads || trackerBlock.maxObservations || raw.maxReads || raw.max_reads || defaultMaxReads),
  )
  const minCues = Math.max(1, Number(raw.minCues || raw.min_cues || trackerBlock.minCues || 1))
  const recommendedCues = Math.max(
    minCues,
    Number(raw.recommendedCues || raw.recommended_cues || trackerBlock.recommendedCues || defaultRecommendedCues),
  )
  const maxCues = Math.max(recommendedCues, Number(raw.maxCues || raw.max_cues || trackerBlock.maxCues || defaultMaxCues))

  const mechanic: AnticipationReadConfig['mechanic'] = supportsPredictionUpdate
    ? 'prediction_update'
    : supportsScenarioBranches
      ? 'scenario_branches'
      : supportsCuePriority
        ? 'cue_priority'
        : 'anticipation_read'
  const defaultRule = supportsPredictionUpdate
    ? 'Ein guter Read bleibt nicht stur – er passt sich an neue Informationen an.'
    : supportsScenarioBranches
      ? 'Antizipation bedeutet nicht, eine Zukunft vorherzusagen – sondern Wahrscheinlichkeiten zu ordnen.'
      : 'Antizipation ist eine begründete Erwartung – keine Vorhersage aus dem Bauch.'
  const defaultHint = supportsPredictionUpdate
    ? 'Nicht die erste Einschätzung entscheidet über Qualität, sondern wie gut du deine Einschätzung aktualisierst.'
    : supportsScenarioBranches
      ? 'Ein guter Read hat eine Hauptoption und kennt die wichtigste Alternative.'
      : 'Bewerte deinen Read nach seinen Hinweisen, nicht nur nach dem Outcome.'
  const defaultIntro = supportsPredictionUpdate
    ? 'Antizipation ist kein einmaliges Raten. Du bildest zuerst eine Erwartung, dann erscheint neue Information. Entscheide bewusst, ob dein Read bestehen bleibt oder sich ändern muss – und prüfe später, ob das Timing sinnvoll war.'
    : supportsScenarioBranches
      ? 'Spielsituationen haben selten nur eine mögliche Zukunft. Du nennst zuerst deine primäre Erwartung, dann die wahrscheinlichste Alternative – und welche konkreten Bedingungen diese Alternative wahrscheinlicher machen würden. Danach prüfst du, was tatsächlich passiert ist und ob dein Trigger relevant war.'
      : 'Gute Spieler und Beobachter warten nicht nur darauf, was passiert. Sie bilden vorher eine Erwartung. Entscheide vor der nächsten Aktion, was du für am wahrscheinlichsten hältst – und welche sichtbaren Hinweise dafür sprechen. Danach prüfst du nicht nur, ob du richtig lagst, sondern ob dein Read gut begründet war.'

  return {
    mechanic,
    minReads,
    recommendedReads,
    maxReads,
    expectedActionOptions: asStringArray(raw.expectedActionOptions || raw.expected_action_options),
    otherActionLabel: String(raw.otherActionLabel || raw.other_action_label || 'Andere').trim() || 'Andere',
    cueCategories: resolveCueCategories(raw),
    minCues,
    recommendedCues,
    maxCues,
    supportsConfidence: trackerBlock.supportsConfidence !== false && raw.supportsConfidence !== false,
    supportsGameClock: trackerBlock.supportsGameClock !== false && raw.supportsGameClock !== false && raw.supports_game_clock !== false,
    supportsSceneCapture: trackerBlock.supportsSceneCapture !== false && raw.supportsSceneCapture !== false,
    supportsCuePriority,
    supportsScenarioBranches,
    supportsPredictionUpdate,
    minTriggers: scenarioBranches.minTriggers,
    maxTriggers: scenarioBranches.maxTriggers,
    triggerSuggestions: scenarioBranches.triggerSuggestions,
    minUpdateTriggers: predictionUpdate.minUpdateTriggers,
    maxUpdateTriggers: predictionUpdate.maxUpdateTriggers,
    updateTriggerSuggestions: asStringArray(raw.updateTriggerSuggestions || raw.update_trigger_suggestions || raw.triggerSuggestions || raw.trigger_suggestions),
    logsKey: String(raw.logs_key || raw.logsKey || 'anticipation_read_observations'),
    draftKey: String(raw.draft_key || raw.draftKey || '__anticipation_read_draft'),
    stageKey: String(raw.stage_key || raw.stageKey || '__anticipation_read_stage'),
    editIndexKey: String(raw.edit_index_key || raw.editIndexKey || '__anticipation_read_edit_index'),
    addingMoreKey: String(raw.adding_more_key || raw.addingMoreKey || '__anticipation_read_adding_more'),
    strongMismatchKey: String(raw.strong_mismatch_key || raw.strongMismatchKey || 'strongReadDespiteMismatchId'),
    helpfulCueKey: String(raw.helpful_cue_key || raw.helpfulCueKey || 'mostHelpfulCueCategory'),
    overconfidenceKey: String(raw.overconfidence_key || raw.overconfidenceKey || 'overconfidenceAssessment'),
    overconfidenceReadKey: String(raw.overconfidence_read_key || raw.overconfidenceReadKey || 'overconfidenceReadId'),
    overweightedCueKey: String(raw.overweighted_cue_key || raw.overweightedCueKey || 'overweightedCueCategory'),
    futureCueKey: String(raw.future_cue_key || raw.futureCueKey || 'futureCueCategory'),
    importantAlternativeKey: String(raw.important_alternative_key || raw.importantAlternativeKey || 'importantAlternativeReadId'),
    strongestTriggerKey: String(raw.strongest_trigger_key || raw.strongestTriggerKey || 'strongestTriggerDescription'),
    linearThinkingKey: String(raw.linear_thinking_key || raw.linearThinkingKey || 'linearThinkingAssessment'),
    successfulUpdateKey: String(raw.successful_update_key || raw.successfulUpdateKey || 'successfulUpdateReadId'),
    heldTooLongKey: String(raw.held_too_long_key || raw.heldTooLongKey || 'heldTooLongReadId'),
    strongestUpdateInfoKey: String(raw.strongest_update_info_key || raw.strongestUpdateInfoKey || 'strongestUpdateInfo'),
    resultKey: String(raw.result_key || raw.resultKey || 'anticipation_read_result'),
    decisionRule: String(raw.decision_rule || raw.decisionRule || defaultRule),
    coreHint: String(raw.core_hint || raw.coreHint || defaultHint),
    introText: String(raw.intro_text || raw.introText || defaultIntro),
    examplesHelp: resolveExamplesHelp(raw),
  }
}

export function createObservationId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `read_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function createCueId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `cue_${crypto.randomUUID()}`
  }
  return `cue_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function emptyCue(category?: string): AnticipationCue {
  return {
    id: createCueId(),
    category: category || 'other',
    label: '',
  }
}

export function canEvaluate(count: number, minReads: number): boolean {
  return count >= minReads
}

export function canAddRead(count: number, maxReads: number): boolean {
  return count < maxReads
}

export function canAddCue(count: number, maxCues: number): boolean {
  return count < maxCues
}

export function normalizeCues(cues: AnticipationCue[] | null | undefined, maxCues: number): AnticipationCue[] {
  const cleaned = (cues || [])
    .map((cue) => ({
      id: String(cue?.id || createCueId()),
      category: String(cue?.category || '').trim() || undefined,
      label: String(cue?.label || '').trim(),
      priority: cue?.priority,
    }))
    .filter((cue) => cue.label)
  return cleaned.slice(0, Math.max(0, maxCues))
}

export function actionChoiceOptions(cfg: Pick<AnticipationReadConfig, 'expectedActionOptions' | 'otherActionLabel'>): Array<PatternLogOption<string>> {
  if (!cfg.expectedActionOptions.length) return []
  const seen = new Set<string>()
  const options: Array<PatternLogOption<string>> = []
  for (const label of cfg.expectedActionOptions) {
    if (seen.has(label)) continue
    seen.add(label)
    options.push({ value: label, label })
  }
  options.push({ value: OTHER_ACTION_ID, label: cfg.otherActionLabel })
  return options
}

export function resolvedAction(optionId: string, freeText: string, options: string[]): string {
  const text = String(freeText || '').trim()
  if (!options.length) return text
  if (optionId && optionId !== OTHER_ACTION_ID && options.includes(optionId)) return optionId
  return text
}

export function isOtherActionSelected(optionId: string, options: string[]): boolean {
  if (!options.length) return true
  return !optionId || optionId === OTHER_ACTION_ID || !options.includes(optionId)
}

function clockLooksValid(value: string): boolean {
  return !value || /^\d{1,2}(:\d{1,2})?$/.test(value.trim())
}

export function canSaveExpectStep(
  draft: AnticipationDraft,
  cfg: Pick<AnticipationReadConfig, 'expectedActionOptions' | 'minCues' | 'maxCues' | 'supportsConfidence' | 'supportsGameClock'>,
): boolean {
  const expected = resolvedAction(draft.expectedActionOptionId, draft.expectedAction, cfg.expectedActionOptions)
  if (!expected) return false
  if (cfg.supportsConfidence && !draft.confidence) return false
  const cues = normalizeCues(draft.cues, cfg.maxCues)
  if (cues.length < cfg.minCues || cues.length > cfg.maxCues) return false
  if (cfg.supportsGameClock && !clockLooksValid(draft.gameClock)) return false
  return true
}

export function canSaveActualStep(draft: AnticipationDraft, cfg: Pick<AnticipationReadConfig, 'expectedActionOptions'>): boolean {
  const actual = resolvedAction(draft.actualActionOptionId, draft.actualAction, cfg.expectedActionOptions)
  if (!actual) return false
  if (!draft.outcomeMatch) return false
  return true
}

export function canSaveQualityStep(draft: AnticipationDraft): boolean {
  return Boolean(draft.readQuality)
}

export function canSavePrioritizeStep(draft: AnticipationDraft, cfg: Pick<AnticipationReadConfig, 'maxCues' | 'supportsCuePriority'>): boolean {
  if (!cfg.supportsCuePriority) return true
  return canSaveCuePriorities(normalizeCues(draft.cues, cfg.maxCues))
}

export function canSaveCueReviewStep(draft: AnticipationDraft, cfg: Pick<AnticipationReadConfig, 'supportsCuePriority'>): boolean {
  if (!cfg.supportsCuePriority) return true
  return Boolean(draft.cueReview)
}

export function canSaveAlternativeStep(
  draft: AnticipationDraft,
  cfg: Pick<AnticipationReadConfig, 'expectedActionOptions' | 'supportsScenarioBranches'>,
): boolean {
  if (!cfg.supportsScenarioBranches) return true
  const primary = resolvedAction(draft.expectedActionOptionId, draft.expectedAction, cfg.expectedActionOptions)
  const alternative = resolvedAction(draft.alternativeActionOptionId, draft.alternativeAction, cfg.expectedActionOptions)
  return canSaveAlternative(primary, alternative, true)
}

export function canSaveTriggersStep(
  draft: AnticipationDraft,
  cfg: Pick<AnticipationReadConfig, 'supportsScenarioBranches' | 'minTriggers' | 'maxTriggers'>,
): boolean {
  if (!cfg.supportsScenarioBranches) return true
  return canSaveTriggers(draft.triggers, cfg.minTriggers, cfg.maxTriggers)
}

export function canSaveBranchReviewStep(
  draft: AnticipationDraft,
  cfg: Pick<AnticipationReadConfig, 'supportsScenarioBranches'>,
): boolean {
  return canSaveBranchReview(draft.alternativeOccurred, draft.triggerRelevant, cfg.supportsScenarioBranches)
}

export function canSaveUpdateInfoStep(
  draft: AnticipationDraft,
  cfg: Pick<AnticipationReadConfig, 'supportsPredictionUpdate' | 'minUpdateTriggers' | 'maxUpdateTriggers'>,
): boolean {
  if (!cfg.supportsPredictionUpdate) return true
  return canSaveUpdateTriggers(draft.updateTriggers, cfg.minUpdateTriggers, cfg.maxUpdateTriggers)
}

export function canSaveUpdateDecideStep(
  draft: AnticipationDraft,
  cfg: Pick<AnticipationReadConfig, 'expectedActionOptions' | 'supportsPredictionUpdate'>,
): boolean {
  if (!cfg.supportsPredictionUpdate) return true
  const initial = resolvedAction(draft.expectedActionOptionId, draft.expectedAction, cfg.expectedActionOptions)
  const updated = resolvedAction(draft.updatedPredictionOptionId, draft.updatedPrediction, cfg.expectedActionOptions)
  return canSaveUpdateDecision(draft.updateDecision, initial, updated, draft.updateReason, {
    enabled: true,
    requireReasonOnKeep: true,
    requireUpdatedPredictionOnChange: true,
  })
}

export function canSaveUpdateReviewStep(
  draft: AnticipationDraft,
  cfg: Pick<AnticipationReadConfig, 'supportsPredictionUpdate'>,
): boolean {
  return canSaveUpdateQuality(draft.updateQuality, cfg.supportsPredictionUpdate)
}

export function nextAnticipationStep(
  current: AnticipationDraftStep,
  cfg: Pick<AnticipationReadConfig, 'supportsCuePriority' | 'supportsScenarioBranches' | 'supportsPredictionUpdate'>,
): AnticipationDraftStep | 'save' {
  const sequence: AnticipationDraftStep[] = ['expect']
  if (cfg.supportsCuePriority) sequence.push('prioritize')
  if (cfg.supportsScenarioBranches) sequence.push('alternative', 'triggers')
  if (cfg.supportsPredictionUpdate) sequence.push('updateInfo', 'updateDecide')
  sequence.push('actual', 'quality')
  if (cfg.supportsCuePriority) sequence.push('cueReview')
  if (cfg.supportsScenarioBranches) sequence.push('branchReview')
  if (cfg.supportsPredictionUpdate) sequence.push('updateReview')
  const index = sequence.indexOf(current)
  if (index < 0) return 'expect'
  return sequence[index + 1] || 'save'
}

export function isCompleteRead(
  observation: AnticipationObservation,
  minCues = 1,
  requiresCuePriority = false,
  requiresScenarioBranches = false,
  requiresPredictionUpdate = false,
): boolean {
  if (!String(observation.expectedAction || '').trim()) return false
  if (!observation.confidence) return false
  if (!normalizeCues(observation.supportingCues, 99).length || observation.supportingCues.length < minCues) return false
  if (!String(observation.actualAction || '').trim()) return false
  if (!observation.outcomeMatch) return false
  if (!observation.readQuality) return false
  if (requiresCuePriority) {
    if (!canSaveCuePriorities(observation.supportingCues)) return false
    if (!observation.cueReview) return false
  }
  if (requiresScenarioBranches) {
    if (!isCompleteScenarioBranchRead(observation, { enabled: true, minTriggers: 1, maxTriggers: 3 })) return false
  }
  if (requiresPredictionUpdate) {
    if (!isCompletePredictionUpdate(observation, {
      enabled: true,
      minUpdateTriggers: 1,
      maxUpdateTriggers: 3,
      requireReasonOnKeep: true,
      requireUpdatedPredictionOnChange: true,
    })) return false
  }
  return true
}

export function draftToObservation(
  draft: AnticipationDraft,
  cfg: Pick<AnticipationReadConfig, 'expectedActionOptions' | 'minCues' | 'maxCues' | 'supportsConfidence' | 'supportsCuePriority' | 'supportsScenarioBranches' | 'supportsPredictionUpdate' | 'minTriggers' | 'maxTriggers' | 'minUpdateTriggers' | 'maxUpdateTriggers'>,
  existing?: AnticipationObservation | null,
  order = 1,
): AnticipationObservation | null {
  if (!canSaveExpectStep(draft, { ...cfg, supportsGameClock: true })) return null
  if (!canSavePrioritizeStep(draft, cfg)) return null
  if (!canSaveAlternativeStep(draft, cfg)) return null
  if (!canSaveTriggersStep(draft, cfg)) return null
  if (!canSaveUpdateInfoStep(draft, cfg)) return null
  if (!canSaveUpdateDecideStep(draft, cfg)) return null
  if (!canSaveActualStep(draft, cfg)) return null
  if (!canSaveQualityStep(draft)) return null
  if (!canSaveCueReviewStep(draft, cfg)) return null
  if (!canSaveBranchReviewStep(draft, cfg)) return null
  if (!canSaveUpdateReviewStep(draft, cfg)) return null
  const expectedAction = resolvedAction(draft.expectedActionOptionId, draft.expectedAction, cfg.expectedActionOptions)
  const actualAction = resolvedAction(draft.actualActionOptionId, draft.actualAction, cfg.expectedActionOptions)
  const alternativeAction = cfg.supportsScenarioBranches
    ? resolvedAction(draft.alternativeActionOptionId, draft.alternativeAction, cfg.expectedActionOptions)
    : undefined
  const cues = normalizeCues(draft.cues, cfg.maxCues)
  const branchTriggers = cfg.supportsScenarioBranches
    ? normalizeTriggers(draft.triggers, cfg.maxTriggers)
    : undefined
  const updateTriggers = cfg.supportsPredictionUpdate
    ? normalizeTriggers(draft.updateTriggers, cfg.maxUpdateTriggers)
    : undefined
  const updatedPrediction = cfg.supportsPredictionUpdate
    ? (draft.updateDecision === 'keep'
      ? expectedAction
      : resolvedAction(draft.updatedPredictionOptionId, draft.updatedPrediction, cfg.expectedActionOptions))
    : undefined
  const id = existing?.id || createObservationId()
  const observation: AnticipationObservation = {
    id,
    order,
    situationLabel: draft.situationLabel.trim() || undefined,
    expectedAction,
    confidence: (draft.confidence || 'medium') as AnticipationConfidence,
    supportingCues: cues,
    alternativeAction,
    branchTriggers,
    updateTriggers,
    updateDecision: cfg.supportsPredictionUpdate ? draft.updateDecision || undefined : undefined,
    updatedPrediction,
    updateReason: cfg.supportsPredictionUpdate ? (draft.updateReason.trim() || undefined) : undefined,
    updateQuality: cfg.supportsPredictionUpdate ? draft.updateQuality || undefined : undefined,
    actualAction,
    outcomeMatch: draft.outcomeMatch as AnticipationOutcomeMatch,
    readQuality: draft.readQuality as AnticipationReadQuality,
    cueReview: cfg.supportsCuePriority ? (draft.cueReview as CueReviewJudgement) : undefined,
    alternativeOccurred: cfg.supportsScenarioBranches ? draft.alternativeOccurred || undefined : undefined,
    triggerRelevant: cfg.supportsScenarioBranches ? draft.triggerRelevant || undefined : undefined,
    period: draft.period || undefined,
    gameClock: draft.gameClock.trim() || undefined,
    note: draft.note.trim() || undefined,
    sceneId: draft.sceneId.trim() || undefined,
    createdAt: existing?.createdAt || new Date().toISOString(),
  }
  if (cfg.supportsScenarioBranches) {
    observation.scenarioBranches = buildScenarioBranches(observation)
  }
  if (cfg.supportsPredictionUpdate) {
    observation.predictionUpdate = buildPredictionUpdate(observation) || undefined
  }
  return observation
}

function optionIdForAction(action: string, options: string[]): string {
  if (options.includes(action)) return action
  return options.length ? OTHER_ACTION_ID : ''
}

export function observationToDraft(
  observation: AnticipationObservation,
  options: string[] = [],
): AnticipationDraft {
  return {
    step: 'expect',
    situationLabel: observation.situationLabel || '',
    expectedActionOptionId: optionIdForAction(observation.expectedAction, options),
    expectedAction: observation.expectedAction || '',
    confidence: observation.confidence || '',
    cues: (observation.supportingCues || []).map((cue) => ({
      id: cue.id || createCueId(),
      category: cue.category || 'other',
      label: cue.label || '',
      priority: cue.priority,
    })),
    alternativeActionOptionId: optionIdForAction(observation.alternativeAction || '', options),
    alternativeAction: observation.alternativeAction || '',
    triggers: (observation.branchTriggers || []).length
      ? observation.branchTriggers!.map((trigger) => ({
        id: trigger.id || emptyTrigger().id,
        description: trigger.description || '',
        cueCategory: trigger.cueCategory,
      }))
      : [emptyTrigger()],
    alternativeOccurred: observation.alternativeOccurred || '',
    triggerRelevant: observation.triggerRelevant || '',
    updateTriggers: (observation.updateTriggers || observation.predictionUpdate?.updateTriggers || []).length
      ? (observation.updateTriggers || observation.predictionUpdate?.updateTriggers || []).map((trigger) => ({
        id: trigger.id || emptyTrigger().id,
        description: trigger.description || '',
        cueCategory: trigger.cueCategory,
      }))
      : [emptyTrigger()],
    updateDecision: observation.updateDecision || observation.predictionUpdate?.updateDecision || '',
    updatedPredictionOptionId: optionIdForAction(observation.updatedPrediction || observation.predictionUpdate?.updatedPrediction || '', options),
    updatedPrediction: observation.updatedPrediction || observation.predictionUpdate?.updatedPrediction || '',
    updateReason: observation.updateReason || observation.predictionUpdate?.reason || '',
    updateQuality: observation.updateQuality || observation.predictionUpdate?.updateQuality || '',
    actualActionOptionId: optionIdForAction(observation.actualAction || '', options),
    actualAction: observation.actualAction || '',
    outcomeMatch: observation.outcomeMatch || '',
    readQuality: observation.readQuality || '',
    cueReview: observation.cueReview || '',
    period: observation.period || '',
    gameClock: observation.gameClock || '',
    note: observation.note || '',
    sceneId: observation.sceneId || '',
  }
}

export function readStage(answers: Record<string, unknown>, stageKey: string): AnticipationReadStage {
  const raw = String(answers[stageKey] || 'observe')
  if (raw === 'review' || raw === 'complete' || raw === 'observe') return raw
  return 'observe'
}

export function readDraftStep(draft: AnticipationDraft): AnticipationDraftStep {
  if (
    draft.step === 'actual'
    || draft.step === 'quality'
    || draft.step === 'expect'
    || draft.step === 'prioritize'
    || draft.step === 'alternative'
    || draft.step === 'triggers'
    || draft.step === 'cueReview'
    || draft.step === 'branchReview'
    || draft.step === 'updateInfo'
    || draft.step === 'updateDecide'
    || draft.step === 'updateReview'
  ) return draft.step
  return 'expect'
}

export function confidenceOptions(): Array<PatternLogOption<AnticipationConfidence>> {
  return [
    { value: 'low', label: 'Niedrig' },
    { value: 'medium', label: 'Mittel' },
    { value: 'high', label: 'Hoch' },
  ]
}

export function outcomeMatchOptions(): Array<PatternLogOption<AnticipationOutcomeMatch>> {
  return [
    { value: 'matched', label: 'Getroffen' },
    { value: 'partly_matched', label: 'Teilweise getroffen' },
    { value: 'different', label: 'Anders' },
  ]
}

export function readQualityOptions(): Array<PatternLogOption<AnticipationReadQuality>> {
  return [
    { value: 'well_supported', label: 'Gut gestützt' },
    { value: 'partly_supported', label: 'Teilweise gestützt' },
    { value: 'weakly_supported', label: 'Schwach gestützt' },
    { value: 'unclear', label: 'Unklar' },
  ]
}

export function overconfidenceOptions(): Array<PatternLogOption<OverconfidenceAssessment>> {
  return [
    { value: 'none', label: 'Bei keinem Read' },
    { value: 'single', label: 'Bei einem Read' },
    { value: 'multiple', label: 'Mehrfach' },
    { value: 'unclear', label: 'Unklar' },
  ]
}

export function outcomeMatchLabel(value?: AnticipationOutcomeMatch | string | null): string {
  if (value === 'matched') return 'Getroffen'
  if (value === 'partly_matched') return 'Teilweise'
  if (value === 'different') return 'Anders'
  return ''
}

export function readQualityLabel(value?: AnticipationReadQuality | string | null): string {
  if (value === 'well_supported') return 'Gut gestützt'
  if (value === 'partly_supported') return 'Teilweise gestützt'
  if (value === 'weakly_supported') return 'Schwach gestützt'
  if (value === 'unclear') return 'Unklar'
  return ''
}

export function confidenceLabel(value?: AnticipationConfidence | string | null): string {
  if (value === 'low') return 'Niedrig'
  if (value === 'medium') return 'Mittel'
  if (value === 'high') return 'Hoch'
  return ''
}

export function formatReadMeta(observation: AnticipationObservation): string {
  const clockParts = [observation.period, observation.gameClock].filter(Boolean)
  const suffix = clockParts.length ? ` · ${clockParts.join(' ')}` : ''
  return `READ #${observation.order}${suffix}`
}

export function removeObservationAt(
  observations: AnticipationObservation[],
  index: number,
): AnticipationObservation[] {
  return observations
    .filter((_, idx) => idx !== index)
    .map((item, idx) => ({ ...item, order: idx + 1 }))
}

export function computeAnticipationReadResult(
  observations: AnticipationObservation[],
  extras: Partial<Pick<AnticipationReadResult, 'selectedStrongReadDespiteMismatchId' | 'mostHelpfulCueCategory' | 'overconfidenceAssessment' | 'overweightedCueCategory' | 'futureCueCategory' | 'importantAlternativeReadId' | 'strongestTriggerDescription' | 'linearThinkingAssessment' | 'successfulUpdateReadId' | 'heldTooLongReadId' | 'strongestUpdateInfo'>> = {},
): AnticipationReadResult {
  const outcomeMatchDistribution = { matched: 0, partlyMatched: 0, different: 0 }
  const readQualityDistribution = { wellSupported: 0, partlySupported: 0, weaklySupported: 0, unclear: 0 }
  const confidenceDistribution = { low: 0, medium: 0, high: 0 }
  const cueCategoryCounts: Record<string, number> = {}
  let highConfidenceDifferentCount = 0

  for (const observation of observations) {
    if (observation.outcomeMatch === 'matched') outcomeMatchDistribution.matched += 1
    if (observation.outcomeMatch === 'partly_matched') outcomeMatchDistribution.partlyMatched += 1
    if (observation.outcomeMatch === 'different') outcomeMatchDistribution.different += 1

    if (observation.readQuality === 'well_supported') readQualityDistribution.wellSupported += 1
    if (observation.readQuality === 'partly_supported') readQualityDistribution.partlySupported += 1
    if (observation.readQuality === 'weakly_supported') readQualityDistribution.weaklySupported += 1
    if (observation.readQuality === 'unclear') readQualityDistribution.unclear += 1

    if (observation.confidence === 'low') confidenceDistribution.low += 1
    if (observation.confidence === 'medium') confidenceDistribution.medium += 1
    if (observation.confidence === 'high') confidenceDistribution.high += 1

    if (observation.confidence === 'high' && observation.outcomeMatch === 'different') {
      highConfidenceDifferentCount += 1
    }

    for (const cue of observation.supportingCues || []) {
      const key = String(cue.category || 'other').trim() || 'other'
      cueCategoryCounts[key] = (cueCategoryCounts[key] || 0) + 1
    }
  }

  return {
    observations,
    totalReads: observations.length,
    outcomeMatchDistribution,
    readQualityDistribution,
    cueCategoryCounts,
    confidenceDistribution,
    highConfidenceDifferentCount,
    selectedStrongReadDespiteMismatchId: extras.selectedStrongReadDespiteMismatchId,
    mostHelpfulCueCategory: extras.mostHelpfulCueCategory,
    overconfidenceAssessment: extras.overconfidenceAssessment,
    overweightedCueCategory: extras.overweightedCueCategory,
    futureCueCategory: extras.futureCueCategory,
    importantAlternativeReadId: extras.importantAlternativeReadId,
    strongestTriggerDescription: extras.strongestTriggerDescription,
    linearThinkingAssessment: extras.linearThinkingAssessment,
    successfulUpdateReadId: extras.successfulUpdateReadId,
    heldTooLongReadId: extras.heldTooLongReadId,
    strongestUpdateInfo: extras.strongestUpdateInfo,
    cuePriority: observations.some((item) => (item.supportingCues || []).some((cue) => cue.priority) || item.cueReview)
      ? computeCuePriorityResult(observations)
      : undefined,
    scenarioBranches: observations.some((item) => item.alternativeAction || (item.branchTriggers || []).length)
      ? computeScenarioBranchResult(observations)
      : undefined,
    predictionUpdates: observations.some((item) => item.updateDecision || item.predictionUpdate)
      ? computePredictionUpdateResult(observations)
      : undefined,
  }
}

/** Explicitly no accuracy/percent score in the result artifact. */
export function resultHasAccuracyScore(result: AnticipationReadResult): boolean {
  const record = result as AnticipationReadResult & Record<string, unknown>
  const encoded = JSON.stringify(result)
  return 'accuracy' in record
    || 'accuracyPercent' in record
    || 'predictionAccuracy' in record
    || 'hitRate' in record
    || 'branchAccuracy' in record
    || 'updateAccuracy' in record
    || 'reactivityScore' in record
    || encoded.includes('predictionAccuracy')
    || encoded.includes('%')
}

export function strongMismatchReads(observations: AnticipationObservation[]): AnticipationObservation[] {
  return observations.filter((item) => (
    (item.outcomeMatch === 'different' || item.outcomeMatch === 'partly_matched')
    && item.readQuality === 'well_supported'
  ))
}

export function usedCueCategories(observations: AnticipationObservation[]): string[] {
  const counts = computeAnticipationReadResult(observations).cueCategoryCounts
  return Object.keys(counts).sort((a, b) => (counts[b] - counts[a]) || a.localeCompare(b))
}

export function highConfidenceDifferentReads(observations: AnticipationObservation[]): AnticipationObservation[] {
  return observations.filter((item) => item.confidence === 'high' && item.outcomeMatch === 'different')
}

export function validateAnticipationReadAnswers(
  cfg: AnticipationReadConfig,
  answers: Record<string, unknown>,
): string | null {
  const observations = Array.isArray(answers[cfg.logsKey])
    ? (answers[cfg.logsKey] as AnticipationObservation[])
    : []
  if (observations.length < cfg.minReads) {
    return `Bitte erfasse mindestens ${cfg.minReads} Reads.`
  }
  if (observations.length > cfg.maxReads) {
    return `Maximal ${cfg.maxReads} Reads.`
  }
  for (const observation of observations) {
    if (!isCompleteRead(observation, cfg.minCues, cfg.supportsCuePriority, cfg.supportsScenarioBranches, cfg.supportsPredictionUpdate)) {
      if (cfg.supportsPredictionUpdate) {
        return 'Bitte schließe jeden Read vollständig ab (Erwartung, neue Information, Update-Entscheidung, tatsächliche Aktion, Timing).'
      }
      if (cfg.supportsScenarioBranches) {
        return 'Bitte schließe jeden Read vollständig ab (Primäre Erwartung, Alternative, Trigger, tatsächliche Aktion, Match, Read Quality, Branch-Check).'
      }
      return cfg.supportsCuePriority
        ? 'Bitte schließe jeden Read vollständig ab (Erwartung, Cue-Gewichtung, tatsächliche Aktion, Match, Read Quality, Cue-Check).'
        : 'Bitte schließe jeden Read vollständig ab (Erwartung, Cues, tatsächliche Aktion, Match, Read Quality).'
    }
    if (normalizeCues(observation.supportingCues, cfg.maxCues).length < cfg.minCues) {
      return `Jeder Read braucht mindestens ${cfg.minCues} Cue.`
    }
    if ((observation.supportingCues || []).length > cfg.maxCues) {
      return `Maximal ${cfg.maxCues} Cues pro Read.`
    }
    if (cfg.supportsScenarioBranches && !canSaveTriggers(observation.branchTriggers, cfg.minTriggers, cfg.maxTriggers)) {
      return `Jeder Read braucht ${cfg.minTriggers}–${cfg.maxTriggers} Trigger für die Alternative.`
    }
    if (cfg.supportsPredictionUpdate && !canSaveUpdateTriggers(observation.updateTriggers, cfg.minUpdateTriggers, cfg.maxUpdateTriggers)) {
      return 'Jeder Read braucht mindestens eine neue Information als Update-Trigger.'
    }
  }

  const used = usedCueCategories(observations)
  if (used.length && !cfg.supportsScenarioBranches && !cfg.supportsPredictionUpdate) {
    const helpful = String(answers[cfg.helpfulCueKey] || '').trim()
    if (!helpful) return 'Bitte wähle, welcher Cue dir am häufigsten geholfen hat.'
    if (!used.includes(helpful)) return 'Bitte wähle eine Cue-Art, die du tatsächlich genutzt hast.'
  }

  if (cfg.supportsPredictionUpdate) {
    const successId = String(answers[cfg.successfulUpdateKey] || '').trim()
    if (!successId) return 'Bitte markiere, bei welchem Read du deine Einschätzung erfolgreich angepasst hast – oder keiner / unklar.'
    const readChoices = new Set([
      NONE_REFLECTION_ID,
      UNCLEAR_REFLECTION_ID,
      ...observations.map((item) => item.id),
    ])
    if (!readChoices.has(successId)) {
      return 'Bitte wähle einen gültigen Read für die Update-Reflexion.'
    }

    const heldId = String(answers[cfg.heldTooLongKey] || '').trim()
    if (!heldId) return 'Bitte markiere, wann du zu lange an der ersten Erwartung festgehalten hast – oder keiner / unklar.'
    if (!readChoices.has(heldId)) {
      return 'Bitte wähle einen gültigen Read für das zu lange Festhalten.'
    }

    const usedInfo = usedUpdateTriggerDescriptions(observations)
    if (usedInfo.length) {
      const strongest = String(answers[cfg.strongestUpdateInfoKey] || '').trim()
      if (!strongest) return 'Bitte wähle, welche neuen Informationen deine Reads am stärksten verändern.'
      if (!usedInfo.includes(strongest) && strongest !== NONE_REFLECTION_ID && strongest !== UNCLEAR_REFLECTION_ID) {
        return 'Bitte wähle eine Information, die du tatsächlich als Trigger genutzt hast.'
      }
    }
    return null
  }

  if (cfg.supportsScenarioBranches) {
    const importantId = String(answers[cfg.importantAlternativeKey] || '').trim()
    if (!importantId) return 'Bitte markiere, bei welchem Read die Alternative besonders wichtig war – oder keiner / unklar.'
    const importantChoices = new Set([
      NONE_REFLECTION_ID,
      UNCLEAR_REFLECTION_ID,
      ...observations.map((item) => item.id),
    ])
    if (!importantChoices.has(importantId)) {
      return 'Bitte wähle einen gültigen Read für die Alternative-Reflexion.'
    }

    const usedTriggers = usedTriggerDescriptions(observations)
    if (usedTriggers.length) {
      const strongest = String(answers[cfg.strongestTriggerKey] || '').trim()
      if (!strongest) return 'Bitte wähle, welcher Trigger deine Erwartung am stärksten verändert hätte.'
      if (!usedTriggers.includes(strongest) && strongest !== NONE_REFLECTION_ID && strongest !== UNCLEAR_REFLECTION_ID) {
        return 'Bitte wähle einen Trigger, den du tatsächlich genutzt hast.'
      }
    }

    const linear = answers[cfg.linearThinkingKey]
    if (!isLinearThinkingAssessment(linear)) return 'Bitte schätze ein, ob du oft zu linear denkst.'
    return null
  }

  if (cfg.supportsCuePriority) {
    const overweighted = String(answers[cfg.overweightedCueKey] || '').trim()
    if (!overweighted) return 'Bitte wähle, welchen Cue du möglicherweise überbewertet hast — oder keiner / unklar.'
    const future = String(answers[cfg.futureCueKey] || '').trim()
    if (!future) return 'Bitte wähle, welchen Cue du zukünftig bewusster beobachten möchtest.'
    return null
  }

  const mismatchId = String(answers[cfg.strongMismatchKey] || '').trim()
  if (!mismatchId) {
    return 'Bitte markiere einen gut begründeten Read, der anders ausging – oder wähle keiner / unklar.'
  }
  const mismatchChoices = new Set([
    NONE_REFLECTION_ID,
    UNCLEAR_REFLECTION_ID,
    ...observations.map((item) => item.id),
  ])
  if (!mismatchChoices.has(mismatchId)) {
    return 'Bitte wähle einen gültigen Read für die Mismatch-Reflexion.'
  }

  const overconfidence = String(answers[cfg.overconfidenceKey] || '') as OverconfidenceAssessment | ''
  if (!overconfidence) return 'Bitte schätze ein, ob du dir zu sicher warst.'
  return null
}
