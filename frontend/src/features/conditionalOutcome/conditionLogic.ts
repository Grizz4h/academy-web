import {
  calculateOpportunityRate,
  calculatePercentagePointDifference,
  canAddOpportunity,
  emptyOpportunityDraft,
  formatRatePercent,
  validObservations,
} from '../opportunityRate/rateLogic'
import { comparabilityOptions } from '../cohortRateCompare/compareLogic'
import type { RateDefinition, RateExamplesHelp, SuitableRateExample } from '../opportunityRate/types'
import { CONDITION_TEMPLATES } from './templates'
import type {
  ConditionOutcomeMatrixCounts,
  ConditionState,
  ConditionTemplate,
  ConditionalDefinition,
  ConditionalDraft,
  ConditionalHypothesis,
  ConditionalObservation,
  ConditionalOutcomeConfig,
  ConditionalOutcomeResult,
  ConditionalStage,
  CounterexampleAssessment,
  HypothesisAssessment,
} from './types'

export function emptyConditionalDraft(): ConditionalDraft {
  return {
    ...emptyOpportunityDraft(),
    conditionState: '',
    outcomeState: '',
  }
}

export function emptyConditionalDefinition(): ConditionalDefinition {
  return {
    opportunityLabel: '',
    condition: { id: 'condition', label: '' },
    targetEventLabel: '',
    question: '',
  }
}

export function composeConditionalQuestion(targetEventLabel: string, conditionLabel: string): string {
  const target = String(targetEventLabel || '').trim() || 'das Target'
  const condition = String(conditionLabel || '').trim() || 'die Bedingung'
  return `Tritt ${target} häufiger auf, wenn ${condition}?`
}

export function definitionFromTemplate(template: ConditionTemplate): ConditionalDefinition {
  return {
    templateId: template.id,
    opportunityLabel: template.opportunityLabel,
    condition: { id: template.id, label: template.conditionLabel },
    targetEventLabel: template.targetEventLabel,
    questionManual: false,
    question: composeConditionalQuestion(template.targetEventLabel, template.conditionLabel),
  }
}

export function updateConditionalDefinition(
  definition: ConditionalDefinition,
  patch: Partial<Omit<ConditionalDefinition, 'condition'>> & { conditionLabel?: string; questionManual?: boolean },
): ConditionalDefinition {
  const next: ConditionalDefinition = {
    ...definition,
    ...patch,
    condition: {
      ...definition.condition,
      label: patch.conditionLabel !== undefined ? patch.conditionLabel : definition.condition.label,
    },
  }
  if (patch.question !== undefined) {
    next.questionManual = patch.questionManual ?? true
  } else if (!next.questionManual) {
    next.question = composeConditionalQuestion(next.targetEventLabel, next.condition.label)
  }
  return next
}

export function isConditionalDefinitionReady(definition: ConditionalDefinition | null | undefined): boolean {
  if (!definition) return false
  return Boolean(
    definition.opportunityLabel.trim()
    && definition.condition.label.trim()
    && definition.targetEventLabel.trim()
    && definition.question.trim(),
  )
}

function resolveExamplesHelp(raw: Record<string, unknown>): RateExamplesHelp | null {
  const source = (raw.condition_examples || raw.conditionExamples || raw.examples || null) as Record<string, unknown> | null
  if (!source || typeof source !== 'object') return null
  const suitableRaw = Array.isArray(source.suitable) ? source.suitable : []
  const suitable: SuitableRateExample[] = suitableRaw
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
    title: String(source.title || 'Welche Fragen eignen sich?'),
    intro: source.intro ? String(source.intro) : undefined,
    suitable,
    unsuitableTitle: String(source.unsuitable_title || source.unsuitableTitle || 'Weniger geeignet'),
    unsuitable,
    footer: source.footer ? String(source.footer) : undefined,
  }
}

