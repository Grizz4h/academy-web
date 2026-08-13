export type ProfileOption = {
  value: string
  label: string
  description?: string
}

export type AdjustmentProfileStage = 'collect' | 'wrapup' | 'complete'

export type AdjustmentDraftStage = 'before' | 'trigger' | 'after' | 'assess'

export type ProfileExamplesHelp = {
  title: string
  intro?: string
  suitable: Array<{ title: string; description: string }>
  unsuitableTitle: string
  unsuitable: string[]
  footer?: string
}

export type AdjustmentProfileEntry = {
  id: string
  beforeBehavior: string
  changedBehavior: string
  primaryChange: string
  stability: string
  possibleTrigger: string
  triggerEvidence: string
  stableElements: string[]
  interactionResponse: string
  assessment: string
  confidence: string
  counterEvidence?: string
  beforeSceneNote?: string
  changeSceneNote?: string
  responseSceneNote?: string
}

export type AdjustmentProfileDraft = Omit<AdjustmentProfileEntry, 'id'> & {
  id?: string
}

export type AdjustmentProfileConfig = {
  mechanic: 'adjustment_profile'
  stageKey: string
  entriesKey: string
  draftKey: string
  draftStageKey: string
  editIndexKey: string
  addingKey: string
  noClearKey: string
  noClearReasonKey: string
  primaryAdjustmentKey: string
  segmentSummaryKey: string
  nextWatchKey: string
  falsificationNoteKey: string
  minAdjustments: number
  maxAdjustments: number
  allowNoClearAdjustment: boolean
  requireSegmentSummary: boolean
  requireNextWatchFocus: boolean
  summaryMinChars: number
  decisionRule: string
  coreHint: string
  examplesHelp: ProfileExamplesHelp | null
}
