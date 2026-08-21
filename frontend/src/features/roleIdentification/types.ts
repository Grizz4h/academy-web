export type GuidanceMode = 'guided' | 'assisted' | 'blind'

export type FoundStatus = 'yes' | 'with_help' | 'unsure'

export type RoleIdentificationStage = 'collect' | 'reflect' | 'complete'

export type LabeledOption = {
  id: string
  label: string
  summaryLabel?: string
}

export type RoleSearchAnchor = {
  id: string
  label: string
  hint?: string
}

export type RoleObservationStep = {
  id: string
  title: string
  guidance: string
}

export type RoleIdentificationConfig = {
  mechanic: 'role_identification'
  required: boolean
  targetRole: string
  targetRoleLabel: string
  whyThisRole: string
  guidanceMode: GuidanceMode
  lineupHint: string
  searchAnchors: RoleSearchAnchor[]
  searchAnchorsDisclaimer: string
  observationSteps: RoleObservationStep[]
  minObservations: number
  recommendedObservations: number
  maxObservations: number
  foundOptions: LabeledOption[]
  hintOptions: LabeledOption[]
  closingPrompt: string
  closingNotePlaceholder: string
  handoffText: string
  decisionRule: string
  coreHint: string
  resultTitle: string
  logsKey: string
  resultKey: string
  payloadKey: string
  stageKey: string
  draftKey: string
  addingMoreKey: string
  editIndexKey: string
  closingNoteKey: string
}

export type RoleObservationDraft = {
  found: FoundStatus | ''
  helpfulHint: string
  note: string
}

export type RoleObservation = {
  id: string
  order: number
  stepId?: string
  found: FoundStatus
  helpfulHint: string
  note?: string
}

export type RoleIdentificationResult = {
  observationCount: number
  foundCounts: Record<FoundStatus, number>
  hintCounts: Record<string, number>
}

export type RoleIdentificationPayload = {
  targetRole: string
  guidanceMode: GuidanceMode
  observationCount: number
  foundCounts: Record<FoundStatus, number>
  hintCounts: Record<string, number>
  closingNote: string
}
