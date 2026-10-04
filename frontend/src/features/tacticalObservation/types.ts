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
  /**
   * When set, this layer is shown only for selected values of another layer.
   * Omitted answers mean “not applicable” — never store `unclear` as a stand-in.
   */
  dependsOnLayerId?: string
  /** Parent option ids for which an answer is required. */
  requiredForParentIds?: string[]
  /** Parent option ids for which the question is shown but optional. */
  optionalForParentIds?: string[]
}

/** How a layer participates in draft/save given current parent answers. */
export type LayerAnswerMode = 'required' | 'optional' | 'omitted'

/**
 * Traits collected per selected parent option (e.g. role → option traits).
 * Config-only — no drill-id branches. Exclusive parent ids skip traits.
 */
export type DependentTraitLayer = {
  id: string
  parentLayerId: string
  /** Parent option ids that require their own trait answers. */
  activeParentIds: string[]
  fieldKeyPrefix: string
  promptTemplate: string
  resultTitle: string
  guideTitle?: string
  options: LabeledOption[]
  multiSelect: boolean
  /** Within one parent's traits, selecting these clears other traits. */
  exclusiveOptionIds: string[]
  legacyFieldKey?: string
  legacyLabel?: string
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
  dependentTraitLayer?: DependentTraitLayer
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
  structureCues?: string
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
