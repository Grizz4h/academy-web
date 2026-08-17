import { comparabilityOptions, perceivedDifferenceOptions } from '../cohortRateCompare/compareLogic'
import type { CohortGroupResult, CohortRateCompareResult } from '../cohortRateCompare/types'
import type { ConditionalOutcomeResult } from '../conditionalOutcome/types'
import { calculatePercentagePointDifference, formatRatePercent } from '../opportunityRate/rateLogic'
import type { OpportunityRateResult } from '../opportunityRate/types'
import { DEFAULT_EVIDENCE_CASES } from './cases'
import type {
  EvidenceAssessment,
  EvidenceAssessmentConfig,
  EvidenceAssessmentStage,
  EvidenceCaseDefinition,
  EvidenceCaseStep,
  EvidenceCounterexampleImpact,
  EvidenceDefinitionClarity,
  EvidenceDimensionDefinition,
  EvidenceDimensionId,
  EvidenceInput,
  EvidenceSampleStrength,
  EvidenceSampleSummary,
  EvidenceStatementOption,
  EvidenceStatementTone,
  EvidenceStrength,
} from './types'

export const EVIDENCE_CASE_STEPS: EvidenceCaseStep[] = [
  'sample',
  'comparability',
  'counterexamples',
  'difference',
  'definition',
  'overall',
  'statements',
  'next_evidence',
]

export const DEFAULT_NEXT_EVIDENCE_OPTIONS = [
  { value: 'more_comparable', label: 'Mehr vergleichbare Opportunities' },
  { value: 'balanced_groups', label: 'Ausgeglichenere Gruppen' },
  { value: 'clearer_definition', label: 'Klarere Definition von Opportunity, Bedingung und Outcome' },
  { value: 'more_counterexamples', label: 'Mehr Gegenfälle prüfen' },
  { value: 'other_opponent', label: 'Dieselbe Bedingung bei einem anderen Gegner beobachten' },
  { value: 'reduce_unclear', label: 'Unklare Fälle reduzieren' },
]

export const DEFAULT_WEAKENING_OPTIONS = [
  { value: 'new_counterexamples', label: 'Mehrere neue Gegenbeispiele' },
  { value: 'difference_vanishes', label: 'Der Unterschied verschwindet bei größerem Sample' },
  { value: 'poor_comparability', label: 'Die Gruppen erweisen sich als schlecht vergleichbar' },
]

const FORBIDDEN_SCORE_PATTERNS = [
  /evidence score/i,
  /confidence\s*\d+\s*%/i,
  /\b\d+\s*\/\s*100\b/,
  /signifikanz/i,
  /p-wert/i,
  /konfidenzintervall/i,
]

export function emptyAssessment(caseId?: string): EvidenceAssessment {
  return {
    caseId,
    dimensions: {},
  }
}

export function isEvidenceSampleSummary(value: unknown): value is EvidenceSampleSummary {
  if (!value || typeof value !== 'object') return false
  const sample = value as EvidenceSampleSummary
  return typeof sample.sampleSize === 'number' && typeof sample.sourceType === 'string'
}

export function toEvidenceSampleFromRate(result: OpportunityRateResult): EvidenceSampleSummary {
  return {
    sourceType: 'rate',
    sampleSize: result.totalOpportunities,
    groupSizes: [result.totalOpportunities],
    groupLabels: [result.definition.targetEventLabel || 'Sample'],
    targetCounts: [result.targetCount],
    rates: [result.rate],
    unclearCount: result.unclearCount,
  }
}

export function toEvidenceSampleFromCohort(result: CohortRateCompareResult): EvidenceSampleSummary {
  return {
    sourceType: 'cohort_compare',
    sampleSize: result.groupA.totalOpportunities + result.groupB.totalOpportunities,
    groupSizes: [result.groupA.totalOpportunities, result.groupB.totalOpportunities],
    groupLabels: [result.groupA.label, result.groupB.label],
    targetCounts: [result.groupA.targetCount, result.groupB.targetCount],
    rates: [result.groupA.rate, result.groupB.rate],
    differencePercentagePoints: result.percentagePointDifference,
    unclearCount: result.groupA.unclearCount + result.groupB.unclearCount,
  }
}

export function toEvidenceSampleFromConditional(result: ConditionalOutcomeResult): EvidenceSampleSummary {
  return {
    sourceType: 'conditional_compare',
    sampleSize: result.withCondition.total + result.withoutCondition.total + result.conditionUnclearCount,
    groupSizes: [result.withCondition.total, result.withoutCondition.total],
    groupLabels: ['Mit Bedingung', 'Ohne Bedingung'],
    targetCounts: [result.withCondition.targetCount, result.withoutCondition.targetCount],
    rates: [result.withCondition.rate, result.withoutCondition.rate],
    differencePercentagePoints: result.percentagePointDifference,
    unclearCount: result.conditionUnclearCount + result.outcomeUnclearCount,
    counterexampleCount: result.counterexampleCount,
    conditionLabel: result.definition.condition.label,
    targetLabel: result.definition.targetEventLabel,
    matrix: result.matrix,
  }
}

