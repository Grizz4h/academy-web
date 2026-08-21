export { TacticalObservationDrill } from './TacticalObservationDrill'
export { TacticalObservationSummary } from './TacticalObservationSummary'
export {
  canAddObservation,
  canEvaluateObservations,
  computeTacticalObservationResult,
  describeStructureVariety,
  resolveTacticalObservationConfig,
  resultHasNumericScore,
  validateTacticalObservationAnswers,
} from './tacticalLogic'
export type {
  TacticalObservationConfig,
  TacticalObservation as TacticalObservationRow,
  TacticalObservationResult,
} from './types'
