export type CuePriority = 'primary' | 'supporting' | 'secondary'

export type CueReviewJudgement = 'yes' | 'partly' | 'no' | 'unclear'

export type PrioritizableCue = {
  id: string
  category?: string
  label: string
  priority?: CuePriority
}

export type CuePriorityConfig = {
  mechanic: 'cue_priority'
  required: boolean
  requirePrimary: boolean
}

export type CueReviewTone = 'often_helpful' | 'mixed' | 'often_overestimated' | 'unclear'

export type CuePriorityResult = {
  primaryCueDistribution: Record<string, number>
  supportingCueDistribution: Record<string, number>
  secondaryCueDistribution: Record<string, number>
  cueReviewAgreement: {
    matched: number
    partlyMatched: number
    different: number
    unclear: number
  }
  overlookedCues?: string[]
  reviewTones: Array<{
    category: string
    primaryCount: number
    tone: CueReviewTone
  }>
}

export type CuePriorityRead = {
  supportingCues?: PrioritizableCue[]
  cueReview?: CueReviewJudgement | string
}
