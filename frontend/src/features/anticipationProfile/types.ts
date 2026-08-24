export type AnticipationProfileCuePatterns = {
  frequentlyUsed: string[]
  rarelyUsed: string[]
}

export type AnticipationProfileDecisionPatterns = {
  keepCount: number
  changeCount: number
}

export type AnticipationProfileBranchPatterns = {
  commonAlternatives: string[]
  commonBranches: string[]
}

export type AnticipationProfileUpdatePatterns = {
  commonTriggers: string[]
}

export type AnticipationProfile = {
  sourceReads: number
  cuePatterns: AnticipationProfileCuePatterns
  decisionPatterns: AnticipationProfileDecisionPatterns
  branchPatterns: AnticipationProfileBranchPatterns
  updatePatterns: AnticipationProfileUpdatePatterns
  sourceDrillIds: string[]
  hasEnoughData: boolean
  /** `read_count` bleibt lesbar für Legacy; Freischaltung nutzt `source_coverage`. */
  enoughBecause: 'read_count' | 'source_coverage' | 'insufficient'
  /** Interne UX-Hinweiszahl aus Config; keine Validitätsschwelle. */
  observationCountHint?: number
}

export type AnticipationProfileReflectionPayload = {
  reads: number
  cuePatterns: AnticipationProfileCuePatterns
  updatePatterns: AnticipationProfileUpdatePatterns & AnticipationProfileDecisionPatterns
  branchPatterns: AnticipationProfileBranchPatterns
  reflectionAnswers: Record<string, string>
}

export type AnticipationProfileConfig = {
  mechanic: 'anticipation_profile'
  minReadsForProfile: number
  sourceDrillIds: string[]
  cueCatalog: string[]
  frequentLimit: number
  rareLimit: number
  logsKey: string
  stageKey: string
  resultKey: string
  payloadKey: string
  helpfulCueKey: string
  futureCueKey: string
  hardToUpdateKey: string
  decisionRule: string
  coreHint: string
  introText: string
  insufficientHint: string
}

export type AnticipationProfileStage = 'review' | 'complete'
