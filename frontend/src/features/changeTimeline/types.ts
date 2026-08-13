export type RelationToBaseline =
  | 'matches_baseline'
  | 'slight_deviation'
  | 'clear_deviation'
  | 'new_behavior'
  | 'mixed'
  | 'unclear'

export type ChangedDimension =
  | 'space_priority'
  | 'pressure_timing'
  | 'positioning'
  | 'depth'
  | 'width'
  | 'support'
  | 'decision_behavior'
  | 'role_distribution'
  | 'puck_movement'
  | 'other'
  | 'unclear'

export type PostChangeStability =
  | 'persists_consistently'
  | 'mostly_persists'
  | 'alternates_with_old'
  | 'returns_to_baseline'
  | 'single_deviation_only'
  | 'too_variable'
  | 'unclear'

export type Comparability =
  | 'yes'
  | 'mostly'
  | 'partly'
  | 'no'
  | 'unclear'

export type ChangeAssessment =
  | 'clear_new_state'
  | 'likely_change'
  | 'possible_change'
  | 'temporary_deviation'
  | 'single_outlier'
  | 'alternating_behavior'
  | 'insufficient_sample'
  | 'unclear'

export type ChangePointChoice =
  | string
  | 'no_clear_change_point'
  | 'too_variable'
  | 'unclear'

export type TimelineOption = {
  value: string
  label: string
  description?: string
}

export type ChangeTimelineObservation = {
  id: string
  order: number
  period?: string
  gameClock?: string
  relationToBaseline: RelationToBaseline
  changedDimension?: ChangedDimension
  description: string
  createdAt?: string
}

export type ChangeTimelineDraft = {
  period: string
  gameClock: string
  relationToBaseline: string
  changedDimension: string
  description: string
}

export type ChangeTimelineConfig = {
  mechanic: 'change_timeline'
  minObservations: number
  maxObservations: number
  logsKey: string
  draftKey: string
  editIndexKey: string
  addingMoreKey: string
  focusKey: string
  baselineKey: string
  baselineAfterCount: number
  changePointKey: string
  stabilityKey: string
  comparabilityKey: string
  changeMagnitudeKey: string
  assessmentKey: string
  summaryKey: string
  stableDimensionsKey: string
  supportsGameClock: boolean
  requireChangePoint: boolean
  requireComparability: boolean
  requireMagnitude: boolean
  summaryMinChars: number
  decisionRule: string
  coreHint: string
}

export type ChangePointEvidence = {
  beforeCount: number
  afterCount: number
  beforeBaselineCount: number
  afterDeviationCount: number
  afterBaselineCount: number
}

export type ChangeTimelineStage = 'collect' | 'assess' | 'complete'
