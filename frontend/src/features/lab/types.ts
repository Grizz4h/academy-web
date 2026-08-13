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

export type PredictionFieldDefinition = {
  id: string
  prompt: string
  options: PredictionOption[]
  required?: boolean
  maxSelect?: number
}

export type PredictionOptionGroup = {
  id: string
  label: string
  optionValues: string[]
}

export type PredictionCompareMode = 'manual' | 'exact'

export type PredictionTemplate = {
  id: string
  categoryId: PredictionCategoryId
  title: string
  shortTitle?: string
  description: string
  learningGoal?: string
  relatedAcademyDrills?: string[]
  perspective: 'selected_team' | 'opponent' | 'both'
  perspectiveHint?: string
  situationTrigger: string
  situationGuide?: string[]
  observationGuide: {
    suitableSituations: string[]
    unsuitableSituations: string[]
    whenToPredict: string[]
    howToDecide?: string[]
    ignore?: string[]
  }
  coreHints?: string[]
  observationStartLabel?: string
  observationStartPrompt?: string
  nextSituationLabel?: string
  lockLabel?: string
  lockedStatusLabel?: string
  captureGameClock?: boolean
  recommendedPredictions?: number
  contextFields?: PredictionFieldDefinition[]
  predictionPrompt: string
  predictionOptions: PredictionOption[]
  optionGroups?: PredictionOptionGroup[]
  cueField?: PredictionFieldDefinition
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
    compareMode?: PredictionCompareMode
    hideManualEvaluation?: boolean
    unjudgeableActualValues?: string[]
    outcomeField?: PredictionFieldDefinition
    reflectionField?: PredictionFieldDefinition
    alternativeSolutionField?: PredictionFieldDefinition
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
  reflectionGuidance?: string[]
}
