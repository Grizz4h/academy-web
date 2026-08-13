export type TimelineOption = {
  value: string
  label: string
  description?: string
  group?: string
}

export type TriggerHypothesisStage =
  | 'change'
  | 'problem'
  | 'evidence'
  | 'alternative'
  | 'assess'
  | 'complete'

export type HypothesisExamplesHelp = {
  title: string
  intro?: string
  suitable: Array<{ title: string; description: string }>
  unsuitableTitle: string
  unsuitable: string[]
  footer?: string
}

export type TriggerHypothesisConfig = {
  mechanic: 'trigger_hypothesis'
  stageKey: string
  observedChangeKey: string
  priorProblemKey: string
  priorProblemDetailKey: string
  triggerTypeKey: string
  evidenceKey: string
  alternativeExplanationKey: string
  alternativeDetailKey: string
  problemFitKey: string
  linkStrengthKey: string
  functionalLinkKey: string
  hypothesisSummaryKey: string
  confidenceKey: string
  requireAlternativeExplanation: boolean
  requireFunctionalLink: boolean
  requireHypothesisSummary: boolean
  summaryMinChars: number
  functionalLinkMinChars: number
  decisionRule: string
  coreHint: string
  examplesHelp: HypothesisExamplesHelp | null
}
