export type CompareOptionValue = string

export type CompareFieldOption = {
  value: CompareOptionValue
  label: string
  description?: string
}

export type StateFieldType = 'single_choice' | 'text'

export type StateFieldConfig = {
  id: string
  label: string
  type: StateFieldType
  options?: CompareFieldOption[]
  maxChars?: number
  required?: boolean
}

export type SuitableCompareExample = {
  title: string
  description: string
}

export type CompareExamplesHelp = {
  title: string
  intro?: string
  suitable: SuitableCompareExample[]
  unsuitableTitle: string
  unsuitable: string[]
  footer?: string
}

export type CompareState = Record<string, string>

export type CompareStage = 'before' | 'after' | 'compare' | 'complete'

export type PrimaryChangeValue =
  | 'spacePriority'
  | 'pressureBehavior'
  | 'positioning'
  | 'decisionBehavior'
  | 'other'
  | 'no_clear_change'
  | 'situations_not_comparable'
  | 'unclear'

export type ChangeMagnitude =
  | 'subtle'
  | 'clear'
  | 'major'
  | 'too_variable'
  | 'unclear'

export type CompareConfidence = 'low' | 'medium' | 'high' | 'not_assessable'

export type ComparabilityRating =
  | 'well_comparable'
  | 'partly_comparable'
  | 'not_comparable'
  | 'not_assessable'

export type CompareStatus = 'same' | 'changed' | 'unclear' | 'not_relevant'

export type FieldComparison = {
  fieldId: string
  label: string
  beforeLabel: string
  afterLabel: string
  beforeValue: string
  afterValue: string
  status: CompareStatus
}

export type BeforeAfterCompareConfig = {
  mechanic: 'before_after_compare'
  beforeKey: string
  afterKey: string
  stageKey: string
  primaryChangeKey: string
  stableDimensionsKey: string
  changeMagnitudeKey: string
  changeSummaryKey: string
  confidenceKey: string
  comparabilityKey: string
  comparabilityLimitKey: string
  stateFields: StateFieldConfig[]
  requirePrimaryChange: boolean
  requireSummary: boolean
  requireConfidence: boolean
  requireComparability: boolean
  summaryMinChars: number
  beforeTitle: string
  afterTitle: string
  compareTitle: string
  similarSituationsHint: string
  decisionRule: string
  comparisonRule: string
  examplesHelp: CompareExamplesHelp | null
  submitBeforeLabel: string
  submitAfterLabel: string
  submitCompareLabel: string
}

export type BeforeAfterCompareSummary = {
  comparisons: FieldComparison[]
  changedFieldIds: string[]
  stableFieldIds: string[]
  hasClearChange: boolean
}
