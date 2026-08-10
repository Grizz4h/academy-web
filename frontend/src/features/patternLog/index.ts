export type {
  ActorRole,
  AttributionConfidence,
  ConditionAssessment,
  ConditionDimensionId,
  ConditionDimensionSummary,
  ConditionRole,
  CounterDifference,
  DimensionAssessmentEntry,
  DimensionConsistencySummary,
  EvidenceBucketId,
  EvidenceHint,
  GameStateContext,
  InvariantDimensionId,
  InvariantDimensionRole,
  NextWatchTarget,
  OpponentContext,
  PatternAssessment,
  PatternAttribution,
  PatternAttributionResult,
  PatternAttributionSummary,
  PatternCaseType,
  PatternConditionResult,
  PatternConditionSummary,
  PatternConsistency,
  PatternContextTag,
  PatternFlexibility,
  PatternInvariantResult,
  PatternInvariantSummary,
  PatternLogConfig,
  PatternLogDraft,
  PatternLogObservation,
  PatternLogResult,
  PatternLogSummary,
  PatternPresence,
  PatternSide,
  PatternSimilarity,
  PatternTrigger,
  PatternZone,
  PersonnelContext,
  PossessionState,
  PressureLevel,
  PrimaryActionEquality,
  RelevantConditionEntry,
  SequenceSimilarity,
  StartingCondition,
  StructuredConsistency,
  SupportState,
  TargetEffect,
  TendencyAllowedVariationId,
  TendencyDraft,
  TendencyEntry,
  TendencyFrequency,
  TendencyPrimaryCondition,
  TendencyProfileResult,
  TendencyProfileSummary,
  TendencyStableCoreId,
} from './types'

export { PatternLogDrill } from './PatternLogDrill'
export { PatternConditionDrill } from './PatternConditionDrill'
export { PatternInvariantDrill } from './PatternInvariantDrill'
export { PatternAttributionDrill } from './PatternAttributionDrill'
export { TendencyProfileDrill } from './TendencyProfileDrill'
export { PatternFingerprint } from './PatternFingerprint'
export { ConditionComparison } from './ConditionComparison'
export { InvariantMap } from './InvariantMap'
export { EvidenceBoard } from './EvidenceBoard'
export { TendencyProfileVisual } from './TendencyProfileVisual'
export { summarizePatternLog, resolvePatternLogConfig } from './summarizePatternLog'
export {
  summarizePatternConditions,
  resolvePatternConditionConfig,
} from './summarizePatternConditions'
export {
  summarizeDimensionConsistency,
  resolvePatternInvariantConfig,
} from './summarizeDimensionConsistency'
export {
  summarizeAttributionEvidence,
  resolvePatternAttributionConfig,
} from './summarizeAttributionEvidence'
export {
  summarizeTendencyProfile,
  resolveTendencyProfileConfig,
  isTendencyComplete,
  frequencyToSampleDots,
} from './summarizeTendencyProfile'
export {
  DEFAULT_ACTOR_ROLE_OPTIONS,
  DEFAULT_ALLOWED_VARIATION_OPTIONS,
  DEFAULT_ASSESSMENT_OPTIONS,
  DEFAULT_ATTRIBUTION_OPTIONS,
  DEFAULT_CASE_TYPE_OPTIONS,
  DEFAULT_CONDITION_ASSESSMENT_OPTIONS,
  DEFAULT_CONDITION_ROLE_OPTIONS,
  DEFAULT_CONFIDENCE_OPTIONS,
  DEFAULT_CONTEXT_TAG_OPTIONS,
  DEFAULT_COUNTER_DIFFERENCE_OPTIONS,
  DEFAULT_FLEXIBILITY_OPTIONS,
  DEFAULT_FREQUENCY_OPTIONS,
  DEFAULT_GAME_STATE_OPTIONS,
  DEFAULT_INVARIANT_DIMENSION_ROLE_OPTIONS,
  DEFAULT_OPPONENT_CONTEXT_OPTIONS,
  DEFAULT_PATTERN_PRESENCE_OPTIONS,
  DEFAULT_PERSONNEL_CONTEXT_OPTIONS,
  DEFAULT_POSSESSION_OPTIONS,
  DEFAULT_PRESSURE_OPTIONS,
  DEFAULT_PRIMARY_CONDITION_OPTIONS,
  DEFAULT_RELEVANT_CONDITION_OPTIONS,
  DEFAULT_SEQUENCE_SIMILARITY_OPTIONS,
  DEFAULT_SIDE_OPTIONS,
  DEFAULT_SIMILARITY_OPTIONS,
  DEFAULT_STABLE_CORE_OPTIONS,
  DEFAULT_STARTING_CONDITION_OPTIONS,
  DEFAULT_SUPPORT_OPTIONS,
  DEFAULT_TARGET_EFFECT_OPTIONS,
  DEFAULT_TENDENCY_VARIATION_OPTIONS,
  DEFAULT_TRIGGER_OPTIONS,
  DEFAULT_ZONE_OPTIONS,
} from './labels'
