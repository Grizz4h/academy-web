export type TacticalObservationStage = 'collect' | 'reflect' | 'complete'

export type LabeledOption = {
  id: string
  label: string
  summaryLabel?: string
  hint?: string
  detail?: string
}

export type TacticalObservationLayer = {
  id: string
  fieldKey: string
  prompt: string
  resultTitle: string
  options: LabeledOption[]
  hint?: string
  guideTitle?: string
  showInGuide?: boolean
  multiSelect?: boolean
}

export type TacticalObservationConfig = {
  mechanic: 'tactical_observation'
  required: boolean
  situationLabel: string
  minObservations: number
  recommendedObservations: number
  maxObservations: number
  supportsUnclear: boolean
  layers: TacticalObservationLayer[]
  guideLayerId?: string
  varietyLayerId?: string
  varietyFallback: string
  whyThisDrill: string
  scanButtonLabel: string
  saveButtonLabel: string
  countNoun: string
  countNounSingular: string
  patternPrompt: string
  patternOptions: LabeledOption[]
  patternRequiredMessage: string
  closingNoteLabel: string
  closingNotePlaceholder: string
  handoffText: string
  decisionRule: string
  coreHint: string
  collectEyebrow: string
  reflectEyebrow: string
  resultTitle: string
  incompleteObservationMessage: string
  logsKey: string
  resultKey: string
  payloadKey: string
  stageKey: string
  draftKey: string
  addingMoreKey: string
  editIndexKey: string
  patternKey: string
  closingNoteKey: string
}

export type TacticalObservationDraft = Record<string, string>

export type TacticalObservation = {
  id: string
  order: number
  values?: Record<string, string>
  /** @deprecated legacy flat storage — normalized into values on read */
  initiatorRole?: string
  supportType?: string
  structureType?: string
  availableOption?: string
  optionType?: string
  optionCount?: string
  executedAction?: string
  optionVisibility?: string
  spaceAvailable?: string
  timeAvailable?: string
  influencingFactor?: string
  supportContinuity?: string
  optionContinuity?: string
  structureState?: string
  period?: number | 'OT' | string
  gameClock?: string
  note?: string
  sceneId?: string
}

export type TacticalObservationResult = {
  observationCount: number
  layerCounts: Record<string, Record<string, number>>
  unclearCount: number
  varietyMessage: string
}

export type TacticalObservationPayload = {
  situationLabel: string
  observationCount: number
  layerCounts: Record<string, Record<string, number>>
  unclearCount: number
  patternNoticed: string
  closingNote: string
}
