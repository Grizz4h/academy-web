import {
  RATE_TEMPLATES,
} from '../opportunityRate/templates'
import {
  UNCLEAR_OUTCOME_ID,
  calculateOpportunityRate,
  calculatePercentagePointDifference,
  canAddOpportunity,
  canSaveOpportunityDraft,
  emptyOpportunityDraft,
  isDefinitionReady,
  validObservations,
} from '../opportunityRate/rateLogic'
import type { RateDefinition, RateExamplesHelp, SuitableRateExample } from '../opportunityRate/types'
import type {
  CohortComparison,
  CohortId,
  CohortOpportunityDraft,
  CohortOpportunityObservation,
  CohortRateCompareConfig,
  CohortRateCompareResult,
  CohortRateCompareStage,
  Comparability,
  DimensionTemplate,
  PerceivedDifference,
} from './types'

export const DEFAULT_DIMENSION_TEMPLATES: DimensionTemplate[] = [
  { id: 'side', label: 'Seite', groupALabel: 'Links', groupBLabel: 'Rechts' },
  { id: 'pressure', label: 'Druck', groupALabel: 'stärkerer Druck', groupBLabel: 'geringerer Druck' },
  { id: 'support', label: 'Support', groupALabel: 'mit klarer Support-Option', groupBLabel: 'ohne klare Support-Option' },
  { id: 'zone', label: 'Zone' },
  { id: 'role', label: 'Rolle' },
  { id: 'other', label: 'Andere' },
]

export function emptyCohortDraft(): CohortOpportunityDraft {
  return {
    ...emptyOpportunityDraft(),
    cohortId: '',
  }
}

export function emptyComparison(): CohortComparison {
  return {
    dimensionLabel: '',
    question: '',
    groupA: { id: 'A', label: '' },
    groupB: { id: 'B', label: '' },
  }
}

export function composeCompareQuestion(
  targetEventLabel: string,
  groupALabel: string,
  groupBLabel: string,
): string {
  const target = String(targetEventLabel || '').trim() || 'das Zielereignis'
  const a = String(groupALabel || '').trim() || 'Vergleichsgruppe A'
  const b = String(groupBLabel || '').trim() || 'Vergleichsgruppe B'
  return `Wie unterscheidet sich die Rate von ${target} zwischen ${a} und ${b}?`
}

export function applyDimensionTemplate(
  comparison: CohortComparison,
  template: DimensionTemplate,
): CohortComparison {
  return {
    ...comparison,
    templateId: template.id,
    dimensionLabel: template.label === 'Andere' ? comparison.dimensionLabel : template.label,
    questionManual: comparison.questionManual,
    groupA: {
      ...comparison.groupA,
      id: 'A',
      label: template.groupALabel ?? comparison.groupA.label,
    },
    groupB: {
      ...comparison.groupB,
      id: 'B',
      label: template.groupBLabel ?? comparison.groupB.label,
    },
  }
}

export function updateComparisonQuestion(
  comparison: CohortComparison,
  definition: RateDefinition | null,
  patch: Partial<CohortComparison>,
): CohortComparison {
  const next = { ...comparison, ...patch }
  if (patch.groupA) next.groupA = { ...comparison.groupA, ...patch.groupA, id: 'A' }
  if (patch.groupB) next.groupB = { ...comparison.groupB, ...patch.groupB, id: 'B' }
  if (patch.question !== undefined) {
    next.questionManual = true
  } else if (!next.questionManual) {
    next.question = composeCompareQuestion(
      definition?.targetEventLabel || '',
      next.groupA.label,
      next.groupB.label,
    )
  }
  return next
}

export function isComparisonReady(comparison: CohortComparison | null | undefined): boolean {
  if (!comparison) return false
  if (!comparison.dimensionLabel.trim()) return false
  if (!comparison.groupA.label.trim() || !comparison.groupB.label.trim()) return false
  if (comparison.groupA.label.trim().toLowerCase() === comparison.groupB.label.trim().toLowerCase()) {
    return false
  }
  return Boolean(comparison.question.trim())
}

