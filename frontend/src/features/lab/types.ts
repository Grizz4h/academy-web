export type LabModuleId =
  | 'predict'
  | 'compare'
  | 'hypothesis'
  | 'reconstruction'
  | 'review'

export interface LabModuleConfig {
  id: LabModuleId
  label: string
  description: string
  enabled: boolean
}

export type PredictionCategoryId =
  | 'transition'
  | 'pressure_solution'
  | 'defensive_systems'
  | 'puck_space_movement'

export type PredictionOption = {
  value: string
  label: string
  description?: string
  shortLabel?: string
}

export type PredictionResolutionOption = {
  value: 'correct' | 'partial' | 'incorrect' | 'unjudgeable'
  label: string
  description?: string
}

export type PredictionTemplate = {
  id: string
  categoryId: PredictionCategoryId
  title: string
  description: string
  relatedAcademyDrills?: string[]
  perspective: 'selected_team' | 'opponent' | 'both'
  perspectiveHint?: string
  situationTrigger: string
  observationGuide: {
    suitableSituations: string[]
    unsuitableSituations: string[]
    whenToPredict: string[]
    howToDecide?: string[]
    ignore?: string[]
  }
  predictionPrompt: string
  predictionOptions: PredictionOption[]
  confidence: {
    enabled: boolean
    question: string
    options: PredictionOption[]
  }
  resolution: {
    actualOutcomePrompt: string
    actualOutcomeOptions: PredictionOption[]
    evaluationPrompt: string
    evaluationOptions: PredictionResolutionOption[]
    autoEvaluateExactMatches?: boolean
  }
  missedCue?: {
    enabled: boolean
    prompt: string
    options: PredictionOption[]
  }
  note?: {
    enabled: boolean
    label: string
    placeholder?: string
    maxChars?: number
  }
  minimumResolvedPredictions: number
  activeFocus?: {
    title: string
    text: string
  }
}