export function resolveConditionalOutcomeConfig(raw: Record<string, unknown> = {}): ConditionalOutcomeConfig {
  const tracker = (raw.tracker && typeof raw.tracker === 'object' ? raw.tracker as Record<string, unknown> : {})
  const minObservations = Math.max(1, Number(tracker.minObservations || raw.minObservations || 10))
  const minPresent = Math.max(1, Number(tracker.minPresent || raw.minPresent || 3))
  const minAbsent = Math.max(1, Number(tracker.minAbsent || raw.minAbsent || 3))
  const recommendedObservations = Math.max(
    minObservations,
    Number(tracker.recommendedObservations || raw.recommendedObservations || 14),
  )
  const maxObservations = Math.max(
    recommendedObservations,
    Number(tracker.maxObservations || raw.maxObservations || 20),
  )

  return {
    mechanic: 'conditional_outcome_compare',
    minObservations,
    minPresent,
    minAbsent,
    recommendedObservations,
    maxObservations,
    supportsGameClock: tracker.supportsGameClock !== false && raw.supportsGameClock !== false,
    supportsSceneCapture: tracker.supportsSceneCapture !== false && raw.supportsSceneCapture !== false,
    definitionKey: String(raw.definition_key || raw.definitionKey || 'conditional_outcome_definition'),
    hypothesisKey: String(raw.hypothesis_key || raw.hypothesisKey || 'conditionalHypothesis'),
    logsKey: String(raw.logs_key || raw.logsKey || 'conditional_outcome_observations'),
    draftKey: String(raw.draft_key || raw.draftKey || '__conditional_outcome_draft'),
    stageKey: String(raw.stage_key || raw.stageKey || '__conditional_outcome_stage'),
    editIndexKey: String(raw.edit_index_key || raw.editIndexKey || '__conditional_outcome_edit_index'),
    addingMoreKey: String(raw.adding_more_key || raw.addingMoreKey || '__conditional_outcome_adding_more'),
    comparabilityKey: String(raw.comparability_key || raw.comparabilityKey || 'comparability'),
    hypothesisAssessmentKey: String(raw.hypothesis_assessment_key || raw.hypothesisAssessmentKey || 'hypothesisAssessment'),
    counterexampleKey: String(raw.counterexample_key || raw.counterexampleKey || 'counterexampleAssessment'),
    alternativeKey: String(raw.alternative_key || raw.alternativeKey || 'alternativeExplanation'),
    extraDimensionKey: String(raw.extra_dimension_key || raw.extraDimensionKey || 'possibleAdditionalDimension'),
    conclusionKey: String(raw.conclusion_key || raw.conclusionKey || 'userConclusion'),
    decisionRule: String(
      raw.decision_rule
        || raw.decisionRule
        || 'Zusammenhang ist nicht Ursache.',
    ),
    coreHint: String(
      raw.core_hint
        || raw.coreHint
        || 'Erfasse auch die Fälle, die deiner Erwartung widersprechen.',
    ),
    sampleLimitNote: String(
      raw.sample_limit_note
        || raw.sampleLimitNote
        || 'In deiner Stichprobe war die Target-Rate bei vorhandener Bedingung höher oder niedriger – das ist noch keine Ursache.',
    ),
    conclusionHint: String(
      raw.conclusion_hint
        || raw.conclusionHint
        || 'Beschreibe, was zusammen auftrat – nicht warum es passiert ist. Nutze „in meiner Stichprobe“.',
    ),
    wordingHelp: String(
      raw.wording_help
        || raw.wordingHelp
        || 'Nicht: „Support macht Exits erfolgreicher.“ Besser: „In meiner Stichprobe trat ein kontrollierter Exit bei vorhandenem Support häufiger auf.“',
    ),
    summaryMinChars: Math.max(1, Number(raw.summary_min_chars || raw.summaryMinChars || 20)),
    alternativeMinChars: Math.max(1, Number(raw.alternative_min_chars || raw.alternativeMinChars || 12)),
    examplesHelp: resolveExamplesHelp(raw),
  }
}

export function readConditionalStage(answers: Record<string, unknown>, stageKey: string): ConditionalStage {
  const raw = String(answers[stageKey] || 'define')
  if (raw === 'define' || raw === 'observe' || raw === 'review' || raw === 'complete') return raw
  return 'define'
}

export function syntheticRateDefinition(definition: ConditionalDefinition): RateDefinition {
  return {
    opportunityLabel: definition.opportunityLabel,
    targetEventLabel: definition.targetEventLabel,
    question: definition.question,
    targetOutcomeId: 'target',
    outcomes: [
      { id: 'target', label: definition.targetEventLabel || 'Target' },
      { id: 'other', label: 'anderes Outcome' },
      { id: 'unclear', label: 'Unklar' },
    ],
  }
}

export function observationsForCondition(
  observations: ConditionalObservation[],
  state: Extract<ConditionState, 'present' | 'absent'>,
): ConditionalObservation[] {
  return validObservations(observations).filter((item) => (
    (item as ConditionalObservation).conditionState === state
  )) as ConditionalObservation[]
}

function toRateObservations(observations: ConditionalObservation[]) {
  return observations.map((item) => ({
    ...item,
    outcomeId: item.outcomeState === 'target' ? 'target' : item.outcomeState === 'unclear' ? 'unclear' : 'other',
  }))
}

