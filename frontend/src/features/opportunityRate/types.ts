export type RateOutcomeDefinition = {
  id: string
  label: string
  description?: string
}

export type RateDefinition = {
  opportunityLabel: string
  targetEventLabel: string
  question: string
  outcomes: RateOutcomeDefinition[]
  targetOutcomeId: string
  templateId?: string
  questionManual?: boolean
}

export type SuitableRateExample = {
  title: string
  description: string
}

export type RateExamplesHelp = {
  title: string
  intro?: string
  suitable: SuitableRateExample[]
  unsuitableTitle: string
  unsuitable: string[]
  footer?: string
}

export type OpportunityObservation = {
  id: string
  order: number
  outcomeId: string
  period?: string
  gameClock?: string
  description?: string
  sceneId?: string
  validOpportunity?: boolean
  createdAt?: string
}

export type OpportunityDraft = {
  outcomeId: string
  period: string
  gameClock: string
  description: string
  sceneId: string
}

export type OpportunityRateStage = 'define' | 'observe' | 'review' | 'complete'

export type OpportunityClarity = 'yes' | 'mostly' | 'partly' | 'no'

export type CountOnlyReflection =
  | 'missing_relative_frequency'
  | 'would_overestimate'
  | 'difference_small'
  | 'unclear'

export type OpportunityRateConfig = {
  mechanic: 'opportunity_rate'
  allowTemplates: boolean
  allowCustomDefinition: boolean
  minObservations: number
  recommendedObservations: number
  maxObservations: number
  supportsGameClock: boolean
  supportsSceneCapture: boolean
  supportsUnclear: boolean
  unclearOutcomeId: string
  definitionKey: string
  logsKey: string
  draftKey: string
  stageKey: string
  editIndexKey: string
  addingMoreKey: string
  clarityKey: string
  countOnlyKey: string
  conclusionKey: string
  templateIds: string[]
  decisionRule: string
  coreHint: string
  sampleLimitNote: string
  conclusionHint: string
  summaryMinChars: number
  examplesHelp: RateExamplesHelp | null
}

export type OutcomeDistributionItem = {
  id: string
  label: string
  count: number
  isTarget: boolean
  isUnclear: boolean
}

export type OpportunityRateResult = {
  definition: RateDefinition
  observations: OpportunityObservation[]
  totalOpportunities: number
  targetCount: number
  rate: number
  ratePercent: number
  outcomeDistribution: Record<string, number>
  distributionItems: OutcomeDistributionItem[]
  unclearCount: number
}

export type RateTemplate = {
  id: string
  title: string
  description: string
  definition: Omit<RateDefinition, 'question'> & { question?: string }
}