export function normalizeEvidenceSample(input: EvidenceInput): EvidenceSampleSummary {
  if (isEvidenceSampleSummary(input)) {
    const rates = input.rates
    const targets = input.targetCounts
    const sizes = input.groupSizes
    let difference = input.differencePercentagePoints
    if (difference === undefined && rates && rates.length >= 2) {
      difference = calculatePercentagePointDifference(rates[0], rates[1])
    } else if (difference === undefined && targets && sizes && sizes.length >= 2 && sizes[0] > 0 && sizes[1] > 0) {
      difference = calculatePercentagePointDifference(targets[0] / sizes[0], targets[1] / sizes[1])
    }
    return { ...input, differencePercentagePoints: difference }
  }
  if ('matrix' in input && 'withCondition' in input) {
    return toEvidenceSampleFromConditional(input)
  }
  if ('groupA' in input && 'groupB' in input && 'percentagePointDifference' in input) {
    return toEvidenceSampleFromCohort(input)
  }
  return toEvidenceSampleFromRate(input as OpportunityRateResult)
}

export function groupsFromSample(sample: EvidenceSampleSummary): [CohortGroupResult, CohortGroupResult] | null {
  const sizes = sample.groupSizes
  const targets = sample.targetCounts
  const labels = sample.groupLabels || ['Gruppe A', 'Gruppe B']
  if (!sizes || sizes.length < 2 || !targets || targets.length < 2) return null
  const toGroup = (id: 'A' | 'B', index: number): CohortGroupResult => {
    const total = sizes[index]
    const targetCount = targets[index]
    const rate = sample.rates?.[index] ?? (total > 0 ? targetCount / total : 0)
    return {
      id,
      label: labels[index] || `Gruppe ${id}`,
      totalOpportunities: total,
      targetCount,
      rate,
      ratePercent: formatRatePercent(rate),
      unclearCount: 0,
      outcomeDistribution: {},
      distributionItems: [],
    }
  }
  return [toGroup('A', 0), toGroup('B', 1)]
}

function parseCases(raw: unknown): EvidenceCaseDefinition[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_EVIDENCE_CASES
  const byId = new Map(DEFAULT_EVIDENCE_CASES.map((item) => [item.id, item]))
  const resolved: EvidenceCaseDefinition[] = []
  for (const item of raw) {
    if (typeof item === 'string' && byId.has(item)) {
      resolved.push(byId.get(item)!)
      continue
    }
    if (item && typeof item === 'object' && 'id' in item && 'sample' in item && 'statement' in item) {
      resolved.push(item as EvidenceCaseDefinition)
    }
  }
  return resolved.length > 0 ? resolved : DEFAULT_EVIDENCE_CASES
}

export function resolveEvidenceAssessmentConfig(raw: Record<string, unknown> = {}): EvidenceAssessmentConfig {
  return {
    mechanic: 'evidence_assessment',
    cases: parseCases(raw.cases),
    assessmentsKey: String(raw.assessments_key || raw.assessmentsKey || 'evidence_assessments'),
    caseIndexKey: String(raw.case_index_key || raw.caseIndexKey || '__evidence_case_index'),
    stepKey: String(raw.step_key || raw.stepKey || '__evidence_case_step'),
    stageKey: String(raw.stage_key || raw.stageKey || '__evidence_assessment_stage'),
    microfeedbackKey: String(raw.microfeedback_key || raw.microfeedbackKey || 'evidenceMicrofeedback'),
    microfeedbackNoteKey: String(raw.microfeedback_note_key || raw.microfeedbackNoteKey || 'evidenceMicrofeedbackNote'),
    decisionRule: String(
      raw.decision_rule
        || raw.decisionRule
        || 'Großer Unterschied heißt nicht automatisch starke Evidenz.',
    ),
    coreHint: String(
      raw.core_hint
        || raw.coreHint
        || 'Je stärker deine Aussage, desto sauberer muss ihre Evidenzbasis sein.',
    ),
    sampleLimitNote: String(
      raw.sample_limit_note
        || raw.sampleLimitNote
        || 'Bei kleinen Samples verändert eine einzelne Observation die Rate stark.',
    ),
    statementHint: String(
      raw.statement_hint
        || raw.statementHint
        || 'Bleib bei der Stichprobe. Behaupte keine Ursache.',
    ),
    userStatementMinChars: Math.max(0, Number(raw.user_statement_min_chars || raw.userStatementMinChars || 0)),
  }
}