/**
 * Condition unclear: stay in the session sample, but never enter present/absent
 * rate denominators or 2×2 cells.
 * Outcome unclear: if the condition is clear, the opportunity stays in that
 * condition's denominator (D1 rule). It is not counted as "other" in the matrix.
 */
export function buildConditionOutcomeMatrix(
  observations: ConditionalObservation[],
): ConditionOutcomeMatrixCounts {
  const usable = validObservations(observations) as ConditionalObservation[]
  const matrix: ConditionOutcomeMatrixCounts = {
    presentTarget: 0,
    presentOther: 0,
    absentTarget: 0,
    absentOther: 0,
    conditionUnclear: 0,
    outcomeUnclear: 0,
    presentOutcomeUnclear: 0,
    absentOutcomeUnclear: 0,
  }

  for (const item of usable) {
    if (item.outcomeState === 'unclear') matrix.outcomeUnclear += 1
    if (item.conditionState === 'unclear') {
      matrix.conditionUnclear += 1
      continue
    }
    if (item.conditionState === 'present') {
      if (item.outcomeState === 'target') matrix.presentTarget += 1
      else if (item.outcomeState === 'other') matrix.presentOther += 1
      else matrix.presentOutcomeUnclear += 1
    } else if (item.conditionState === 'absent') {
      if (item.outcomeState === 'target') matrix.absentTarget += 1
      else if (item.outcomeState === 'other') matrix.absentOther += 1
      else matrix.absentOutcomeUnclear += 1
    }
  }
  return matrix
}

export function canEvaluateConditional(
  present: number,
  absent: number,
  total: number,
  minTotal: number,
  minPresent: number,
  minAbsent: number,
): boolean {
  return total >= minTotal && present >= minPresent && absent >= minAbsent
}

export function canSaveConditionalDraft(draft: ConditionalDraft, supportsGameClock: boolean): boolean {
  if (draft.conditionState !== 'present' && draft.conditionState !== 'absent' && draft.conditionState !== 'unclear') {
    return false
  }
  if (draft.outcomeState !== 'target' && draft.outcomeState !== 'other' && draft.outcomeState !== 'unclear') {
    return false
  }
  if (supportsGameClock && draft.gameClock && !/^\d{1,2}(:\d{1,2})?$/.test(draft.gameClock.trim())) {
    return false
  }
  return true
}

export function remainingForBucket(count: number, min: number): number {
  return Math.max(0, min - count)
}

function counterexampleCount(hypothesis: ConditionalHypothesis | undefined, matrix: ConditionOutcomeMatrixCounts): number {
  if (hypothesis === 'target_more_with_condition') return matrix.absentTarget
  if (hypothesis === 'target_more_without_condition') return matrix.presentTarget
  return 0
}

function counterexampleSummary(
  hypothesis: ConditionalHypothesis | undefined,
  definition: ConditionalDefinition,
  count: number,
): string | null {
  if (count <= 0) return null
  const target = definition.targetEventLabel || 'Target'
  const condition = definition.condition.label || 'der Bedingung'
  if (hypothesis === 'target_more_with_condition') {
    return `${count}× ${target} ohne ${condition}.`
  }
  if (hypothesis === 'target_more_without_condition') {
    return `${count}× ${target} trotz ${condition}.`
  }
  return null
}

export function computeConditionalOutcome(
  definition: ConditionalDefinition,
  observations: ConditionalObservation[],
  hypothesis?: ConditionalHypothesis,
): ConditionalOutcomeResult {
  const usable = validObservations(observations) as ConditionalObservation[]
  const matrix = buildConditionOutcomeMatrix(usable)
  const presentObs = observationsForCondition(usable, 'present')
  const absentObs = observationsForCondition(usable, 'absent')
  const rateDef = syntheticRateDefinition(definition)
  const presentRate = calculateOpportunityRate(rateDef, toRateObservations(presentObs))
  const absentRate = calculateOpportunityRate(rateDef, toRateObservations(absentObs))
  const counters = counterexampleCount(hypothesis, matrix)

  return {
    definition,
    matrix,
    withCondition: {
      total: presentRate.totalOpportunities,
      targetCount: presentRate.targetCount,
      rate: presentRate.rate,
      ratePercent: presentRate.ratePercent,
      outcomeUnclear: presentRate.unclearCount,
    },
    withoutCondition: {
      total: absentRate.totalOpportunities,
      targetCount: absentRate.targetCount,
      rate: absentRate.rate,
      ratePercent: absentRate.ratePercent,
      outcomeUnclear: absentRate.unclearCount,
    },
    percentagePointDifference: calculatePercentagePointDifference(presentRate.rate, absentRate.rate),
    conditionUnclearCount: matrix.conditionUnclear,
    outcomeUnclearCount: matrix.outcomeUnclear,
    sampleImbalance: presentRate.totalOpportunities !== absentRate.totalOpportunities
      && (presentRate.totalOpportunities > 0 || absentRate.totalOpportunities > 0),
    counterexampleCount: counters,
    counterexampleSummary: counterexampleSummary(hypothesis, definition, counters),
  }
}

