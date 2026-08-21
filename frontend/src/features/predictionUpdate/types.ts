import type { BranchTrigger } from '../scenarioBranches/types'

export type UpdateCue = {
  id: string
  category?: string
  label: string
  priority?: string
}

export type UpdateDecision = 'keep' | 'change'

export type UpdateQuality =
  | 'appropriate'
  | 'too_late'
  | 'too_early'
  | 'unclear'

export type PredictionUpdate = {
  id: string
  initialPrediction: string
  initialCues: UpdateCue[]
  updateTrigger: BranchTrigger
  updateTriggers?: BranchTrigger[]
  updatedPrediction: string
  updateDecision: UpdateDecision
  reason?: string
  updateQuality?: UpdateQuality
}

export type PredictionUpdateRead = {
  id?: string
  expectedAction?: string
  supportingCues?: UpdateCue[]
  updateTriggers?: BranchTrigger[]
  updateDecision?: UpdateDecision | string
  updatedPrediction?: string
  updateReason?: string
  updateQuality?: UpdateQuality | string
  predictionUpdate?: PredictionUpdate
}

export type PredictionUpdateConfig = {
  mechanic: 'prediction_update'
  enabled: boolean
  minUpdateTriggers: number
  maxUpdateTriggers: number
  requireReasonOnKeep: boolean
  requireUpdatedPredictionOnChange: boolean
}

export type PredictionUpdateResult = {
  observations: PredictionUpdateRead[]
  totalUpdates: number
  keepCount: number
  changeCount: number
  updateQualityDistribution: {
    appropriate: number
    tooLate: number
    tooEarly: number
    unclear: number
  }
  commonUpdateTriggers?: Record<string, number>
}
