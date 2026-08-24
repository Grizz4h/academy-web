import type { OpportunityDraft, OpportunityObservation, RateDefinition, RateExamplesHelp } from '../opportunityRate/types'
import type { OpportunityRateResult } from '../opportunityRate/types'

export type CohortId = 'A' | 'B'

export type CohortDefinition = {
  id: CohortId
  label: string
  description?: string
}

export type CohortOpportunityObservation = OpportunityObservation & {
  cohortId: CohortId
}

export type CohortOpportunityDraft = OpportunityDraft & {
  cohortId: CohortId | ''
}

export type CohortRateCompareStage = 'define' | 'compare' | 'observe' | 'review' | 'complete'

export type Comparability =
  | 'very_comparable'
  | 'mostly_comparable'
  | 'partly_comparable'
  | 'poorly_comparable'
  | 'unclear'

export type PerceivedDifference =
  | 'minimal'
  | 'small'
  | 'clear'
  | 'large'
  | 'unclear'

export type DimensionTemplate = {
  id: string
  label: string
  groupALabel?: string
  groupBLabel?: string
}

export type CohortRateCompareConfig = {
  mechanic: 'cohort_rate_compare'
  allowTemplates: boolean
  allowCustomDefinition: boolean
  minObservations: number
  minPerGroup: number
  recommendedObservations: number
  maxObservations: number
  supportsGameClock: boolean
  supportsSceneCapture: boolean
  supportsUnclear: boolean
  unclearOutcomeId: string
  definitionKey: string
  comparisonKey: string
  logsKey: string
  draftKey: string
  stageKey: string
  editIndexKey: string
  addingMoreKey: string
  comparabilityKey: string
  differenceKey: string
  confounderKey: string
  conclusionKey: string
  templateIds: string[]
  dimensionTemplates: DimensionTemplate[]
  decisionRule: string
  coreHint: string
  sampleLimitNote: string
  conclusionHint: string
  wordingHelp: string
  summaryMinChars: number
  examplesHelp: RateExamplesHelp | null
}

export type CohortComparison = {
  dimensionLabel: string
  question: string
  questionManual?: boolean
  templateId?: string
  groupA: CohortDefinition
  groupB: CohortDefinition
}

export type CohortGroupResult = {
  id: CohortId
  label: string
  /** Gültige Ausgangssituationen in dieser Vergleichsgruppe. */
  totalOpportunities: number
  evaluableCount: number
  targetCount: number
  otherCount: number
  rate: number
  ratePercent: number
  unclearCount: number
  outcomeDistribution: Record<string, number>
  distributionItems: OpportunityRateResult['distributionItems']
  rateSummary: string
}

export type CohortRateCompareResult = {
  metricDefinition: RateDefinition
  comparisonDimension: string
  question: string
  groupA: CohortGroupResult
  groupB: CohortGroupResult
  percentagePointDifference: number
  sampleImbalance: boolean
}