function resolveExamplesHelp(raw: Record<string, unknown>): RateExamplesHelp | null {
  const source = (raw.compare_examples || raw.compareExamples || raw.examples || raw.rate_examples || null) as Record<string, unknown> | null
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
      : Array.isArray(source.unsuitableExamples)
        ? source.unsuitableExamples
        : []
  const unsuitable = unsuitableRaw.map((item: any) => String(item || '').trim()).filter(Boolean)
  if (suitable.length === 0 && unsuitable.length === 0) return null
  return {
    title: String(source.title || 'Welche Vergleiche eignen sich?'),
    intro: source.intro ? String(source.intro) : undefined,
    suitable,
    unsuitableTitle: String(source.unsuitable_title || source.unsuitableTitle || 'Weniger geeignet'),
    unsuitable,
    footer: source.footer ? String(source.footer) : undefined,
  }
}

export function resolveCohortRateCompareConfig(raw: Record<string, unknown> = {}): CohortRateCompareConfig {
  const trackerBlock = (raw.tracker && typeof raw.tracker === 'object'
    ? (raw.tracker as Record<string, unknown>)
    : {})
  const definitionBlock = (raw.definition && typeof raw.definition === 'object'
    ? (raw.definition as Record<string, unknown>)
    : {})
  const minObservations = Math.max(1, Number(trackerBlock.minObservations || raw.minObservations || 8))
  const minPerGroup = Math.max(1, Number(trackerBlock.minPerGroup || raw.minPerGroup || 3))
  const recommendedObservations = Math.max(
    minObservations,
    Number(trackerBlock.recommendedObservations || raw.recommendedObservations || 12),
  )
  const maxObservations = Math.max(
    recommendedObservations,
    Number(trackerBlock.maxObservations || raw.maxObservations || 16),
  )
  const templateIds = Array.isArray(raw.templates)
    ? (raw.templates as string[]).filter(Boolean)
    : Array.isArray(raw.templateIds)
      ? (raw.templateIds as string[]).filter(Boolean)
      : RATE_TEMPLATES.map((item) => item.id)
  const dimensionTemplates = Array.isArray(raw.dimensionTemplates)
    ? (raw.dimensionTemplates as DimensionTemplate[])
    : Array.isArray(raw.dimension_templates)
      ? (raw.dimension_templates as DimensionTemplate[])
      : DEFAULT_DIMENSION_TEMPLATES

  return {
    mechanic: 'cohort_rate_compare',
    allowTemplates: definitionBlock.allowTemplates !== false && raw.allowTemplates !== false,
    allowCustomDefinition: definitionBlock.allowCustomDefinition !== false && raw.allowCustomDefinition !== false,
    minObservations,
    minPerGroup,
    recommendedObservations,
    maxObservations,
    supportsGameClock: trackerBlock.supportsGameClock !== false && raw.supportsGameClock !== false,
    supportsSceneCapture: trackerBlock.supportsSceneCapture !== false && raw.supportsSceneCapture !== false,
    supportsUnclear: trackerBlock.supportsUnclear !== false && raw.supportsUnclear !== false,
    unclearOutcomeId: String(raw.unclearOutcomeId || UNCLEAR_OUTCOME_ID),
    definitionKey: String(raw.definition_key || raw.definitionKey || 'cohort_rate_definition'),
    comparisonKey: String(raw.comparison_key || raw.comparisonKey || 'cohort_rate_comparison'),
    logsKey: String(raw.logs_key || raw.logsKey || 'cohort_rate_observations'),
    draftKey: String(raw.draft_key || raw.draftKey || '__cohort_rate_draft'),
    stageKey: String(raw.stage_key || raw.stageKey || '__cohort_rate_stage'),
    editIndexKey: String(raw.edit_index_key || raw.editIndexKey || '__cohort_rate_edit_index'),
    addingMoreKey: String(raw.adding_more_key || raw.addingMoreKey || '__cohort_rate_adding_more'),
    comparabilityKey: String(raw.comparability_key || raw.comparabilityKey || 'comparability'),
    differenceKey: String(raw.difference_key || raw.differenceKey || 'perceivedDifference'),
    confounderKey: String(raw.confounder_key || raw.confounderKey || 'possibleConfounder'),
    conclusionKey: String(raw.conclusion_key || raw.conclusionKey || 'userConclusion'),
    templateIds,
    dimensionTemplates,
    decisionRule: String(
      raw.decision_rule
        || raw.decisionRule
        || 'Ein Vergleich ist nur so sauber wie das, was du zwischen den Gruppen konstant hältst.',
    ),
    coreHint: String(
      raw.core_hint
        || raw.coreHint
        || 'Gleiche Messfrage, gleiche Ausgangssituation, gleiches Zielereignis. Lege eine primäre Vergleichsdimension fest und dokumentiere weitere sichtbare Unterschiede.',
    ),
    sampleLimitNote: String(
      raw.sample_limit_note
        || raw.sampleLimitNote
        || 'Mindestwerte pro Vergleichsgruppe sind nur Übungsumfang. Sie machen die Stichprobe nicht repräsentativ und sind keine Evidenzschwelle.',
    ),
    conclusionHint: String(
      raw.conclusion_hint
        || raw.conclusionHint
        || 'Nutze „in dieser Stichprobe“. Vermeide „besser“, „schlechter“ oder „effektiver“, sofern das Zielereignis nicht ausdrücklich als erwünscht/unerwünscht definiert wurde.',
    ),
    wordingHelp: String(
      raw.wording_help
        || raw.wordingHelp
        || 'Geeignet: „In dieser Stichprobe war die Rate kontrollierter Zoneneintritte links höher als rechts. Die Gruppen unterschieden sich zusätzlich beim sichtbaren Gegnerdruck.“ Nicht: „Das Team ist über links besser.“',
    ),
    summaryMinChars: Math.max(1, Number(raw.summary_min_chars || raw.summaryMinChars || 20)),
    examplesHelp: resolveExamplesHelp(raw),
  }
}

