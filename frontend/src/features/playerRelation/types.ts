export type PlayerRelationStage = 'collect' | 'reflect' | 'complete'

export type LabeledOption = {
  id: string
  label: string
  summaryLabel?: string
  hint?: string
  detail?: string
}

export type PlayerRelationConfig = {
  mechanic: 'player_relation'
  required: boolean
  focalRole: string
  focalRoleLabel: string
  minObservations: number
  recommendedObservations: number
  maxObservations: number
  puckCarrierOptions: LabeledOption[]
  positionOptions: LabeledOption[]
  relationOptions: LabeledOption[]
  whyThisDrill: string
  lineupHint: string
  scanButtonLabel: string
  saveButtonLabel: string
  countNoun: string
  countNounSingular: string
  puckCarrierPrompt: string
  positionPrompt: string
  relationPrompt: string
  relationHint: string
  relationGuideTitle: string
  relationsTitle: string
  positionsTitle: string
  patternPrompt: string
  patternOptions: LabeledOption[]
  patternRequiredMessage: string
  hardestPrompt: string
  hardestOptions: LabeledOption[]
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
  hardestKey: string
  closingNoteKey: string
}

export type PlayerRelationDraft = {
  puckCarrierRole: string
  focalPosition: string
  relation: string
  note: string
}

export type PlayerRelationObservation = {
  id: string
  order: number
  puckCarrierRole: string
  focalRole: string
  focalPosition: string
  relation: string
  period?: number | 'OT' | string
  gameClock?: string
  note?: string
  sceneId?: string
}

export type PlayerRelationResult = {
  observationCount: number
  relationCounts: Record<string, number>
  positionCounts: Record<string, number>
  puckCarrierCounts: Record<string, number>
  unclearCount: number
  relationVariety: string
}

export type PlayerRelationPayload = {
  focalRole: string
  observationCount: number
  relationCounts: Record<string, number>
  positionCounts: Record<string, number>
  puckCarrierCounts: Record<string, number>
  unclearCount: number
  patternNoticed: string
  hardestSituation: string
  closingNote: string
}