export function descriptiveDifference(result: ConditionalOutcomeResult): string {
  const withRate = result.withCondition.ratePercent
  const withoutRate = result.withoutCondition.ratePercent
  if (withRate === withoutRate) {
    return 'In deiner Stichprobe war die Target-Rate mit und ohne Bedingung gleich.'
  }
  if (withRate > withoutRate) {
    return 'In deiner Stichprobe war die Target-Rate bei vorhandener Bedingung höher.'
  }
  return 'In deiner Stichprobe war die Target-Rate bei vorhandener Bedingung niedriger.'
}

export function hypothesisOptions(): Array<{ value: ConditionalHypothesis; label: string }> {
  return [
    { value: 'target_more_with_condition', label: 'Target tritt mit Bedingung häufiger auf' },
    { value: 'target_more_without_condition', label: 'Target tritt ohne Bedingung häufiger auf' },
    { value: 'roughly_equal', label: 'Ungefähr gleich' },
    { value: 'no_expectation', label: 'Keine Erwartung' },
  ]
}

export function hypothesisAssessmentOptions(): Array<{ value: HypothesisAssessment; label: string }> {
  return [
    { value: 'confirmed', label: 'Ja' },
    { value: 'partly_confirmed', label: 'Teilweise' },
    { value: 'not_confirmed', label: 'Nein' },
    { value: 'no_expectation', label: 'Keine Erwartung' },
  ]
}

export function counterexampleAssessmentOptions(): Array<{ value: CounterexampleAssessment; label: string }> {
  return [
    { value: 'multiple', label: 'Mehrere' },
    { value: 'some', label: 'Einzelne' },
    { value: 'none_clear', label: 'Keine klaren' },
    { value: 'unclear', label: 'Unklar' },
  ]
}

export function validateConditionalOutcomeAnswers(
  cfg: ConditionalOutcomeConfig,
  answers: Record<string, unknown>,
): string | null {
  const definition = answers[cfg.definitionKey] as ConditionalDefinition | undefined
  if (!isConditionalDefinitionReady(definition)) {
    return 'Bitte definiere Opportunity, Bedingung und Target Outcome getrennt.'
  }
  if (!answers[cfg.hypothesisKey]) {
    return 'Bitte halte fest, was du erwartest, bevor du auswertest.'
  }
  const observations = Array.isArray(answers[cfg.logsKey])
    ? answers[cfg.logsKey] as ConditionalObservation[]
    : []
  const usable = validObservations(observations) as ConditionalObservation[]
  const present = observationsForCondition(usable, 'present').length
  const absent = observationsForCondition(usable, 'absent').length
  if (!canEvaluateConditional(present, absent, usable.length, cfg.minObservations, cfg.minPresent, cfg.minAbsent)) {
    return `Für eine erste Auswertung brauchst du mindestens ${cfg.minPresent} Fälle mit und ${cfg.minAbsent} ohne Bedingung sowie ${cfg.minObservations} Opportunities insgesamt.`
  }
  if (usable.length > cfg.maxObservations) {
    return `Maximal ${cfg.maxObservations} Opportunities.`
  }
  if (!answers[cfg.comparabilityKey]) {
    return 'Bitte bewerte, wie vergleichbar die Situationen mit und ohne Bedingung waren.'
  }
  if (!answers[cfg.hypothesisAssessmentKey]) {
    return 'Bitte bewerte, ob sich deine Erwartung bestätigt hat.'
  }
  if (!answers[cfg.counterexampleKey]) {
    return 'Bitte halte fest, ob es widersprechende Situationen gab.'
  }
  const alternative = String(answers[cfg.alternativeKey] || '').trim()
  if (alternative.length < cfg.alternativeMinChars) {
    return 'Bitte nenne eine alternative Erklärung für das Muster.'
  }
  const conclusion = String(answers[cfg.conclusionKey] || '').trim()
  if (conclusion.length < cfg.summaryMinChars) {
    return 'Bitte formuliere den beobachteten Zusammenhang, ohne eine Ursache zu behaupten.'
  }
  return null
}

export {
  CONDITION_TEMPLATES,
  canAddOpportunity,
  comparabilityOptions,
  formatRatePercent,
}
export type { ConditionTemplate }