export function readCompareStage(answers: Record<string, unknown>, stageKey: string): CohortRateCompareStage {
  const raw = String(answers[stageKey] || 'define')
  if (raw === 'define' || raw === 'compare' || raw === 'observe' || raw === 'review' || raw === 'complete') return raw
  return 'define'
}

export function observationsForCohort(
  observations: CohortOpportunityObservation[],
  cohortId: CohortId,
): CohortOpportunityObservation[] {
  return (validObservations(observations) as CohortOpportunityObservation[]).filter((item) => item.cohortId === cohortId)
}

export function canEvaluateCompare(
  countA: number,
  countB: number,
  minTotal: number,
  minPerGroup: number,
): boolean {
  return countA + countB >= minTotal && countA >= minPerGroup && countB >= minPerGroup
}

export function remainingForGroup(count: number, minPerGroup: number): number {
  return Math.max(0, minPerGroup - count)
}

export function hasSampleImbalance(countA: number, countB: number): boolean {
  return countA !== countB && (countA > 0 || countB > 0)
}

export function canSaveCohortDraft(
  draft: CohortOpportunityDraft,
  definition: RateDefinition,
  supportsGameClock: boolean,
): boolean {
  if (draft.cohortId !== 'A' && draft.cohortId !== 'B') return false
  return canSaveOpportunityDraft(draft, definition, supportsGameClock)
}

export function computeCohortRateCompare(
  definition: RateDefinition,
  comparison: CohortComparison,
  observations: CohortOpportunityObservation[],
  unclearId = UNCLEAR_OUTCOME_ID,
): CohortRateCompareResult {
  const groupAObs = observationsForCohort(observations, 'A')
  const groupBObs = observationsForCohort(observations, 'B')
  const rateA = calculateOpportunityRate(definition, groupAObs, unclearId)
  const rateB = calculateOpportunityRate(definition, groupBObs, unclearId)

  return {
    metricDefinition: definition,
    comparisonDimension: comparison.dimensionLabel,
    question: comparison.question || definition.question,
    groupA: {
      id: 'A',
      label: comparison.groupA.label,
      totalOpportunities: rateA.totalOpportunities,
      evaluableCount: rateA.evaluableCount,
      targetCount: rateA.targetCount,
      otherCount: rateA.otherCount,
      rate: rateA.rate,
      ratePercent: rateA.ratePercent,
      unclearCount: rateA.unclearCount,
      outcomeDistribution: rateA.outcomeDistribution,
      distributionItems: rateA.distributionItems,
      rateSummary: rateA.rateSummary,
    },
    groupB: {
      id: 'B',
      label: comparison.groupB.label,
      totalOpportunities: rateB.totalOpportunities,
      evaluableCount: rateB.evaluableCount,
      targetCount: rateB.targetCount,
      otherCount: rateB.otherCount,
      rate: rateB.rate,
      ratePercent: rateB.ratePercent,
      unclearCount: rateB.unclearCount,
      outcomeDistribution: rateB.outcomeDistribution,
      distributionItems: rateB.distributionItems,
      rateSummary: rateB.rateSummary,
    },
    percentagePointDifference: calculatePercentagePointDifference(rateA.rate, rateB.rate),
    sampleImbalance: hasSampleImbalance(rateA.totalOpportunities, rateB.totalOpportunities),
  }
}

