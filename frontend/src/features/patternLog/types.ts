/**
 * Generic Pattern Log mechanic — reusable for E1, Compare, Hypothesis, Meta Analysis.
 * Stores observations that jointly test one suspected pattern within a session.
 */

export type PatternZone =
  | 'defensive_zone'
  | 'neutral_zone'
  | 'offensive_zone'
  | 'blue_line'
  | 'multiple_zones'
  | 'unclear'

export type PatternTrigger =
  | 'puck_loss'
  | 'zone_entry'
  | 'zone_exit'
  | 'opponent_pressure'
  | 'pass_to_side'
  | 'reset'
  | 'rebound_second_puck'
  | 'faceoff_or_set_play'
  | 'transition'
  | 'other'
  | 'unclear'

export type PatternSide =
  | 'left'
  | 'right'
  | 'middle'
  | 'both'
  | 'not_relevant'
  | 'unclear'

export type PatternSimilarity =
  | 'same_zone'
  | 'same_trigger'
  | 'same_team_reaction'
  | 'same_side'
  | 'similar_positioning'
  | 'similar_sequence'
  | 'only_outcome_similar'
  | 'little_similarity'
  | 'unclear'

export type PatternContextTag =
  | 'high_pressure'
  | 'low_pressure'
  | 'controlled_possession'
  | 'loose_puck'
  | 'rush'
  | 'established_structure'
  | 'quick_change'
  | 'unclear'

export type PatternAssessment =
  | 'strong_pattern'
  | 'likely_tendency'
  | 'possible_signal'
  | 'mostly_individual_cases'
  | 'insufficient_sample'
  | 'unclear'

export type PatternCaseType = 'pattern_case' | 'counter_case'

export type PressureLevel =
  | 'low'
  | 'moderate'
  | 'high'
  | 'changing'
  | 'unclear'

export type PossessionState =
  | 'controlled'
  | 'partly_controlled'
  | 'loose_puck'
  | 'contested'
  | 'transitioning'
  | 'unclear'

export type SupportState =
  | 'strong_support'
  | 'some_support'
  | 'isolated'
  | 'changing'
  | 'not_relevant'
  | 'unclear'

export type ConditionDimensionId =
  | 'zone'
  | 'trigger'
  | 'pressureLevel'
  | 'possessionState'
  | 'supportState'
  | 'side'

export type ConditionRole = 'core' | 'supporting' | 'incidental' | 'unclear'

export type ConditionAssessment =
  | 'clear_conditions'
  | 'likely_conditions'
  | 'some_signal'
  | 'conditions_too_variable'
  | 'insufficient_sample'
  | 'unclear'

export type CounterDifference =
  | 'other_zone'
  | 'other_trigger'
  | 'other_pressure'
  | 'other_possession'
  | 'other_support'
  | 'other_side'
  | 'other_positioning'
  | 'nothing_clear'
  | 'unclear'

export type RelevantConditionEntry = {
  dimensionId: ConditionDimensionId | 'none_clear' | 'unclear'
  role?: ConditionRole
}

export type PatternLogObservation = {
  id: string
  zone: PatternZone
  trigger: PatternTrigger
  teamReaction: string
  side?: PatternSide
  contextTags?: PatternContextTag[]
  /** Present from observation 2 onward — user-classified similarity. */
  similarities?: PatternSimilarity[]
  /** E1_D2 / condition matrix */
  caseType?: PatternCaseType
  pressureLevel?: PressureLevel
  possessionState?: PossessionState
  supportState?: SupportState
  /** E1_D3 / invariant map */
  primaryAction?: string
  targetEffect?: TargetEffect
  actorRole?: ActorRole
  sequenceSimilarity?: SequenceSimilarity
  /** E1_D4 / attribution */
  patternPresence?: PatternPresence
  opponentContext?: OpponentContext
  personnelContext?: PersonnelContext
  gameStateContext?: GameStateContext
  startingCondition?: StartingCondition
  note?: string
  createdAt?: string
}

export type PatternLogDraft = {
  zone?: PatternZone | ''
  trigger?: PatternTrigger | ''
  teamReaction?: string
  side?: PatternSide | ''
  contextTags?: PatternContextTag[]
  similarities?: PatternSimilarity[]
  caseType?: PatternCaseType | ''
  pressureLevel?: PressureLevel | ''
  possessionState?: PossessionState | ''
  supportState?: SupportState | ''
  primaryAction?: string
  targetEffect?: TargetEffect | ''
  actorRole?: ActorRole | ''
  sequenceSimilarity?: SequenceSimilarity | ''
  patternPresence?: PatternPresence | ''
  opponentContext?: OpponentContext | ''
  personnelContext?: PersonnelContext | ''
  gameStateContext?: GameStateContext | ''
  startingCondition?: StartingCondition | ''
  note?: string
}