export function readEvidenceStage(answers: Record<string, unknown>, stageKey: string): EvidenceAssessmentStage {
  const raw = String(answers[stageKey] || 'intro')
  if (raw === 'intro' || raw === 'assess' || raw === 'review' || raw === 'complete') return raw
  return 'intro'
}

export function readCaseStep(answers: Record<string, unknown>, stepKey: string): EvidenceCaseStep {
  const raw = String(answers[stepKey] || 'sample')
  return EVIDENCE_CASE_STEPS.includes(raw as EvidenceCaseStep) ? raw as EvidenceCaseStep : 'sample'
}

export function readAssessments(answers: Record<string, unknown>, key: string): Record<string, EvidenceAssessment> {
  const raw = answers[key]
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  return raw as Record<string, EvidenceAssessment>
}

export function sampleStrengthOptions(): Array<{ value: EvidenceSampleStrength; label: string }> {
  return [
    { value: 'very_thin', label: 'Sehr dünn' },
    { value: 'thin', label: 'Dünn' },
    { value: 'usable', label: 'Brauchbar' },
    { value: 'solid', label: 'Solide' },
  ]
}

export function counterexampleImpactOptions(): Array<{ value: EvidenceCounterexampleImpact; label: string }> {
  return [
    { value: 'none_or_few', label: 'Kaum' },
    { value: 'some', label: 'Einige' },
    { value: 'several', label: 'Mehrere' },
    { value: 'dominant', label: 'Stark' },
    { value: 'unclear', label: 'Unklar' },
  ]
}

export function definitionClarityOptions(): Array<{ value: EvidenceDefinitionClarity; label: string }> {
  return [
    { value: 'very_clear', label: 'Sehr klar' },
    { value: 'mostly_clear', label: 'Überwiegend klar' },
    { value: 'partly_unclear', label: 'Teilweise unklar' },
    { value: 'unclear', label: 'Unklar' },
  ]
}

export function evidenceStrengthOptions(): Array<{ value: EvidenceStrength; label: string }> {
  return [
    { value: 'strongly_supported', label: 'Stark gestützt' },
    { value: 'reasonably_supported', label: 'Ordentlich gestützt' },
    { value: 'suggestive', label: 'Hinweis' },
    { value: 'weak', label: 'Schwach gestützt' },
    { value: 'insufficient', label: 'Nicht ausreichend' },
    { value: 'unclear', label: 'Unklar' },
  ]
}

export function evidenceDimensions(): EvidenceDimensionDefinition[] {
  return [
    {
      id: 'sample',
      label: 'Sample',
      question: 'Wie tragfähig wirkt die Stichprobengröße für diese Aussage?',
      help: 'Bei kleinen Samples verändert eine einzelne Observation die Rate stark.',
      options: sampleStrengthOptions(),
    },
    {
      id: 'comparability',
      label: 'Vergleichbarkeit',
      question: 'Wie gut lassen sich die Situationen miteinander vergleichen?',
      options: comparabilityOptions(),
    },
    {
      id: 'counterexamples',
      label: 'Gegenbeispiele',
      question: 'Wie stark wird die Aussage durch Gegenbeispiele relativiert?',
      help: 'Ein Gegenbeispiel macht die Aussage nicht automatisch falsch. Es verlangt eine Einschränkung.',
      options: counterexampleImpactOptions(),
    },
    {
      id: 'difference',
      label: 'Unterschied',
      question: 'Wie klar ist der Unterschied in den beobachteten Daten?',
      options: perceivedDifferenceOptions(),
    },
    {
      id: 'definition',
      label: 'Definition',
      question: 'Wie sauber waren Opportunity, Gruppen/Bedingung und Outcome definiert?',
      options: definitionClarityOptions(),
    },
  ]
}

export function microfeedbackOptions(): Array<{ value: EvidenceDimensionId; label: string }> {
  return evidenceDimensions().map((item) => ({ value: item.id, label: item.label }))
}

