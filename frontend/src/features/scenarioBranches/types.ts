export type BranchRole = 'primary' | 'alternative'

export type AlternativeOccurred = 'yes' | 'no'

export type TriggerRelevant = 'yes' | 'partly' | 'no' | 'unclear'

export type LinearThinkingAssessment = 'rarely' | 'sometimes' | 'often' | 'unclear'

export type BranchTrigger = {
  id: string
  description: string
  cueCategory?: string
}

export type ScenarioBranch = {
  id: string
  action: string
  role: BranchRole
  triggerConditions?: string[]
  supportingCues?: string[]
  note?: string
}

export type ScenarioBranchReview = {
  alternativeOccurred: AlternativeOccurred
  triggerRelevant: TriggerRelevant
}

export type ScenarioBranchRead = {
  id?: string
  expectedAction?: string
  alternativeAction?: string
  branchTriggers?: BranchTrigger[]
  alternativeOccurred?: AlternativeOccurred | string
  triggerRelevant?: TriggerRelevant | string
  actualAction?: string
  scenarioBranches?: ScenarioBranch[]
  supportingCues?: Array<{ label?: string; category?: string }>
}

export type ScenarioBranchConfig = {
  mechanic: 'scenario_branches'
  enabled: boolean
  allowAlternative: boolean
  minTriggers: number
  maxTriggers: number
  actionOptions: string[]
  triggerSuggestions: string[]
}

export type ScenarioBranchResult = {
  observations: ScenarioBranchRead[]
  primaryActions: string[]
  alternativeActions: string[]
  branchTriggeredCount: number
  triggerRecognizedCount: number
  commonAlternativePatterns?: Record<string, number>
  commonPrimaryPatterns?: Record<string, number>
  commonTriggerPatterns?: Record<string, number>
}