export type PatternLogResult = {
  observations: PatternLogObservation[]
  patternAssessment?: PatternAssessment | ''
  patternSummary?: string
  /** Optional mid-session label after observation 2+ */
  patternLabel?: string
}

export type PatternConditionResult = {
  patternCandidate: string
  cases: PatternLogObservation[]
  relevantConditions: RelevantConditionEntry[]
  counterCaseDifferences?: CounterDifference[]
  counterDifferenceNote?: string
  conditionAssessment: ConditionAssessment | ''
  ifThenSummary: string
  noCounterCase?: boolean
}

export type TargetEffect =
  | 'middle'
  | 'outside'
  | 'weak_side'
  | 'net_front'
  | 'depth'
  | 'blue_line'
  | 'passing_lane'
  | 'shot_lane'
  | 'support_option'
  | 'space_behind'
  | 'other'
  | 'not_relevant'
  | 'unclear'

export type ActorRole =
  | 'center'
  | 'wing'
  | 'defense'
  | 'puck_carrier'
  | 'nearest_defender'
  | 'multiple'
  | 'changing'
  | 'not_relevant'
  | 'unclear'

export type SequenceSimilarity =
  | 'very_similar'
  | 'similar'
  | 'same_function_different_execution'
  | 'noticeably_different'
  | 'unclear'

export type InvariantDimensionId =
  | 'zone'
  | 'trigger'
  | 'primaryAction'
  | 'targetEffect'
  | 'actorRole'
  | 'side'
  | 'sequenceSimilarity'

export type InvariantDimensionRole =
  | 'core'
  | 'frequent'
  | 'variable'
  | 'not_relevant'
  | 'unclear'

export type StructuredConsistency =
  | 'constant'
  | 'mostly_constant'
  | 'variable'
  | 'insufficient_data'
  | 'user_judged'

export type PatternFlexibility =
  | 'rigid'
  | 'stable_with_variation'
  | 'functionally_stable'
  | 'highly_variable'
  | 'too_few_examples'
  | 'unclear'

export type PrimaryActionEquality =
  | 'yes'
  | 'mostly'
  | 'no'
  | 'unclear'

export type DimensionAssessmentEntry = {
  dimensionId: InvariantDimensionId
  role: InvariantDimensionRole
}

export type PatternInvariantResult = {
  patternCandidate: string
  observations: PatternLogObservation[]
  dimensionAssessments: DimensionAssessmentEntry[]
  invariantSummary: string
  allowedVariation: Array<InvariantDimensionId | 'other' | 'none' | 'unclear'>
  flexibilityAssessment: PatternFlexibility | ''
  primaryActionEquality?: PrimaryActionEquality | ''
}

export type PatternPresence = 'clear' | 'partial' | 'absent' | 'unclear'

export type OpponentContext =
  | 'very_similar'
  | 'similar'
  | 'different'
  | 'strongly_different'
  | 'unclear'

export type PersonnelContext =
  | 'same'
  | 'similar_roles'
  | 'different'
  | 'changing'
  | 'unclear'

export type GameStateContext =
  | 'neutral'
  | 'leading'
  | 'trailing'
  | 'late_game'
  | 'special_situation'
  | 'changing'
  | 'not_relevant'
  | 'unclear'

export type StartingCondition =
  | 'very_similar'
  | 'similar'
  | 'different'
  | 'unclear'

export type PatternAttribution =
  | 'mostly_structural'
  | 'mostly_situational'
  | 'opponent_driven'
  | 'personnel_driven'
  | 'game_state_driven'
  | 'mixed'
  | 'insufficient_evidence'
  | 'unclear'

export type AttributionConfidence = 'low' | 'medium' | 'high'

export type EvidenceBucketId =
  | 'structural'
  | 'situational'
  | 'opponent'
  | 'personnel'
  | 'game_state'
  | 'insufficient'

export type EvidenceHint = {
  id: string
  bucket: EvidenceBucketId
  text: string
}

export type PatternAttributionResult = {
  patternCandidate: string
  observations: PatternLogObservation[]
  attribution: PatternAttribution | ''
  confidence: AttributionConfidence | ''
  strongestEvidence: string
  counterEvidence?: string
}

export type PatternAttributionSummary = {
  observationCount: number
  presentCount: number
  contextVariation: {
    opponent: string
    personnel: string
    gameState: string
    startingCondition: string
  }
  hints: EvidenceHint[]
  statements: string[]
}

