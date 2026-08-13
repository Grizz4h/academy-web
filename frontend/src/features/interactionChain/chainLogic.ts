import {
  COMPARABILITY_OPTIONS,
  DEFAULT_CHANGE_MAGNITUDE_OPTIONS,
  DIMENSION_OPTIONS,
  EXAMPLE_COUNT_OPTIONS,
  INTERACTION_ASSESSMENT_OPTIONS,
  PROBLEM_CATEGORY_OPTIONS,
  PROBLEM_EFFECT_OPTIONS,
  PROBLEM_EVIDENCE_OPTIONS,
  RESPONSE_REPETITION_OPTIONS,
  RESPONSE_TYPE_OPTIONS,
  TRADEOFF_OPTIONS,
} from './labels'
import type { ChainExamplesHelp, InteractionChainConfig, InteractionChainView } from './types'

function resolveExamplesHelp(raw: Record<string, unknown>): ChainExamplesHelp | null {
  const source = (raw.chain_examples || raw.chainExamples || raw.hypothesis_examples || null) as
    | Record<string, unknown>
    | null
  if (!source || typeof source !== 'object') return null

  const suitableRaw = Array.isArray(source.suitable) ? source.suitable : []
  const suitable = suitableRaw
    .map((item: any) => ({
      title: String(item?.title || '').trim(),
      description: String(item?.description || item?.text || '').trim(),
    }))
    .filter((item) => item.title && item.description)

  const unsuitableRaw = Array.isArray(source.unsuitable) ? source.unsuitable : []
  const unsuitable = unsuitableRaw.map((item: any) => String(item || '').trim()).filter(Boolean)

  if (suitable.length === 0 && unsuitable.length === 0) return null

  return {
    title: String(source.title || 'Geeignete Adjustment-Sequenzen'),
    intro: source.intro ? String(source.intro) : undefined,
    suitable,
    unsuitableTitle: String(source.unsuitable_title || source.unsuitableTitle || 'Ungeeignete Vergleiche'),
    unsuitable,
    footer: source.footer ? String(source.footer) : undefined,
  }
}

export function resolveInteractionChainConfig(raw: Record<string, unknown> = {}): InteractionChainConfig {
  return {
    mechanic: 'interaction_chain',
    stageKey: String(raw.stage_key || raw.stageKey || '__interaction_chain_stage'),
    problemDescriptionKey: String(raw.problem_description_key || raw.problemDescriptionKey || 'problemDescription'),
    problemCategoryKey: String(raw.problem_category_key || raw.problemCategoryKey || 'problemCategory'),
    problemEvidenceKey: String(raw.problem_evidence_key || raw.problemEvidenceKey || 'problemEvidence'),
    problemExampleCountKey: String(
      raw.problem_example_count_key || raw.problemExampleCountKey || 'problemExampleCount',
    ),
    problemSceneNoteKey: String(raw.problem_scene_note_key || raw.problemSceneNoteKey || 'problemSceneNote'),
    adjustmentDescriptionKey: String(
      raw.adjustment_description_key || raw.adjustmentDescriptionKey || 'adjustmentDescription',
    ),
    adjustmentDimensionKey: String(
      raw.adjustment_dimension_key || raw.adjustmentDimensionKey || 'adjustmentDimension',
    ),
    changeMagnitudeKey: String(raw.change_magnitude_key || raw.changeMagnitudeKey || 'changeMagnitude'),
    adjustmentSceneNoteKey: String(
      raw.adjustment_scene_note_key || raw.adjustmentSceneNoteKey || 'adjustmentSceneNote',
    ),
    responseTypeKey: String(raw.response_type_key || raw.responseTypeKey || 'responseType'),
    responseDescriptionKey: String(
      raw.response_description_key || raw.responseDescriptionKey || 'responseDescription',
    ),
    responseRepetitionKey: String(
      raw.response_repetition_key || raw.responseRepetitionKey || 'responseRepetition',
    ),
    responseSceneNoteKey: String(raw.response_scene_note_key || raw.responseSceneNoteKey || 'responseSceneNote'),
    problemEffectKey: String(raw.problem_effect_key || raw.problemEffectKey || 'problemEffect'),
    tradeoffKey: String(raw.tradeoff_key || raw.tradeoffKey || 'tradeoff'),
    tradeoffDetailKey: String(raw.tradeoff_detail_key || raw.tradeoffDetailKey || 'tradeoffDetail'),
    comparabilityKey: String(raw.comparability_key || raw.comparabilityKey || 'comparability'),
    interactionAssessmentKey: String(
      raw.interaction_assessment_key || raw.interactionAssessmentKey || 'interactionAssessment',
    ),
    chainSummaryKey: String(raw.chain_summary_key || raw.chainSummaryKey || 'chainSummary'),
    supportsTradeoff: raw.supports_tradeoff !== false && raw.supportsTradeoff !== false,
    supportsComparability: raw.supports_comparability !== false && raw.supportsComparability !== false,
    requireSummary: raw.require_summary !== false && raw.requireSummary !== false,
    summaryMinChars: Math.max(1, Number(raw.summary_min_chars || raw.summaryMinChars || 40)),
    decisionRule: String(
      raw.decision_rule
        || raw.decisionRule
        || 'Bewerte nicht das Ergebnis. Prüfe, ob sich dieselbe Interaktion anders entwickelt.',
    ),
    coreHint: String(
      raw.core_hint
        || raw.coreHint
        || 'Ein Adjustment kann funktionieren, obwohl danach ein Tor fällt – und wirkungslos sein, obwohl keines fällt.',
    ),
    outcomeBiasHint: String(
      raw.outcome_bias_hint
        || raw.outcomeBiasHint
        || 'Bewerte Verhalten → Reaktion, nicht das Scoreboard.',
    ),
    summaryHelper: String(
      raw.summary_helper
        || raw.summaryHelper
        || 'Vorher … Danach veränderte das Team … Darauf reagierte der Gegner mit …',
    ),
    examplesHelp: resolveExamplesHelp(raw),
  }
}

