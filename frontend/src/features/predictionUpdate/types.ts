import type { BranchTrigger } from '../scenarioBranches/types'

export type UpdateCue = {
  id: string
  category?: string
  label: string
  priority?: string
}

export type UpdateDecision = 'keep' | 'change' | 'no_new_info' | 'unclear'

export type UpdateQuality =
  | 'appropriate'
  | 'after_confirmation'
  | 'too_late'
  | 'too_early'
  | 'not_updated'
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
    afterConfirmation: number
    tooLate: number
    tooEarly: number
    notUpdated: number
    unclear: number
  }
  commonUpdateTriggers?: Record<string, number>
}
