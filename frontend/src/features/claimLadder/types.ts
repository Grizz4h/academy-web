import type { EvidenceSampleSummary, EvidenceStrength } from '../evidenceAssessment/types'

export const EVIDENCE_PROFILE_SCHEMA_VERSION = 1

export type ClaimLevel =
  | 'description'
  | 'comparison'
  | 'tendency'
  | 'generalization'
  | 'causal'

export type ClaimExample = {
  level: ClaimLevel
  text: string
}

export type ClaimLimitationId =
  | 'small_sample'
  | 'unequal_groups'
  | 'poor_comparability'
  | 'several_counterexamples'
  | 'unclear_definition'
  | 'extra_dimension'
  | 'unclear_outcomes'
  | 'no_clear_difference'
  | 'other'

export type EvidenceSynthesisCase = {
  id: string
  title: string
  question: string
  evidenceInput: EvidenceSampleSummary
  observedData: {
    labelA?: string
    countA?: number
    totalA?: number
    rateA?: number
    labelB?: string
    countB?: number
    totalB?: number
    rateB?: number
  }
  evidenceStrengthHint?: EvidenceStrength
  limitations: string[]
  counterEvidence?: string[]
  contextNotes?: string[]
  claimExamples: ClaimExample[]
  descriptiveOptions: Array<{ value: string; label: string }>
  ceilingFeedback?: Partial<Record<ClaimLevel, string>>
}

export type EvidenceProfile = {
  schemaVersion: number
  caseId?: string
  question: string
  sampleSummary: {
    total: number
    groups?: {
      label: string
      targetCount: number
      total: number
      rate: number
    }[]
  }
  descriptiveNote?: string
  evidenceStrength: EvidenceStrength
  maxClaimLevel: ClaimLevel
  primaryLimitation: string
  primaryLimitationOther?: string
  counterEvidence?: string[]
  finalClaim: string
  nextObservationTest: string
  falsificationCondition?: string
  confidenceNote?: string
}

export type ClaimLadderDraft = {
  caseId?: string
  descriptiveChoice?: string
  descriptiveNote?: string
  evidenceStrength?: EvidenceStrength
  maxClaimLevel?: ClaimLevel
  primaryLimitation?: ClaimLimitationId | ''
  primaryLimitationOther?: string
  counterEvidence?: string
  finalClaim?: string
  nextObservationTest?: string
  falsificationCondition?: string
}

export type ClaimLadderStage = 'intro' | 'assess' | 'review' | 'complete'

export type ClaimLadderStep =
  | 'case'
  | 'describe'
  | 'evidence'
  | 'claim'
  | 'limitation'
  | 'counterevidence'
  | 'final_claim'
  | 'next_test'

export type ClaimLadderConfig = {
  mechanic: 'claim_ladder'
  schemaVersion: number
  cases: EvidenceSynthesisCase[]
  profilesKey: string
  profileKey: string
  caseIndexKey: string
  stepKey: string
  stageKey: string
  microfeedbackKey: string
  temptingClaimKey: string
  decisionRule: string
  coreHint: string
  claimHint: string
  scaffoldHint: string
  nextTestHint: string
  finalClaimMinChars: number
  nextTestMinChars: number
}

export type { EvidenceSampleSummary, EvidenceStrength }