/** E1_D5 / tendency profile */
export type TendencyFrequency =
  | 'two'
  | 'three'
  | 'four'
  | 'five_plus'
  | 'hard_to_count'
  | 'unclear'

export type TendencyPrimaryCondition =
  | 'trigger'
  | 'pressure'
  | 'zone'
  | 'possession'
  | 'support'
  | 'opponent_behavior'
  | 'game_state'
  | 'multiple'
  | 'no_clear_condition'
  | 'unclear'

export type TendencyStableCoreId =
  | 'zone'
  | 'trigger'
  | 'team_function'
  | 'target_space'
  | 'actor_role'
  | 'side'
  | 'sequence'
  | 'opponent_reaction'
  | 'other'
  | 'none_clear'
  | 'unclear'

export type TendencyAllowedVariationId =
  | 'side'
  | 'player'
  | 'role'
  | 'exact_position'
  | 'sequence'
  | 'tempo'
  | 'zone'
  | 'trigger'
  | 'other'
  | 'little_variation'
  | 'unclear'

export type TendencyEntry = {
  id: string
  summary: string
  frequency: TendencyFrequency | ''
  primaryCondition: TendencyPrimaryCondition | ''
  conditionDetail?: string
  stableCore: TendencyStableCoreId[]
  allowedVariation: TendencyAllowedVariationId[]
  attribution: PatternAttribution | ''
  confidence: AttributionConfidence | ''
  strongestEvidence: string
  counterEvidence?: string
}

export type TendencyDraft = {
  summary?: string
  frequency?: TendencyFrequency | ''
  primaryCondition?: TendencyPrimaryCondition | ''
  conditionDetail?: string
  stableCore?: TendencyStableCoreId[]
  allowedVariation?: TendencyAllowedVariationId[]
  attribution?: PatternAttribution | ''
  confidence?: AttributionConfidence | ''
  strongestEvidence?: string
  counterEvidence?: string
}

export type NextWatchTarget =
  | string
  | 'none'
  | 'new_possible'
  | 'unclear'
  | ''

export type TendencyProfileResult = {
  tendencies: TendencyEntry[]
  strongestTendencyId?: string
  segmentSummary: string
  nextWatchTendencyId?: NextWatchTarget
  falsificationNote?: string
}

export type TendencyProfileSummary = {
  tendencyCount: number
  statements: string[]
  rows: Array<{
    id: string
    summary: string
    frequencyLabel: string
    sampleDots: number
    sampleTotal: number
    confidence: AttributionConfidence | ''
    attribution: PatternAttribution | ''
    attributionLabel: string
    confidenceLabel: string
  }>
}

export type PatternLogOption<T extends string> = {
  value: T
  label: string
  description?: string
}

