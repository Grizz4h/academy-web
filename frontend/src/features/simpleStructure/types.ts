export type SimpleStructureStage = 'collect' | 'reflect' | 'complete'

export type LabeledOption = {
  id: string
  label: string
  summaryLabel?: string
  hint?: string
  detail?: string
}

export type StructureGuidanceTier = {
  maxIndex: number
  guidance: string
}

export type TrackRecapStep = {
  id: string
  label: string
}

export type SimpleStructureConfig = {
  mechanic: 'simple_structure'
  required: boolean
  focalRole: string
  focalRoleLabel: string
  minObservations: number
  recommendedObservations: number
  maxObservations: number
  supportsUnclear: boolean
  supportsSceneCapture: boolean
  structureOptions: LabeledOption[]
  guidanceTiers: StructureGuidanceTier[]
  trackRecapTitle: string
  trackRecapLead: string
  trackRecap: TrackRecapStep[]
  whyThisDrill: string
  lineupHint: string
  scanButtonLabel: string
  saveButtonLabel: string
  countNoun: string
  countNounSingular: string
  structurePrompt: string
  structureHint: string
  structureGuideTitle: string
  patternPrompt: string
  patternOptions: LabeledOption[]
  patternRequiredMessage: string
  nextFocusPrompt: string
  nextFocusOptions: LabeledOption[]
  closingNoteLabel: string
  closingNotePlaceholder: string
  handoffText: string
  decisionRule: string
  coreHint: string
  collectEyebrow: string
  reflectEyebrow: string
  resultTitle: string
  showSketch: boolean
  logsKey: string
  resultKey: string
  payloadKey: string
  stageKey: string
  draftKey: string
  addingMoreKey: string
  editIndexKey: string
  patternKey: string
  nextFocusKey: string
  closingNoteKey: string
}

export type SimpleStructureDraft = {
  structureType: string
}

export type SimpleStructureObservation = {
  id: string
  order: number
  structureType: string
  focalRole: string
  period?: number | 'OT' | string
  gameClock?: string
  note?: string
  sceneId?: string
}

export type SimpleStructureResult = {
  observationCount: number
  structureCounts: Record<string, number>
  unclearCount: number
  structureVariety: string
}

export type SimpleStructurePayload = {
  focalRole: string
  observationCount: number
  structureCounts: Record<string, number>
  unclearCount: number
  patternNoticed: string
  nextFocus: string
  closingNote: string
}