export function validateInteractionChainAnswers(
  cfg: InteractionChainConfig,
  answers: Record<string, unknown>,
): string | null {
  if (!String(answers[cfg.problemDescriptionKey] || '').trim()) {
    return 'Bitte beschreibe das wiederkehrende Problem vor der Veränderung.'
  }
  if (!answers[cfg.problemCategoryKey]) {
    return 'Bitte ordne das Problem einer Kategorie zu.'
  }

  const evidence = Array.isArray(answers[cfg.problemEvidenceKey])
    ? (answers[cfg.problemEvidenceKey] as string[])
    : []
  if (evidence.length === 0) {
    return 'Bitte markiere, woran du erkennst, dass das Problem sich wiederholt.'
  }

  if (!String(answers[cfg.adjustmentDescriptionKey] || '').trim()) {
    return 'Bitte beschreibe, was das Team sichtbar verändert.'
  }
  if (!answers[cfg.adjustmentDimensionKey]) {
    return 'Bitte ordne die Veränderung einer Dimension zu.'
  }
  if (!answers[cfg.changeMagnitudeKey]) {
    return 'Bitte bewerte, wie deutlich das Adjustment sichtbar ist.'
  }

  if (!answers[cfg.responseTypeKey]) {
    return 'Bitte ordne ein, wie die Interaktion danach reagiert.'
  }
  if (!String(answers[cfg.responseDescriptionKey] || '').trim()) {
    return 'Bitte beschreibe, was danach konkret anders passiert.'
  }

  if (!answers[cfg.problemEffectKey]) {
    return 'Bitte bewerte, was mit dem ursprünglichen Problem passiert.'
  }

  if (cfg.supportsTradeoff && !answers[cfg.tradeoffKey]) {
    return 'Bitte prüfe, welche neue Möglichkeit durch das Adjustment entstehen könnte.'
  }

  if (cfg.supportsComparability && !answers[cfg.comparabilityKey]) {
    return 'Bitte bewerte, ob die Situationen vor und nach dem Adjustment vergleichbar sind.'
  }

  if (!answers[cfg.interactionAssessmentKey]) {
    return 'Bitte schätze ein, wie stark der Hinweis auf eine veränderte Interaktion ist.'
  }

  if (cfg.requireSummary) {
    const summary = String(answers[cfg.chainSummaryKey] || '').trim()
    if (!summary || summary.length < cfg.summaryMinChars) {
      return 'Bitte formuliere die gesamte Kette in 2–3 Sätzen.'
    }
  }

  return null
}

export function viewFromAnswers(
  cfg: InteractionChainConfig,
  answers: Record<string, unknown>,
): InteractionChainView {
  const evidence = Array.isArray(answers[cfg.problemEvidenceKey])
    ? (answers[cfg.problemEvidenceKey] as string[])
    : []

  return {
    problemDescription: String(answers[cfg.problemDescriptionKey] || ''),
    problemCategory: String(answers[cfg.problemCategoryKey] || ''),
    problemEvidence: evidence,
    problemExampleCount: String(answers[cfg.problemExampleCountKey] || '') || undefined,
    adjustmentDescription: String(answers[cfg.adjustmentDescriptionKey] || ''),
    adjustmentDimension: String(answers[cfg.adjustmentDimensionKey] || ''),
    changeMagnitude: String(answers[cfg.changeMagnitudeKey] || ''),
    responseType: String(answers[cfg.responseTypeKey] || ''),
    responseDescription: String(answers[cfg.responseDescriptionKey] || ''),
    responseRepetition: String(answers[cfg.responseRepetitionKey] || '') || undefined,
    problemEffect: String(answers[cfg.problemEffectKey] || ''),
    tradeoff: String(answers[cfg.tradeoffKey] || '') || undefined,
    tradeoffDetail: String(answers[cfg.tradeoffDetailKey] || '') || undefined,
    comparability: String(answers[cfg.comparabilityKey] || '') || undefined,
    interactionAssessment: String(answers[cfg.interactionAssessmentKey] || ''),
    chainSummary: String(answers[cfg.chainSummaryKey] || ''),
  }
}

export function getProblemCategoryOptions() {
  return PROBLEM_CATEGORY_OPTIONS
}

export function getProblemEvidenceOptions() {
  return PROBLEM_EVIDENCE_OPTIONS
}

export function getExampleCountOptions() {
  return EXAMPLE_COUNT_OPTIONS
}

export function getAdjustmentDimensionOptions() {
  return DIMENSION_OPTIONS
}

export function getMagnitudeOptions() {
  return DEFAULT_CHANGE_MAGNITUDE_OPTIONS
}

export function getResponseTypeOptions() {
  return RESPONSE_TYPE_OPTIONS
}

export function getResponseRepetitionOptions() {
  return RESPONSE_REPETITION_OPTIONS
}

export function getProblemEffectOptions() {
  return PROBLEM_EFFECT_OPTIONS
}

export function getTradeoffOptions() {
  return TRADEOFF_OPTIONS
}

export function getComparabilityOptions() {
  return COMPARABILITY_OPTIONS
}

export function getInteractionAssessmentOptions() {
  return INTERACTION_ASSESSMENT_OPTIONS
}