export type PatternLogConfig = {
  mechanic?: 'pattern_log' | 'pattern_condition' | 'pattern_invariant' | 'pattern_attribution' | 'tendency_profile'
  mode?: 'repeat_check' | 'condition_matrix' | 'invariant_map' | 'attribution_board' | 'tendency_profile'
  logs_key?: string
  minObservations?: number
  maxObservations?: number
  minPatternCases?: number
  maxCounterCases?: number
  minTendencies?: number
  maxTendencies?: number
  assessment_key?: string
  summary_key?: string
  label_key?: string
  candidate_key?: string
  relevant_conditions_key?: string
  counter_differences_key?: string
  counter_difference_note_key?: string
  condition_assessment_key?: string
  if_then_key?: string
  dimension_assessments_key?: string
  invariant_summary_key?: string
  allowed_variation_key?: string
  flexibility_key?: string
  primary_action_equality_key?: string
  attribution_key?: string
  confidence_key?: string
  strongest_evidence_key?: string
  counter_evidence_key?: string
  tendencies_key?: string
  segment_summary_key?: string
  strongest_tendency_key?: string
  next_watch_key?: string
  falsification_note_key?: string
  draft_key?: string
  edit_index_key?: string
  enable_side?: boolean
  enable_context_tags?: boolean
  enable_mid_label?: boolean
  enable_pressure?: boolean
  enable_possession?: boolean
  enable_support?: boolean
  enable_counter_cases?: boolean
  enable_game_state?: boolean
  require_candidate_first?: boolean
  require_segment_summary?: boolean
  require_strongest_tendency?: boolean
  require_next_watch?: boolean
  submit_label?: string
  add_more_label?: string
  finish_label?: string
  observe_hint?: string
  search_next_hint?: string
  outcome_similarity_hint?: string
  decision_rule?: string
  summary_title?: string
  fingerprint_title?: string
  zones?: PatternLogOption<PatternZone>[]
  triggers?: PatternLogOption<PatternTrigger>[]
  sides?: PatternLogOption<PatternSide>[]
  similarities?: PatternLogOption<PatternSimilarity>[]
  context_tags?: PatternLogOption<PatternContextTag>[]
  assessments?: PatternLogOption<PatternAssessment>[]
  case_types?: PatternLogOption<PatternCaseType>[]
  pressure_levels?: PatternLogOption<PressureLevel>[]
  possession_states?: PatternLogOption<PossessionState>[]
  support_states?: PatternLogOption<SupportState>[]
  condition_assessments?: PatternLogOption<ConditionAssessment>[]
  condition_roles?: PatternLogOption<ConditionRole>[]
  relevant_condition_options?: PatternLogOption<ConditionDimensionId | 'none_clear' | 'unclear'>[]
  counter_difference_options?: PatternLogOption<CounterDifference>[]
  target_effects?: PatternLogOption<TargetEffect>[]
  actor_roles?: PatternLogOption<ActorRole>[]
  sequence_similarities?: PatternLogOption<SequenceSimilarity>[]
  invariant_dimension_roles?: PatternLogOption<InvariantDimensionRole>[]
  flexibility_options?: PatternLogOption<PatternFlexibility>[]
  allowed_variation_options?: PatternLogOption<InvariantDimensionId | 'other' | 'none' | 'unclear'>[]
  invariant_dimensions?: InvariantDimensionId[]
  pattern_presence_options?: PatternLogOption<PatternPresence>[]
  opponent_context_options?: PatternLogOption<OpponentContext>[]
  personnel_context_options?: PatternLogOption<PersonnelContext>[]
  game_state_options?: PatternLogOption<GameStateContext>[]
  starting_condition_options?: PatternLogOption<StartingCondition>[]
  attribution_options?: PatternLogOption<PatternAttribution>[]
  confidence_options?: PatternLogOption<AttributionConfidence>[]
  frequency_options?: PatternLogOption<TendencyFrequency>[]
  primary_condition_options?: PatternLogOption<TendencyPrimaryCondition>[]
  stable_core_options?: PatternLogOption<TendencyStableCoreId>[]
  tendency_variation_options?: PatternLogOption<TendencyAllowedVariationId>[]
  summary_dimensions?: Array<'zone' | 'trigger' | 'reaction' | 'side' | 'sequence' | 'pressureLevel' | 'possessionState' | 'supportState'>
}

export type PatternConsistency = {
  key: string
  label: string
  /** 0–1 ratio of strongest repeated signal */
  ratio: number
  /** e.g. "4 / 4 Neutral Zone" */
  detail: string
  filledDots: number
  totalDots: number
}

export type PatternLogSummary = {
  observationCount: number
  zoneConsistency: PatternConsistency
  triggerConsistency: PatternConsistency
  reactionSimilarity: PatternConsistency
  sideConsistency: PatternConsistency
  sequenceSimilarity: PatternConsistency
  similarityCounts: Record<string, number>
  statements: string[]
  dominantZone?: PatternZone | null
  dominantTrigger?: PatternTrigger | null
  onlyOutcomeHeavy: boolean
}

export type ConditionDimensionSummary = {
  dimensionId: ConditionDimensionId
  label: string
  patternCases: Record<string, number>
  counterCases: Record<string, number>
  patternMode: string | null
  patternModeCount: number
  patternUniqueCount: number
  patternDetail: string
  counterDetail: string
  /** True when pattern mode differs from counter mode (when both exist). */
  differsInCounter: boolean
  consistency: PatternConsistency
}

export type PatternConditionSummary = {
  totalCount: number
  patternCaseCount: number
  counterCaseCount: number
  dimensions: ConditionDimensionSummary[]
  statements: string[]
  fingerprint: PatternConsistency[]
}

export type DimensionConsistencySummary = {
  dimensionId: InvariantDimensionId
  label: string
  values: string[]
  displayValues: string[]
  counts: Record<string, number>
  uniqueCount: number
  modeValue: string | null
  modeCount: number
  detail: string
  /** Auto suggestion for structured dims; free-text stays user_judged. */
  consistency: StructuredConsistency
  isFreeText: boolean
  fingerprint: PatternConsistency
}

export type PatternInvariantSummary = {
  observationCount: number
  dimensions: DimensionConsistencySummary[]
  statements: string[]
  fingerprint: PatternConsistency[]
}
