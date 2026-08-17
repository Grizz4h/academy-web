import type { ConditionOutcomeMatrixCounts } from '../conditionalOutcome/types'
import type { Comparability, PerceivedDifference } from '../cohortRateCompare/types'
import type { CohortRateCompareResult } from '../cohortRateCompare/types'
import type { ConditionalOutcomeResult } from '../conditionalOutcome/types'
import type { OpportunityRateResult } from '../opportunityRate/types'

export type EvidenceSourceType = 'rate' | 'cohort_compare' | 'conditional_compare' | 'manual'

export type EvidenceSampleStrength = 'very_thin' | 'thin' | 'usable' | 'solid'

export type EvidenceCounterexampleImpact =
  | 'none_or_few'
  | 'some'
  | 'several'
  | 'dominant'
  | 'unclear'

export type EvidenceDefinitionClarity = 'very_clear' | 'mostly_clear' | 'partly_unclear' | 'unclear'

export type EvidenceStrength =
  | 'strongly_supported'
  | 'reasonably_supported'
  | 'suggestive'
  | 'weak'
  | 'insufficient'
  | 'unclear'

export type EvidenceComparability = Comparability
export type EvidenceDifferenceClarity = PerceivedDifference

export type EvidenceSampleSummary = {
  sampleSize: number
  groupSizes?: number[]
  groupLabels?: string[]
  targetCounts?: number[]
  rates?: number[]
  differencePercentagePoints?: number
  unclearCount?: number
  comparability?: EvidenceComparability
  counterexampleCount?: number
  definitionClarity?: EvidenceDefinitionClarity
  sourceType: EvidenceSourceType
  conditionLabel?: string
  targetLabel?: string
  matrix?: ConditionOutcomeMatrixCounts
}

export type EvidenceInput =
  | OpportunityRateResult
  | CohortRateCompareResult
  | ConditionalOutcomeResult
  | EvidenceSampleSummary

export type EvidenceStatementTone = 'sample_bound' | 'overclaim' | 'causal' | 'denial'

export type EvidenceStatementOption = {
  id: string
  text: string
  tone: EvidenceStatementTone
}

export type EvidenceDimensionOption<T extends string = string> = {
  value: T
  label: string
}

export type EvidenceDimensionId =
  | 'sample'
  | 'comparability'
  | 'counterexamples'
  | 'difference'
  | 'definition'

export type EvidenceDimensionDefinition<T extends string = string> = {
  id: EvidenceDimensionId
  label: string
  question: string
  help?: string
  options: EvidenceDimensionOption<T>[]
}

export type EvidenceCaseDefinition = {
  id: string
  title: string
  statement: string
  sample: EvidenceSampleSummary
  contextNotes?: string[]
  intendedLearningFocus?: EvidenceDimensionId
  statements: EvidenceStatementOption[]
  supportedStatementId: string
  feedback?: Partial<Record<EvidenceStrength, string>>
  nextEvidenceOptions?: EvidenceDimensionOption[]
  weakeningOptions?: EvidenceDimensionOption[]
}

export type EvidenceDimensions = {
  sampleStrength?: EvidenceSampleStrength
  comparability?: EvidenceComparability
  counterexamples?: EvidenceCounterexampleImpact
  differenceClarity?: EvidenceDifferenceClarity
  definitionClarity?: EvidenceDefinitionClarity
}

export type EvidenceAssessment = {
  caseId?: string
  sourceSessionId?: string
  dimensions: EvidenceDimensions
  overallStrength?: EvidenceStrength
  strongestSupportedStatement?: string
  tooStrongStatement?: string
  userStatement?: string
  evidenceNeededNext?: string
  weakeningEvidence?: string
}

export type EvidenceAssessmentStage = 'intro' | 'assess' | 'review' | 'complete'

export type EvidenceCaseStep =
  | 'sample'
  | 'comparability'
  | 'counterexamples'
  | 'difference'
  | 'definition'
  | 'overall'
  | 'statements'
  | 'next_evidence'

export type EvidenceAssessmentConfig = {
  mechanic: 'evidence_assessment'
  cases: EvidenceCaseDefinition[]
  assessmentsKey: string
  caseIndexKey: string
  stepKey: string
  stageKey: string
  microfeedbackKey: string
  microfeedbackNoteKey: string
  decisionRule: string
  coreHint: string
  sampleLimitNote: string
  statementHint: string
  userStatementMinChars: number
}

export type { Comparability, PerceivedDifference, ConditionOutcomeMatrixCounts }
