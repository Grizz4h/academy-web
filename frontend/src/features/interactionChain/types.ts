export type ChainOption = {
  value: string
  label: string
  description?: string
}

export type InteractionChainStage =
  | 'problem'
  | 'adjustment'
  | 'response'
  | 'assess'
  | 'complete'

export type ChainExamplesHelp = {
  title: string
  intro?: string
  suitable: Array<{ title: string; description: string }>
  unsuitableTitle: string
  unsuitable: string[]
  footer?: string
}

export type InteractionChainConfig = {
  mechanic: 'interaction_chain'
  stageKey: string
  problemDescriptionKey: string
  problemCategoryKey: string
  problemEvidenceKey: string
  problemExampleCountKey: string
  problemSceneNoteKey: string
  adjustmentDescriptionKey: string
  adjustmentDimensionKey: string
  changeMagnitudeKey: string
  adjustmentSceneNoteKey: string
  responseTypeKey: string
  responseDescriptionKey: string
  responseRepetitionKey: string
  responseSceneNoteKey: string
  problemEffectKey: string
  tradeoffKey: string
  tradeoffDetailKey: string
  comparabilityKey: string
  interactionAssessmentKey: string
  chainSummaryKey: string
  supportsTradeoff: boolean
  supportsComparability: boolean
  requireSummary: boolean
  summaryMinChars: number
  decisionRule: string
  coreHint: string
  outcomeBiasHint: string
  summaryHelper: string
  examplesHelp: ChainExamplesHelp | null
}

export type InteractionChainView = {
  problemDescription: string
  problemCategory: string
  problemEvidence: string[]
  problemExampleCount?: string
  adjustmentDescription: string
  adjustmentDimension: string
  changeMagnitude: string
  responseType: string
  responseDescription: string
  responseRepetition?: string
  problemEffect: string
  tradeoff?: string
  tradeoffDetail?: string
  comparability?: string
  interactionAssessment: string
  chainSummary: string
}