export function usesSharedMetricDefinition(
  definition: RateDefinition,
  observations: CohortOpportunityObservation[],
): boolean {
  const targetIds = new Set(observations.map(() => definition.targetOutcomeId))
  return targetIds.size <= 1
}

export function canAddCompareOpportunity(total: number, maxObservations: number): boolean {
  return canAddOpportunity(total, maxObservations)
}

export function comparabilityOptions(): Array<{ value: Comparability; label: string }> {
  return [
    { value: 'very_comparable', label: 'Sehr vergleichbar' },
    { value: 'mostly_comparable', label: 'Überwiegend vergleichbar' },
    { value: 'partly_comparable', label: 'Teilweise vergleichbar' },
    { value: 'poorly_comparable', label: 'Kaum vergleichbar' },
    { value: 'unclear', label: 'Unklar' },
  ]
}

export function perceivedDifferenceOptions(): Array<{ value: PerceivedDifference; label: string }> {
  return [
    { value: 'minimal', label: 'Kaum Unterschied' },
    { value: 'small', label: 'Kleiner Unterschied' },
    { value: 'clear', label: 'Klarer Unterschied' },
    { value: 'large', label: 'Großer Unterschied' },
    { value: 'unclear', label: 'Zu unklar' },
  ]
}

export function validateCohortRateCompareAnswers(
  cfg: CohortRateCompareConfig,
  answers: Record<string, unknown>,
): string | null {
  const definition = answers[cfg.definitionKey] as RateDefinition | undefined
  if (!isDefinitionReady(definition, cfg.unclearOutcomeId)) {
    return 'Bitte definiere gültige Ausgangssituation, Zielereignis und Ergebnis-Kategorien – einmal für beide Gruppen.'
  }
  const comparison = answers[cfg.comparisonKey] as CohortComparison | undefined
  if (!isComparisonReady(comparison)) {
    return 'Bitte definiere Vergleichsdimension sowie Gruppe A und Gruppe B.'
  }
  const observations = Array.isArray(answers[cfg.logsKey])
    ? (answers[cfg.logsKey] as CohortOpportunityObservation[])
    : []
  const usable = validObservations(observations) as CohortOpportunityObservation[]
  const countA = observationsForCohort(usable, 'A').length
  const countB = observationsForCohort(usable, 'B').length
  if (!canEvaluateCompare(countA, countB, cfg.minObservations, cfg.minPerGroup)) {
    return `Für einen ersten Vergleich brauchst du mindestens ${cfg.minPerGroup} Opportunities pro Gruppe und ${cfg.minObservations} insgesamt.`
  }
  if (usable.length > cfg.maxObservations) {
    return `Maximal ${cfg.maxObservations} Opportunities.`
  }
  if (!answers[cfg.comparabilityKey]) {
    return 'Bitte bewerte, wie vergleichbar die beiden Gruppen waren.'
  }
  if (!answers[cfg.differenceKey]) {
    return 'Bitte ordne den beobachteten Unterschied ein.'
  }
  const conclusion = String(answers[cfg.conclusionKey] || '').trim()
  if (conclusion.length < cfg.summaryMinChars) {
    return 'Bitte formuliere den Vergleich in 1–2 Sätzen.'
  }
  return null
}

export { UNCLEAR_OUTCOME_ID }