export function dimensionSegmentCount(
  id: EvidenceDimensionId,
  dimensions: EvidenceAssessment['dimensions'],
): number {
  if (id === 'sample') {
    const value = dimensions.sampleStrength
    if (value === 'very_thin') return 1
    if (value === 'thin') return 2
    if (value === 'usable') return 3
    if (value === 'solid') return 4
  }
  if (id === 'comparability') {
    const value = dimensions.comparability
    if (value === 'poorly_comparable') return 1
    if (value === 'partly_comparable') return 2
    if (value === 'mostly_comparable') return 3
    if (value === 'very_comparable') return 4
  }
  if (id === 'counterexamples') {
    const value = dimensions.counterexamples
    if (value === 'none_or_few') return 1
    if (value === 'some') return 2
    if (value === 'several') return 3
    if (value === 'dominant') return 4
  }
  if (id === 'difference') {
    const value = dimensions.differenceClarity
    if (value === 'minimal') return 1
    if (value === 'small') return 2
    if (value === 'clear') return 3
    if (value === 'large') return 4
  }
  if (id === 'definition') {
    const value = dimensions.definitionClarity
    if (value === 'unclear') return 1
    if (value === 'partly_unclear') return 2
    if (value === 'mostly_clear') return 3
    if (value === 'very_clear') return 4
  }
  return 0
}

export function dimensionValueLabel(id: EvidenceDimensionId, dimensions: EvidenceAssessment['dimensions']): string | null {
  const dim = evidenceDimensions().find((item) => item.id === id)
  if (!dim) return null
  const value = (
    id === 'sample' ? dimensions.sampleStrength
      : id === 'comparability' ? dimensions.comparability
        : id === 'counterexamples' ? dimensions.counterexamples
          : id === 'difference' ? dimensions.differenceClarity
            : dimensions.definitionClarity
  )
  if (!value) return null
  return dim.options.find((item) => item.value === value)?.label || null
}

export function hasDimensionsComplete(assessment: EvidenceAssessment | undefined): boolean {
  const dims = assessment?.dimensions
  return Boolean(
    dims?.sampleStrength
    && dims.comparability
    && dims.counterexamples
    && dims.differenceClarity
    && dims.definitionClarity,
  )
}

export function isCaseAssessmentComplete(assessment: EvidenceAssessment | undefined): boolean {
  if (!assessment || !hasDimensionsComplete(assessment)) return false
  return Boolean(
    assessment.overallStrength
    && assessment.strongestSupportedStatement
    && assessment.tooStrongStatement
    && String(assessment.evidenceNeededNext || '').trim(),
  )
}

export function statementToneExplanation(tone: EvidenceStatementTone): string {
  if (tone === 'sample_bound') {
    return 'Diese Formulierung bleibt bei der beobachteten Stichprobe und behauptet keine Ursache.'
  }
  if (tone === 'overclaim') {
    return 'Diese Aussage geht über die vorhandene Evidenz hinaus.'
  }
  if (tone === 'causal') {
    return 'Diese Aussage behauptet eine Ursache, die das Sample nicht tragen kann.'
  }
  return 'Die Zahlen zeigen einen Unterschied – ihn zu leugnen unterschlägt die Beobachtung.'
}

export function findStatement(
  caseDef: EvidenceCaseDefinition,
  statementId?: string,
): EvidenceStatementOption | undefined {
  if (!statementId) return undefined
  return caseDef.statements.find((item) => item.id === statementId || item.text === statementId)
}

export function overallFeedback(caseDef: EvidenceCaseDefinition, strength?: EvidenceStrength): string | null {
  if (!strength) return null
  return caseDef.feedback?.[strength] || null
}

export function containsForbiddenScoreLanguage(text: string): boolean {
  return FORBIDDEN_SCORE_PATTERNS.some((pattern) => pattern.test(text))
}

export function defaultCopyHasNoAutomaticScore(cfg: EvidenceAssessmentConfig): boolean {
  const blobs = [
    cfg.decisionRule,
    cfg.coreHint,
    cfg.sampleLimitNote,
    cfg.statementHint,
    ...cfg.cases.flatMap((item) => [
      item.title,
      item.statement,
      ...(item.contextNotes || []),
      ...Object.values(item.feedback || {}),
    ]),
  ]
  return blobs.every((text) => !containsForbiddenScoreLanguage(String(text || '')))
}

export function validateEvidenceAssessmentAnswers(
  cfg: EvidenceAssessmentConfig,
  answers: Record<string, unknown>,
): string | null {
  const assessments = readAssessments(answers, cfg.assessmentsKey)
  for (const caseDef of cfg.cases) {
    if (!isCaseAssessmentComplete(assessments[caseDef.id])) {
      return `Bitte schließe die Evidenzbewertung für „${caseDef.title}“ vollständig ab.`
    }
  }
  if (!answers[cfg.microfeedbackKey]) {
    return 'Bitte halte fest, welche Dimension deine Einschätzung am stärksten verändert hat.'
  }
  return null
}

export {
  comparabilityOptions,
  perceivedDifferenceOptions,
}
export type { EvidenceSampleStrength, EvidenceStrength }
