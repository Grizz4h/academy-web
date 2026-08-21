export type ReminderLevel = 'full' | 'compact' | 'minimal'

export type ShiftTrackerStage = 'collect' | 'reflect' | 'complete'

export type LabeledOption = {
  id: string
  label: string
  summaryLabel?: string
  hint?: string
  detail?: string
}

export type ShiftGuidanceTier = {
  maxIndex: number
  guidance: string
  reminderLevel: ReminderLevel
}

export type ShiftTrackerConfig = {
  mechanic: 'shift_tracker'
  required: boolean
  targetRole: string
  targetRoleLabel: string
  showTriggerField: boolean
  showFunctionField: boolean
  minObservations: number
  recommendedObservations: number
  maxObservations: number
  positionOptions: LabeledOption[]
  functionOptions: LabeledOption[]
  triggerOptions: LabeledOption[]
  markerExamples: string[]
  guidanceTiers: ShiftGuidanceTier[]
  relativeHeightHint: string
  whyThisDrill: string
  lineupHint: string
  scanButtonLabel: string
  positionPrompt: string
  functionPrompt: string
  functionHint: string
  triggerPrompt: string
  patternPrompt: string
  patternOptions: LabeledOption[]
  hardestPrompt: string
  hardestOptions: LabeledOption[]
  closingNotePlaceholder: string
  handoffText: string
  decisionRule: string
  coreHint: string
  collectEyebrow: string
  reflectEyebrow: string
  resultTitle: string
  functionsTitle: string
  functionGuideTitle: string
  saveButtonLabel: string
  countNoun: string
  countNounSingular: string
  closingNoteLabel: string
  patternRequiredMessage: string
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

export type ShiftObservationDraft = {
  position: string
  trigger: string
  roleFunction: string
}

export type ShiftObservation = {
  id: string
  order: number
  position: string
  trigger?: string
  roleFunction?: string
}

export type ShiftTrackerResult = {
  observationCount: number
  positionCounts: Record<string, number>
  functionCounts: Record<string, number>
  functionVariety: string
}

export type ShiftTrackerPayload = {
  targetRole: string
  observationCount: number
  positionCounts: Record<string, number>
  functionCounts: Record<string, number>
  patternNoticed: string
  hardestSituation: string
  closingNote: string
}
