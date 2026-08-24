import type { OpportunityObservation, RateExamplesHelp } from '../opportunityRate/types'
import type { Comparability } from '../cohortRateCompare/types'

export type ConditionState = 'present' | 'absent' | 'unclear'
export type OutcomeState = 'target' | 'other' | 'unclear'

export type ConditionDefinition = {
  id: string
  label: string
  description?: string
}

export type ConditionalHypothesis =
  | 'target_more_with_condition'
  | 'target_more_without_condition'
  | 'roughly_equal'
  | 'no_expectation'

export type HypothesisAssessment =
  | 'confirmed'
  | 'partly_confirmed'
  | 'not_confirmed'
  | 'no_expectation'

export type CounterexampleAssessment =
  | 'multiple'
  | 'some'
  | 'none_clear'
  | 'unclear'

export type ConditionalDefinition = {
  opportunityLabel: string
  condition: ConditionDefinition
  targetEventLabel: string
  question: string
  questionManual?: boolean
  templateId?: string
}

export type ConditionalObservation = OpportunityObservation & {
  conditionState: ConditionState
  outcomeState: OutcomeState
}

export type ConditionalDraft = {
  conditionState: ConditionState | ''
  outcomeState: OutcomeState | ''
  period: string
  gameClock: string
  description: string
  sceneId: string
}

export type ConditionalStage = 'define' | 'observe' | 'review' | 'complete'

export type ConditionTemplate = {
  id: string
  title: string
  description: string
  opportunityLabel: string
  conditionLabel: string
  targetEventLabel: string
}

export type ConditionalOutcomeConfig = {
  mechanic: 'conditional_outcome_compare'
  minObservations: number
  minPresent: number
  minAbsent: number
  recommendedObservations: number
  maxObservations: number
  supportsGameClock: boolean
  supportsSceneCapture: boolean
  definitionKey: string
  hypothesisKey: string
  logsKey: string
  draftKey: string
  stageKey: string
  editIndexKey: string
  addingMoreKey: string
  comparabilityKey: string
  hypothesisAssessmentKey: string
  counterexampleKey: string
  alternativeKey: string
  extraDimensionKey: string
  conclusionKey: string
  decisionRule: string
  coreHint: string
  sampleLimitNote: string
  conclusionHint: string
  wordingHelp: string
  summaryMinChars: number
  alternativeMinChars: number
  examplesHelp: RateExamplesHelp | null
}

export type ConditionOutcomeMatrixCounts = {
  presentTarget: number
  presentOther: number
  absentTarget: number
  absentOther: number
  conditionUnclear: number
  outcomeUnclear: number
  presentOutcomeUnclear: number
  absentOutcomeUnclear: number
}

export type ConditionalRateSlice = {
  /** Gültige Ausgangssituationen mit klarer Bedingung (inkl. unklarer Ergebnisse). */
  total: number
  evaluableCount: number
  targetCount: number
  otherCount: number
  rate: number
  ratePercent: number
  outcomeUnclear: number
  rateSummary: string
}

export type ConditionalOutcomeResult = {
  definition: ConditionalDefinition
  matrix: ConditionOutcomeMatrixCounts
  withCondition: ConditionalRateSlice
  withoutCondition: ConditionalRateSlice
  percentagePointDifference: number
  conditionUnclearCount: number
  outcomeUnclearCount: number
  sampleImbalance: boolean
  counterexampleCount: number
  counterexampleSummary: string | null
}

export type { Comparability }
