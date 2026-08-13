import {
  ALTERNATIVE_OPTIONS,
  DEFAULT_CONFIDENCE_OPTIONS,
  EVIDENCE_OPTIONS,
  LINK_STRENGTH_OPTIONS,
  PRIOR_PROBLEM_OPTIONS,
  PROBLEM_FIT_OPTIONS,
  TRIGGER_TYPE_OPTIONS,
} from './labels'
import type { HypothesisExamplesHelp, TriggerHypothesisConfig } from './types'

function resolveExamplesHelp(raw: Record<string, unknown>): HypothesisExamplesHelp | null {
  const source = (raw.hypothesis_examples || raw.hypothesisExamples || raw.comparison_examples || null) as
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
    title: String(source.title || 'Beispiele für geeignete Adjustment-Hypothesen'),
    intro: source.intro ? String(source.intro) : undefined,
    suitable,
    unsuitableTitle: String(source.unsuitable_title || source.unsuitableTitle || 'Nicht sauber'),
    unsuitable,
    footer: source.footer ? String(source.footer) : undefined,
  }
}

export function resolveTriggerHypothesisConfig(raw: Record<string, unknown> = {}): TriggerHypothesisConfig {
  return {
    mechanic: 'trigger_hypothesis',
    stageKey: String(raw.stage_key || raw.stageKey || '__trigger_hypothesis_stage'),
    observedChangeKey: String(raw.observed_change_key || raw.observedChangeKey || 'observedChange'),
    priorProblemKey: String(raw.prior_problem_key || raw.priorProblemKey || 'priorProblem'),
    priorProblemDetailKey: String(raw.prior_problem_detail_key || raw.priorProblemDetailKey || 'priorProblemDetail'),
    triggerTypeKey: String(raw.trigger_type_key || raw.triggerTypeKey || 'triggerType'),
    evidenceKey: String(raw.evidence_key || raw.evidenceKey || 'evidence'),
    alternativeExplanationKey: String(
      raw.alternative_explanation_key || raw.alternativeExplanationKey || 'alternativeExplanation',
    ),
    alternativeDetailKey: String(raw.alternative_detail_key || raw.alternativeDetailKey || 'alternativeDetail'),
    problemFitKey: String(raw.problem_fit_key || raw.problemFitKey || 'problemFit'),
    linkStrengthKey: String(raw.link_strength_key || raw.linkStrengthKey || 'linkStrength'),
    functionalLinkKey: String(raw.functional_link_key || raw.functionalLinkKey || 'functionalLink'),
    hypothesisSummaryKey: String(raw.hypothesis_summary_key || raw.hypothesisSummaryKey || 'hypothesisSummary'),
    confidenceKey: String(raw.confidence_key || raw.confidenceKey || 'confidence'),
    requireAlternativeExplanation:
      raw.require_alternative_explanation !== false && raw.requireAlternativeExplanation !== false,
    requireFunctionalLink: raw.require_functional_link !== false && raw.requireFunctionalLink !== false,
    requireHypothesisSummary: raw.require_hypothesis_summary !== false && raw.requireHypothesisSummary !== false,
    summaryMinChars: Math.max(1, Number(raw.summary_min_chars || raw.summaryMinChars || 30)),
    functionalLinkMinChars: Math.max(1, Number(raw.functional_link_min_chars || raw.functionalLinkMinChars || 20)),
    decisionRule: String(
      raw.decision_rule
        || raw.decisionRule
        || 'Zeitliche Reihenfolge ist ein Hinweis – keine Ursache. Eine gute Adjustment-Hypothese erklärt, warum genau diese Veränderung zu genau diesem Problem passen könnte.',
    ),
    coreHint: String(
      raw.core_hint
        || raw.coreHint
        || 'Formuliere vorsichtig: könnte / spricht dafür / möglicherweise. Die reale Coaching-Absicht ist unbekannt.',
    ),
    examplesHelp: resolveExamplesHelp(raw),
  }
}

export function validateTriggerHypothesisAnswers(
  cfg: TriggerHypothesisConfig,
  answers: Record<string, unknown>,
): string | null {
  if (!String(answers[cfg.observedChangeKey] || '').trim()) {
    return 'Bitte beschreibe zuerst die beobachtete Veränderung.'
  }
  if (!answers[cfg.priorProblemKey]) {
    return 'Bitte wähle, welches Problem oder gegnerische Verhalten vorher wiederholt auftrat.'
  }
  if (!answers[cfg.triggerTypeKey]) {
    return 'Bitte ordne die Art des möglichen Triggers ein.'
  }

  const evidence = Array.isArray(answers[cfg.evidenceKey]) ? answers[cfg.evidenceKey] as string[] : []
  if (evidence.length === 0) {
    return 'Bitte markiere mindestens ein Indiz für deine Hypothese.'
  }

  if (cfg.requireAlternativeExplanation && !answers[cfg.alternativeExplanationKey]) {
    return 'Bitte prüfe eine alternative Erklärung.'
  }
  if (!answers[cfg.problemFitKey]) {
    return 'Bitte bewerte, ob die Veränderung das Problem adressiert.'
  }
  if (!answers[cfg.linkStrengthKey]) {
    return 'Bitte bewerte den Zusammenhang zwischen Problem und Veränderung.'
  }

  if (cfg.requireFunctionalLink) {
    const link = String(answers[cfg.functionalLinkKey] || '').trim()
    if (!link || link.length < cfg.functionalLinkMinChars) {
      return 'Bitte formuliere, wie die Veränderung das Problem beeinflussen könnte.'
    }
  }

  if (cfg.requireHypothesisSummary) {
    const summary = String(answers[cfg.hypothesisSummaryKey] || '').trim()
    if (!summary || summary.length < cfg.summaryMinChars) {
      return 'Bitte formuliere deine Adjustment-Hypothese in 1–2 Sätzen.'
    }
  }

  if (!answers[cfg.confidenceKey]) {
    return 'Bitte gib an, wie sicher du dir bist.'
  }

  return null
}

export function getPriorProblemOptions() {
  return PRIOR_PROBLEM_OPTIONS
}

export function getTriggerTypeOptions() {
  return TRIGGER_TYPE_OPTIONS
}

export function getEvidenceOptions() {
  return EVIDENCE_OPTIONS
}

export function getAlternativeOptions() {
  return ALTERNATIVE_OPTIONS
}

export function getProblemFitOptions() {
  return PROBLEM_FIT_OPTIONS
}

export function getLinkStrengthOptions() {
  return LINK_STRENGTH_OPTIONS
}

export function getConfidenceOptions() {
  return DEFAULT_CONFIDENCE_OPTIONS
}
