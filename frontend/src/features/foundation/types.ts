/** Foundation / Track 0 — config-driven lesson types */

export type FoundationStepType =
  | 'identify_region'
  | 'scenario_choice'
  | 'completion_summary'

export type FoundationRinkRegionId =
  | 'defensive_zone'
  | 'neutral_zone'
  | 'offensive_zone'
  | 'blue_line_near'
  | 'blue_line_far'
  | 'center_line'
  | 'goal_line'
  | 'net_front'
  | 'slot'
  | 'faceoff_dot'
  | 'goalie_spot'
  | 'defense_left'
  | 'defense_right'
  | 'center_spot'
  | 'wing_left'
  | 'wing_right'
  | 'puck_carrier'
  | 'support_player'
  | 'weak_side'

export type FoundationAttackDirection = 'left' | 'right'

export type FoundationScenarioOption = {
  id: string
  label: string
}

export type FoundationMarkerTeam = 'blue' | 'red' | 'neutral'

export type FoundationMarkerOverride = {
  cx?: number
  cy?: number
  label?: string
  team?: FoundationMarkerTeam
  /** Lone puck vs player body */
  kind?: 'player' | 'puck'
  /** Player marker with a visible puck attached (recognition cue, not a role label) */
  hasPuck?: boolean
}

export type FoundationLessonStep = {
  id: string
  type: FoundationStepType
  prompt: string
  /** Links to central glossary via term id */
  termId?: string
  /** Rink tap targets */
  correctRegions?: FoundationRinkRegionId[]
  highlightRegions?: FoundationRinkRegionId[]
  attackDirection?: FoundationAttackDirection
  showMarkers?: FoundationRinkRegionId[]
  /** Optional per-step marker placement / labels / team colors */
  markerOverrides?: Partial<Record<FoundationRinkRegionId, FoundationMarkerOverride>>
  /** Weak-side half of the ice (top/bottom in horizontal attack view) */
  weakSideBand?: 'top' | 'bottom'
  /** Hide the global attack-direction arrow (avoids “Pfeil = Spieler”) */
  hideAttackArrow?: boolean
  /** Quiz */
  options?: FoundationScenarioOption[]
  correctOptionId?: string
  explanation?: string
  gentleWrong?: string
  whyImportant?: string
  /** completion_summary only */
  summaryItems?: string[]
  learnedTermsCount?: number
}

export type FoundationLessonConfig = {
  trackStep?: number
  trackStepLabel?: string
  trackStepTotal?: number
  steps: FoundationLessonStep[]
  learningMode?: boolean
}

export type HockeyExperienceLevel = 'beginner' | 'familiar' | 'advanced'

export type HockeyTermDefinition = {
  id: string
  term: string
  shortDefinition: string
  longDefinition?: string
  category: string
  glossarySlug?: string
}
