import type { CuePriority, CuePriorityResult, CueReviewJudgement } from '../cuePriority/types'
import type {
  AlternativeOccurred,
  BranchTrigger,
  LinearThinkingAssessment,
  ScenarioBranch,
  ScenarioBranchResult,
  TriggerRelevant,
} from '../scenarioBranches/types'
import type {
  PredictionUpdate,
  PredictionUpdateResult,
  UpdateDecision,
  UpdateQuality,
} from '../predictionUpdate/types'

export const OTHER_ACTION_ID = '__other__'
export const NONE_REFLECTION_ID = '__none__'
export const UNCLEAR_REFLECTION_ID = '__unclear__'

export const DEFAULT_CUE_CATEGORIES = [
  'positioning',
  'pressure',
  'support',
  'puck_orientation',
  'available_space',
  'body_orientation',
  'timing',
  'player_movement',
  'other',
] as const

export type AnticipationCueCategory = typeof DEFAULT_CUE_CATEGORIES[number]

export type AnticipationConfidence = 'low' | 'medium' | 'high'

export type AnticipationOutcomeMatch = 'matched' | 'partly_matched' | 'different' | 'unclear'

export type AnticipationReadQuality =
  | 'well_supported'
  | 'partly_supported'
  | 'weakly_supported'
  | 'unclear'

export type OverconfidenceAssessment = 'none' | 'single' | 'multiple' | 'unclear'

export type AnticipationCue = {
  id: string
  category?: AnticipationCueCategory | string
  label: string
  priority?: CuePriority
}

export type AnticipationObservation = {
  id: string
  order: number
  situationLabel?: string
  expectedAction: string
  confidence: AnticipationConfidence
  supportingCues: AnticipationCue[]
  alternativeAction?: string
  branchTriggers?: BranchTrigger[]
  scenarioBranches?: ScenarioBranch[]
  alternativeOccurred?: AlternativeOccurred
  triggerRelevant?: TriggerRelevant
  updateTriggers?: BranchTrigger[]
  updateDecision?: UpdateDecision
  updatedPrediction?: string
  updateReason?: string
  updateQuality?: UpdateQuality
  predictionUpdate?: PredictionUpdate
  actualAction?: string
  outcomeMatch?: AnticipationOutcomeMatch
  readQuality?: AnticipationReadQuality
  cueReview?: CueReviewJudgement
  period?: string
  gameClock?: string
  note?: string
  sceneId?: string
  createdAt?: string
}

export type AnticipationDraftStep =
  | 'expect'
  | 'prioritize'
  | 'alternative'
  | 'triggers'
  | 'actual'
  | 'quality'
  | 'cueReview'
  | 'branchReview'
  | 'updateInfo'
  | 'updateDecide'
  | 'updateReview'

export type AnticipationDraft = {
  step: AnticipationDraftStep
  situationLabel: string
  expectedActionOptionId: string
  expectedAction: string
  confidence: AnticipationConfidence | ''
  cues: AnticipationCue[]
  alternativeActionOptionId: string
  alternativeAction: string
  triggers: BranchTrigger[]
  alternativeOccurred: AlternativeOccurred | ''
  triggerRelevant: TriggerRelevant | ''
  updateTriggers: BranchTrigger[]
  updateDecision: UpdateDecision | ''
  updatedPredictionOptionId: string
  updatedPrediction: string
  updateReason: string
  updateQuality: UpdateQuality | ''
  actualActionOptionId: string
  actualAction: string
  outcomeMatch: AnticipationOutcomeMatch | ''
  readQuality: AnticipationReadQuality | ''
  cueReview: CueReviewJudgement | ''
  period: string
  gameClock: string
  note: string
  sceneId: string
}

export type AnticipationReadStage = 'observe' | 'review' | 'complete'

export type AnticipationSceneExample = {
  title: string
  description: string
}

export type AnticipationExamplesHelp = {
  title: string
  intro?: string
  suitable: AnticipationSceneExample[]
  unsuitableTitle: string
  unsuitable: string[]
  footer?: string
}

export type AnticipationReadConfig = {
  mechanic: 'anticipation_read' | 'cue_priority' | 'scenario_branches' | 'prediction_update'
  minReads: number
  recommendedReads: number
  maxReads: number
  expectedActionOptions: string[]
  otherActionLabel: string
  cueCategories: AnticipationCueCategory[]
  minCues: number
  recommendedCues: number
  maxCues: number
  supportsConfidence: boolean
  supportsGameClock: boolean
  supportsSceneCapture: boolean
  supportsCuePriority: boolean
  supportsScenarioBranches: boolean
  supportsPredictionUpdate: boolean
  minTriggers: number
  maxTriggers: number
  triggerSuggestions: string[]
  minUpdateTriggers: number
  maxUpdateTriggers: number
  updateTriggerSuggestions: string[]
  logsKey: string
  draftKey: string
  stageKey: string
  editIndexKey: string
  addingMoreKey: string
  strongMismatchKey: string
  helpfulCueKey: string
  overconfidenceKey: string
  overconfidenceReadKey: string
  overweightedCueKey: string
  futureCueKey: string
  importantAlternativeKey: string
  strongestTriggerKey: string
  linearThinkingKey: string
  successfulUpdateKey: string
  heldTooLongKey: string
  strongestUpdateInfoKey: string
  resultKey: string
  decisionRule: string
  coreHint: string
  introText: string
  examplesHelp: AnticipationExamplesHelp | null
}

export type AnticipationReadResult = {
  observations: AnticipationObservation[]
  totalReads: number
  outcomeMatchDistribution: {
    matched: number
    partlyMatched: number
    different: number
    unclear: number
  }
  readQualityDistribution: {
    wellSupported: number
    partlySupported: number
    weaklySupported: number
    unclear: number
  }
  cueCategoryCounts: Record<string, number>
  confidenceDistribution: {
    low: number
    medium: number
    high: number
  }
  highConfidenceDifferentCount: number
  selectedStrongReadDespiteMismatchId?: string
  mostHelpfulCueCategory?: string
  overconfidenceAssessment?: OverconfidenceAssessment
  overweightedCueCategory?: string
  futureCueCategory?: string
  importantAlternativeReadId?: string
  strongestTriggerDescription?: string
  linearThinkingAssessment?: LinearThinkingAssessment
  successfulUpdateReadId?: string
  heldTooLongReadId?: string
  strongestUpdateInfo?: string
  cuePriority?: CuePriorityResult
  scenarioBranches?: ScenarioBranchResult
  predictionUpdates?: PredictionUpdateResult
}
